# CSV2CRM — AI-Powered Lead Importer

A full-stack application that intelligently extracts CRM lead information from any valid CSV format using AI, and converts it to GrowEasy CRM format.

## Architecture

```
┌─────────────────────┐        ┌────────────────────────────┐        ┌──────────────────┐
│   Next.js Frontend  │  HTTP  │   Express Backend API      │  SQL   │   PostgreSQL     │
│  (Port 3000)        │ ─────▶│   (Port 3001)              │ ─────▶ │                  │
│                     │ ◀─────│                            │ ◀───── │                  │
└─────────────────────┘        └───────────┬────────────────┘        └──────────────────┘
                                            │
                                   ┌────────┴────────┐
                                   ▼                 ▼
                            ┌────────────┐    ┌──────────────┐
                            │   Redis    │    │   OpenRouter │
                            │  (BullMQ)  │    │   / AI APIs  │
                            └────────────┘    └──────────────┘
```

## Features

- **Drag & Drop CSV Upload** — Upload any CSV file regardless of column names or structure
- **Live Preview** — See parsed data in a responsive table before importing
- **AI-Powered Extraction** — Intelligently maps fields to GrowEasy CRM format
- **Batch Processing** — Processes records in batches with progress tracking
- **Retry Mechanism** — Failed batches retry with exponential backoff
- **Dark Mode** — Toggle between light and dark themes
- **CSV Export** — Download imported records as a formatted CSV
- **Pluggable AI** — Supports OpenRouter, OpenAI, Gemini, and Claude

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, TanStack Table, react-dropzone |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Queue | BullMQ + Redis |
| AI | OpenRouter (OpenAI-compatible), Gemini, Claude — pluggable adapters |
| CSV Parsing | papaparse (frontend), csv-parse (backend) |
| Testing | Vitest + Supertest |

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- An AI API key (OpenRouter recommended)

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
| `AI_PROVIDER` | AI provider (`openrouter`, `openai`, `gemini`, `claude`) | `openrouter` |
| `AI_MODEL` | Model identifier | `openai/gpt-4o-mini` |
| `OPENROUTER_API_KEY` | OpenRouter API key | — |
| `OPENAI_API_KEY` | OpenAI API key (for direct OpenAI) | — |
| `GEMINI_API_KEY` | Google Gemini API key | — |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key | — |
| `BATCH_SIZE` | Rows per AI batch | `20` |
| `BATCH_CONCURRENCY` | Parallel batch processing | `3` |
| `MAX_RETRIES` | Max retry attempts per batch | `3` |
| `PORT` | Backend port | `3001` |
| `FRONTEND_URL` | Frontend URL (for CORS) | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | Backend URL (frontend config) | `http://localhost:3001` |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/uploads` | Upload CSV file (multipart/form-data) |
| `POST` | `/api/uploads/:id/confirm` | Trigger AI processing |
| `GET` | `/api/uploads/:id` | Get processing status (poll) |
| `GET` | `/api/uploads/:id/records` | Get all parsed records |
| `GET` | `/api/uploads/:id/export` | Download CRM-format CSV |
| `GET` | `/api/health` | Health check |

## Project Structure

```
csv2crm/
├── apps/
│   ├── web/                     # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/             # App Router pages
│   │   │   ├── components/      # React components
│   │   │   ├── lib/             # API client & hooks
│   │   │   └── types/           # TypeScript types
│   │   └── Dockerfile
│   └── api/                     # Express backend
│       ├── src/
│       │   ├── routes/          # API routes
│       │   ├── services/        # Business logic
│       │   │   ├── ai/          # AI adapters (OpenRouter, Gemini, Claude)
│       │   │   ├── csv/         # CSV parsing
│       │   │   └── queue/       # BullMQ processing
│       │   ├── db/              # Prisma client
│       │   ├── middleware/      # Express middleware
│       │   └── utils/           # Errors, validation
│       ├── prisma/              # Database schema
│       ├── tests/               # Test files
│       └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## Docker Deployment

```bash
# Build and start everything
docker-compose up --build

# Or just the infrastructure
docker-compose up -d postgres redis
```

## Testing

```bash
# Run all tests
npm run test

# Backend tests only
npm run test -w apps/api
```

## Supported CSV Formats

The AI can handle any CSV format, including:

- Facebook Lead Ad exports
- Google Ads exports
- Excel/Google Sheets exports
- Real estate CRM exports
- Sales reports
- Marketing agency CSVs
- Manually created spreadsheets

The system intelligently maps column names to CRM fields regardless of naming conventions.

## CRM Fields

| Field | Description |
|---|---|
| `created_at` | Lead creation date |
| `name` | Lead name |
| `email` | Primary email |
| `country_code` | Phone country code |
| `mobile_without_country_code` | Mobile number |
| `company` | Company name |
| `city` | City |
| `state` | State |
| `country` | Country |
| `lead_owner` | Lead owner |
| `crm_status` | GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE |
| `crm_note` | Notes and remarks |
| `data_source` | leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots |
| `possession_time` | Property possession time |
| `description` | Additional description |

## License

MIT
