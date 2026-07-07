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

### Dokploy (Recommended — Full Stack in One Deploy)

[Dokploy](https://dokploy.com) is a self-hosted PaaS that natively supports Docker Compose deployments. The entire csv2crm stack (frontend, API, Postgres, Redis) deploys as a single Docker Compose service.

#### 1. Install Dokploy on your VPS

```bash
curl -sSL https://dokploy.com/install.sh | sh
```

#### 2. Create a Docker Compose service

1. Dokploy Dashboard → **Projects** → **Create Project**
2. **Add Service** → **Docker Compose**
3. Connect your Git repository (GitHub/GitLab/Bitbucket)
4. Set compose file path: `docker-compose.yml`

#### 3. Configure environment variables

In the Dokploy UI → **Environment** tab, add these variables:

```
OPENROUTER_API_KEY=sk-or-your-key-here
AI_PROVIDER=openrouter
AI_MODEL=openai/gpt-4o-mini
BATCH_SIZE=20
BATCH_CONCURRENCY=3
MAX_RETRIES=3
FRONTEND_URL=https://your-app.your-domain.com
NEXT_PUBLIC_API_URL=https://your-api.your-domain.com
```

Dokploy writes these to a `.env` file that `docker-compose.yml` reads automatically via `${VAR}` syntax.

#### 4. Configure domains

In the **Domains** tab, add domains for the `web` and `api` services:

| Service | Internal Port | Example Domain |
|---------|--------------|----------------|
| `web`   | 3000         | `app.your-domain.com` |
| `api`   | 3001         | `api.your-domain.com` |

Dokploy auto-provisions SSL certificates via Let's Encrypt.

#### 5. Deploy

Click **Deploy**. Dokploy will:
1. Clone your repo
2. Run `docker compose up -d --build`
3. Build both Dockerfiles (multi-stage)
4. Start all 4 services with health-check-based ordering
5. The API automatically runs `prisma migrate deploy` on startup

#### Dokploy Data Persistence

- Postgres and Redis use Docker named volumes (`postgres_data`, `redis_data`) which persist across redeployments.
- Enable **Volume Backups** in Dokploy (S3-compatible) for automated database backups.

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
