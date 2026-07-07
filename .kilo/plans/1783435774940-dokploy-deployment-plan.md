# Deploy csv2crm to Dokploy

## Context

The user wants to deploy the full-stack csv2crm app (Next.js frontend + Express API + PostgreSQL + Redis) to Dokploy as a single Docker Compose deployment. The project already has a working `docker-compose.yml` and individual Dockerfiles for both apps. Dokploy natively supports Docker Compose deployments.

## Approach: Single Docker Compose Service in Dokploy

Dokploy's "Docker Compose" service type lets you paste a compose file and deploy the entire stack as one unit. This is the simplest path — no changes to existing Dockerfiles needed.

---

## Steps

### 1. Modify `docker-compose.yml` for Dokploy compatibility

Current issues with the existing compose file for Dokploy deployment:

- **`build` context** uses `.` which works since Dokploy clones the repo and runs compose from the project root. ✅ No change needed.
- **Environment variables** use `${VAR}` syntax — Dokploy writes UI-defined env vars to a `.env` file next to the compose, so this works. ✅ No change needed.
- **Networking** — services communicate via Docker Compose internal networking (`postgres`, `redis` hostnames). ✅ Already correct.
- **Domain routing** — needs Dokploy domain config (see Step 3).

**One required change:** The `FRONTEND_URL` and `NEXT_PUBLIC_API_URL` must point to actual deployed domains, not `localhost`. These will be set via Dokploy's environment UI.

No changes to `docker-compose.yml` are needed.

### 2. Set up Dokploy

1. **Install Dokploy** on your VPS (if not already):
   ```bash
   curl -sSL https://dokploy.com/install.sh | sh
   ```

2. **Create a Docker Compose service:**
   - Dokploy Dashboard → Projects → Create Project
   - Add Service → **Docker Compose**
   - Connect your Git repository (GitHub/GitLab/Bitbucket)
   - Set the compose file path to `docker-compose.yml` (root)

3. **Configure environment variables** in the Dokploy UI (Environment tab):
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

### 3. Configure domains in Dokploy

For external access, configure domains in the **Domains** tab of the Docker Compose service:

| Service | Domain Config |
|---------|--------------|
| `web` | `your-app.your-domain.com` → port `3000` |
| `api` | `your-api.your-domain.com` → port `3001` |

Dokploy will auto-generate SSL certificates via Let's Encrypt.

### 4. Deploy

Click **Deploy** in the Dokploy dashboard. This will:
1. `git clone` your repo
2. Run `docker compose up -d --build`
3. Build both Dockerfiles (API + Web)
4. Start all 4 services (postgres, redis, api, web)
5. The API container automatically runs `prisma migrate deploy` on startup

---

## What the Existing `docker-compose.yml` Already Handles

- ✅ PostgreSQL 16 with health check and named volume
- ✅ Redis 7 with health check and named volume
- ✅ API build via `apps/api/Dockerfile` (multi-stage, runs Prisma migrations)
- ✅ Web build via `apps/web/Dockerfile` (multi-stage, Next.js standalone)
- ✅ Service dependencies (api waits for postgres/redis health, web waits for api)
- ✅ Environment variable passthrough via `${VAR}` syntax

## Files to Change

| File | Change |
|------|--------|
| `docker-compose.yml` | Add `container_name` directives (optional, for clearer Dokploy logs) |

No other file changes required.

## Risks

- **Data persistence:** Named volumes (`postgres_data`, `redis_data`) persist across redeployments within Dokploy. For backup, use Dokploy's Volume Backup feature to S3.
- **File uploads:** The API uses `multer` for CSV uploads. If the container restarts, in-progress uploads stored in the container filesystem will be lost. Consider adding a persistent volume for `/app/uploads` if needed (currently uploads are processed in-memory/streamed).
- **Domain setup:** Requires DNS A records pointing to your VPS IP for both subdomains.

## Validation

1. After deploy, check `docker-compose ps` — all 4 services should be healthy
2. Visit `https://your-app.your-domain.com` — frontend should load
3. Visit `https://your-api.your-domain.com/api/health` — should return 200
4. Upload a sample CSV through the UI to verify end-to-end flow
