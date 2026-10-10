# Hunar v2

**AI-powered co-pilot for Pakistani women micro-entrepreneurs**

Hunar v2 is a specialized multi-agent system built to help informal home-business women in Pakistan validate ideas, calculate unit economics, plan launches, generate content, track metrics, and access verified mentors — all through natural Roman Urdu conversation with strict human approval gates.

**Built for:** Contest Demonstration (October 2026)
**Demo Script:** [`docs/demo-script.md`](docs/demo-script.md)
**User Manual:** [`docs/user-manual.md`](docs/user-manual.md)
**Deployment Guide:** [`docs/deployment-guide.md`](docs/deployment-guide.md)

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Testing & Verification](#testing--verification)
6. [Database Seeding](#database-seeding)
7. [Deployment](#deployment)
8. [Documentation](#documentation)
9. [Agent Workflow](#agent-workflow)
10. [Tech Stack](#tech-stack)

---

## Quick Start

### Prerequisites

Ensure you have the following installed:

- **Python 3.12+** ([python.org](https://www.python.org/downloads/))
- **Node.js 20+** ([nodejs.org](https://nodejs.org))
- **[uv](https://docs.astral.sh/uv/)** (Python package manager: `pip install uv`)
- **[pnpm](https://pnpm.io/)** (Node package manager: `npm install -g pnpm`)
- **Docker & Docker Compose** ([docker.com](https://www.docker.com/get-started))

### Local Development Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd hunar-ai

# 2. Start PostgreSQL database
docker compose up -d

# 3. Set up API (FastAPI backend)
cd apps/api
uv sync                          # Install Python dependencies
uv run alembic upgrade head      # Run database migrations
cd ../..

# 4. Set up Web (Next.js frontend)
pnpm install                     # Install all workspace dependencies (monorepo root)

# 5. Seed database with demo data
cd apps/api
uv run python -m scripts.seed    # Creates Super Admin, mentors, entrepreneurs, sample data
cd ../..
```

### Running the Application

**Terminal 1 — Backend API:**
```bash
cd apps/api
uv run uvicorn app.main:app --reload --port 8000
```

API will be available at:
- **API:** http://localhost:8000
- **Docs:** http://localhost:8000/api/v1/docs
- **Health:** http://localhost:8000/api/v1/health

**Terminal 2 — Frontend Web App:**
```bash
cd apps/web
pnpm dev
```

Web app will be available at:
- **App:** http://localhost:3000

### Demo Credentials (After Seeding)

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| **Super Admin** | `admin@hunar.pk` | `Admin1234!` | Cohort management, feature flags, system telemetry |
| **Entrepreneur** | `fatima@hunar.pk` | `User1234!` | Flagship demo user (Fatima Ali — Zauq-e-Hunar Pret) |
| **Mentor** | `ayesha.mentor@hunar.pk` | `Mentor1234!` | Fashion specialist mentor |

### Environment Variables

Create a `.env` file in `apps/api/` (or configure via environment):

```bash
# Database (Docker Compose default)
DATABASE_URL=postgresql+asyncpg://hunar:hunar_dev@localhost:5432/hunar

# Authentication
JWT_SECRET=change-me-in-production-min-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# AI Services (optional for development)
GEMINI_API_KEY=         # Google Gemini API key (agents use deterministic fallback if empty)
GEMINI_MODEL=gemini-2.5-flash
TAVILY_API_KEY=         # Tavily search API key (validator agent uses mock if empty)

# Application
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000
API_PORT=8000
```

Frontend environment (create `apps/web/.env.local`):

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Next.js Frontend (App Router)                  │
│  Entrepreneur Dashboard | Mentor Panel | Super Admin Console       │
└────────────────────────────┬────────────────────────────────────────┘
                             │ REST + SSE
┌────────────────────────────┴────────────────────────────────────────┐
│                     FastAPI Backend (Python 3.12)                   │
│  Auth | Business Logic | Agent Orchestrator | Mentor Marketplace   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼──────┐    ┌────────▼────────┐   ┌──────▼──────────┐
│  PostgreSQL  │    │ OpenAI Agents   │   │ External APIs   │
│  (Supabase)  │    │ SDK + Gemini    │   │ (Tavily Search) │
└──────────────┘    └─────────────────┘   └─────────────────┘
```

### Key Components

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript
- **Backend:** FastAPI, SQLAlchemy (async), Alembic migrations, Pydantic validation
- **Database:** PostgreSQL 16 with connection pooling (asyncpg driver)
- **AI Agents:** OpenAI Agents SDK with Google Gemini 2.5 Flash via OpenAI compatibility layer
- **Authentication:** JWT (access + refresh tokens), Argon2id password hashing
- **Hosting:** Vercel (frontend), Railway/Cloud Run (backend), Supabase (database)

See [`context/architecture.md`](context/architecture.md) for detailed architecture decisions.

---

## Project Structure

```
hunar-ai/
├── apps/
│   ├── api/                    # FastAPI backend
│   │   ├── app/
│   │   │   ├── agents/         # AI agent implementations (Orchestrator, Intake, etc.)
│   │   │   ├── auth/           # JWT, password hashing, role-based access
│   │   │   ├── core/           # Config, database, middleware, errors
│   │   │   ├── models/         # SQLAlchemy models (User, Business, etc.)
│   │   │   ├── routes/         # FastAPI routers (auth, onboarding, plan, etc.)
│   │   │   ├── schemas/        # Pydantic request/response schemas
│   │   │   └── services/       # Business logic layer
│   │   ├── migrations/         # Alembic database migrations
│   │   ├── tests/              # Pytest test suite
│   │   ├── Dockerfile          # Production container build
│   │   ├── alembic.ini         # Alembic configuration
│   │   └── pyproject.toml      # Python dependencies (uv)
│   │
│   └── web/                    # Next.js frontend
│       ├── app/                # App Router pages
│       │   ├── (auth)/         # Auth routes (login, register)
│       │   ├── (dashboard)/    # Entrepreneur dashboard
│       │   ├── admin/          # Super Admin console
│       │   └── mentor/         # Mentor panel
│       ├── components/         # React components
│       ├── lib/                # API client, utilities
│       ├── tests/              # Vitest test suite
│       └── package.json        # Node dependencies
│
├── packages/
│   └── api-client/             # Generated TypeScript API client (OpenAPI)
│
├── scripts/
│   ├── seed.py                 # Database seeding (demo data)
│   └── verify.sh               # Verification lanes (lint, typecheck, tests)
│
├── docs/
│   ├── demo-script.md          # 4-minute contest demonstration walkthrough
│   ├── deployment-guide.md     # Production deployment instructions
│   ├── user-manual.md          # End-user guide
│   └── prd/PRD.md              # Product Requirements Document
│
├── context/                    # AI agent coding context (architecture, standards)
├── infra/                      # Docker Compose (local PostgreSQL)
├── docker-compose.yml          # Local development database
├── vercel.json                 # Vercel deployment config
├── AGENTS.md                   # Agent instructions (source of truth)
└── memory.md                   # Project status & hand-off notes
```

---

## Development Workflow

### 1. Install Dependencies

**API:**
```bash
cd apps/api
uv sync                 # Install all dependencies from uv.lock
```

**Web:**
```bash
pnpm install            # Install all monorepo packages (run from root)
```

### 2. Run Database Migrations

```bash
cd apps/api
uv run alembic upgrade head
```

**Create new migration:**
```bash
uv run alembic revision --autogenerate -m "add feature_flags table"
uv run alembic upgrade head
```

### 3. Generate API Client (After Backend Schema Changes)

```bash
# Start API server
cd apps/api
uv run uvicorn app.main:app --port 8000

# In another terminal, generate client
cd packages/api-client
pnpm generate           # Fetches OpenAPI, generates TypeScript client
```

### 4. Code Quality

**Backend (API):**
```bash
cd apps/api
uv run ruff check .     # Lint
uv run ruff format .    # Format
uv run mypy app         # Type check
```

**Frontend (Web):**
```bash
cd apps/web
pnpm lint               # ESLint
pnpm typecheck          # TypeScript check
```

---

## Testing & Verification

### Run All Tests

**Backend:**
```bash
cd apps/api
uv run pytest                           # All tests
uv run pytest -m "not live"             # Skip tests requiring API keys
uv run pytest tests/test_auth.py        # Specific file
```

**Frontend:**
```bash
cd apps/web
pnpm test                               # Vitest (all tests)
pnpm test -- notifications.test.tsx     # Specific file
```

### Verification Script

The project includes a comprehensive verification script:

```bash
bash scripts/verify.sh --all            # Run all lanes
bash scripts/verify.sh --lane api       # Backend lint + typecheck + tests
bash scripts/verify.sh --lane web       # Frontend lint + typecheck + tests
bash scripts/verify.sh --lane contract  # API client contract validation
bash scripts/verify.sh --list           # Show available lanes
```

**Verification Lanes:**
- `api`: Backend ruff lint, mypy typecheck, pytest
- `api-db`: Alembic migration checks
- `web`: Frontend ESLint, TypeScript, Vitest
- `contract`: OpenAPI client generation & validation
- `infra`: Docker Compose healthcheck

---

## Database Seeding

### Full Seed (Development/Staging)

Seeds complete demo dataset:
- 1 Super Admin (`admin@hunar.pk`)
- 5 Verified Mentors with services and availability
- 20 Entrepreneurs across 4 progression stages
- 20 Businesses with products, plans, content calendars
- 150 Content items, 35 metrics snapshots
- Bookings, reviews, notifications, feature flags

```bash
cd apps/api
uv run python -m scripts.seed
```

**Options:**
```bash
uv run python -m scripts.seed --clean      # Delete all data first (WARNING: destructive)
uv run python -m scripts.seed --dry-run    # Preview without committing
```

### Production Seed

**DO NOT use full seed in production.** Instead:
1. Create Super Admin account manually (see `docs/deployment-guide.md`)
2. Initialize feature flags only

---

## Deployment

See **[`docs/deployment-guide.md`](docs/deployment-guide.md)** for complete production deployment instructions covering:

- Supabase PostgreSQL setup (connection pooling, SSL, migrations)
- Containerized FastAPI deployment (Railway, Google Cloud Run, Render)
- Vercel Next.js deployment (monorepo configuration)
- Environment variables reference
- Post-deployment verification
- Troubleshooting guide

**Quick Summary:**

1. **Database:** Supabase PostgreSQL with connection pooling
2. **Backend:** Docker container (see `apps/api/Dockerfile`)
3. **Frontend:** Vercel (auto-deploys from Git, see `vercel.json`)

---

## Documentation

### For Developers

- **[AGENTS.md](AGENTS.md)**: Agent instructions and project rules (source of truth)
- **[context/architecture.md](context/architecture.md)**: Technical architecture & decisions
- **[context/code-standards.md](context/code-standards.md)**: Coding conventions & rules
- **[context/build-plan.md](context/build-plan.md)**: Phase breakdown & task sequencing
- **[docs/prd/PRD.md](docs/prd/PRD.md)**: Product Requirements Document

### For Users

- **[docs/user-manual.md](docs/user-manual.md)**: End-user guide for entrepreneurs, mentors, admins
- **[docs/demo-script.md](docs/demo-script.md)**: 4-minute contest demonstration walkthrough

### For Deployment

- **[docs/deployment-guide.md](docs/deployment-guide.md)**: Production deployment instructions

---

## Agent Workflow

Hunar v2 uses a multi-agent orchestration system with autonomous handoffs:

```
User Input (Roman Urdu)
        ↓
┌───────────────────┐
│   Orchestrator    │ ← Manages conversation state, routes to specialized agents
└─────────┬─────────┘
          │
    ┌─────┴──────┐
    │            │
    ▼            ▼
Intake Agent  Validator Agent  ← Extract business model, validate market fit
    │            │
    └─────┬──────┘
          ▼
   Pricing Agent           ← Calculate unit economics, margin breakdown
          │
          ▼
   Launch Planner          ← Generate 30-day roadmap with tasks
          │
          ▼
   [GATE 1: Human Approval] ← User must approve plan before proceeding
          │
          ▼
   Content Strategist      ← Generate 30-day content calendar
          │
          ▼
   [GATE 2: Content Outline Approval] ← User approves content strategy
          │
          ▼
   Daily Execution (Metrics Logging)
          │
          ▼
   Weekly Coach Agent      ← Analyze performance, propose adjustments
          │
          ▼
   [GATE 3: Weekly Review Approval] ← User approves coach recommendations
```

**Human Approval Gates (Non-Negotiable):**
1. **Gate 1:** Plan Approval (Launch Plan must be approved before content generation)
2. **Gate 2:** Content Outline Approval (Content calendar reviewed before daily posts)
3. **Gate 3:** Weekly Coach Review (Performance analysis approved before changes)

All agent executions are traced and stored in `agent_runs` and `agent_steps` tables for full observability.

---

## Tech Stack

### Backend (FastAPI)
- **Framework:** FastAPI 0.115+ (async, OpenAPI auto-generation)
- **ORM:** SQLAlchemy 2.0 (async engine with asyncpg driver)
- **Migrations:** Alembic 1.14+
- **Validation:** Pydantic 2.10+, pydantic-settings
- **Auth:** JWT (PyJWT), Argon2id password hashing (argon2-cffi)
- **Testing:** pytest, pytest-asyncio, pytest-cov
- **Linting:** ruff, mypy (strict mode)
- **AI Agents:** openai-agents 0.0.22, httpx (for Gemini API via OpenAI compatibility)

### Frontend (Next.js)
- **Framework:** Next.js 16 (App Router, React Server Components)
- **React:** React 19, react-dom 19
- **Styling:** Tailwind CSS v4 (design tokens), clsx, tailwind-merge
- **Icons:** lucide-react
- **Charts:** recharts 3.10+
- **Validation:** Zod 4.6+
- **API Client:** Generated TypeScript client from OpenAPI (openapi-typescript-codegen)
- **Testing:** Vitest 5.0+, @testing-library/react, jsdom
- **Linting:** ESLint 9, eslint-config-next
- **TypeScript:** TypeScript 5

### Infrastructure
- **Database:** PostgreSQL 16 (local: Docker Compose, production: Supabase)
- **Containerization:** Docker (multi-stage builds, uv for Python deps)
- **Hosting:**
  - Frontend: Vercel (edge network, auto-scaling)
  - Backend: Railway / Google Cloud Run / Render (containerized)
  - Database: Supabase (managed PostgreSQL with connection pooling)
- **Monorepo:** pnpm workspaces

### External Services
- **AI Model:** Google Gemini 2.5 Flash (via OpenAI SDK compatibility layer)
- **Search:** Tavily API (market validation, competitor research)

---

## Project Health

### Latest Verification Status

**Phase 5 Complete** (Tasks 58-60) ✅

- ✅ Web App: 41 Next.js routes compiled, statically optimized
- ✅ Web Typecheck: Passed (`tsc --noEmit`)
- ✅ Web Tests: Passed (Vitest)
- ✅ API Tests: Passed (pytest)
- ✅ API Lint: Passed (ruff)
- ✅ API Typing: Passed (mypy --strict)

**Coverage:**
- Backend: 34 pytest tests across auth, onboarding, business, plan, content, mentor, metrics, admin
- Frontend: 51 Vitest tests across all major features

---

## Contributing

This project was built with AI assistance following strict documented processes. Before contributing:

1. Read `AGENTS.md` (source of truth for rules and constraints)
2. Review `context/code-standards.md` (non-negotiable conventions)
3. Run `bash scripts/verify.sh --all` before committing
4. Ensure all tests pass and linting is clean

**Git Hooks:**
```bash
bash scripts/install-hooks.sh   # Install pre-push hook (runs verification)
```

---

## License

Proprietary — Contest Submission (October 2026)

---

## Support

- **Demo Script:** [`docs/demo-script.md`](docs/demo-script.md)
- **User Manual:** [`docs/user-manual.md`](docs/user-manual.md)
- **Deployment Guide:** [`docs/deployment-guide.md`](docs/deployment-guide.md)
- **API Docs:** http://localhost:8000/api/v1/docs (when running locally)

**Built by:** Nimra (Solo Developer)
**Contest:** October 2026
**Version:** 0.1.0
