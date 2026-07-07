# AI-Powered CSV Importer — Project Plan & Technical Spec

## 1. Objective

Build a full-stack application that lets a user upload an arbitrary CSV (Facebook Lead Ads export, Google Ads export, real estate CRM export, manual spreadsheet, etc.), preview it, and convert it into GrowEasy CRM-formatted lead records using an LLM for intelligent field mapping — regardless of source column names or layout.

Scope for this plan: **full scope**, including Docker, tests, deployment, and bonus features (drag-drop, progress indicators, retries, virtualized tables, dark mode).

---

## 2. Architecture Overview

```
┌─────────────────────┐        ┌────────────────────────────┐        ┌──────────────────┐
│   Next.js Frontend  │  HTTP  │   Express Backend API      │  SQL   │   PostgreSQL     │
│  (Vercel)           │ ─────▶│   (Railway/Render, Docker) │ ─────▶ │  (Railway/Render)│
│                     │ ◀─────│                            │ ◀───── │                  │
└─────────────────────┘        └───────────┬────────────────┘        └──────────────────┘
                                            │
                                            ▼
                                 ┌────────────────────────┐
                                 │  AI Provider Adapter   │
                                 │  (OpenAI / Gemini /    │
                                 │   Claude — pluggable)  │
                                 └────────────────────────┘
```

**Key design decision — pluggable AI provider:** the backend never calls a vendor SDK directly. It calls an internal `AIExtractor` interface; a factory picks the concrete adapter (`OpenAIAdapter`, `GeminiAdapter`, `ClaudeAdapter`) based on an env var (`AI_PROVIDER=openai|gemini|claude`). This lets evaluators swap providers with zero code changes and makes unit testing easy (mock the interface).

---

## 3. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, TanStack Table (virtualization + sticky headers), react-dropzone |
| Backend | Node.js, Express, TypeScript |
| DB | PostgreSQL + Prisma ORM |
| Queue (batch AI calls) | In-process queue via `p-queue`, or BullMQ + Redis if async job durability is desired |
| AI | Pluggable adapter: OpenAI, Gemini, Anthropic SDKs behind one interface |
| CSV parsing | `papaparse` (frontend preview) and `csv-parse` (backend, streaming) |
| Testing | Vitest/Jest + Supertest (backend), Vitest + React Testing Library (frontend) |
| Containerization | Docker + docker-compose (backend, Postgres, optional Redis) |
| Deployment | Frontend → Vercel; Backend + DB → Railway or Render |

---

## 4. Data Model (PostgreSQL / Prisma)

```prisma
model Upload {
  id          String   @id @default(uuid())
  fileName    String
  totalRows   Int
  status      UploadStatus @default(PENDING)
  createdAt   DateTime @default(now())
  records     LeadRecord[]
  batches     Batch[]
}

enum UploadStatus {
  PENDING
  PARSING
  PROCESSING
  DONE
  FAILED
}

model Batch {
  id          String   @id @default(uuid())
  uploadId    String
  upload      Upload   @relation(fields: [uploadId], references: [id])
  batchIndex  Int
  status      BatchStatus @default(PENDING)
  retryCount  Int      @default(0)
  errorMessage String?
  createdAt   DateTime @default(now())
}

enum BatchStatus {
  PENDING
  IN_PROGRESS
  SUCCESS
  FAILED
}

model LeadRecord {
  id                          String   @id @default(uuid())
  uploadId                    String
  upload                      Upload   @relation(fields: [uploadId], references: [id])
  rawRow                      Json      // original CSV row, for audit/debug
  status                      RecordStatus @default(PENDING)
  skipReason                  String?

  createdAtField              DateTime?
  name                        String?
  email                       String?
  countryCode                 String?
  mobileWithoutCountryCode    String?
  company                     String?
  city                        String?
  state                       String?
  country                     String?
  leadOwner                   String?
  crmStatus                   CrmStatus?
  crmNote                     String?
  dataSource                  DataSource?
  possessionTime              String?
  description                 String?
}

enum RecordStatus {
  PENDING
  IMPORTED
  SKIPPED
}

enum CrmStatus {
  GOOD_LEAD_FOLLOW_UP
  DID_NOT_CONNECT
  BAD_LEAD
  SALE_DONE
}

enum DataSource {
  leads_on_demand
  meridian_tower
  eden_park
  varah_swamy
  sarjapur_plots
}
```

Storing `rawRow` and per-batch status gives the app a real retry/audit trail rather than an all-or-nothing import.

---

## 5. Backend API Spec

### `POST /api/uploads`
Accepts `multipart/form-data` with the CSV file. Streams and parses it, stores the `Upload` row and raw rows (unprocessed), returns a preview.

**Response**
```json
{
  "uploadId": "uuid",
  "totalRows": 128,
  "columns": ["Full Name", "Email Address", "Phone", "..."],
  "previewRows": [ { "Full Name": "John Doe", "...": "..." } ]
}
```
No AI call happens here — this satisfies the "no AI processing on preview" requirement.

### `POST /api/uploads/:uploadId/confirm`
Triggered by the frontend's Confirm button. Kicks off AI extraction:
1. Loads raw rows for the upload.
2. Chunks rows into batches (default batch size: 20, configurable).
3. Creates a `Batch` row per chunk, dispatches each to the `AIExtractor`.
4. Persists mapped fields into `LeadRecord`, applying the skip rule (no email AND no mobile → `SKIPPED`).
5. Failed batches are retried up to N times (exponential backoff) before being marked `FAILED`.

**Response**
```json
{
  "uploadId": "uuid",
  "importedCount": 118,
  "skippedCount": 10,
  "failedBatches": 0,
  "records": [ /* LeadRecord[] */ ],
  "skipped": [ { "rawRow": {...}, "reason": "no email or mobile found" } ]
}
```

### `GET /api/uploads/:uploadId`
Poll endpoint for progress (used to drive the frontend progress indicator while AI batches run).

```json
{ "status": "PROCESSING", "batchesTotal": 7, "batchesDone": 4 }
```

### `GET /api/uploads/:uploadId/export` (bonus)
Streams the final CRM-format CSV for download.

All endpoints return typed error bodies: `{ "error": { "code": "INVALID_CSV", "message": "..." } }`, with appropriate HTTP status codes (400 for bad input, 422 for parse failures, 502 for AI provider failure after retries exhausted).

---

## 6. AI Extraction Design (the core evaluation criterion)

### 6.1 Adapter interface
```ts
interface AIExtractor {
  extractBatch(rows: RawRow[], sourceColumns: string[]): Promise<ExtractedRecord[]>;
}
```

### 6.2 Prompting strategy
- **System prompt** fixes the CRM schema, the four allowed `crm_status` values, the five allowed `data_source` values (blank if unsure), and the date format rule (`created_at` must parse with `new Date(...)`).
- **Per-batch user prompt** includes: the raw column headers, then each row as a JSON object (not raw CSV text) — this avoids delimiter/quoting ambiguity and lets the model reason over key-value pairs instead of guessing column order.
- Model is instructed to return **strict JSON only** (an array of objects matching the schema), which the backend validates against a Zod schema before writing to Postgres. Any row failing schema validation is treated as a soft failure and retried once individually before being logged as skipped.
- Explicit rules embedded in the prompt: multiple emails → first email kept, rest appended to `crm_note`; same for phone numbers; ambiguous/ freeform status or source text → map to nearest allowed enum or leave blank (never invent a new enum value); skip rule enforced both in the prompt and re-validated in code (defense in depth — don't trust the AI to skip correctly on its own).

### 6.3 Batching & concurrency
- Default batch size 20 rows/request, tunable via env var, chosen to stay well under token limits while minimizing per-row overhead.
- Batches processed with bounded concurrency (`p-queue`, concurrency = 3–5) so large CSVs don't fire hundreds of parallel LLM calls at once.

### 6.4 Retry mechanism
- Batch-level retry: up to 3 attempts with exponential backoff on provider errors (timeouts, 429s, malformed JSON).
- Row-level fallback: if a batch keeps failing, split it into smaller sub-batches (binary-search style) so one bad row doesn't sink 19 good ones.

---

## 7. Frontend Spec

### Pages / flow
1. **Upload screen** — `react-dropzone` drag-and-drop + file picker fallback. Client-side validation (`.csv` only, size limit e.g. 10MB) before upload.
2. **Preview screen** — calls `POST /api/uploads`, renders a `TanStack Table` with sticky header, horizontal + vertical scroll, virtualized rows for large files. "Confirm Import" button fixed at the bottom.
3. **Processing state** — after Confirm, poll `GET /api/uploads/:id` and show a progress bar (`batchesDone / batchesTotal`) with a friendly loading message.
4. **Results screen** — two tables (Imported / Skipped), summary cards (Total Imported, Total Skipped), CSV export button, and a toggle for dark mode.

### State handling
- Loading, empty, and error states designed explicitly for each screen (e.g. "This file has no rows", "AI processing failed after 3 retries — retry?").
- Dark mode via Tailwind's `class` strategy, toggled and persisted in React context (no `localStorage`, since it's out for artifacts — but fine in the real Next.js app outside the artifact sandbox).

---

## 8. Folder Structure

```
ai-csv-importer/
├── apps/
│   ├── web/                     # Next.js frontend
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── ...
│   └── api/                     # Express backend
│       ├── src/
│       │   ├── routes/
│       │   ├── services/
│       │   │   ├── csv/
│       │   │   ├── ai/
│       │   │   │   ├── AIExtractor.ts        (interface)
│       │   │   │   ├── OpenAIAdapter.ts
│       │   │   │   ├── GeminiAdapter.ts
│       │   │   │   └── ClaudeAdapter.ts
│       │   │   └── batching/
│       │   ├── prisma/
│       │   └── tests/
│       └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 9. Testing Plan
- **Unit**: CSV parsing edge cases (BOM, quoted commas, missing headers), skip-rule logic, batch splitting, AI adapter mocked to return fixed JSON.
- **Integration**: `POST /api/uploads` → `confirm` → `export` round trip against a test Postgres (Docker), with the AI adapter mocked/stubbed.
- **Frontend**: component tests for the upload dropzone, table rendering with virtualization, and progress polling.

---

## 10. Docker & Deployment
- `docker-compose.yml`: `api`, `postgres`, optional `redis` (if BullMQ is used) — one command spins up the full backend locally.
- Frontend deployed to **Vercel**; backend + Postgres to **Railway or Render**; `NEXT_PUBLIC_API_URL` env var points the frontend at the deployed API.
- `.env.example` documents `AI_PROVIDER`, `OPENAI_API_KEY` / `GEMINI_API_KEY` / `ANTHROPIC_API_KEY`, `DATABASE_URL`, `BATCH_SIZE`, `BATCH_CONCURRENCY`.

---

## 11. Project Timeline (suggested, ~8–10 working days)

| Day | Milestone |
|---|---|
| 1 | Repo scaffold, Prisma schema, Docker Compose, CSV upload + parse endpoint |
| 2 | Frontend upload + preview table (sticky headers, virtualization, drag-drop) |
| 3 | AI adapter interface + one provider (e.g. OpenAI) implementation, Zod validation |
| 4 | Batching, concurrency, retry mechanism; confirm endpoint end-to-end |
| 5 | Second/third AI adapters (Gemini, Claude) to prove pluggability; progress polling endpoint |
| 6 | Results screen (imported/skipped tables, summary, export CSV), dark mode |
| 7 | Unit + integration tests, error-state polish across frontend |
| 8 | Docker hardening, README, deploy frontend (Vercel) + backend/DB (Railway/Render) |
| 9–10 | Buffer: edge cases (huge CSVs, malformed rows, provider timeouts), README polish, demo recording |

---

## 12. Evaluation-Criteria Checklist

- [x] AI prompt engineering — schema-constrained JSON prompt, enum validation, defense-in-depth skip logic
- [x] Field mapping robustness — header-agnostic, key-value row prompting
- [x] Messy/ambiguous data handling — multi-email/phone merge rule, enum fallback to blank
- [x] Clean API design — REST endpoints, typed errors, polling for async progress
- [x] Batch processing — chunked, bounded concurrency, retries
- [x] Modern responsive UI — sticky/virtualized table, drag-drop, dark mode
- [x] Type safety — TypeScript end-to-end, Prisma models, Zod validation of AI output
- [x] Production readiness — Docker, tests, deployment, README

---

## 13. Open Decisions to Confirm Before Coding
1. Batch size / concurrency defaults (proposed: 20 rows, concurrency 3) — adjust based on expected CSV sizes.
2. Async job durability: is an in-process queue acceptable, or should BullMQ + Redis be added for crash-safe retries on large files?
3. Auth: is this a single-user internal tool (no login) or does it need multi-tenant auth? (Plan above assumes no auth layer.)