# Architecture

Technical architecture document for CSV2CRM.

## System Overview

```
┌─────────────────────┐        ┌────────────────────────────┐        ┌──────────────────┐
│   Next.js Frontend  │  HTTP  │   Express Backend API      │  SQL   │   PostgreSQL     │
│  (Port 3000)        │ ─────▶│   (Port 3001)              │ ─────▶ │  (Port 5432)     │
│                     │ ◀─────│                            │ ◀───── │                  │
└─────────────────────┘        └────────────┬───────────────┘        └──────────────────┘
                                            │
                                   ┌────────┴────────┐
                                   ▼                 ▼
                            ┌────────────┐    ┌──────────────────────┐
                            │   Redis    │    │   AI Provider        │
                            │  (BullMQ)  │    │  (OpenRouter/OpenAI/ │
                            │ (Port 6379)│    │   Gemini/Claude/MiMo)│
                            └────────────┘    └──────────────────────┘
```

## Data Flow

```
1. Upload CSV
   └─ POST /api/uploads (multipart/form-data)
      └─ multer → parseCSV() → store raw rows as LeadRecord (PENDING)

2. Preview
   └─ Frontend displays columns + rows in TanStack Table

3. Confirm Import
   └─ POST /api/uploads/:id/confirm
      └─ Chunk LeadRecords into Batch rows
      └─ Enqueue BullMQ jobs (one per batch)

4. AI Processing (BullMQ Worker)
   └─ For each batch:
      ├─ Mark batch IN_PROGRESS
      ├─ Call AIExtractor.extractBatch(rows, columns)
      │   └─ AI returns JSON array of ExtractedRecord[]
      ├─ Validate with Zod schema
      ├─ For each record:
      │   ├─ Has email or mobile? → IMPORTED
      │   └─ No contact info? → SKIPPED with reason
      ├─ Write LeadRecord + AiUsage to PostgreSQL
      └─ Mark batch SUCCESS (or FAILED → retry)

5. Progress Polling
   └─ Frontend polls GET /api/uploads/:id every 2s
      └─ Returns batchesDone/batchesTotal, imported/skipped counts

6. Results & Export
   └─ GET /api/uploads/:id/records → display in table
   └─ GET /api/uploads/:id/export → download CRM CSV
```

## Backend Architecture

### Express Middleware Stack

```
Request → helmet (security headers)
        → cors (restricted to FRONTEND_URL)
        → morgan (HTTP logging)
        → express.json()
        → Route handler
        → errorHandler (global error middleware)
```

### Error Hierarchy

```
AppError (base, status 500)
├── ValidationError (400, code: VALIDATION_ERROR)
├── NotFoundError (404, code: NOT_FOUND)
├── CSVParserError (422, code: CSV_PARSE_ERROR)
└── AIServiceError (502, code: AI_SERVICE_ERROR)
```

### Config Validation

All environment variables are validated at startup using Zod (`apps/api/src/config.ts`). The server will not start if required variables (e.g., `DATABASE_URL`) are missing or invalid.

## AI Extraction Pipeline

### Adapter Interface

```typescript
interface AIExtractor {
  extractBatch(rows: RawRow[], sourceColumns: string[]): Promise<ExtractionResult>;
}

interface ExtractionResult {
  records: ExtractedRecord[];
  usage: TokenUsage;
}
```

### Factory Pattern

The `createAIExtractor()` factory function in `apps/api/src/services/ai/factory.ts` selects the adapter based on `AI_PROVIDER`:

| Provider | Adapter Class | Client |
|---|---|---|
| `openrouter` | `OpenAICompatibleAdapter` | `openai` SDK → `https://openrouter.ai/api/v1` |
| `openai` | `OpenAICompatibleAdapter` | `openai` SDK → `https://api.openai.com/v1` |
| `xiaomimimo` | `OpenAICompatibleAdapter` | `openai` SDK → `https://api.xiaomimimo.com/v1` |
| `gemini` | `GeminiAdapter` | `@google/generative-ai` SDK |
| `claude` | `ClaudeAdapter` | `@anthropic-ai` SDK |

### Prompting Strategy

**System prompt** (`apps/api/src/services/ai/prompts.ts`):
- Defines the 15-field CRM schema
- Specifies allowed enum values for `crm_status` and `data_source`
- Rules for handling multiple emails/phones (first → field, rest → `crm_note`)
- Skip rule: no email AND no mobile → skip
- Date format: ISO 8601 parseable by `new Date()`
- Strict JSON output requirement

**User prompt**:
- Includes column names as JSON array
- Includes rows as JSON objects (key-value pairs, not raw CSV text)
- Avoids delimiter/quoting ambiguity

### Validation (Defense in Depth)

AI output is validated at two levels:
1. **In the adapter** — Each adapter parses JSON from the AI response and validates against `extractedBatchSchema` (Zod)
2. **In the processor** — The queue processor checks for contact info (email or mobile) independently of the AI's skip decision

### AI Output Schema (Zod)

```typescript
const extractedRecordSchema = z.object({
  created_at: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  country_code: z.string().nullable().optional(),
  mobile_without_country_code: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  lead_owner: z.string().nullable().optional(),
  crm_status: z.enum(["GOOD_LEAD_FOLLOW_UP", "DID_NOT_CONNECT", "BAD_LEAD", "SALE_DONE"]).nullable().optional(),
  crm_note: z.string().nullable().optional(),
  data_source: z.enum(["leads_on_demand", "meridian_tower", "eden_park", "varah_swamy", "sarjapur_plots"]).nullable().optional(),
  possession_time: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});
```

## Queue System

### BullMQ Configuration

```typescript
// Queue: "ai-extraction"
// Worker concurrency: BATCH_CONCURRENCY (default 3)
// Job attempts: MAX_RETRIES (default 3)
// Backoff: exponential, starting at 1s
// Retention: 100 completed, 100 failed jobs
```

### Job Data Shape

```typescript
interface BatchJobData {
  batchId: string;
  uploadId: string;
  batchIndex: number;
  rows: Record<string, string>[];
  columns: string[];
}
```

### Retry Behavior

- Failed jobs are retried up to `MAX_RETRIES` times with exponential backoff
- Each retry increments `Batch.retryCount`
- After all retries exhausted, batch is marked `FAILED` with the error message
- The upload continues processing other batches even if one fails

## Database Schema

### Entity Relationships

```
Upload (1) ──→ (N) Batch        (cascade delete)
Upload (1) ──→ (N) LeadRecord   (cascade delete)
Upload (1) ──→ (N) AiUsage      (cascade delete)
```

### Models

**Upload** — Top-level import job
- `id` (UUID PK), `fileName`, `totalRows`, `status` (UploadStatus), `createdAt`

**Batch** — Chunk of rows for AI processing
- `id` (UUID PK), `uploadId` (FK), `batchIndex`, `status` (BatchStatus), `retryCount`, `errorMessage`, `createdAt`
- Index on `uploadId`

**LeadRecord** — Individual lead with raw + extracted data
- `id` (UUID PK), `uploadId` (FK), `rawRow` (JSON), `status` (RecordStatus), `skipReason`
- 15 CRM fields: `createdAtField`, `name`, `email`, `countryCode`, `mobileWithoutCountryCode`, `company`, `city`, `state`, `country`, `leadOwner`, `crmStatus` (CrmStatus?), `crmNote`, `dataSource` (DataSource?), `possessionTime`, `description`
- Index on `uploadId`

**AiUsage** — Token usage tracking per batch
- `id` (UUID PK), `provider`, `model`, `promptTokens`, `completionTokens`, `totalTokens`, `uploadId` (FK, nullable), `batchId`, `createdAt`
- Indexes on `uploadId` and `createdAt`

### Enums

| Enum | Values |
|---|---|
| `UploadStatus` | `PENDING`, `PARSING`, `PROCESSING`, `DONE`, `FAILED` |
| `BatchStatus` | `PENDING`, `IN_PROGRESS`, `SUCCESS`, `FAILED` |
| `RecordStatus` | `PENDING`, `IMPORTED`, `SKIPPED` |
| `CrmStatus` | `GOOD_LEAD_FOLLOW_UP`, `DID_NOT_CONNECT`, `BAD_LEAD`, `SALE_DONE` |
| `DataSource` | `leads_on_demand`, `meridian_tower`, `eden_park`, `varah_swamy`, `sarjapur_plots` |

## Frontend Architecture

### Page Structure

| Route | Component | Purpose |
|---|---|---|
| `/` | `page.tsx` | 4-step wizard: upload → preview → process → results |
| `/jobs` | `jobs/page.tsx` | All jobs list with sortable/resizable table |
| `/jobs/[id]` | `jobs/[id]/page.tsx` | Job detail with status, actions, results |

### Component Architecture

```
page.tsx (Home - Wizard)
├── Navbar
│   ├── AiCreditBadge (uses useAiCredits hook)
│   └── ThemeToggle
├── [Step: upload]
│   ├── FileUploader (react-dropzone)
│   └── SampleFiles
├── [Step: preview]
│   └── CsvPreviewTable (TanStack Table + useResizableColumns)
├── [Step: processing]
│   └── ProcessingState (progress bar + rotating tips)
└── [Step: results]
    ├── JobCostSummary (token usage + cost)
    └── ResultsView (imported/skipped tabs + TanStack Table)
```

### Hooks

| Hook | Purpose |
|---|---|
| `useUpload()` | CSV file upload with loading/error state |
| `useConfirm()` | Trigger AI processing |
| `useProcessingPoll(uploadId, enabled)` | Poll status every 2s until DONE/FAILED |
| `useRecords(uploadId)` | Fetch processed records on demand |
| `useUploads()` | Fetch all uploads for jobs list |
| `useAiCredits(refreshKey?)` | Fetch AI usage/credit data |

### Styling

- Tailwind CSS with `darkMode: "class"` strategy
- CSS custom properties (HSL) for design tokens in `globals.css`
- shadcn/ui-style variable system: `--background`, `--foreground`, `--primary`, `--muted`, etc.
- Dark mode toggled via `ThemeToggle` component, persisted in `localStorage`

### Table Features

- `@tanstack/react-table` with `columnResizeMode: "onChange"`
- Custom `useResizableColumns` hook for drag-to-resize (mouse + touch)
- `@tanstack/react-virtual` for row virtualization on large datasets
- Min column width: 40px

## AI Cost Estimation

Token costs are estimated using hardcoded rates in `apps/api/src/services/ai/pricing.ts`:

| Provider | Input ($/token) | Output ($/token) |
|---|---|---|
| xiaomimimo | $0.10/M | $0.30/M |
| openai | $0.15/M | $0.60/M |
| openrouter | $0.15/M | $0.60/M |
| gemini | $0.075/M | $0.30/M |
| claude | $3.00/M | $15.00/M |
