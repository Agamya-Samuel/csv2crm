# CSV2CRM — AI-Powered Lead Importer

A full-stack application that intelligently extracts CRM lead information from any valid CSV format using AI, and converts it to GrowEasy CRM format.

## User Flow

```
Upload CSV  →  Preview Data  →  AI Processing  →  View Results & Export
(Drag-drop)    (Resizable       (Batched with       (Imported/Skipped
                table)           progress bar)        tables + CSV export)
```

## Architecture

```
┌─────────────────────┐        ┌────────────────────────────┐        ┌──────────────────┐
│   Next.js Frontend  │  HTTP  │   Express Backend API      │  SQL   │   PostgreSQL     │
│  (Port 3000)        │ ─────▶│   (Port 3001)              │ ─────▶ │                  │
│                     │ ◀─────│                            │ ◀───── │                  │
└─────────────────────┘        └────────────┬───────────────┘        └──────────────────┘
                                            │
                                   ┌────────┴────────┐
                                   ▼                 ▼
                            ┌────────────┐    ┌──────────────────────┐
                            │   Redis    │    │   AI Provider        │
                            │  (BullMQ)  │    │  (OpenRouter/OpenAI/ │
                            │            │    │   Gemini/Claude/MiMo)│
                            └────────────┘    └──────────────────────┘
```

## Features

- **Drag & Drop CSV Upload** — Upload any CSV file regardless of column names or structure
- **Live Preview** — See parsed data in a resizable, scrollable table before importing
- **AI-Powered Extraction** — Intelligently maps fields to GrowEasy CRM format using pluggable AI providers
- **Batch Processing** — Processes records in batches via BullMQ + Redis with progress tracking
- **Retry Mechanism** — Failed batches retry with exponential backoff (up to 3 attempts)
- **AI Credit Tracking** — Real-time token usage, estimated cost, and live balance for XiaomiMiMo
- **Job Management** — View all import jobs, continue pending jobs, delete jobs
- **Dark Mode** — Toggle between light and dark themes (persisted in localStorage)
- **CSV Export** — Download imported records as a formatted CRM CSV
- **Sample Files** — 4 downloadable sample CSVs for testing (Facebook Leads, Google Ads, Messy Spreadsheet, 500-row dataset)
- **Pluggable AI** — Supports OpenRouter, OpenAI, Gemini, Claude, and XiaomiMiMo

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, TanStack Table, TanStack Virtual, react-dropzone, lucide-react |
| Backend | Node.js, Express, TypeScript, Zod (validation), helmet, morgan |
| Database | PostgreSQL 16 + Prisma ORM |
| Queue | BullMQ + Redis 7 |
| AI | OpenRouter, OpenAI, Gemini, Claude, XiaomiMiMo — pluggable adapters behind `AIExtractor` interface |
| CSV Parsing | papaparse (frontend), csv-parse (backend, streaming) |
| CSV Export | csv-stringify |
| Testing | Vitest + Supertest |
| Containerization | Docker (multi-stage builds) + Docker Compose |

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- An AI API key (any of: OpenRouter, OpenAI, Gemini, Claude, or XiaomiMiMo)

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/yourusername/csv2crm.git
cd csv2crm
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
```

Edit `.env` and add your API key:

```env
OPENROUTER_API_KEY=sk-or-your-key-here
```

### 3. Start services with Docker

```bash
docker-compose up -d postgres redis
```

### 4. Run database migrations

```bash
cd apps/api
npx prisma migrate dev
```

### 5. Start development servers

```bash
# From root directory
npm run dev
```

This starts both:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/csv2crm` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `AI_PROVIDER` | AI provider (`openrouter`, `openai`, `gemini`, `claude`, `xiaomimimo`) | `openrouter` |
| `AI_MODEL` | Model identifier | `openai/gpt-4o-mini` |
| `OPENROUTER_API_KEY` | OpenRouter API key | — |
| `OPENAI_API_KEY` | OpenAI API key (for direct OpenAI) | — |
| `GEMINI_API_KEY` | Google Gemini API key | — |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key | — |
| `XIAOMIMIMO_API_KEY` | XiaomiMiMo API key | — |
| `MIMO_COOKIE` | Browser cookie from platform.xiaomimimo.com (for live balance) | — |
| `BATCH_SIZE` | Rows per AI batch | `20` |
| `BATCH_CONCURRENCY` | Parallel batch processing | `3` |
| `MAX_RETRIES` | Max retry attempts per batch | `3` |
| `PORT` | Backend port | `3001` |
| `FRONTEND_URL` | Frontend URL (for CORS) | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | Backend URL (frontend config) | `http://localhost:3001` |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/uploads` | Upload CSV file (multipart/form-data) |
| `GET` | `/api/uploads` | List all uploads with stats |
| `GET` | `/api/uploads/:id` | Get single upload status with progress |
| `POST` | `/api/uploads/:id/confirm` | Trigger AI processing |
| `GET` | `/api/uploads/:id/records` | Get all parsed records |
| `GET` | `/api/uploads/:id/export` | Download CRM-format CSV |
| `DELETE` | `/api/uploads/:id` | Delete an upload and all related data |
| `GET` | `/api/ai-credits` | AI usage dashboard + live balance |

See [docs/API.md](docs/API.md) for detailed request/response schemas.

## AI Providers

| Provider | `AI_PROVIDER` | `AI_MODEL` example | Adapter |
|---|---|---|---|
| OpenRouter | `openrouter` | `openai/gpt-4o-mini` | OpenAI-compatible |
| OpenAI | `openai` | `gpt-4o-mini` | OpenAI-compatible |
| Google Gemini | `gemini` | `gemini-1.5-flash` | Google Generative AI SDK |
| Anthropic Claude | `claude` | `claude-3-5-sonnet-20241022` | Anthropic SDK |
| XiaomiMiMo | `xiaomimimo` | `xiaomimimo/mimo-v2.5-pro` | OpenAI-compatible |

To switch providers, change `AI_PROVIDER` and `AI_MODEL` in `.env` and provide the corresponding API key. No code changes required.

## Project Structure

```
csv2crm/
├── apps/
│   ├── web/                          # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx        # Root layout (server component)
│   │   │   │   ├── globals.css       # Tailwind + CSS design tokens
│   │   │   │   ├── page.tsx          # Main wizard (upload → preview → process → results)
│   │   │   │   └── jobs/
│   │   │   │       ├── page.tsx      # All jobs list
│   │   │   │       └── [id]/
│   │   │   │           └── page.tsx  # Job detail
│   │   │   ├── components/
│   │   │   │   ├── Navbar.tsx              # Top nav with AI credit badge
│   │   │   │   ├── ThemeToggle.tsx         # Dark/light mode toggle
│   │   │   │   ├── FileUploader.tsx        # Drag-and-drop CSV upload
│   │   │   │   ├── CsvPreviewTable.tsx     # Preview table (resizable columns)
│   │   │   │   ├── ResultsView.tsx         # Imported/skipped results tabs
│   │   │   │   ├── ProcessingState.tsx     # Progress bar + tips
│   │   │   │   ├── JobCostSummary.tsx      # AI token usage summary
│   │   │   │   ├── SampleFiles.tsx         # Downloadable sample CSVs
│   │   │   │   └── useResizableColumns.tsx # Column resize hook + handle
│   │   │   ├── lib/
│   │   │   │   ├── api.ts            # HTTP client (8 API functions)
│   │   │   │   ├── hooks.ts          # 6 React hooks (upload, confirm, poll, records, uploads, credits)
│   │   │   │   └── utils.ts          # formatTokens utility
│   │   │   └── types/
│   │   │       └── index.ts          # TypeScript interfaces
│   │   ├── public/
│   │   │   └── samples/              # Sample CSV files for download
│   │   ├── Dockerfile                # Multi-stage Docker build
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   └── postcss.config.mjs
│   └── api/                          # Express backend
│       ├── src/
│       │   ├── index.ts              # Express server + BullMQ worker bootstrap
│       │   ├── config.ts             # Zod-validated environment config
│       │   ├── routes/
│       │   │   ├── health.ts         # GET /api/health
│       │   │   ├── uploads.ts        # Upload CRUD, confirm, export, records (7 endpoints)
│       │   │   └── ai-credits.ts     # GET /api/ai-credits (usage + live balance)
│       │   ├── services/
│       │   │   ├── ai/
│       │   │   │   ├── AIExtractor.ts              # Adapter interface
│       │   │   │   ├── factory.ts                   # Provider factory
│       │   │   │   ├── prompts.ts                   # System + user prompts
│       │   │   │   ├── pricing.ts                   # Token cost estimation
│       │   │   │   ├── OpenAICompatibleAdapter.ts   # OpenRouter/OpenAI/MiMo
│       │   │   │   ├── GeminiAdapter.ts             # Google Gemini
│       │   │   │   └── ClaudeAdapter.ts             # Anthropic Claude
│       │   │   ├── csv/
│       │   │   │   └── parser.ts     # Streaming CSV parser
│       │   │   ├── queue/
│       │   │   │   ├── bull.ts       # BullMQ queue + worker setup
│       │   │   │   └── processor.ts  # Batch processing logic
│       │   │   └── export.ts         # CRM CSV export
│       │   ├── db/
│       │   │   └── client.ts         # Prisma client singleton
│       │   ├── middleware/
│       │   │   ├── errorHandler.ts   # Global error handler
│       │   │   └── upload.ts         # Multer config (10MB, CSV only)
│       │   ├── types/
│       │   │   └── index.ts          # TypeScript interfaces
│       │   └── utils/
│       │       ├── errors.ts         # Custom error classes (AppError, ValidationError, etc.)
│       │       └── validation.ts     # Zod schemas for AI output
│       ├── prisma/
│       │   └── schema.prisma         # Database schema (4 models, 5 enums)
│       ├── tests/
│       │   ├── routes/uploads.test.ts
│       │   ├── ai/extractor.test.ts
│       │   ├── csv/parser.test.ts
│       │   └── fixtures/             # Test CSV files
│       ├── Dockerfile                # Multi-stage Docker build
│       └── vitest.config.ts
├── docs/
│   ├── API.md                        # Detailed API reference
│   ├── ARCHITECTURE.md               # Technical architecture
│   ├── DEPLOYMENT.md                 # Deployment guide
│   └── technical-specification.md    # Original project spec
├── docker-compose.yml
├── .env.example
├── CONTRIBUTING.md
└── README.md
```

## Docker Deployment

```bash
# Build and start all 4 services
docker-compose up --build

# Or just the infrastructure
docker-compose up -d postgres redis
```

The `docker-compose.yml` includes:
- **postgres** — PostgreSQL 16 with health check
- **redis** — Redis 7 with health check
- **api** — Express backend (runs migrations on startup)
- **web** — Next.js frontend (standalone output)

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for production deployment guidance.

## Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
cd apps/api && npm run test:watch
```

Tests cover:
- **AI validation** — Zod schema validation for extracted records (valid, minimal, invalid enum values)
- **CSV parsing** — Facebook leads, Google ads, messy spreadsheets, BOM handling, empty file rejection
- **Route structure** — Endpoint verification

Test fixtures are located in `apps/api/tests/fixtures/`.

## Supported CSV Formats

The AI can handle any CSV format, including:

- Facebook Lead Ad exports
- Google Ads exports
- Excel/Google Sheets exports
- Real estate CRM exports
- Sales reports
- Marketing agency CSVs
- Manually created spreadsheets

The system intelligently maps column names to CRM fields regardless of naming conventions. Sample files are available in the app UI and in `apps/web/public/samples/`.

## CRM Fields

| Field | Description |
|---|---|
| `created_at` | Lead creation date (ISO 8601) |
| `name` | Lead name |
| `email` | Primary email |
| `country_code` | Phone country code (e.g., +91, +1) |
| `mobile_without_country_code` | Mobile number |
| `company` | Company name |
| `city` | City |
| `state` | State |
| `country` | Country |
| `lead_owner` | Lead owner |
| `crm_status` | `GOOD_LEAD_FOLLOW_UP`, `DID_NOT_CONNECT`, `BAD_LEAD`, `SALE_DONE` |
| `crm_note` | Notes, extra emails/phones, remarks |
| `data_source` | `leads_on_demand`, `meridian_tower`, `eden_park`, `varah_swamy`, `sarjapur_plots` |
| `possession_time` | Property possession time |
| `description` | Additional description |

## Database Schema

4 models with cascade deletes:

- **Upload** — Top-level job (file name, row count, status)
- **Batch** — Chunk of rows for AI processing (status, retry count)
- **LeadRecord** — Individual lead with 15 CRM fields + raw row data
- **AiUsage** — Token usage per batch (prompt, completion, total tokens)

Enums: `UploadStatus`, `BatchStatus`, `RecordStatus`, `CrmStatus`, `DataSource`

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for full schema details.

## License

MIT
