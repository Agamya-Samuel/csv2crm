# Deployment

## Docker Compose (Recommended for Local/Single-Server)

### Full Stack

```bash
# Build and start all services
docker-compose up --build

# Detached mode
docker-compose up --build -d
```

This starts 4 services:
- `postgres` — PostgreSQL 16 on port 5432
- `redis` — Redis 7 on port 6379
- `api` — Express backend on port 3001 (runs `prisma migrate deploy` on startup)
- `web` — Next.js frontend on port 3000

### Infrastructure Only

```bash
# Start just Postgres and Redis, run apps locally
docker-compose up -d postgres redis
```

### Environment Variables

Pass environment variables via a `.env` file in the project root (Docker Compose reads it automatically):

```env
OPENROUTER_API_KEY=sk-or-your-key-here
BATCH_SIZE=20
BATCH_CONCURRENCY=3
MAX_RETRIES=3
```

### Health Checks

Both Postgres and Redis have health checks configured. The API service waits for both to be healthy before starting:

```bash
# Check service health
docker-compose ps
```

## Cloud Deployment

### Frontend → Vercel

1. Connect your GitHub repo to Vercel
2. Set root directory to `apps/web`
3. Set environment variable: `NEXT_PUBLIC_API_URL=https://your-api-domain.com`
4. Vercel auto-detects Next.js and deploys

### Backend + DB → Railway or Render

1. Connect your GitHub repo
2. Set root directory to `apps/api` (or use Dockerfile at root)
3. Add a PostgreSQL service (Railway/Render provide managed Postgres)
4. Set environment variables:

```
DATABASE_URL=postgresql://...  (from managed Postgres)
REDIS_URL=redis://...          (add a Redis service)
AI_PROVIDER=openrouter
AI_MODEL=openai/gpt-4o-mini
OPENROUTER_API_KEY=sk-or-...
BATCH_SIZE=20
BATCH_CONCURRENCY=3
MAX_RETRIES=3
PORT=3001
FRONTEND_URL=https://your-frontend.vercel.app
```

5. Deploy command: `npx prisma migrate deploy && node dist/index.js`
6. Or use the provided Dockerfile which handles this automatically

## Dockerfiles

Both apps use multi-stage builds for minimal production images:

### API Dockerfile (`apps/api/Dockerfile`)

- **Builder stage:** `node:20-alpine` → install deps → generate Prisma client → compile TypeScript
- **Runner stage:** `node:20-alpine` → copy `dist/`, `node_modules/`, `prisma/` → install `openssl3` (Prisma requirement) → run migrations + start server

### Web Dockerfile (`apps/web/Dockerfile`)

- **Builder stage:** `node:20-alpine` → install deps → `next build`
- **Runner stage:** `node:20-alpine` → copy standalone output (`.next/standalone`, `.next/static`, `public/`) → `node server.js`

The web Dockerfile uses Next.js `output: "standalone"` mode which bundles only the files needed for production, resulting in a smaller image.

## Reverse Proxy

If running behind Nginx or Caddy, proxy both services:

```nginx
# Nginx example
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;  # Next.js frontend
    }

    location /api/ {
        proxy_pass http://localhost:3001;  # Express backend
    }
}
```

## Database Migrations

Migrations run automatically when the API container starts (`prisma migrate deploy` in Dockerfile CMD).

For manual migration in production:

```bash
# Inside the API container or with DATABASE_URL set
npx prisma migrate deploy
```

To create a new migration during development:

```bash
cd apps/api
npx prisma migrate dev --name describe_change
```

## Troubleshooting

### API fails to start

- Verify `DATABASE_URL` is correct and Postgres is reachable
- Verify `REDIS_URL` is correct and Redis is reachable
- Check that required API key is set for your `AI_PROVIDER`

### Frontend can't reach API

- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check CORS: `FRONTEND_URL` on the API must match the frontend's actual URL
- Ensure the API port (3001) is exposed and not blocked

### BullMQ jobs not processing

- Verify Redis is running and accessible
- Check `REDIS_URL` format: `redis://hostname:port`
- Redis must allow multiple connections (BullMQ requires `maxRetriesPerRequest: null`)

### Prisma migration errors

- Ensure `openssl3` is installed in the Docker image (already in Dockerfile)
- Verify `DATABASE_URL` format: `postgresql://user:password@host:port/database`
- For fresh databases, `prisma migrate deploy` applies all pending migrations
