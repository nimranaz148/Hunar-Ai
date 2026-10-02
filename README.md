# Hunar v2

AI-powered platform for Pakistani home-business women. Built for the Oct 2026 contest.

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+
- [uv](https://docs.astral.sh/uv/) (Python package manager)
- [pnpm](https://pnpm.io/) (Node package manager)
- Docker & Docker Compose

### Setup

```bash
# 1. Clone and enter the repo
git clone <repo-url>
cd hunar-ai

# 2. Copy environment file
cp .env.example .env
# Edit .env with your values

# 3. Start database
docker compose up -d

# 4. Install API dependencies
cd apps/api
uv sync
uv run alembic upgrade head
cd ../..

# 5. Install web dependencies
cd apps/web
pnpm install
cd ../..

# 6. Run the API
cd apps/api
uv run uvicorn app.main:app --reload --port 8000

# 7. Run the web app (separate terminal)
cd apps/web
pnpm dev
```

### Verification

```bash
bash scripts/verify.sh --all
```

## Architecture

- **API:** FastAPI (Python 3.12+) — `apps/api/`
- **Web:** Next.js 15 (App Router, TypeScript) — `apps/web/`
- **Database:** PostgreSQL 16 (Supabase)
- **AI:** OpenAI Agents SDK + Gemini 2.5 Flash
- **Hosting:** FastAPI Cloud (API) + Vercel (Web) + Supabase (DB)

See `context/architecture.md` for full details.

## Project Structure

```
apps/api/            # FastAPI backend
apps/web/            # Next.js frontend
apps/agents/         # Agent service (placeholder)
packages/api-client/ # Generated TypeScript API client
infra/               # Docker Compose files
context/             # AI coding context files
docs/                # PRD, ADRs, design docs
scripts/             # Verification, seed, deployment
```

## Documentation

- [PRD](docs/prd/PRD.md) — Product Requirements
- [Architecture](context/architecture.md) — Technical architecture
- [Build Plan](context/build-plan.md) — Phase breakdown
- [Code Standards](context/code-standards.md) — Coding rules
