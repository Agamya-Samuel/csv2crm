# Documentation Update Plan for CSV2CRM

## Goal

Update `README.md` to accurately reflect the current codebase and add supplementary documentation for project setup, technical understanding, and contributor guidance.

---

## Identified Gaps (Current README vs Actual Codebase)

### 1. Features Missing from README
- **AI Credit Tracking** — `AiUsage` model, `/api/ai-credits` endpoint, `AiCreditBadge` in navbar, live balance for XiaomiMiMo
- **Job Management** — `/jobs` list page, `/jobs/[id]` detail page, delete uploads, continue pending jobs
- **5th AI Provider** — `xiaomimimo` (Xiaomi MiMo) with `XIAOMIMIMO_API_KEY` and `MIMO_COOKIE`
- **Sample CSV Files** — 4 downloadable sample files in `public/samples/`
- **Resizable Table Columns** — drag-to-resize via custom `useResizableColumns` hook
- **Job Cost Summary** — token usage + estimated cost displayed per job
- **Step-by-Step Wizard UI** — 4-step indicator (Upload → Preview → Process → Results)

### 2. Tech Stack Inaccuracies
- README says Next.js 15 → actual is **Next.js 16**
- README says React (unspecified) → actual is **React 19**
- Missing backend deps: `helmet`, `morgan`, `zod`, `csv-stringify`, `ioredis`
- Missing frontend deps: `@tanstack/react-virtual`, `lucide-react`

### 3. Environment Variables Missing
- `XIAOMIMIMO_API_KEY` — XiaomiMiMo API key
- `MIMO_COOKIE` — Browser cookie for MiMo live balance

### 4. API Endpoints Missing
- `GET /api/uploads` — List all uploads with stats
- `DELETE /api/uploads/:uploadId` — Delete an upload and related data
- `GET /api/ai-credits` — AI usage dashboard + live balance

### 5. Project Structure Outdated
- Missing: `src/config.ts`, `src/types/`, `src/services/ai/prompts.ts`, `src/services/ai/pricing.ts`, `src/routes/ai-credits.ts`
- Missing: `apps/web/src/lib/`, `apps/web/src/types/`, `apps/web/src/components/` (9 components), `apps/web/public/samples/`
- Missing: `apps/api/tests/` subdirectories (ai/, csv/, fixtures/, routes/)
- Missing: `AiUsage` model in Prisma schema section

### 6. Docker Section Incomplete
- docker-compose has 4 services (postgres, redis, api, web) but README only shows infra
- Multi-stage Dockerfiles not documented

### 7. Testing Section Incomplete
- Missing: test fixtures (3 CSV files), Zod schema tests, CSV parser tests
- Missing: `vitest.config.ts`, test commands (`test:watch`)

### 8. Existing `docs/technical-specification.md` is a Planning Document
- References "p-queue" but actual uses BullMQ + Redis
- Contains timeline/milestones (not useful for ongoing docs)
- Should be preserved as historical context but supplemented with current architecture docs

---

## Plan: Files to Create/Update

### Task 1: Update `README.md`

Rewrite the README to accurately reflect the current project. Sections:

1. **Header** — Title, one-line description, badges (optional)
2. **Screenshot/Flow description** — Brief user flow text
3. **Architecture** — Updated diagram including Redis/BullMQ, 5 AI providers, AiUsage tracking
4. **Features** — Complete list (add AI credits, job management, samples, resizable columns, dark mode, wizard UI)
5. **Tech Stack** — Accurate versions (Next.js 16, React 19), complete dependency lists
6. **Prerequisites** — Node.js 20+, Docker, AI API key (any of 5 providers)
7. **Quick Start** — Updated 5-step guide (clone → env → docker → migrate → dev)
8. **Environment Variables** — Complete table (16 variables including MiMo)
9. **API Endpoints** — Complete table (9 endpoints)
10. **Project Structure** — Full tree matching actual codebase
11. **AI Providers** — How to configure each of the 5 providers
12. **Docker Deployment** — Full `docker-compose up --build` with all 4 services
13. **Testing** — Commands, test types, fixture descriptions
14. **Supported CSV Formats** — Keep existing + add sample file references
15. **CRM Fields** — Keep existing table
16. **License** — MIT

### Task 2: Create `CONTRIBUTING.md`

Developer-focused guide covering:

1. **Prerequisites** — Tools needed (Node 20+, Docker, Git)
2. **Local Development Setup** — Step-by-step
3. **Project Architecture** — Monorepo structure, workspace commands
4. **Adding a New AI Provider** — Step-by-step guide (create adapter, register in factory, add env vars, add pricing)
5. **Database Changes** — How to create Prisma migrations
6. **Running Tests** — All test commands, fixture files
7. **Code Style** — TypeScript strict, Zod validation, error handling patterns
8. **Frontend Conventions** — Client components, hooks pattern, Tailwind + CSS variables
9. **Commit/PR Guidelines** — (brief)

### Task 3: Create `docs/API.md`

Detailed API reference:

1. **Base URL** — `http://localhost:3001`
2. **Error Format** — `{ error: { code, message, details } }` with status codes
3. **Endpoints** — For each: method, path, description, request body/params, response schema with example JSON, status codes
   - `GET /api/health`
   - `POST /api/uploads`
   - `GET /api/uploads`
   - `GET /api/uploads/:id`
   - `POST /api/uploads/:id/confirm`
   - `GET /api/uploads/:id/records`
   - `GET /api/uploads/:id/export`
   - `DELETE /api/uploads/:id`
   - `GET /api/ai-credits`
4. **Enums** — UploadStatus, BatchStatus, RecordStatus, CrmStatus, DataSource values

### Task 4: Create `docs/ARCHITECTURE.md`

Technical architecture document (replaces outdated technical-specification.md for reference):

1. **System Overview** — High-level architecture diagram
2. **Data Flow** — Upload → Parse → Confirm → Batch → AI Extract → Validate → Store → Export
3. **Backend Architecture** — Express server, middleware stack, route structure, service layer
4. **AI Extraction Pipeline** — Adapter interface, factory pattern, prompting strategy, Zod validation, retry mechanism
5. **Queue System** — BullMQ + Redis configuration, worker concurrency, exponential backoff
6. **Database Schema** — Prisma models with relationships (Upload → Batch, Upload → LeadRecord, Upload → AiUsage)
7. **Frontend Architecture** — Next.js App Router, client components, hooks pattern, TanStack Table + Virtual
8. **Design Patterns** — Pluggable AI adapters, defense-in-depth validation, polling-based progress

### Task 5: Create `docs/DEPLOYMENT.md`

Deployment guide:

1. **Docker Compose (Local/Production)** — Full stack deployment with `docker-compose up --build`
2. **Environment Variables** — Required vs optional, production recommendations
3. **Database** — Migration strategy (`prisma migrate deploy` in Docker CMD)
4. **Reverse Proxy** — Nginx/Caddy configuration hints
5. **Cloud Deployment** — Vercel (frontend) + Railway/Render (backend + DB) approach
6. **Health Checks** — `/api/health` endpoint usage

---

## Implementation Order

1. `README.md` (update) — Highest impact, most visible
2. `docs/API.md` (create) — Essential for any API consumer
3. `docs/ARCHITECTURE.md` (create) — Technical understanding
4. `CONTRIBUTING.md` (create) — Developer onboarding
5. `docs/DEPLOYMENT.md` (create) — Operations guide

---

## Validation

- After writing, verify all referenced file paths exist in the codebase
- Verify all API endpoints match `apps/api/src/routes/` implementations
- Verify all environment variables match `apps/api/src/config.ts`
- Verify all component names match `apps/web/src/components/` filenames
- Run `npm run lint` to ensure no code changes were affected
