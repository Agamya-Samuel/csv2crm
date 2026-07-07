# Contributing

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Git

## Local Development Setup

```bash
# 1. Clone
git clone https://github.com/yourusername/csv2crm.git
cd csv2crm

# 2. Install dependencies (npm workspaces)
npm install

# 3. Copy environment file
cp .env.example .env
# Edit .env with your API key

# 4. Start infrastructure
docker-compose up -d postgres redis

# 5. Run migrations
cd apps/api && npx prisma migrate dev && cd ../..

# 6. Start dev servers
npm run dev
```

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start both frontend and backend |
| `npm run dev:api` | Start backend only |
| `npm run dev:web` | Start frontend only |
| `npm run build` | Build both apps |
| `npm run build:api` | Build backend only |
| `npm run build:web` | Build frontend only |
| `npm run test` | Run backend tests |
| `npm run lint` | Type-check backend |

## Project Structure

This is an npm workspace monorepo with two apps:

- `apps/api` — Express + TypeScript backend
- `apps/web` — Next.js + TypeScript frontend

Shared dependencies are installed at the root. Per-app dependencies are in each app's `package.json`.

## Adding a New AI Provider

### 1. Create the adapter

Create `apps/api/src/services/ai/YourAdapter.ts`:

```typescript
import type { AIExtractor, ExtractionResult } from "./AIExtractor";
import type { RawRow } from "../../types";

export class YourAdapter implements AIExtractor {
  constructor(private apiKey: string | undefined, private model: string) {}

  async extractBatch(rows: RawRow[], sourceColumns: string[]): Promise<ExtractionResult> {
    // 1. Build messages using SYSTEM_PROMPT and buildUserPrompt()
    // 2. Call your AI provider's API
    // 3. Parse JSON from response
    // 4. Validate against extractedBatchSchema (from ../../utils/validation)
    // 5. Return { records, usage: { promptTokens, completionTokens, totalTokens } }
  }
}
```

### 2. Register in the factory

Edit `apps/api/src/services/ai/factory.ts`:

```typescript
case "yourprovider":
  return new YourAdapter(config.YOURPROVIDER_API_KEY, config.AI_MODEL);
```

### 3. Add environment variable

Edit `apps/api/src/config.ts`:

```typescript
YOURPROVIDER_API_KEY: z.string().optional(),
```

Add the variable to `.env.example`.

### 4. Add pricing (optional)

Edit `apps/api/src/services/ai/pricing.ts` to add per-token rates.

## Database Changes

```bash
# 1. Edit prisma/schema.prisma

# 2. Create migration
cd apps/api
npx prisma migrate dev --name describe_your_change

# 3. Regenerate client (if needed)
npx prisma generate
```

Migrations are auto-applied in Docker via `prisma migrate deploy` on container start.

## Testing

```bash
# Run all tests
npm run test

# Watch mode
cd apps/api && npm run test:watch
```

### Test Structure

```
apps/api/tests/
├── routes/uploads.test.ts    # Route structure tests
├── ai/extractor.test.ts      # Zod schema validation tests
├── csv/parser.test.ts        # CSV parsing tests (uses fixtures)
└── fixtures/                 # Test CSV files
    ├── facebook-leads.csv
    ├── google-ads.csv
    └── messy-spreadsheet.csv
```

## Code Conventions

### Backend (apps/api)

- **TypeScript strict mode** — All files use explicit types
- **Zod for validation** — Environment config and AI output validated with Zod schemas
- **Error handling** — Use custom error classes from `src/utils/errors.ts` (ValidationError, NotFoundError, CSVParserError, AIServiceError)
- **Async routes** — All route handlers are `async` with `try/catch` calling `next(err)`
- **Service layer** — Business logic in `src/services/`, routes are thin controllers

### Frontend (apps/web)

- **Client components** — All pages and interactive components use `"use client"` directive
- **Hooks pattern** — API calls wrapped in custom hooks (`src/lib/hooks.ts`) with loading/error state
- **Tailwind + CSS variables** — Styling via Tailwind classes, theme colors via HSL CSS variables in `globals.css`
- **TanStack Table** — All data tables use `@tanstack/react-table` with `columnResizeMode: "onChange"`
- **No global state management** — State is local to pages, passed via props or hooks
