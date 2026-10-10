# Hunar v2 — Production Deployment Guide

This guide covers deploying Hunar v2 to production infrastructure with Supabase PostgreSQL, containerized FastAPI backend, and Vercel-hosted Next.js frontend.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup (Supabase PostgreSQL)](#database-setup-supabase-postgresql)
3. [Backend Deployment (FastAPI)](#backend-deployment-fastapi)
4. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Database Seeding](#database-seeding)
7. [Environment Variables Reference](#environment-variables-reference)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- **Supabase Account**: [supabase.com](https://supabase.com)
- **Container Platform**: Docker Hub, AWS ECR, Google Cloud Run, Railway, Render, or similar
- **Vercel Account**: [vercel.com](https://vercel.com)
- **API Keys**:
  - Google Gemini API key (for AI agents)
  - Tavily API key (for web research)
- **Local Tools**:
  - Docker Desktop (for building container)
  - Git
  - pnpm 12.8.1+

---

## Database Setup (Supabase PostgreSQL)

### 1. Create Supabase Project

1. Log in to [Supabase Dashboard](https://app.supabase.com)
2. Click **New Project**
3. Configure:
   - **Name**: `hunar-v2-prod`
   - **Database Password**: Generate strong password (save securely)
   - **Region**: Choose closest to your users (e.g., `Singapore` for Pakistani users)
   - **Pricing Plan**: At minimum **Pro** for connection pooling (500+ concurrent connections recommended)

### 2. Get Database Connection Strings

From **Project Settings** → **Database**:

1. **Transaction Mode (Direct Connection)**:
   ```
   postgresql://postgres.xxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
   - Use this for Alembic migrations (sync operations)
   - Copy as `DIRECT_DATABASE_URL`

2. **Session Mode (Pooled Connection)**:
   ```
   postgresql://postgres.xxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
   ```
   - Use this for application runtime (async operations)
   - Copy as `DATABASE_URL`

### 3. Configure SSL Mode

Supabase requires SSL. Ensure your connection strings include:
```
?sslmode=require
```

If not present, append it:
```
postgresql://postgres.xxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require
```

### 4. Run Database Migrations

From your local machine (or CI/CD):

```bash
cd apps/api

# Set environment variable for Alembic (direct connection)
export DATABASE_URL="postgresql://postgres.xxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require"

# Run migrations
uv run alembic upgrade head
```

**Expected Output**:
```
INFO  [alembic.runtime.migration] Running upgrade  -> a1b2c3d4e5f6, create users table
INFO  [alembic.runtime.migration] Running upgrade a1b2c3d4e5f6 -> b2c3d4e5f6a1, create businesses table
...
INFO  [alembic.runtime.migration] Running upgrade xyz -> 20261009_0015, add notifications table
```

### 5. Verify Database Schema

In Supabase Dashboard → **Table Editor**, confirm tables exist:
- `users`
- `businesses`
- `products`
- `pricing_results`
- `launch_plans`
- `plan_tasks`
- `content_calendars`
- `content_items`
- `research_reports`
- `mentor_profiles`
- `mentor_services`
- `mentor_availability`
- `bookings`
- `booking_reviews`
- `metrics_snapshots`
- `weekly_review_proposals`
- `cohort_programs`
- `feature_flags`
- `agent_runs`
- `notifications`

---

## Backend Deployment (FastAPI)

### Option A: Docker-Based Deployment (Railway, Render, Fly.io, Cloud Run)

#### 1. Build Docker Image

From repo root:

```bash
cd apps/api

# Build image
docker build -t hunar-api:latest .

# Test locally
docker run -p 8000:8000 \
  -e DATABASE_URL="postgresql+asyncpg://..." \
  -e JWT_SECRET="your-production-secret-min-32-chars" \
  -e GEMINI_API_KEY="your-gemini-key" \
  -e TAVILY_API_KEY="your-tavily-key" \
  -e ENVIRONMENT="production" \
  -e CORS_ORIGINS="https://hunar-v2.vercel.app" \
  hunar-api:latest
```

Visit `http://localhost:8000/api/v1/health` — should return:
```json
{"status": "ok", "version": "0.1.0"}
```

#### 2. Push to Container Registry

**Docker Hub**:
```bash
docker tag hunar-api:latest yourusername/hunar-api:latest
docker push yourusername/hunar-api:latest
```

**AWS ECR**:
```bash
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.ap-south-1.amazonaws.com
docker tag hunar-api:latest 123456789.dkr.ecr.ap-south-1.amazonaws.com/hunar-api:latest
docker push 123456789.dkr.ecr.ap-south-1.amazonaws.com/hunar-api:latest
```

#### 3. Deploy to Cloud Platform

**Railway**:
1. Create new project → **Deploy from Docker Image**
2. Set image: `yourusername/hunar-api:latest`
3. Add environment variables (see [Environment Variables Reference](#environment-variables-reference))
4. Configure:
   - **Port**: `8000`
   - **Health Check Path**: `/api/v1/health`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2`

**Google Cloud Run**:
```bash
gcloud run deploy hunar-api \
  --image gcr.io/your-project/hunar-api:latest \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --port 8000 \
  --set-env-vars "DATABASE_URL=postgresql+asyncpg://...,JWT_SECRET=...,GEMINI_API_KEY=...,TAVILY_API_KEY=...,ENVIRONMENT=production,CORS_ORIGINS=https://hunar-v2.vercel.app"
```

**Render**:
1. Dashboard → **New Web Service**
2. **Runtime**: Docker
3. **Docker Image URL**: `yourusername/hunar-api:latest`
4. **Port**: `8000`
5. Add environment variables
6. Health Check: `/api/v1/health`

#### 4. Note API URL

Save your deployed API URL:
```
https://hunar-api-xyz.railway.app
```
or
```
https://hunar-api-abc123.run.app
```

You'll need this for frontend configuration.

### Option B: Platform-as-a-Service (Render, Heroku)

If deploying directly from Git without Docker:

**Render** (Recommended):
1. Dashboard → **New Web Service**
2. Connect Git repository
3. Configure:
   - **Root Directory**: `apps/api`
   - **Runtime**: Python 3.12
   - **Build Command**: `pip install uv && uv pip install --system -r pyproject.toml && uv run alembic upgrade head`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 2`
4. Add environment variables
5. Deploy

---

## Frontend Deployment (Vercel)

### 1. Connect Repository to Vercel

1. Log in to [Vercel Dashboard](https://vercel.com)
2. Click **Add New Project**
3. **Import Git Repository**: Select your Hunar v2 repo
4. Vercel will auto-detect Next.js

### 2. Configure Project Settings

**Framework Preset**: Next.js

**Root Directory**: Leave as `.` (repo root) — Vercel will detect monorepo

**Build Settings** (auto-detected from `vercel.json`):
- **Build Command**: `cd apps/web && pnpm build`
- **Output Directory**: `apps/web/.next`
- **Install Command**: `pnpm install`

### 3. Environment Variables

Add in **Project Settings** → **Environment Variables**:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://hunar-api-xyz.railway.app` | Production |

**Important**: `NEXT_PUBLIC_*` variables are bundled at build time. If you update `NEXT_PUBLIC_API_URL`, you must **redeploy** the frontend.

### 4. Deploy

Click **Deploy**. Vercel will:
1. Install dependencies with pnpm
2. Build Next.js app in `apps/web`
3. Deploy to edge network

**Deployment URL**: `https://hunar-v2.vercel.app` (or your custom domain)

### 5. Custom Domain (Optional)

**Project Settings** → **Domains**:
1. Add domain: `app.hunar.pk`
2. Configure DNS:
   - **Type**: CNAME
   - **Name**: `app`
   - **Value**: `cname.vercel-dns.com`

---

## Post-Deployment Verification

### 1. Backend Health Check

```bash
curl https://hunar-api-xyz.railway.app/api/v1/health
```

**Expected**:
```json
{"status": "ok", "version": "0.1.0"}
```

### 2. API Documentation

Visit:
```
https://hunar-api-xyz.railway.app/api/v1/docs
```

Verify Swagger UI loads with all endpoints.

### 3. Frontend Load Test

Visit:
```
https://hunar-v2.vercel.app
```

**Expected**:
- Landing page loads
- Can navigate to `/login`
- Login page connects to API (check browser DevTools Network tab)

### 4. End-to-End Authentication Test

1. Navigate to `/login`
2. Enter credentials (if seeded): `admin@hunar.pk` / `Admin1234!`
3. Verify:
   - Login succeeds
   - Redirects to `/dashboard` or `/admin`
   - API returns user data

### 5. Database Connection Verification

Check backend logs for successful database queries:
```
INFO sqlalchemy.engine.Engine SELECT * FROM users LIMIT 1
```

If errors like `connection refused` or `SSL required`, review [Database Setup](#database-setup-supabase-postgresql).

---

## Database Seeding

### When to Seed

- **Development/Staging**: Always seed with sample data
- **Production**: Only seed:
  - Initial Super Admin account
  - Initial Feature Flags
  - **NOT** sample entrepreneurs, businesses, or test data

### Seed Development Data (Staging Only)

From local machine connected to staging database:

```bash
cd apps/api

# Set DATABASE_URL to staging Supabase
export DATABASE_URL="postgresql://postgres.xxx:[PASSWORD]@...staging.supabase.com:5432/postgres?sslmode=require"

# Run full seed (20 entrepreneurs, 5 mentors, sample data)
uv run python -m scripts.seed

# Verify
uv run python -m scripts.seed --dry-run
```

**Entities Created**:
- 1 Super Admin (`admin@hunar.pk`)
- 5 Verified Mentors
- 20 Entrepreneurs across all progression stages
- 10 Mentor Services
- 20 Businesses with Products, Plans, Content
- 150 Content Items
- 35 Metrics Snapshots
- Bookings, Reviews, Notifications

### Seed Production Data (Super Admin Only)

**Production should NOT use full seed script.** Instead:

1. **Create Super Admin via SQL**:

```sql
-- In Supabase SQL Editor
INSERT INTO users (email, hashed_password, role, is_email_verified)
VALUES (
  'admin@hunar.pk',
  -- Generate password hash locally with argon2-cffi:
  -- python -c "from argon2 import PasswordHasher; print(PasswordHasher().hash('YourSecurePassword!'))"
  '$argon2id$v=19$m=65536,t=3,p=4$...',
  'super_admin',
  true
);
```

2. **Initialize Feature Flags**:

```bash
# Set DATABASE_URL to production
export DATABASE_URL="postgresql://postgres.xxx:[PASSWORD]@...prod.supabase.com:5432/postgres?sslmode=require"

# Seed only feature flags
uv run python -c "
from sqlalchemy import create_engine
from app.core.config import settings
from app.models.feature_flag import FeatureFlag

engine = create_engine(settings.sync_database_url)
with engine.begin() as conn:
    conn.execute('INSERT INTO feature_flags (flag_name, is_enabled) VALUES (%s, %s) ON CONFLICT (flag_name) DO NOTHING', [
        ('weekly_coach_agent', True),
        ('mentor_marketplace', True),
        ('meta_connect', False),
        ('vision_metrics', False),
        ('user_registration', True),
    ])
print('Feature flags initialized')
"
```

### Clean Database (Development Only)

**WARNING**: This deletes ALL data.

```bash
uv run python -m scripts.seed --clean
```

Confirm when prompted. Tables are wiped in reverse dependency order.

---

## Environment Variables Reference

### Backend (FastAPI)

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `postgresql+asyncpg://user:pass@host:5432/db?sslmode=require` | Async database connection (pooled) |
| `JWT_SECRET` | Yes | `a1b2c3d4e5f6...` (min 32 chars) | Secret for signing JWTs |
| `JWT_ALGORITHM` | No | `HS256` | JWT signing algorithm (default: HS256) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `15` | Access token lifespan (default: 15 minutes) |
| `REFRESH_TOKEN_EXPIRE_DAYS` | No | `7` | Refresh token lifespan (default: 7 days) |
| `GEMINI_API_KEY` | Yes | `AIza...` | Google Gemini API key for AI agents |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Gemini model name |
| `TAVILY_API_KEY` | Yes | `tvly-...` | Tavily search API key |
| `ENVIRONMENT` | No | `production` | Environment name (default: development) |
| `CORS_ORIGINS` | No | `https://app.hunar.pk,https://hunar-v2.vercel.app` | Comma-separated allowed origins |
| `API_PORT` | No | `8000` | Port to bind (default: 8000) |

### Frontend (Next.js)

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | `https://hunar-api-xyz.railway.app` | Backend API base URL (must include protocol) |

---

## Troubleshooting

### Issue: "Connection refused" from Frontend to API

**Cause**: CORS misconfiguration or incorrect `NEXT_PUBLIC_API_URL`

**Fix**:
1. Verify `NEXT_PUBLIC_API_URL` in Vercel matches deployed API URL (with `https://`)
2. Ensure API `CORS_ORIGINS` includes frontend URL:
   ```
   CORS_ORIGINS=https://hunar-v2.vercel.app
   ```
3. Redeploy frontend after changing `NEXT_PUBLIC_API_URL`

### Issue: "SSL required" Database Error

**Cause**: Supabase requires SSL; connection string missing `?sslmode=require`

**Fix**:
```bash
# Append to DATABASE_URL
?sslmode=require
```

### Issue: "Too many connections" Database Error

**Cause**: Using direct connection (port 6543) for application runtime

**Fix**:
- Use **Session Mode (port 5432)** for runtime `DATABASE_URL`
- Use **Transaction Mode (port 6543)** only for migrations

### Issue: 502 Bad Gateway on API

**Cause**: Container failed to start or health check failing

**Fix**:
1. Check container logs:
   ```bash
   # Railway
   railway logs

   # Cloud Run
   gcloud run logs read hunar-api --limit 50
   ```
2. Look for:
   - Database connection errors (check `DATABASE_URL` format)
   - Missing environment variables
   - Python import errors (rebuild image)

### Issue: API Returns 500 on Authenticated Requests

**Cause**: `JWT_SECRET` not set or changed between deployments

**Fix**:
1. Set `JWT_SECRET` to consistent value (min 32 characters)
2. Generate secure secret:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```
3. Restart API container

### Issue: Next.js Build Fails "Module not found: @hunar/api-client"

**Cause**: API client package not built in monorepo

**Fix**:
Ensure `pnpm install` runs at repo root (installs workspace dependencies). Vercel `vercel.json` already configures this:
```json
"installCommand": "pnpm install"
```

If still failing, check `packages/api-client/package.json` is committed to Git.

### Issue: Agents Fail with "API key not found"

**Cause**: `GEMINI_API_KEY` or `TAVILY_API_KEY` not set

**Fix**:
1. Obtain API keys:
   - Gemini: [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Tavily: [Tavily Dashboard](https://tavily.com)
2. Add to backend environment variables
3. Restart API

**Fallback Behavior**: If `GEMINI_API_KEY` is empty, agents return deterministic mock responses (development only).

---

## Production Checklist

Before going live:

- [ ] Database migrations applied (`alembic upgrade head`)
- [ ] Super Admin account created
- [ ] Feature flags initialized
- [ ] `JWT_SECRET` set to secure 32+ character string
- [ ] `GEMINI_API_KEY` and `TAVILY_API_KEY` configured
- [ ] `DATABASE_URL` uses Session Mode (port 5432) with `?sslmode=require`
- [ ] API health check returns `200 OK` at `/api/v1/health`
- [ ] API docs accessible at `/api/v1/docs`
- [ ] CORS configured with production frontend URL
- [ ] Frontend `NEXT_PUBLIC_API_URL` points to production API
- [ ] Frontend loads without console errors
- [ ] End-to-end login test successful
- [ ] SSL certificates valid (Vercel auto-provisions)
- [ ] Monitoring/logging configured (Railway, Cloud Run built-in)
- [ ] Backup strategy for Supabase (automatic daily backups on Pro plan)

---

## Support

For deployment issues:
1. Check logs (container platform dashboard or CLI)
2. Verify environment variables match [reference](#environment-variables-reference)
3. Test connectivity: `curl https://your-api.com/api/v1/health`
4. Review [Troubleshooting](#troubleshooting) section

For platform-specific help:
- **Supabase**: [docs.supabase.com](https://docs.supabase.com)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Railway**: [docs.railway.app](https://docs.railway.app)
- **Google Cloud Run**: [cloud.google.com/run/docs](https://cloud.google.com/run/docs)

---

**Deployment Guide Version**: 1.0.0
**Last Updated**: 2026-10-10
**Hunar v2 API**: 0.1.0
