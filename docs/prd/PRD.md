---
project: "Hunar v2"
slug: "hunar-v2"
version: "0.1.0"
status: draft
profile: production
date: "2026-09-26"
owners: ["Nimra"]
stack:
  frontend: "Next.js 15 (App Router, TypeScript strict) + Tailwind CSS v4 + shadcn/ui"
  backend: "FastAPI + SQLAlchemy 2 + Pydantic v2"
  database: "PostgreSQL 16 (Supabase free tier)"
  migrations: "Alembic"
  api_contract: "openapi"
  agents: "OpenAI Agents SDK + Gemini 2.5 Flash"
  infra: "Docker Compose, GitHub Actions, Vercel + FastAPI Cloud"
features:
  - ui
  - database
  - audit
  - ai-agents
  - api-contract
layout:
  api: apps/api
  web: apps/web
  agents: apps/agents
  infra: infra
  client: packages/api-client
phases: 6
---

# Hunar v2 — Product Requirements & Technical Specification

## 0. Document Control

### 0.1 Purpose and audience

This PRD is the **single source of truth** for the Hunar v2 platform. It is read by:

- **Nimra (solo developer / product owner):** scope, priorities, and implementation reference.
- **AI coding assistants:** context for code generation, architecture decisions, and constraint enforcement.
- **Contest judges (10 Oct 2026):** product capability overview and demo script.
- **Future contributors:** onboarding reference.

Changes to scope, stack, or architecture follow the change control process in §25.

### 0.2 Revision history

| Version | Date | Author | Summary of change | Sections touched |
| --- | --- | --- | --- | --- |
| 0.1.0 | 2026-09-26 | Nimra | Initial draft from discovery interview | all |

### 0.3 Assumptions ledger

| ID | Assumption | Basis | Owner to confirm |
| --- | --- | --- | --- |
| A-001 | Demo scale: ~30 users, design ceiling ~500 entrepreneurs, ~20 concurrent | Discovery interview | Nimra |
| A-002 | No Redis, Kafka, or microservices needed at this scale — single FastAPI instance is sufficient | Scale estimate + free-tier budget | Nimra |
| A-003 | Meta Connect (Instagram/Facebook API integration) is fully cut from this build | Time constraint + optional nature | Nimra |
| A-004 | WCAG AA accessibility not required for contest submission | Contest context | Nimra |
| A-005 | Single timezone: Asia/Karachi (PKT, UTC+5) | Pakistan-only user base | Nimra |
| A-006 | Payments are simulated — no real money movement | Discovery interview | Nimra |
| A-007 | Email/SMS are simulated via in-app notifications outbox | Discovery interview | Nimra |
| A-008 | No file uploads in initial build (image/video prompts are text-based, not generated) | Design document | Nimra |
| A-009 | Content generation uses batched approach (4 parallel batches of ~8 days each) to avoid large single LLM calls | Design document | Nimra |
| A-010 | Single build only — slim/full contest split dropped | Discovery interview | Nimra |

### 0.4 Open questions

| ID | Question | Blocks (section/phase) | Owner | Status |
| --- | --- | --- | --- | --- |
| Q-001 | Real payment integration timing and provider selection | §36+ (Phase 6+) | Nimra | open |
| Q-002 | Exact Gemini API quota limits on free tier and fallback strategy | §36, P0 | Nimra | open — test on day 1 |
| Q-003 | Tavily free tier (1000 searches/month) sufficient for content research at scale? | §36, P2 | Nimra | open |
| Q-004 | Handoff behavior with Gemini via OpenAI compatibility endpoint — needs live smoke test | §36, P0 | Nimra | open — P0 exit gate |

### 0.5 Glossary

| Term | Meaning in this product |
| --- | --- |
| Entrepreneur | A woman with a home-business idea who uses the platform to validate, price, plan, and market her business |
| Mentor | A vetted expert who sells priced services (sessions, reviews, guidance) through the Pro panel |

| Super Admin | Platform owner with full access to users, audit, settings, and agent traces |
| Content Engine | The agent pipeline that generates a full 30-day Instagram/Facebook content calendar |
| Pro Panel | The mentor's professional workspace for selling services and managing bookings |
| Agent Run | A background execution of one or more AI agents, tracked in `agent_runs` with full trace |
| Human Gate | A point where the user must approve/reject an agent's output before it takes effect |
| Posted Document | A record that, once posted/approved, cannot be edited — only reversed or superseded |
| Roman Urdu | Urdu language written in Latin script, commonly used in Pakistani digital communication |

---

## 1. Executive Summary

Hunar v2 is an AI-powered platform that empowers Pakistani women with home-business ideas to build validated, priced businesses with professional social media presence. A woman signs up, describes her idea in Roman Urdu or English, and a pipeline of 12 specialized AI agents turns it into a validated business model, pricing strategy, 30-day launch plan, and a complete 30-day Instagram/Facebook content calendar — with copy-paste-ready captions, hashtags from fresh web research, and image/video generation prompts.

The platform operates at **production profile**: audit logging, role-based security, and data integrity are non-negotiable, even though the infrastructure runs on free tiers. The system serves three roles: **Entrepreneurs** (the primary users), **Mentors** (who sell expert services through a Pro panel), and **Super Admins** (platform operators who also manage cohorts, approve mentors, and oversee the audit trail).

The deployment model is cloud-native on free tiers: Vercel for the Next.js frontend, FastAPI Cloud (Tiangolo's official managed hosting, deployed via `uv run fastapi deploy`) for the FastAPI backend, and Supabase for PostgreSQL. AI agents run via the OpenAI Agents SDK with Google Gemini 2.5 Flash as the LLM provider. The platform is built by a solo developer (Nimra) in 6 phases from 25 Sep to 10 Oct 2026, targeting a contest demonstration.

What makes Hunar v2 different: **(1)** The content engine produces not just strategy but day-by-day, platform-specific, copy-paste-ready content with researched hashtags and image/video prompts. **(2)** Every agent action is traceable — the Super Admin can replay the full decision chain from idea to published content. **(3)** The mentor marketplace connects entrepreneurs to real experts with transparent pricing, even with simulated payments.

## 2. Product Objectives

- **Validate** a home-business idea with web-sourced competitor analysis and demand signals within one agent session.
- **Price** products with cost-based calculations, margin analysis, and break-even points — no guesswork.
- **Generate** a 30-day launch plan with dated, actionable tasks.
- **Produce** a complete 30-day content calendar for Instagram and Facebook with captions, hashtags (from fresh web research), CTAs, and copy-paste-ready image/video generation prompts.
- **Enable** daily content execution through a Today View with copy buttons and post-tracking.
- **Measure** business outcomes (views, reach, orders, revenue in PKR) through manual metrics entry.
- **Coach** entrepreneurs weekly with AI-driven re-planning based on actual performance data.
- **Connect** entrepreneurs with vetted mentors through a services marketplace with transparent pricing and booking.
- **Manage** cohorts and detect stalled businesses through the Super Admin panel.
- **Audit** every significant action with an append-only log and full agent trace visibility for Super Admins.
- **Demonstrate** agentic AI capabilities: multi-agent pipelines, human approval gates, tool use, and full observability.

### 2.1 Success metrics

| Metric | Baseline | Target | How measured |
| --- | --- | --- | --- |
| Onboarding completion (idea → approved plan) | 0 | 80% of signed-up entrepreneurs | `plan.approved` audit events / `user.created` events |
| Content calendar generation success rate | 0 | 90% of attempts produce valid 30-day calendar | `agent_runs` with workflow=content_month, status=succeeded |
| Daily content posting rate | 0 | 60% of generated content items marked as posted | `content_items` with status=posted / total approved items |
| Mentor booking completion rate | 0 | 50% of requested bookings reach completed | `bookings` status=completed / status=requested |
| Agent run failure rate | N/A | < 10% | `agent_runs` status=failed / total runs |
| API response time (p95) | N/A | < 500ms for non-agent endpoints | Application logs |
| Demo walkthrough (contest) | N/A | Complete 4-minute script without errors | Manual rehearsal |

### 2.2 Out of scope

- Auto-posting to Instagram/Facebook (entrepreneurs post manually and mark as posted).
- Real payment processing (Stripe, JazzCash, EasyPaisa) — simulated only.
- Real email/SMS/WhatsApp sending — simulated via in-app notifications.
- Meta Connect API integration (Instagram/Facebook token + data sync).
- Screenshot-based metrics extraction (vision model).
- CSV export from any screen.
- Native mobile app or PWA capabilities beyond responsive web.
- Multi-language UI (English only; content generation supports Roman Urdu).
- RTL layout support.
- WCAG AA accessibility compliance.
- Multi-currency support (PKR only).
- Offline operation.

## 3. Technology & Architecture

### 3.1 Stack decision record

| Layer | Required technology / standard | Why this choice | Considered and rejected |
| --- | --- | --- | --- |
| UI | Next.js 15 (App Router, TypeScript strict) + Tailwind CSS v4 + shadcn/ui | SSR/SSG flexibility, component library with good defaults, Tailwind for rapid styling | React+Vite (no SSR), SvelteKit (smaller ecosystem) |
| UI forms/validation | React Hook Form + Zod | Type-safe validation shared with backend schemas | Formik (heavier), uncontrolled forms |
| UI data tables | TanStack Table | Headless, composable, sorting/filtering built-in | AG Grid (heavy/paid), custom tables |
| UI charts | Recharts | Lightweight, React-native, sufficient for dashboards | Chart.js (canvas-based), Visx (lower-level) |
| UI state/data fetching | TanStack Query (React Query) | Cache, deduplication, SSE integration | SWR (fewer features), Redux (overkill) |
| Backend | FastAPI (Python 3.12+) + Pydantic v2 | Async, auto-OpenAPI, Pydantic for validation, Python for AI tools | Django (heavier ORM coupling), Express (JS) |
| Business logic | Python modules in `apps/api/app/services/` | Separated from routes, testable, reusable by agents | Embedded in route handlers |
| ORM / data access | SQLAlchemy 2 (async) | Mature, flexible, explicit queries, good Postgres support | Django ORM (tied to Django), Prisma (Node) |
| Database | PostgreSQL 16 (Supabase free tier) | Robust, JSONB for flexible schemas, free tier generous (500MB, 2 projects) | MySQL (fewer features), SQLite (not for production) |
| Migrations | Alembic | Pairs with SQLAlchemy, auto-generates from models | Django migrations, Flyway |
| API | REST + OpenAPI 3.1 (auto-generated by FastAPI) | Standard, well-tooled, matches frontend code generation | GraphQL (complexity), tRPC (TypeScript only) |
| API client | openapi-typescript generated client | Type-safe, auto-synced with backend, drift check in CI | Manual fetch calls |
| Authentication | Custom JWT: short-lived access token (~15min) + rotating httpOnly refresh token (~7d) | Full control, no vendor dependency, Supabase Auth not used | Supabase Auth (less control), NextAuth (tied to Next.js) |
| Authorization | Role-based: `require_role()` FastAPI dependency + ownership/program scoping | API-enforced, UI only hides | Supabase RLS (bypassed since no Supabase Auth) |
| Password hashing | argon2 (argon2-cffi) | Best current algorithm, resistant to GPU attacks | bcrypt (older, still acceptable) |
| Background jobs | In-process async tasks with `agent_runs` table tracking | Simple, no extra infra, semaphore limits concurrency | Celery (needs Redis), arq (needs Redis) |
| Cache / queue | None — Postgres advisory locks for coordination | Scale doesn't justify Redis; deferred | Redis/Valkey (§3.2) |
| Search | Postgres `pg_trgm` + full-text search | Built-in, no extra service, sufficient for < 10k rows | Meilisearch (§3.2) |
| File storage | None — no file uploads in initial build | Image/video prompts are text, not binary | Supabase Storage, S3 (§3.2) |
| AI / agents | OpenAI Agents SDK + Gemini 2.5 Flash via OpenAI compatibility endpoint | SDK provides traces, handoffs, guardrails; Gemini is free-tier eligible | LangGraph (heavier), Pydantic AI (less mature), direct API calls (no tracing) |
| Web search (agents) | Tavily API (free tier, 1000/month) | Best AI-agent integration, structured results | Serper, Brave (less agent-focused) |
| Observability | Structured logging (Python `structlog`) + agent traces to DB (`agent_steps`) | Free, self-contained, no external service needed | Sentry (paid), OpenTelemetry (complex setup) |
| CI/CD | GitHub Actions | Free for public repos, good ecosystem | GitLab CI, CircleCI |
| Hosting / deployment | Vercel (frontend) + FastAPI Cloud (API) + Supabase (DB) | FastAPI Cloud: official managed hosting by Tiangolo, one-command deploy (`uv run fastapi deploy`), handles HTTPS/replication/autoscaling, built-in Supabase integration; Vercel free tier for SSR | Railway/Render (less integrated), Google Cloud Run (more complex), VPS (maintenance overhead) |
| Containers | Docker Compose (local development and CI parity) | Consistent environments, easy onboarding | No containers (environment drift) |
| Testing | pytest (API) + Vitest (frontend) + Playwright (E2E critical flows) | Standard tools, good coverage for solo dev | Jest (slower), Cypress (heavier) |
| Python tooling | uv (package manager) + ruff (linter/formatter) + mypy (type checking) | Fast, modern Python toolchain | pip + black + flake8 (slower, more tools) |
| Node tooling | pnpm (package manager) + ESLint + Prettier | Fast, disk-efficient, standard | npm (slower), yarn |

### 3.2 Considered and deferred

| Technology | Why not now | Trigger to adopt |
| --- | --- | --- |
| Redis / Valkey | Scale doesn't justify it (< 20 concurrent users); Postgres advisory locks and `LISTEN/NOTIFY` are sufficient | > 200 concurrent users, or need for rate limiting / pub-sub / session cache |
| Message queue (Celery/arq/BullMQ) | Background agent runs tracked in DB with semaphore; no queue needed | > 50 concurrent agent runs, or need for scheduled/recurring jobs beyond weekly coach |
| Meilisearch / Typesense | Postgres FTS handles < 10k rows well; no fuzzy/relevance requirements yet | > 100k searchable records, or users request typo-tolerant search |
| Supabase Storage / S3 / R2 | No file uploads in initial build | Users need to upload images, PDFs, or business documents |
| Kubernetes | Single-instance deployment is sufficient; free-tier hosts handle this | > 1000 concurrent users, or need for auto-scaling / multi-region |
| Microservices | Monolith-first; agents are in-process | Need to scale agents independently, or agent jobs block API performance |
| Sentry / external APM | Structured logs + DB traces are sufficient for debugging | Production errors become hard to reproduce, or team grows |
| Meta Connect (Instagram/Facebook API) | Time constraint; product works without it (manual metrics entry) | Post-contest, when entrepreneurs want automated metrics sync |
| Real payment gateway (Stripe/JazzCash) | Simulated payments are sufficient for contest demo | Post-contest, when real mentor transactions are needed |
| Email service (Resend/Postmark/SES) | Simulated notifications via in-app outbox | Post-contest, when real email delivery is needed |

### 3.3 Architecture overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
│                    (Next.js SSR + CSR)                           │
└──────────────────┬───────────────────────────────────────────────┘
                   │ HTTPS (REST + SSE)
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FastAPI Application                            │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────────┐ │
│  │   Routes    │  │  Services   │  │   Agent Runner            │ │
│  │ (auth, CRUD │  │ (business   │  │ (OpenAI Agents SDK)       │ │
│  │  admin)     │  │  logic)     │  │                           │ │
│  └──────┬──────┘  └──────┬──────┘  │ ┌───────┐ ┌───────────┐  │ │
│         │                │         │ │Gemini │ │ Tavily    │  │ │
│         │                │         │ │  API  │ │ Search    │  │ │
│         │                │         │ └───────┘ └───────────┘  │ │
│         │                │         └──────────┬───────────────┘ │
│         │                │                    │                  │
│  ┌──────┴────────────────┴────────────────────┴──────────────┐  │
│  │              SQLAlchemy 2 (async) + Alembic                │  │
│  └──────────────────────────┬────────────────────────────────┘  │
└─────────────────────────────┬────────────────────────────────────┘
                              │ PostgreSQL wire protocol
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│              Supabase PostgreSQL 16                               │
│  (users, businesses, content, metrics, audit_logs, agent_steps)  │
└──────────────────────────────────────────────────────────────────┘
```

**Key rules:**
- The API is the **sole owner** of business logic and data access.
- Agents are clients of the API — they call approved tools, never hold database credentials directly (in production; during initial build, agents run in-process and access the DB through the same service layer).
- The frontend never talks to the database or to external APIs.
- SSE is used for agent progress streaming; no WebSocket.

### 3.4 Repository layout

```
hunar-v2/
├── apps/
│   ├── api/                    # FastAPI backend
│   │   ├── app/
│   │   │   ├── auth/           # JWT, dependencies, password hashing
│   │   │   ├── routes/         # FastAPI routers (auth, admin, business, content, etc.)
│   │   │   ├── services/       # Business logic layer
│   │   │   ├── models/         # SQLAlchemy models
│   │   │   ├── schemas/        # Pydantic request/response schemas
│   │   │   ├── agents/         # Agent definitions, tools, pipelines, tracing
│   │   │   ├── core/           # Config, DB session, audit helper, errors
│   │   │   └── main.py         # FastAPI app with lifespan
│   │   ├── migrations/         # Alembic migrations
│   │   ├── tests/              # pytest tests
│   │   ├── pyproject.toml
│   │   └── Dockerfile
│   └── web/                    # Next.js frontend
│       ├── app/                # App Router pages
│       ├── components/         # Shared UI components
│       ├── lib/                # API client, utilities
│       ├── package.json
│       └── Dockerfile
├── packages/
│   └── api-client/             # Generated OpenAPI TypeScript client
├── infra/
│   ├── docker-compose.yml      # Local development
│   ├── docker-compose.ci.yml   # CI environment
│   └── supabase/               # Supabase config (if needed)
├── docs/
│   ├── prd/                    # This PRD + discovery log
│   ├── adr/                    # Architecture Decision Records
│   └── deployment.md           # Deployment guide
├── scripts/
│   ├── verify.sh               # CI verification script
│   ├── seed.py                 # Seed data for demo
│   └── create_super_admin.py   # CLI script for first Super Admin
├── context/                    # AI coding context files
│   └── AGENTS.md               # Constraints for AI assistants
├── .github/
│   └── workflows/
│       ├── ci.yml              # Lint, test, build
│       └── deploy.yml          # Deploy to Vercel + FastAPI Cloud
├── .env.example
├── README.md
└── docker-compose.yml          # Root alias
```

### 3.5 Multi-tenancy and scoping

**Model:** Single organization, single-tenant, with optional **cohort program tagging** (`program_id` on users/businesses) for grouping entrepreneurs into batches (e.g., "Lahore Batch 1").

**Enforcement:**
1. Every database query that touches user-owned data enforces ownership (`user_id = current_user.id` for entrepreneurs; mentors access their own profile/services and booked mentees only).
2. This is enforced through a **scoping dependency** in FastAPI (`require_role` + ownership check) that injects verified user identity into every service call.
3. Super Admin has full administrative visibility across all users, businesses, cohorts, and audit logs. All Super Admin actions are audited.

### 3.6 Environments and deployment models

| Environment | Purpose | Infrastructure | Secrets |
| --- | --- | --- | --- |
| Local | Development | Docker Compose (Postgres + API + optional Next.js dev server) | `.env` file (gitignored) |
| CI | Automated testing | GitHub Actions + Docker Compose (ephemeral Postgres) | GitHub Secrets |
| Production | Live application | Vercel (web) + FastAPI Cloud (API) + Supabase (DB) | FastAPI Cloud env vars + platform secret managers |

**Configuration:** All secrets via environment variables. `.env.example` has every key with empty values. Required variables: `DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`, `TAVILY_API_KEY`.

### 3.7 Architectural constraints (non-negotiable)

1. **The API is the sole owner of business logic and data access.** No business rules in the frontend or in raw SQL outside migrations.
2. **Every route has an authorization decision.** No endpoint is accidentally public; `require_role()` is applied to every router.
3. **Every query that returns user data is scoped.** Ownership or program filtering is always applied; a test verifies this.
4. **Agents never hold database credentials in production.** They call approved tools through the service layer. (During initial build, agents run in-process but access data through service functions, not raw queries.)
5. **Audit log is append-only.** A database trigger prevents UPDATE and DELETE on `audit_logs`.
6. **No credentials or secrets in source control.** `.env.example` has empty values; CI uses platform secrets.
7. **Every schema change ships as a migration.** Alembic migration in the same PR; a CI check fails when models differ from the latest migration.
8. **OpenAPI is the contract.** The generated TypeScript client must pass a drift check (`verify.sh`) before merge.
9. **Agent traces are stored and viewable.** Every agent run has a `trace_id` linking to `agent_steps` for debugging and demonstration.
10. **All user input is validated.** Pydantic on the API; Zod on the frontend. Parameterized queries only.

## 4. Application Navigation / Main Menu

### Entrepreneur (default after login)

```
Home (Today View)
├── My Business
│   ├── Business Profile
│   ├── Products
│   ├── Validation Report
│   └── Pricing & Break-even
├── My Plan
│   ├── Launch Plan (30-day tasks)
│   └── Task Progress
├── Content
│   ├── Content Calendar (month view)
│   ├── Today's Posts
│   ├── Research Report
│   └── Content Outline
├── Metrics
│   ├── Log Results
│   └── Performance Charts
├── Mentors
│   ├── Browse Services
│   ├── My Bookings
│   └── Reviews
├── Notifications
└── Settings (profile, password)
```

### Mentor

```
Dashboard (requests, upcoming sessions)
├── My Profile
├── My Services (CRUD)
├── Availability
├── My Mentees (booked only)
│   └── [Mentee] → Brief, Progress, Notes
├── Earnings (simulated)
├── Reviews
├── Notifications
└── Settings
```

### Super Admin

```
Dashboard (system health + cohort metrics)
├── Cohort & Entrepreneurs
│   ├── All Entrepreneurs (with progress status)
│   ├── Stalled List (no post > 5d, no metrics > 7d)
│   └── [Entrepreneur] → Plan, Calendar, Metrics (admin view)
├── Mentors
│   ├── Pending Approvals (review & approve mentors)
│   ├── Active Mentors & Services
│   └── Bookings & Simulated Payouts
├── Users
│   ├── All Users (create, suspend, reactivate, change role)
│   └── Password Reset
├── Audit Log (filter, export)
├── Agent Explorer
│   ├── Run List (with status filters)
│   └── [Run] → Span Timeline (trace view)
├── Settings
│   ├── System Settings (model, limits, concurrency)
│   ├── Feature Flags
│   └── Kill Switch
├── Usage Stats (runs/day, failures, latency, top users)
└── Notifications
```

**Visibility rules:** Menu items for unauthorized roles are **hidden** (not disabled). The API still enforces authorization — hiding is convenience, not security.

## 5. Form & Screen Specification

### 5.1 Mandated form layout

Every data-entry form follows this structure:

```
┌──────────────────────────────────────────────────────┐
│ Page Title                                 [Status]  │
├──────────────────────────────────────────────────────┤
│ Master fields (grouped logically, 2-3 columns)      │
├──────────────────────────────────────────────────────┤
│ Detail section (grid, list, or nested form)          │
├──────────────────────────────────────────────────────┤
│ Summary / totals (if applicable)                     │
├──────────────────────────────────────────────────────┤
│ [Primary Action]  [Secondary Action]  [Cancel]       │
├──────────────────────────────────────────────────────┤
│ Audit / status panel (created by, updated at, etc.)  │
└──────────────────────────────────────────────────────┘
```

- **Validation:** Inline errors below each field; toast for server errors.
- **Loading state:** Skeleton placeholder.
- **Empty state:** Illustration + action prompt.
- **Error state:** Retry button + error message.
- **Unauthorized state:** 403 redirect to dashboard.

### 5.2 Form register

| ID | Form / screen | Module | Type | Roles | Priority | Phase |
| --- | --- | --- | --- | --- | --- | --- |
| F-001 | Signup | Auth | master | public | P0 | 0 |
| F-002 | Login | Auth | master | public | P0 | 0 |
| F-003 | Onboarding Chat | Onboarding | transaction | Entrepreneur | P0 | 1 |
| F-004 | Business Profile View | Business | master | Entrepreneur | P0 | 1 |
| F-005 | Product Editor | Business | master | Entrepreneur | P0 | 1 |
| F-006 | Validation Report View | Business | report | Entrepreneur | P0 | 1 |
| F-007 | Pricing & Break-even View | Business | report | Entrepreneur | P0 | 1 |
| F-008 | Plan Approval Gate | Onboarding | transaction | Entrepreneur | P0 | 1 |
| F-009 | Launch Plan / Tasks | Plan | list | Entrepreneur | P0 | 1 |
| F-010 | Content Outline Approval | Content | transaction | Entrepreneur | P0 | 2 |
| F-011 | Content Calendar (month view) | Content | list | Entrepreneur | P0 | 2 |
| F-012 | Content Item Detail / Editor | Content | master | Entrepreneur | P0 | 2 |
| F-013 | Today View | Content | list | Entrepreneur | P0 | 2 |
| F-014 | Research Report View | Content | report | Entrepreneur | P0 | 2 |
| F-015 | Metrics Entry Form | Metrics | master | Entrepreneur | P0 | 4 |
| F-016 | Performance Charts | Metrics | report | Entrepreneur | P1 | 4 |
| F-017 | Weekly Review Approval | Metrics | transaction | Entrepreneur | P1 | 4 |
| F-018 | Browse Mentor Services | Mentor | list | Entrepreneur | P1 | 3 |
| F-019 | Book a Service | Mentor | transaction | Entrepreneur | P1 | 3 |
| F-020 | My Bookings | Mentor | list | Entrepreneur | P1 | 3 |
| F-021 | Mentor Profile Editor | Mentor | master | Mentor | P1 | 3 |
| F-022 | Service CRUD | Mentor | master | Mentor | P1 | 3 |
| F-023 | Availability Editor | Mentor | master | Mentor | P1 | 3 |
| F-024 | Mentor Dashboard | Mentor | list | Mentor | P1 | 3 |
| F-025 | Mentee View (brief + progress) | Mentor | report | Mentor | P1 | 3 |
| F-026 | Earnings View | Mentor | report | Mentor | P1 | 3 |
| F-027 | Session Notes | Mentor | master | Mentor | P1 | 3 |
| F-028 | Cohort Dashboard | Program | report | Super Admin | P1 | 4 |
| F-029 | Stalled List | Program | list | Super Admin | P1 | 4 |
| F-030 | Mentor Approval | Program | transaction | Super Admin | P1 | 3 |
| F-031 | User Management | Admin | list | Super Admin | P0 | 0 |
| F-032 | Audit Log Viewer | Admin | list | Super Admin | P0 | 0 |
| F-033 | Agent Run Explorer | Admin | list | Super Admin | P0 | 0 |
| F-034 | Agent Run Detail (span timeline) | Admin | report | Super Admin | P0 | 0 |
| F-035 | System Settings | Admin | settings | Super Admin | P0 | 0 |
| F-036 | Feature Flags | Admin | settings | Super Admin | P1 | 4 |
| F-037 | Usage Stats | Admin | report | Super Admin | P1 | 4 |
| F-038 | Notifications Inbox | System | list | all roles | P1 | 4 |
| F-039 | Change Password | Auth | master | all roles | P0 | 0 |
| F-040 | Mentor Application | Auth | master | public | P1 | 3 |
| F-041 | Review Form | Mentor | master | Entrepreneur | P1 | 3 |
| F-042 | Agent Progress (SSE overlay) | System | report | Entrepreneur | P0 | 1 |

### 5.3 Field-level specifications

#### F-001 Signup

| Field | Type | Required | Validation / rule | Notes |
| --- | --- | --- | --- | --- |
| name | text | yes | 2-100 characters | Display name |
| email | email | yes | Valid email format, unique in `users` | Primary identifier |
| password | password | yes | Min 8 chars, 1 uppercase, 1 digit | Hashed with argon2 |
| confirm_password | password | yes | Must match password | Client-side only |
| language | select | no | Options: "en", "ur", "roman_ur" | Default: "roman_ur" |
| invite_code | text | no | If provided, must match a valid `programs.invite_code` | Links to program |

#### F-002 Login

| Field | Type | Required | Validation / rule | Notes |
| --- | --- | --- | --- | --- |
| email | email | yes | Valid email format | |
| password | password | yes | Non-empty | |

#### F-003 Onboarding Chat

| Field | Type | Required | Validation / rule | Notes |
| --- | --- | --- | --- | --- |
| message | textarea | yes | 1-2000 characters | User's chat message, any language |

Output fields (extracted by Intake agent and shown for confirmation):

| Field | Type | Required | Validation / rule | Notes |
| --- | --- | --- | --- | --- |
| business_name | text | yes | 2-200 characters | Auto-extracted, editable |
| niche | select | yes | Predefined: food, stitching_fashion, beauty, handmade, tutoring, digital, other | |
| city | text | yes | 2-100 characters | |
| area | text | no | 2-100 characters | Neighborhood/locality |
| budget_pkr | number | yes | 1,000 - 10,000,000 | Monthly budget in PKR |
| hours_per_week | number | yes | 1-80 | Available hours |
| tone | select | no | casual, professional, friendly, inspirational | Default: friendly |
| languages | multi-select | yes | Options: ur, roman_ur, en | Content language mix |
| platforms | multi-select | yes | Options: instagram, facebook | Target platforms |
| target_customer | text | no | 2-500 characters | Who she sells to |

#### F-005 Product Editor

| Field | Type | Required | Validation / rule | Notes |
| --- | --- | --- | --- | --- |
| name | text | yes | 2-200 characters | Product name |
| description | textarea | no | 0-1000 characters | |
| cost_inputs | json/form | yes | Array of {item: text, amount_pkr: number} | Itemized costs |
| price_pkr | number | yes | > 0, >= total cost_inputs | Selling price |

#### F-012 Content Item Detail / Editor

| Field | Type | Required | Validation / rule | Notes |
| --- | --- | --- | --- | --- |
| day | number | read-only | 1-30 | Day number in calendar |
| date | date | read-only | Valid date | Calculated from start_date |
| platform | multi-select | yes | instagram, facebook | |
| format | select | yes | reel, carousel, static, story, fb_post | |
| pillar | select | yes | education, behind_the_scenes, social_proof, offer, engagement | |
| goal | select | yes | awareness, engagement, leads, sales | |
| hook | text | yes | 1-200 characters | First line to stop the scroll |
| caption | textarea | yes | 1-2200 characters | Full caption (Instagram limit) |
| cta | text | yes | 1-200 characters | Call to action |
| hashtags | tag-input | yes | 5-8 tags, each 2-100 chars | Mix of broad/niche/local |
| best_time_hint | text | read-only | | Suggestion from strategist |
| image_prompt.prompt_text | textarea | yes | 1-1000 characters | Copy-paste ready prompt |
| image_prompt.aspect_ratio | select | yes | 4:5 (feed), 9:16 (reels/stories), 1:1 | |
| video_prompt.prompt_text | textarea | conditional | Required if format=reel | Copy-paste ready |
| video_prompt.duration_sec | number | conditional | 5-60 | |
| alt_text | text | no | 0-500 characters | Accessibility |
| status | select | yes | draft, approved, posted, skipped | |
| post_url | url | no | Valid URL | Optional: link to published post |

#### F-015 Metrics Entry Form

| Field | Type | Required | Validation / rule | Notes |
| --- | --- | --- | --- | --- |
| content_item_id | select | no | Must reference existing content_item | Link to specific post |
| platform | select | yes | instagram, facebook | |
| period_start | date | yes | | |
| period_end | date | yes | >= period_start | |
| views | number | no | >= 0 | |
| reach | number | no | >= 0 | |
| likes | number | no | >= 0 | |
| comments | number | no | >= 0 | |
| shares | number | no | >= 0 | |
| saves | number | no | >= 0 | |
| follower_delta | number | no | Integer (can be negative) | Change in followers |
| inquiries | number | no | >= 0 | DMs, messages |
| orders | number | no | >= 0 | |
| revenue_pkr | number | no | >= 0 | |

#### F-021 Mentor Profile Editor

| Field | Type | Required | Validation / rule | Notes |
| --- | --- | --- | --- | --- |
| niches | multi-select | yes | food, stitching_fashion, beauty, handmade, tutoring, digital | |
| languages | multi-select | yes | ur, roman_ur, en | |
| city | text | yes | 2-100 characters | |
| bio | textarea | yes | 10-1000 characters | |

#### F-022 Service CRUD

| Field | Type | Required | Validation / rule | Notes |
| --- | --- | --- | --- | --- |
| title | text | yes | 2-200 characters | |
| description | textarea | yes | 10-1000 characters | |
| niche | select | yes | Same as mentor niches | |
| type | select | yes | session, review, done_with_you, package | |
| price_pkr | number | yes | > 0 | Cannot change after accepted booking |
| duration_min | number | yes | 15-180, step 15 | |
| active | boolean | yes | | Toggle availability |

#### F-031 User Management

| Field | Type | Required | Validation / rule | Notes |
| --- | --- | --- | --- | --- |
| name | text | yes | 2-100 characters | |
| email | email | yes | Valid, unique | |
| role | select | yes | entrepreneur, mentor (Super Admin can assign or change role) | |
| program_id | select | no | Optional cohort assignment | |
| status | select | yes | active, suspended | |
| temporary_password | text | auto | Generated, forced change on first login | |

## 6. Key Screen — Detailed Requirements

### Today View (F-013) — The daily loop screen

This is the screen entrepreneurs use every day. It must be fast, clear, and action-oriented.

**Layout regions:**

```
┌──────────────────────────────────────────────────────┐
│ Today's Content — Day 12, 7 Oct 2026        [← →]   │
├──────────────────────────────────────────────────────┤
│ ┌────────────────────────┐ ┌──────────────────────┐  │
│ │ Platform: Instagram    │ │ Format: Reel          │  │
│ │ Pillar: Social proof   │ │ Goal: Engagement      │  │
│ └────────────────────────┘ └──────────────────────┘  │
├──────────────────────────────────────────────────────┤
│ HOOK                                                  │
│ "Meri customer ne 3 baar order kiya — woh bhi..."    │
│                                              [Copy]   │
├──────────────────────────────────────────────────────┤
│ CAPTION                                               │
│ "Full caption text in Roman Urdu..."                  │
│                                              [Copy]   │
├──────────────────────────────────────────────────────┤
│ HASHTAGS                                              │
│ #HomeBakeryLahore #CakesOfPakistan ...               │
│                                              [Copy]   │
├──────────────────────────────────────────────────────┤
│ CTA                                                   │
│ "DM 'ORDER' ya WhatsApp karein"                      │
│                                              [Copy]   │
├──────────────────────────────────────────────────────┤
│ IMAGE PROMPT (4:5 feed)                               │
│ "A warm, inviting flat-lay of..."                    │
│                                              [Copy]   │
├──────────────────────────────────────────────────────┤
│ VIDEO PROMPT (9:16, 12s)                              │
│ Scene 1: ... Scene 2: ...                            │
│                                              [Copy]   │
├──────────────────────────────────────────────────────┤
│ [Mark as Posted]  [Edit]  [Regenerate]  [Skip]       │
│                                                       │
│ Post URL: [________________] (optional)               │
├──────────────────────────────────────────────────────┤
│ Quick Metrics: views [__] reach [__] orders [__]     │
│                                          [Save]       │
└──────────────────────────────────────────────────────┘
```

**Behavior:**
- Navigation arrows cycle through days.
- Each [Copy] button copies the specific section to clipboard with a toast confirmation.
- [Mark as Posted] changes status to `posted`, records timestamp, optionally saves post URL.
- [Regenerate] triggers a single-item agent run (small, fast).
- [Skip] marks the day as `skipped` with an optional reason.
- Quick Metrics section lets her log results without leaving the page.
- **Response time budget:** Page load < 300ms (no agent call on load); copy/mark actions < 100ms.

### Agent Progress Overlay (F-042)

When an agent run is in progress, a bottom-sheet or modal shows:

```
┌──────────────────────────────────────────────────────┐
│ 🤖 Generating your content calendar...               │
│                                                       │
│ ✅ Research complete (3 competitors found)            │
│ ✅ Strategy outline ready                             │
│ ⏳ Writing batch 1/4 (days 1-8)...                   │
│ ○ Writing batch 2/4                                  │
│ ○ Writing batch 3/4                                  │
│ ○ Writing batch 4/4                                  │
│ ○ Visual prompts                                     │
│ ○ Quality check                                      │
│                                                       │
│ [Cancel Run]                                          │
└──────────────────────────────────────────────────────┘
```

**Powered by SSE** from `GET /api/v1/agents/runs/{run_id}/stream`.

## 7. Dashboards

| ID | Dashboard | Role | KPIs (each drills down to records) | Refresh | Phase |
| --- | --- | --- | --- | --- | --- |
| D-001 | Entrepreneur Home | Entrepreneur | Tasks completed this week, Posts published, Engagement trend (likes+comments), Revenue this week (PKR) | On page load | 2 |
| D-002 | Mentor Dashboard | Mentor | Pending requests, Upcoming sessions this week, Total earnings (simulated), Average rating | On page load | 3 |
| D-003 | Cohort Dashboard | Super Admin | Funnel: signed up → plan approved → first post → first order, Stalled count, Active mentors, Bookings this week | On page load | 4 |
| D-004 | System Dashboard | Super Admin | Active users today, Agent runs today (success/fail), Avg agent latency, Error rate, Top 5 users by runs | On page load + auto-refresh 60s | 4 |

## 8. Dashboard UI Standard

- **KPI cards:** Icon + label + value + trend arrow (▲/▼) + percentage change. Click drills down to the filtered list.
- **Charts:** Line charts for trends (Recharts), bar charts for comparisons, donut for distribution.
- **Filters:** Date range picker (default: this week), optional cohort program filter.
- **Drill-down rule:** Every aggregate number links to the list of records that compose it.
- **Empty state:** "No data yet — complete your onboarding to get started."
- **Loading state:** Skeleton cards with shimmer.
- **Error state:** "Failed to load dashboard — [Retry]" with the error in a collapsed detail.
- **Permission awareness:** Each dashboard only shows data within the user's scope (Entrepreneurs see only own data; Mentors see booked mentees; Super Admin sees platform-wide data with optional cohort filter).

## 9. Reports

| ID | Report | Module | Filters | Export | Roles |
| --- | --- | --- | --- | --- | --- |
| R-001 | Validation Report | Business | business_id | — | Entrepreneur |
| R-002 | Pricing & Break-even | Business | business_id, product_id | — | Entrepreneur |
| R-003 | Research Report | Content | business_id | — | Entrepreneur |
| R-004 | Content Performance | Metrics | date range, platform | — | Entrepreneur |
| R-005 | Weekly Coach Review | Metrics | business_id, week | — | Entrepreneur |
| R-006 | Mentor Earnings | Mentor | date range | — | Mentor |
| R-007 | Cohort Progress | Program | program_id, date range | — | Super Admin |
| R-008 | Stalled Businesses | Program | program_id | — | Super Admin |
| R-009 | Audit Trail | Admin | actor, action, target, date range | CSV (P2) | Super Admin |
| R-010 | Agent Run History | Admin | workflow, status, date range | — | Super Admin |
| R-011 | Usage Statistics | Admin | date range | — | Super Admin |

## 10. Core Business Workflows

### W-001 Entrepreneur Onboarding

1. Entrepreneur signs up (F-001) → `users` row created with role=entrepreneur, status=active.
2. Entrepreneur starts onboarding chat (F-003) → Orchestrator agent receives input.
3. Orchestrator → Intake agent extracts `BusinessProfile` → `businesses` row created.
4. Intake → Idea Validator (web_search) → `validation_reports` row created.
5. Validator → Pricing agent (calc tools) → `pricing_results` row(s) created.
6. Pricing → Launch Planner → `launch_plans` + `plan_tasks` rows created.
7. **Human Gate 1 (F-008):** Entrepreneur reviews plan + pricing → approves or requests changes.
8. On approve: `plan.approved` audit event, plan status = approved.
9. Parallel: Mentor Matcher suggests top 3 → shown as recommendation (not blocking).

- **State machine:** `not_started → in_progress → awaiting_approval → approved | revision_requested`
- **Failure paths:** Agent fails → `agent_runs.status=failed`, user sees error + retry option. Validation low confidence → warning shown, user decides.
- **Audit events:** `agent.run.started`, `agent.run.succeeded`/`failed`, `plan.approved`

### W-002 Content Month Generation

1. Entrepreneur triggers "Generate Content Month" or it follows onboarding.
2. Researcher agent (web_search via Tavily) → competitor analysis + hashtags → `research_reports` row.
3. Research Normalizer → structured `CompetitorReport`.
4. Content Strategist → 30-day outline (pillars, themes, format mix) → `content_calendars` row.
5. **Human Gate 2 (F-010):** Entrepreneur reviews outline → approves.
6. Content Writer generates in 4 parallel batches (days 1-8, 9-15, 16-23, 24-30) → `content_items` rows.
7. Visual Prompt agent adds image_prompt + video_prompt to each item.
8. Content QA agent validates every item (schema + tone + IP rules) → retries failed items once.
9. All items available for review/edit in calendar (F-011) and Today View (F-013).

- **State machine:** `not_started → researching → strategizing → awaiting_approval → generating → qa → ready`
- **Failure paths:** Batch fails → retry that batch; QA rejects item → regenerate once; if still fails → mark as `needs_review`, user edits manually.
- **Audit events:** `content_outline.approved`, `agent.run.*`

### W-003 Daily Content Loop

1. Entrepreneur opens Today View (F-013).
2. Copies caption, hashtags, image prompt, video prompt using [Copy] buttons.
3. Creates media externally (Canva, phone camera, AI image generator).
4. Posts manually to Instagram/Facebook.
5. Returns to Today View → clicks [Mark as Posted] → status=posted, optional post_url, timestamp saved.
6. Optionally logs quick metrics (views, reach, orders).
7. `content_item.posted` audit event.

- **State machine (content_item):** `draft → approved → posted | skipped`
- **No agent involvement** — this is a manual workflow.

### W-004 Weekly Review

1. Triggered manually by entrepreneur or by a scheduled prompt (Super Admin configurable).
2. System gathers: metrics_snapshots, posted content_items, plan_tasks status, mentor session notes.
3. Python computes stats: best format, best day, engagement trend, revenue trend.
4. Weekly Coach agent reads stats → decides actions: keep plan, shift content mix, refresh hashtags, suggest mentor service, escalate stuck.
5. **Human Gate 3 (F-017):** Entrepreneur reviews proposed changes → approves or rejects each.
6. On approve: upcoming content_items updated, `agent.proposal.approved` audit event.

- **State machine:** `pending → computed → reviewed → approved | partially_approved | rejected`
- **Failure paths:** Not enough data → coach says "need at least 3 days of metrics to advise."

### W-005 Mentor Booking

1. Entrepreneur browses services (F-018) or receives Matcher recommendation.
2. Entrepreneur books a service (F-019) → `bookings` row with status=requested, `payments_sim` row with status=held.
3. Mentor sees request in dashboard (F-024) → accepts or declines.
4. On accept: status=accepted → scheduled_at set.
5. Before session: Mentor Brief Agent generates one-page brief (business summary, plan progress, metrics, blockers).
6. Session happens (outside the platform).
7. Mentor adds session notes (F-027) → status=completed.
8. Simulated payment released: `payments_sim.status=released`, mentor_payout calculated.
9. Entrepreneur leaves review (F-041).

- **State machine:** `requested → accepted | declined → scheduled → completed → reviewed`
- **Failure paths:** Mentor doesn't respond in 48h → auto-decline. Booking cancelled before session → payment refunded.

### W-006 Mentor Approval

1. User applies as mentor (F-040) → `users` row with role=mentor, status=pending; `mentor_profiles` row.
2. Super Admin reviews application (F-030).
3. Approve → status=active, Pro panel unlocked, `mentor.approved` audit event.
4. Decline → status declined (can re-apply), `mentor.declined` audit event.

- **State machine:** `pending → active | declined`

### W-007 User Management (Super Admin)

1. Super Admin opens user list (F-031).
2. Manages users: creates user accounts, assigns optional cohort programs, sets temporary passwords if needed.
3. Suspend user: status → suspended, all refresh tokens revoked, `user.suspended` audit event.
4. Reactivate user: status → active, `user.reactivated` audit event.
5. Change role: `user.role_changed` audit event with before/after.

- **Audit events:** `user.created`, `user.invited`, `user.role_changed`, `user.suspended`, `user.reactivated`

## 11. Offline & Synchronization

Not applicable — the platform is online-only. Entrepreneurs use it via desktop or mobile web browser with an internet connection. Agent runs require server-side processing and LLM API calls that cannot function offline.

## 12. Database / Data Model

### 12.1 Domains and representative tables

| Domain | Representative tables |
| --- | --- |
| Identity & Security | users, refresh_tokens, programs |
| Business | businesses, products, validation_reports, pricing_results |
| Planning | launch_plans, plan_tasks |
| Content | content_calendars, content_items, research_reports |
| Metrics | metrics_snapshots |
| Mentoring | mentor_profiles, mentor_services, mentor_availability, bookings, payments_sim, reviews |
| Agent Platform | agent_runs, agent_steps, proposals |
| System | audit_logs, notifications, settings, feature_flags |

### 12.2 Conventions

- **Naming:** `lower_snake_case`, plural table names.
- **Primary keys:** UUID (`gen_random_uuid()`) for all main entities; `bigserial` for audit_logs, agent_steps, notifications.
- **Soft delete:** Not used — records are never deleted in the MVP. Suspensions use a `status` field.
- **Timestamps:** `created_at timestamptz NOT NULL DEFAULT now()`, `updated_at timestamptz` (trigger-maintained where needed).
- **Money type:** `integer` for PKR amounts (no decimal currency — PKR smallest unit is 1 rupee). Display formatting in the frontend.
- **JSONB:** Used for flexible/nested structures (cost_inputs, report payloads, content prompts, agent trace data). Never for queryable foreign keys.
- **Optimistic concurrency:** Not implemented in MVP (low concurrent writes). Add `version integer` column if conflicts arise.
- **Indexing rule:** Primary key + foreign keys + columns used in WHERE/ORDER BY with high cardinality. Added as needed based on query patterns.
- **Tenant column:** `program_id` on `users` and `businesses`; all downstream data is scoped via JOIN to `businesses.program_id`.

### 12.3 Entity detail

#### users

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| id | uuid | PK, default gen_random_uuid() | |
| email | text | UNIQUE, NOT NULL | |
| password_hash | text | NOT NULL | argon2 hash |
| role | text | NOT NULL, CHECK (role IN ('entrepreneur', 'mentor', 'super_admin')) | |
| status | text | NOT NULL DEFAULT 'active', CHECK (status IN ('pending', 'active', 'suspended')) | |
| program_id | uuid | FK → programs(id), nullable | Optional cohort program tag |
| name | text | NOT NULL | |
| language | text | DEFAULT 'roman_ur' | Preferred language |
| created_by | uuid | FK → users(id), nullable | null for self-signup |
| force_password_change | boolean | DEFAULT false | true for admin-created accounts |
| failed_login_count | integer | DEFAULT 0 | Reset on success |
| locked_until | timestamptz | nullable | Set after 5 failures |
| created_at | timestamptz | NOT NULL DEFAULT now() | |
| updated_at | timestamptz | | |

Indexes: `(email)` unique, `(program_id)`, `(role, status)`.

#### refresh_tokens

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| id | uuid | PK | |
| user_id | uuid | FK → users(id), NOT NULL | |
| token_hash | text | NOT NULL | SHA-256 of the opaque token |
| family_id | uuid | NOT NULL | Groups token rotation chain |
| expires_at | timestamptz | NOT NULL | |
| revoked_at | timestamptz | nullable | Set on revocation |
| replaced_by | uuid | FK → refresh_tokens(id), nullable | Points to the new token |
| created_at | timestamptz | NOT NULL DEFAULT now() | |

Indexes: `(token_hash)`, `(user_id)`, `(family_id)`.

#### businesses

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| id | uuid | PK | |
| owner_id | uuid | FK → users(id), NOT NULL, UNIQUE | One business per user |
| program_id | uuid | FK → programs(id), nullable | Inherited from user |
| name | text | NOT NULL | |
| niche | text | NOT NULL | |
| city | text | NOT NULL | |
| area | text | | |
| budget_pkr | integer | NOT NULL | Monthly budget |
| hours_per_week | integer | NOT NULL | |
| tone | text | DEFAULT 'friendly' | |
| languages | text[] | NOT NULL | |
| platforms | text[] | NOT NULL | |
| target_customer | text | | |
| created_at | timestamptz | NOT NULL DEFAULT now() | |
| updated_at | timestamptz | | |

Indexes: `(owner_id)` unique, `(program_id)`.

#### content_items

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| id | uuid | PK | |
| calendar_id | uuid | FK → content_calendars(id), NOT NULL | |
| day | integer | NOT NULL | 1-30 |
| date | date | NOT NULL | |
| platform | text[] | NOT NULL | |
| format | text | NOT NULL | reel, carousel, static, story, fb_post |
| pillar | text | NOT NULL | education, behind_the_scenes, etc. |
| goal | text | NOT NULL | awareness, engagement, leads, sales |
| hook | text | NOT NULL | |
| caption | text | NOT NULL | |
| cta | text | NOT NULL | |
| hashtags | text[] | NOT NULL | |
| best_time_hint | text | | |
| image_prompt | jsonb | NOT NULL | {subject, scene, style, lighting, composition, aspect_ratio, palette, negative, prompt_text} |
| video_prompt | jsonb | | {duration_sec, aspect_ratio, scenes[], voiceover, music_mood, prompt_text} |
| alt_text | text | | |
| status | text | NOT NULL DEFAULT 'draft' | draft, approved, posted, skipped |
| posted_at | timestamptz | | |
| post_url | text | | |
| created_at | timestamptz | NOT NULL DEFAULT now() | |
| updated_at | timestamptz | | |

Indexes: `(calendar_id, day)`, `(status)`.

#### audit_logs (append-only)

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| id | bigserial | PK | |
| at | timestamptz | NOT NULL DEFAULT now() | |
| request_id | uuid | | Correlation ID |
| actor_id | uuid | FK → users(id) | |
| actor_role | text | | |
| action | text | NOT NULL | e.g. 'auth.login.failed' |
| target_type | text | | e.g. 'user', 'business' |
| target_id | text | | |
| program_id | uuid | | For scoped queries |
| ip | inet | | |
| user_agent | text | | |
| before | jsonb | | State before change |
| after | jsonb | | State after change |
| meta | jsonb | NOT NULL DEFAULT '{}' | Additional context |

Indexes: `(at DESC)`, `(actor_id, at DESC)`, `(action, at DESC)`.

Trigger: `audit_logs_immutable()` — prevents UPDATE and DELETE.

#### agent_runs

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| id | uuid | PK | |
| trace_id | text | UNIQUE | Links to agent_steps |
| workflow | text | NOT NULL | onboarding, content_month, weekly_review, mentor_match, etc. |
| user_id | uuid | FK → users(id) | |
| business_id | uuid | FK → businesses(id) | |
| status | text | NOT NULL DEFAULT 'queued' | queued, running, awaiting_approval, succeeded, failed, blocked |
| input_summary | text | | |
| output_summary | text | | |
| error | text | | |
| started_at | timestamptz | | |
| ended_at | timestamptz | | |
| created_at | timestamptz | NOT NULL DEFAULT now() | |

#### agent_steps

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| id | bigserial | PK | |
| trace_id | text | NOT NULL | |
| span_id | text | NOT NULL, UNIQUE | |
| parent_id | text | | |
| span_type | text | NOT NULL | agent, generation, function, handoff, guardrail, custom |
| started_at | timestamptz | | |
| ended_at | timestamptz | | |
| data | jsonb | | Redacted + truncated (1500 chars) |
| error | jsonb | | |

Indexes: `(trace_id)`.

### 12.4 Migration policy

- Every schema change ships as an Alembic migration in the same PR.
- Migrations are **never edited** after merge to main.
- CI check: `alembic check` fails when SQLAlchemy models have changes not captured in a migration.
- Destructive migrations (drop column, drop table) require explicit confirmation in the PR description.

### 12.5 Data retention, seed data, sample data

- **Retention:** No automatic data deletion. Audit logs and agent traces are retained indefinitely.
- **Seed data:** `scripts/seed.py` creates:
  - 1 Super Admin (from env vars)
  - 1 sample cohort program ("Lahore Batch 1")
  - 5 mentors with services and availability
  - 20 entrepreneurs with businesses at various stages
  - Sample content calendars, metrics, bookings
- **Demo data:** Pre-generated content for the demo script (home bakery in Gulshan-e-Iqbal).

## 13. API Requirements

### 13.1 Conventions

- **Base path:** `/api/v1`
- **Naming:** `lower_snake_case` for paths and fields; plural nouns for collections (`/users`, `/businesses`).
- **Pagination:** `?page=1&page_size=20` (default 20, max 100). Response includes `total`, `page`, `page_size`.
- **Filtering:** Query parameters matching field names: `?status=active&role=mentor`.
- **Sorting:** `?sort=created_at&order=desc`.
- **Idempotency:** `X-Idempotency-Key` header for POST requests that create resources; server stores key for 24h.
- **Error format (RFC 7807):**
  ```json
  {
    "type": "validation_error",
    "title": "Invalid input",
    "status": 422,
    "detail": "email: not a valid email address",
    "instance": "/api/v1/auth/register",
    "errors": [{"field": "email", "message": "not a valid email address"}]
  }
  ```
- **Correlation ID:** `X-Request-Id` header (UUID), passed to audit logs and agent traces.
- **Rate limits:** 100 requests/minute per user (429 Too Many Requests). Agent endpoints: 10/minute.
- **OpenAPI:** Auto-generated by FastAPI; served at `/api/v1/openapi.json`. The generated TypeScript client (`packages/api-client`) must match.

### 13.2 Endpoint register

| Area | Endpoint | Methods | Permission | Notes |
| --- | --- | --- | --- | --- |
| Auth | `/api/v1/auth/register` | POST | public | Entrepreneur signup |
| Auth | `/api/v1/auth/login` | POST | public | Returns tokens in cookies |
| Auth | `/api/v1/auth/refresh` | POST | authenticated | Rotates refresh token |
| Auth | `/api/v1/auth/logout` | POST | authenticated | Revokes tokens |
| Auth | `/api/v1/auth/me` | GET | authenticated | Current user profile |
| Auth | `/api/v1/auth/change-password` | POST | authenticated | |
| Auth | `/api/v1/auth/mentor-apply` | POST | public | Mentor application |
| Users | `/api/v1/admin/users` | GET, POST | super_admin | List, manage users |
| Users | `/api/v1/admin/users/{id}` | GET, PATCH | super_admin | View, suspend/reactivate/change role |
| Users | `/api/v1/admin/users/{id}/reset-password` | POST | super_admin | |
| Business | `/api/v1/businesses` | GET | entrepreneur (own), super_admin | |
| Business | `/api/v1/businesses/{id}` | GET, PATCH | owner, super_admin | |
| Business | `/api/v1/businesses/{id}/products` | GET, POST, PATCH, DELETE | owner | |
| Business | `/api/v1/businesses/{id}/validation` | GET | owner, super_admin | |
| Business | `/api/v1/businesses/{id}/pricing` | GET | owner, super_admin | |
| Plans | `/api/v1/businesses/{id}/plan` | GET | owner, super_admin | |
| Plans | `/api/v1/businesses/{id}/plan/tasks` | GET, PATCH | owner | Update task status |
| Plans | `/api/v1/businesses/{id}/plan/approve` | POST | owner | Human gate 1 |
| Agents | `/api/v1/agents/runs` | GET, POST | authenticated | Start workflow, list runs |
| Agents | `/api/v1/agents/runs/{id}` | GET | owner, super_admin | Run status + output |
| Agents | `/api/v1/agents/runs/{id}/stream` | GET (SSE) | owner | Real-time progress |
| Agents | `/api/v1/agents/runs/{id}/cancel` | POST | owner, super_admin | |
| Proposals | `/api/v1/proposals` | GET | owner | Pending proposals |
| Proposals | `/api/v1/proposals/{id}/approve` | POST | owner | |
| Proposals | `/api/v1/proposals/{id}/reject` | POST | owner | |
| Content | `/api/v1/businesses/{id}/content/calendar` | GET | owner, super_admin | |
| Content | `/api/v1/businesses/{id}/content/outline` | GET | owner | |
| Content | `/api/v1/businesses/{id}/content/outline/approve` | POST | owner | Human gate 2 |
| Content | `/api/v1/businesses/{id}/content/items` | GET | owner, super_admin | |
| Content | `/api/v1/businesses/{id}/content/items/{item_id}` | GET, PATCH | owner | Edit, mark posted |
| Content | `/api/v1/businesses/{id}/content/items/{item_id}/regenerate` | POST | owner | |
| Content | `/api/v1/businesses/{id}/content/research` | GET | owner | |
| Metrics | `/api/v1/businesses/{id}/metrics` | GET, POST | owner | Log manual metrics |
| Metrics | `/api/v1/businesses/{id}/metrics/charts` | GET | owner, super_admin | Aggregated data |
| Mentors | `/api/v1/mentors` | GET | authenticated | Browse |
| Mentors | `/api/v1/mentors/me` | GET, PATCH | mentor | Own profile |
| Mentors | `/api/v1/mentors/me/services` | GET, POST | mentor | |
| Mentors | `/api/v1/mentors/me/services/{id}` | PATCH, DELETE | mentor | |
| Mentors | `/api/v1/mentors/me/availability` | GET, PUT | mentor | |
| Mentors | `/api/v1/mentors/me/mentees` | GET | mentor | Booked only |
| Mentors | `/api/v1/mentors/me/earnings` | GET | mentor | |
| Services | `/api/v1/services` | GET | entrepreneur | Browse all active services |
| Services | `/api/v1/services/{id}` | GET | entrepreneur | |
| Bookings | `/api/v1/bookings` | GET, POST | entrepreneur, mentor | |
| Bookings | `/api/v1/bookings/{id}` | GET, PATCH | participant | Accept, complete |
| Bookings | `/api/v1/bookings/{id}/notes` | POST | mentor | Session notes |
| Reviews | `/api/v1/bookings/{id}/review` | POST | entrepreneur | |
| Mentors | `/api/v1/mentors/match` | POST | entrepreneur | Matcher agent |
| Admin | `/api/v1/admin/cohort/dashboard` | GET | super_admin | Cohort stats |
| Admin | `/api/v1/admin/cohort/stalled` | GET | super_admin | Stalled businesses list |
| Admin | `/api/v1/admin/mentors/pending` | GET | super_admin | Pending mentor applications |
| Admin | `/api/v1/admin/mentors/{id}/approve` | POST | super_admin | Approve mentor application |
| Admin | `/api/v1/admin/mentors/{id}/decline` | POST | super_admin | Decline mentor application |
| Admin | `/api/v1/admin/audit` | GET | super_admin | Filterable |
| Admin | `/api/v1/admin/runs` | GET | super_admin | All agent runs |
| Admin | `/api/v1/admin/runs/{id}` | GET | super_admin | Run + spans |
| Admin | `/api/v1/admin/settings` | GET, PATCH | super_admin | |
| Admin | `/api/v1/admin/feature-flags` | GET, PATCH | super_admin | |
| Admin | `/api/v1/admin/usage` | GET | super_admin | |
| Admin | `/api/v1/admin/kill-switch` | POST | super_admin | Pause all agent runs |
| Notifications | `/api/v1/notifications` | GET, PATCH | authenticated | List, mark read |

### 13.3 Integrations (external)

| ID | System | Direction | Protocol | Auth | Failure handling | Phase |
| --- | --- | --- | --- | --- | --- | --- |
| I-001 | Gemini API | Outbound | HTTPS (OpenAI-compatible) | API key (env var) | Retry 3x with exponential backoff; on persistent failure: agent_run status=failed, user notified | P0 |
| I-002 | Tavily Search API | Outbound | HTTPS REST | API key (env var) | Retry 2x; on failure: agent continues with partial results or error message | P2 |

## 14. Security & Audit

- HTTPS in all non-development environments.
- Role-based authorization enforced by the API (the UI hiding an action is convenience, not security).
- No credentials or secrets in source control; `.env.example` holds keys with empty values.
- Passwords stored with argon2; lockout after 5 failed attempts (15-minute cooldown).
- Rate limiting: 100 req/min per user, 10 req/min for agent endpoints.
- Validation on all user input and API payloads (Pydantic); parameterized queries via SQLAlchemy ORM only.
- Sensitive data (passwords, tokens, API keys) never appear in logs or audit records.

### 14.1 Audited actions

| Category | Actions |
| --- | --- |
| Auth | auth.login.success, auth.login.failed, auth.locked, auth.logout, auth.refresh.reuse_detected, auth.password.changed |
| Users | user.created, user.invited, user.role_changed, user.suspended, user.reactivated, mentor.approved, mentor.declined |
| Business | plan.approved, content_outline.approved, content_item.edited, content_item.posted, metrics.logged |
| Mentor marketplace | service.created, service.price_changed, booking.requested, booking.accepted, booking.completed, payment_sim.released |
| Agents | agent.run.started, agent.run.blocked, guardrail.tripped, agent.proposal.approved, agent.proposal.rejected |
| Admin | settings.changed, feature_flag.changed, kill_switch.toggled, audit.exported |

Every change action stores **before/after** state. Emails and phones are masked in `meta`. Passwords and tokens are never stored.

### 14.2 Roles and permission matrix

| Role | Modules / screens | Actions |
| --- | --- | --- |
| Entrepreneur | Business, Plan, Content, Metrics, Mentors (browse/book), Notifications | view own, create own, edit own, approve own proposals |
| Mentor | Profile, Services, Availability, Mentees (booked), Bookings, Earnings, Reviews, Notifications | view own, create services, edit services, accept/decline bookings, add notes |
| Super Admin | All Users, Cohort & Stalled, Mentor Approvals, Audit Log, Agent Explorer, Settings, Feature Flags, Kill Switch, Usage | view all, create users, approve/decline mentors, suspend/reactivate users, change roles, change settings |

### 14.3 Data protection and privacy

- **Classification:** User data is confidential. Agent trace data is internal. Metrics data is user-owned.
- **Encryption in transit:** TLS 1.2+ (enforced by hosting platforms).
- **Encryption at rest:** Supabase provides encryption at rest for PostgreSQL storage.
- **Token encryption:** Social connection tokens (if Meta Connect is added later) encrypted with Fernet/AES, key from env var.
- **Retention:** No automatic deletion. User can request data export (future feature).
- **Backups:** Supabase provides daily automated backups on paid plans; free tier has no backups — manual `pg_dump` via GitHub Actions cron (weekly).

### 14.4 Threat notes

| # | Threat | Control |
| --- | --- | --- |
| 1 | Prompt injection in agent inputs | Input guardrail in Orchestrator blocks off-topic/abusive/injection text |
| 2 | Unauthorized data access (one user sees another's data) | Scoping enforced at query level via FastAPI dependency; integration tests verify |
| 3 | JWT token theft | Short-lived (15 min), httpOnly + Secure + SameSite cookies, refresh rotation with family revocation |
| 4 | Brute force login | 5-attempt lockout, rate limiting (100 req/min) |
| 5 | Agent producing harmful content | Content QA guardrail checks for claims, IP issues; all outputs are drafts requiring human approval |

## 15. AI-Assisted Development Protocol

| Step | Developer / agent requirement |
| --- | --- |
| 1. Requirement | A small, testable story with acceptance criteria |
| 2. Context | Supply structure, conventions, constraints (`context/` folder) |
| 3. Design | Agree database/API/UI design before large generation |
| 4. Generate | Scaffolding, implementation, refactoring, tests |
| 5. Review | Nimra reviews all generated code, queries, security, error handling |
| 6. Test | Acceptance tests written first and passing; `scripts/verify.sh` green |
| 7. PR | Requirement, test evidence, migration notes |
| 8. Merge | Only passing PRs reach main branch |

The developer (Nimra) remains accountable for architecture, security, correctness and maintainability. AI tooling is never given unrestricted production credentials or unrestricted database write access.

## 16. UI/UX Standards

- **Layout:** Sidebar navigation (collapsible), top bar with user info + notifications bell.
- **Density:** Comfortable (not compact) — target audience may not be tech-savvy.
- **Typography:** System font stack via Tailwind; 16px base; clear hierarchy with shadcn/ui defaults.
- **Colour tokens:** shadcn/ui theme tokens only — no hard-coded colors. Primary: brand color (to be decided). Semantic: success (green), warning (amber), error (red), info (blue).
- **Forms:** React Hook Form + Zod; inline validation on blur; error messages below field in red; success toast on submit.
- **Data grids:** TanStack Table with sorting, filtering, pagination. Row click navigates to detail.
- **Feedback:** Toast notifications (sonner) for actions; loading spinner for async operations.
- **Responsive breakpoints:** Mobile (< 640px), Tablet (640-1024px), Desktop (> 1024px). Sidebar collapses to hamburger on mobile.
- **Keyboard support:** Tab navigation through forms; Enter to submit; Escape to cancel modals.
- **Four states:** Every data-loading component handles: loading (skeleton), empty (illustration + prompt), error (message + retry), unauthorized (redirect).
- **Formatting:** Single `format.ts` utility for dates (Pakistan locale), currency (PKR with comma separator), percentages.

## 17. Performance Requirements

| Area | Target / requirement | How verified |
| --- | --- | --- |
| Standard interaction | API response p95 < 500ms | Application logs + pytest benchmarks |
| Search | pg_trgm search p95 < 1s for < 10k rows | Integration test with sample data |
| Agent runs | No time target (async); progress via SSE; cancel available | Manual testing |
| Page load | First Contentful Paint < 2s on 3G equivalent | Lighthouse CI |
| Content copy actions | < 100ms (clipboard API, no server call) | Manual testing |
| Concurrent agent runs | Max 5 simultaneous (configurable by Super Admin) | Semaphore in agent runner |
| Database | Query plans reviewed for N+1 patterns; indexes on all FK columns | pytest + EXPLAIN ANALYZE in dev |

## 18. Backup & Disaster Recovery

- **RPO:** 24 hours (acceptable data loss window for a contest project).
- **RTO:** 4 hours (time to restore from backup).
- **Backup strategy:** 
  - Supabase free tier: no automated backups.
  - Manual: `pg_dump` via GitHub Actions cron job, weekly, stored in a private GitHub release or S3-compatible storage.
- **Restore procedure:** `psql < backup.sql` into a fresh Supabase project.
- **Restore test:** Run a restore to a test database at least once before the contest.
- **Failover:** Not applicable for free-tier single-instance deployment. If Supabase is down, the app is down.
- **On call:** Nimra (solo developer).

## 19. Testing & Acceptance

| Test level | Scope | Tooling |
| --- | --- | --- |
| Unit | Domain rules, calculations (pricing, break-even, stats), agent tool functions | pytest (API), Vitest (frontend) |
| Architecture | Every endpoint has `require_role`, scoping on every query, no raw SQL outside migrations | pytest with custom markers |
| Integration | API + database + auth + scoping + audit (real Postgres via Docker) | pytest + httpx TestClient + testcontainers |
| Component / UI | Forms, validation, permissions, responsive behaviour | Vitest + React Testing Library |
| E2E | Critical flows: signup → onboarding → content generation → today view → mark posted | Playwright |
| Performance | API endpoints against §17 targets, database query plans | pytest benchmarks |
| Security | Authorization tests (each role against each endpoint), token rotation, lockout | pytest |

## 20. Acceptance Criteria for Forms

Every form must pass:
- [ ] Layout follows §5.1 (title/status → master fields → detail → actions → audit panel)
- [ ] Every field matches §5.3 (no invented fields, correct types and validation rules)
- [ ] Inline validation on blur with actionable error messages
- [ ] Unauthorized actions are hidden; API still returns 403
- [ ] Loading state with skeleton, empty state with prompt, error state with retry
- [ ] Keyboard navigation: Tab through fields, Enter to submit
- [ ] Responsive on mobile (fields stack vertically)

## 21. Acceptance Criteria for Dashboards

- [ ] Every KPI number is clickable and drills down to the filtered list of records
- [ ] Numbers reconcile with the source data (verified by integration test)
- [ ] Dashboard is scoped to the user's permissions (entrepreneur sees own data; mentor sees booked mentees; Super Admin sees all)
- [ ] Loads within 2 seconds on standard connection
- [ ] Empty state shows guidance ("No data yet — complete your onboarding")
- [ ] Charts are readable on mobile (responsive layout)

## 22. Phased Delivery Plan

| Phase | Scope | Exit criteria (a test a person can run) |
| --- | --- | --- |
| 0 | Foundation (25-26 Sep): Repo structure, Docker Compose, Supabase schema, Alembic migrations, auth (register/login/refresh/logout + 3 roles + user creation paths), audit() helper, llm.py (Gemini client), trace processor (agent_steps), live Gemini smoke test (tool call, structured output, one handoff), Super Admin panel (user management, audit viewer, agent explorer, settings) | A user can register as entrepreneur, login, see empty dashboard. Super Admin can login, manage users, view audit log. A smoke test calls Gemini with a tool and gets a structured response. CI is green. |
| 1 | Onboarding agents (27-29 Sep): Orchestrator + Intake + Validator + Pricing + Launch Planner, approval gate (Human Gate 1), plan dashboard, SSE progress streaming, agent progress overlay | An entrepreneur types a business idea → agents produce validation report, pricing, and launch plan → she approves → plan tasks are visible. Agent run appears in Super Admin's explorer with spans. |
| 2 | Content Engine (30 Sep - 3 Oct): Researcher (Tavily) + Normalizer + Strategist + Writer (4 batches) + Visual Prompt + Content QA, content outline approval (Human Gate 2), content calendar UI, Today View, research report view | Entrepreneur approves plan → content engine generates research, strategy, 30-day calendar → she reviews outline (gate 2) → approves → items appear in calendar → Today View shows today's post with copy buttons → she marks posted. |
| 3 | Mentor Pro Panel (4-5 Oct): Mentor profile, services CRUD, availability, booking flow (request → accept → complete → review), simulated payment, Mentor Matcher agent, Mentor Brief agent, mentor approval by Super Admin | A mentor applies → Super Admin approves → mentor creates a service → entrepreneur browses and books → mentor accepts → brief is generated → session completed → payment released → review left. |
| 4 | Metrics + Coach + Admin (6-7 Oct): Manual metrics entry form, performance charts, Weekly Coach agent (Human Gate 3), Super Admin cohort panel (cohort funnel, stalled list), feature flags, usage stats, notifications inbox | Entrepreneur logs metrics for 3+ days → triggers Weekly Coach → coach proposes changes → she approves → upcoming content updated. Super Admin sees cohort funnel and stalled list. |
| 5 | Polish + Rehearsal (8-9 Oct): Seed data script, demo script rehearsal, bug fixes, README, deployment guide, user manual, final UI polish | Demo script runs end-to-end without errors. All documentation is written. Deployment guide tested on a fresh environment. |

## 23. Required Deliverables

- Complete source code with full repository history (git)
- Database migrations (Alembic) and ERD documentation
- API documentation (auto-generated OpenAPI at `/api/v1/openapi.json`)
- All forms and dashboards listed in §5 and §7
- Unit, integration, and E2E tests
- Docker Compose for local development
- Deployment guide (Vercel + FastAPI Cloud + Supabase setup)
- `scripts/seed.py` for demo data
- Demo script document (4-minute walkthrough)
- README with setup instructions
- User manual / help content

## 24. Definition of Done

- Requirement implemented and demonstrated
- Database migration included
- API and UI completed
- Validation and authorization implemented
- Audit requirements implemented
- Automated tests added and passing; `scripts/verify.sh` passes
- No critical/high unresolved defects
- Code reviewed by Nimra (including AI-generated code)
- Documentation updated

## 25. Change Control

Any feature, form, report, integration or workflow not in this PRD is handled by a change request recording: scope, business reason, effort, impact on schedule and cost, affected sections, decision, approver. Approved changes are recorded in §0.2.

### 25.1 Change request log

| CR | Date | Requester | Summary | Sections | Decision | Approver |
| --- | --- | --- | --- | --- | --- | --- |

## 26. Initial Feature Priority

| Priority | Meaning | Items |
| --- | --- | --- |
| P0 — Mandatory | Cannot ship without | Auth + 3 roles + user creation; Intake → Validator → Pricing → Launch Planner; Content Engine (research → strategy → captions/hashtags → image/video prompts); Today View; manual metrics entry; audit log + agent trace viewer |
| P1 — Should have | First commercial release | Mentor Pro panel + booking (simulated payment); Mentor Matcher; Weekly Coach re-plan; Super Admin cohort dashboard; Notifications; Feature flags |
| P2 — Could have | Expansion | Metrics from screenshot (vision); CSV export; email/WhatsApp draft reminders; Performance charts |
| P3 — Won't (v2) | Differentiation / future | Auto-posting; real payments; real email/SMS; Meta Connect; native mobile app |

## 27. Final Product Structure

| Module | Screens | Tables | API routes |
| --- | --- | --- | --- |
| Auth | F-001, F-002, F-039, F-040 | users, refresh_tokens, programs | /auth/* |
| Business | F-003, F-004, F-005, F-006, F-007, F-008 | businesses, products, validation_reports, pricing_results | /businesses/*, /plans/* |
| Content | F-010, F-011, F-012, F-013, F-014 | content_calendars, content_items, research_reports | /content/* |
| Metrics | F-015, F-016, F-017 | metrics_snapshots | /metrics/* |
| Mentor | F-018–F-027, F-041 | mentor_profiles, mentor_services, mentor_availability, bookings, payments_sim, reviews | /mentors/*, /services/*, /bookings/* |
| Cohort & Admin | F-028, F-029, F-030 | — (reads from other tables) | /admin/* |
| Admin | F-031–F-037 | settings, feature_flags | /admin/* |
| Agent Platform | F-042 | agent_runs, agent_steps, proposals | /agents/* |
| System | F-038 | audit_logs, notifications | /notifications/*, /admin/audit |

## 28. Approval

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Product owner / Developer | Nimra | | |

## 29. Visual UI / UX Wireframes — Dashboards

### 29.1 D-001 Entrepreneur Home

```
+--------------------------------------------------------------+
| Tasks Done     | Posts Published | Engagement ▲  | Revenue    |
| 12/30          | 8              | +23%           | Rs 15,000  |
+--------------------------------------------------------------+
| Engagement Trend (7 days)        | Today's Post               |
| [line chart]                     | Day 12: Reel               |
|                                  | "Meri customer ne..."      |
|                                  | [Go to Today View →]       |
+--------------------------------------------------------------+
| Upcoming Tasks                                                |
| ☐ Post Day 13 content    ☐ Reply to DMs    ☐ Log metrics     |
+--------------------------------------------------------------+
```

### 29.2 D-002 Mentor Dashboard

```
+--------------------------------------------------------------+
| Pending        | This Week       | Earnings      | Rating    |
| Requests: 3    | Sessions: 5     | Rs 12,500     | ★ 4.7     |
+--------------------------------------------------------------+
| Upcoming Sessions                | Recent Reviews             |
| Mon 10am - Amina (pricing)       | ★★★★★ "Very helpful!"     |
| Tue 2pm  - Sara (content)        | ★★★★☆ "Good advice"       |
+--------------------------------------------------------------+
```

### 29.3 D-003 Cohort Dashboard (Super Admin)

```
+--------------------------------------------------------------+
| Signed Up | Plan Approved | First Post | First Order | Stalled|
| 28        | 22            | 15         | 8           | 5      |
+--------------------------------------------------------------+
| Funnel (bar chart)               | Stalled Businesses         |
| [stages visualization]           | Fatima - no post in 7 days |
|                                  | Hina - tasks overdue       |
|                                  | [View All →]               |
+--------------------------------------------------------------+
```

### 29.4 D-004 System Dashboard (Super Admin)

```
+--------------------------------------------------------------+
| Active Today | Runs Today | Avg Latency | Error Rate          |
| 12 users     | 45         | 3.2s        | 4.4%               |
+--------------------------------------------------------------+
| Runs per Hour (bar chart)        | Top Users by Runs          |
| [24h histogram]                  | 1. amina@... (8 runs)     |
|                                  | 2. sara@...  (6 runs)     |
|                                  | [View Agent Explorer →]   |
+--------------------------------------------------------------+
```

## 30. Visual Form Wireframes

### 30.1 F-003 Onboarding Chat

```
+--------------------------------------------------------------+
| Hunar — Tell us about your business idea               🤖    |
+--------------------------------------------------------------+
| ┌──────────────────────────────────────────────────────────┐ |
| │ 🤖 Assalamu alaikum! Main Hunar hun. Apni business      │ |
| │    idea batayein — kya banana/bechna chahti hain,        │ |
| │    kahan se, aur budget kitna hai?                       │ |
| │                                                          │ |
| │                                                          │ |
| │                          👩 Mujhe ghar pe cake bake      │ |
| │                             karne hain. Gulshan mein     │ |
| │                             rehti hun. Budget 20k.       │ |
| │                                                          │ |
| │ 🤖 Bohut acha! Toh aap home bakery start karna          │ |
| │    chahti hain Gulshan-e-Iqbal se, Rs. 20,000 budget.   │ |
| │    Kuch aur batayein...                                  │ |
| └──────────────────────────────────────────────────────────┘ |
| [Type your message...                              ] [Send]  |
+--------------------------------------------------------------+
| ⏳ Agent is thinking...                                       |
+--------------------------------------------------------------+
```

### 30.2 F-008 Plan Approval Gate

```
+--------------------------------------------------------------+
| Your Business Plan                              [Pending]     |
+--------------------------------------------------------------+
| VALIDATION REPORT                                             |
| Confidence: ★★★★☆ High                                       |
| Competitors: 3 found (Cake Queen, Sweet Dreams, Bake & Take) |
| Gap: "None offer same-day delivery in Gulshan"               |
| [View Full Report]                                            |
+--------------------------------------------------------------+
| PRICING                                                       |
| Product        | Cost     | Price    | Margin  | Break-even  |
| Chocolate Cake | Rs 800   | Rs 1,500 | 47%     | 15 cakes/mo |
| Cupcakes (12)  | Rs 400   | Rs 800   | 50%     | 10 boxes/mo |
+--------------------------------------------------------------+
| LAUNCH PLAN (30 days)                                         |
| Week 1: Setup accounts, first 3 posts, reach out to 10 people|
| Week 2: Start taking orders, post daily, run a small offer   |
| Week 3: ...                                                   |
| Week 4: ...                                                   |
+--------------------------------------------------------------+
| [✅ Approve Plan]  [✏️ Request Changes]                       |
+--------------------------------------------------------------+
```

### 30.3 F-013 Today View

```
+--------------------------------------------------------------+
| Today's Content — Day 12, 7 Oct 2026              [← →]     |
+--------------------------------------------------------------+
| Instagram  |  Reel  |  Social Proof  |  Engagement           |
+--------------------------------------------------------------+
| HOOK                                                 [📋]     |
| "Meri customer ne 3 baar order kiya — woh bhi..."            |
+--------------------------------------------------------------+
| CAPTION                                              [📋]     |
| "Jab koi 3 baar order kare toh samajhlo taste sahi hai!      |
|  Alhamdulillah meri chocolate cake ki demand barh rahi hai.   |
|  Aaj special offer: 2 cakes pe 10% off..."                   |
+--------------------------------------------------------------+
| HASHTAGS                                             [📋]     |
| #HomeBakeryKarachi #CakeLover #GulshanFood #OrderNow         |
| #PakistaniBaker #HomemadeCake #CakeOfTheDay                  |
+--------------------------------------------------------------+
| CTA                                                  [📋]     |
| DM 'CAKE' ya WhatsApp karein 0300-XXXXXXX                    |
+--------------------------------------------------------------+
| IMAGE PROMPT (4:5)                                   [📋]     |
| "A warm overhead shot of a rich chocolate cake with fresh     |
|  strawberries on a rustic wooden board, soft natural light,   |
|  warm brown and cream palette, no text in image"             |
+--------------------------------------------------------------+
| VIDEO PROMPT (9:16, 12s)                             [📋]     |
| Scene 1: Close-up of cake being sliced (3s)                  |
| Scene 2: Customer receiving box, smiling (4s)                |
| Scene 3: "3 baar order!" text overlay (3s)                   |
| Scene 4: Logo + WhatsApp number (2s)                         |
+--------------------------------------------------------------+
| [✅ Mark as Posted]  [✏️ Edit]  [🔄 Regenerate]  [⏭ Skip]   |
| Post URL: [________________________________]                  |
+--------------------------------------------------------------+
| QUICK METRICS                                                 |
| Views [____] Reach [____] Likes [____] Orders [____]  [Save] |
+--------------------------------------------------------------+
```

### 30.4 F-032 Audit Log Viewer (Super Admin)

```
+--------------------------------------------------------------+
| Audit Log                                                     |
+--------------------------------------------------------------+
| Filters:                                                      |
| Actor [________] Action [________] Date [__/__] to [__/__]   |
| [Apply]  [Clear]  [Export CSV]                                |
+--------------------------------------------------------------+
| Time         | Actor          | Action              | Target  |
| 14:32:01     | nimra@...      | auth.login.success   | —      |
| 14:30:15     | amina@...      | content_item.posted  | CI-042 |
| 14:28:03     | system         | agent.run.succeeded  | AR-015 |
| 14:25:44     | nimra@...      | user.created         | usr-09 |
| ...          | ...            | ...                  | ...    |
+--------------------------------------------------------------+
| Page 1 of 12                               [← 1 2 3 ... →]  |
+--------------------------------------------------------------+
```

## 31. Visual Design Rules for Implementation

1. **Tokens only:** All colors, spacing, shadows, radii use shadcn/ui CSS variables. No hard-coded hex values.
2. **Spacing scale:** Tailwind's default scale (4px increments). Consistent padding: `p-4` for cards, `p-6` for page sections.
3. **Component reuse:** Check shadcn/ui registry before building custom components. Wrap shadcn components for project-specific behavior.
4. **Density:** Comfortable (default shadcn spacing). Forms are single-column on mobile, 2-3 columns on desktop.
5. **Iconography:** Lucide icons (bundled with shadcn/ui). Consistent size (16px inline, 20px in buttons, 24px in navigation).
6. **Motion:** Minimal — transitions on route changes (fade 150ms), modal open/close (slide 200ms). No decorative animations.
7. **Copy buttons:** Use `navigator.clipboard.writeText()` with a toast ("Copied!"). Icon-only button with tooltip.

## 32. UI Acceptance Checklist

- [ ] Layout matches §5.1
- [ ] Every field is in §5.3 (no invented fields)
- [ ] Inline validation, actionable error messages
- [ ] Unauthorized actions hidden or disabled; API still enforces
- [ ] Loading, empty, error, unauthorized states present
- [ ] Keyboard navigation complete
- [ ] Responsive on mobile (< 640px)
- [ ] Audit/status panel present where required

## 33. Note on Final UI Design

The visual identity is **provisional**. The information architecture, workflows, and field specifications are final. Only the following may change without a change request:
- Brand colors (CSS variable values)
- Logo
- Illustration style
- Typography weight preferences

Workflow, navigation structure, and field definitions require a change request (§25).

## 34. Mandatory Compliance / Regulatory Integration Requirement

Not applicable — no tax, e-invoicing, GDPR, HIPAA, PCI, or industry-specific regulatory requirements for this contest project. Basic privacy practices (encrypted passwords, no PII in logs, HTTPS) are implemented as security best practices in §14, not as regulatory compliance.

### 34.1 Integration Scope
Not applicable.
### 34.2 Transaction Flow
Not applicable.
### 34.3 Integration Statuses
Not applicable.
### 34.4 Integration Form
Not applicable.
### 34.5 Failure Handling
Not applicable.
### 34.6 Reporting & Reconciliation
Not applicable.
### 34.7 Security Requirements
Not applicable.
### 34.8 Acceptance Criteria
Not applicable.

## 35. Mandatory P0 Compliance Requirement

Not applicable — no compliance requirements block go-live.

## 36. Mandatory Agentic AI Architecture

### 36.1 Agentic AI Product Vision

AI agents automate the hardest parts of starting a home business: market research, pricing analysis, content creation, and ongoing coaching. The entrepreneur provides her idea and context; agents do the research, analysis, and creative work. She retains full control through **three human approval gates** — nothing changes her plan or content without her explicit approval.

**What "good" looks like:**
- An entrepreneur with zero marketing experience gets a professional-quality content calendar in minutes, not weeks.
- Every recommendation is backed by real web research with source URLs — no hallucinated claims.
- The weekly coach adapts the strategy based on actual performance data, not assumptions.
- Every agent decision is traceable by the Super Admin for trust and debugging.

### 36.2 Agentic AI Architecture

```
Entrepreneur → Chat UI → FastAPI → Orchestrator Agent
                                      ↓ (handoffs)
                              Specialist Agents (Intake, Validator, Pricing, etc.)
                                      ↓ (tool calls)
                              Approved Tools (web_search, calc_tools, DB tools)
                                      ↓
                              Service Layer (business logic + validation)
                                      ↓
                              Database (via SQLAlchemy)
```

The AI layer is a **client of the API/service layer**. Agents access data through approved tool functions that enforce permissions and business rules. Agents never run arbitrary SQL or hold database connection strings.

### 36.3 AI Must Not Have Direct Database Authority

The AI layer shall not hold database credentials or run arbitrary SQL. All data access and actions pass through approved tool functions that:
- Enforce the calling user's role and ownership scope.
- Validate inputs with the same Pydantic schemas used by the API.
- Record tool calls in the agent trace (agent_steps).
- Run financial calculations (pricing, break-even) in deterministic Python, not in the LLM.

In the initial build, agents run in-process within the FastAPI application for simplicity, but they access data exclusively through service-layer functions — never through direct ORM queries. This makes future separation trivial.

### 36.4 AI Tool / Function Layer

| Tool | Purpose | Read/Write | Required permission | Approval level |
| --- | --- | --- | --- | --- |
| web_search | Search web for competitors, trends, hashtags via Tavily | Read (external) | authenticated | None (read-only) |
| get_business_profile | Read the entrepreneur's business data | Read | owner | None |
| save_validation_report | Store validation results | Write | system (during agent run) | Auto (part of pipeline) |
| calc_pricing | Compute cost, price, margin, break-even | Read (compute) | system | None (deterministic) |
| save_pricing_result | Store pricing analysis | Write | system | Auto |
| create_plan_tasks | Create launch plan tasks | Write | system | Requires Human Gate 1 |
| save_research_report | Store competitor research | Write | system | Auto |
| save_content_outline | Store content strategy outline | Write | system | Requires Human Gate 2 |
| save_content_items | Store generated content items | Write | system | Auto (QA validates) |
| get_metrics | Read entrepreneur's metrics data | Read | owner | None |
| get_content_performance | Read content performance stats | Read | owner | None |
| propose_changes | Create a proposal for plan/content changes | Write | system | Requires Human Gate 3 |
| match_mentors | Query mentor profiles for matching | Read | authenticated | None |
| generate_mentor_brief | Create session preparation brief | Write | system | Auto |

### 36.5 Specialized Agents

| Agent | Responsibility | Tools it may call | Autonomy level |
| --- | --- | --- | --- |
| Orchestrator | Chat entry, routes to specialists via handoffs, applies input guardrail | handoffs only | L2 (recommend/route) |
| Intake | Extract structured business profile from messy user input | get_business_profile (write) | L3 (draft, user confirms) |
| Idea Validator | Research demand and competitors for the business idea | web_search, save_validation_report | L3 (draft, user reviews) |
| Pricing | Calculate cost-based pricing, margins, break-even | calc_pricing, save_pricing_result | L3 (draft, user approves) |
| Launch Planner | Create 30-day launch plan with dated tasks | create_plan_tasks | L3 (requires Human Gate 1) |
| Competitor & Trend Researcher | Competitor teardown, hashtag research with sources | web_search, save_research_report | L3 (output feeds strategist) |
| Content Strategist | Create 30-day content outline (pillars, themes, format mix) | save_content_outline | L3 (requires Human Gate 2) |
| Content Writer | Generate captions, hooks, CTAs, hashtags per day | save_content_items | L3 (QA validates) |
| Visual Prompt | Create image and video generation prompts per content item | save_content_items (update) | L3 (QA validates) |
| Content QA | Validate content items against schema, tone, and IP rules | none (reads items, flags issues) | L2 (recommend fixes) |
| Mentor Matcher / Brief | Rank mentors by fit; generate session preparation brief | match_mentors, generate_mentor_brief | L2 (recommend, user decides) |
| Weekly Coach | Read metrics, decide adjustments, propose re-plan | get_metrics, get_content_performance, web_search, propose_changes | L3 (requires Human Gate 3) |

### 36.6 AI Autonomy Levels

| Level | Name | Description | Agents at this level |
| --- | --- | --- | --- |
| L1 | Explain | Describes what it sees, no action | — |
| L2 | Recommend | Suggests actions, user or system decides | Orchestrator, Content QA, Mentor Matcher |
| L3 | Draft | Produces output that requires human approval before taking effect | All others (Intake through Weekly Coach) |
| L4 | Act within limits | Not used in v2 | — |
| L5 | Fully autonomous | Not used in v2 | — |

**Promotion criteria:** An agent may be promoted from L3 to L4 only after: (1) 50+ successful runs with < 5% rejection rate, (2) specific approval from Nimra documented as a change request (§25), and (3) clear rollback mechanism.

### 36.7 AI Approval Center

Three human gates, each implemented as a `proposals` row with status=pending:

1. **Gate 1 (F-008):** Plan + pricing approval after onboarding. Blocks task creation.
2. **Gate 2 (F-010):** Content outline approval after strategist. Blocks content generation.
3. **Gate 3 (F-017):** Weekly review approval. Blocks content/plan changes.

Each gate shows:
- What the agent proposes (structured, readable format).
- Why (agent's reasoning, sourced where possible).
- What changes if approved.
- [Approve] and [Reject] buttons.

Rejection records the reason and triggers a re-run with the feedback.

### 36.8 AI Command Center Dashboard

Part of D-004 (Super Admin System Dashboard):
- Agent runs today (total, succeeded, failed, blocked).
- Average latency per workflow type.
- Error rate trend.
- Top errors.
- Kill switch toggle.

### 36.9 AI Agent Activity / Audit Form

F-034 (Agent Run Detail): for each run:
- Who triggered it (user_id, business_id).
- Which workflow (onboarding, content_month, etc.).
- Status and duration.
- Span timeline: a visual tree of agent → generation → tool call → handoff → guardrail, each with start/end time and latency.
- Tool call inputs/outputs (truncated to 1500 chars, secrets redacted).
- Errors at any level.
- Cost estimate (if API provides token counts).

### 36.10 Agent Requirements — Orchestrator

- **Purpose:** Entry point for user chat; routes to specialist agents via handoffs.
- **Input:** User message (text, any language).
- **Output:** Routing decision + final response to user.
- **Tools:** Handoffs to Intake, Validator, Pricing, Launch Planner, Researcher, Weekly Coach.
- **Guardrail:** Input guardrail that blocks off-topic, abusive, and prompt-injection text. Logged as `guardrail.tripped`.
- **Model settings:** temperature=0.2 (low creativity for routing).

### 36.11 Agent Requirements — Intake

- **Purpose:** Extract structured business profile from messy user input.
- **Input:** Conversational text (Roman Urdu, English, or mix).
- **Output:** `BusinessProfile` (Pydantic model): name, niche, city, area, budget_pkr, hours_per_week, tone, languages, platforms, target_customer, products[].
- **Model settings:** temperature=0.1 (extraction, not generation).
- **Validation:** All required fields must be present; niche must be from allowed list; budget > 0.

### 36.12 Agent Requirements — Idea Validator

- **Purpose:** Research demand and competition for the business idea.
- **Input:** BusinessProfile (from Intake).
- **Output:** `ValidationReport`: competitors[] (name, what_they_do_well, gap_we_can_exploit, source_url), how_to_be_better[], confidence (low/medium/high), reasoning.
- **Tools:** `web_search` (2-4 searches: local competitors, market demand, pricing).
- **Model settings:** temperature=0.3.
- **Rule:** Never invent competitor names or URLs. If no results found, say so and lower confidence.

### 36.13 Agent Requirements — Pricing Agent

- **Purpose:** Calculate cost-based pricing, margins, and break-even.
- **Input:** BusinessProfile + products with cost_inputs.
- **Output:** `PricingResult[]`: unit_cost, recommended_price, margin_pct, break_even_units, risk_flags.
- **Tools:** `calc_pricing` (deterministic Python — the LLM does NOT do arithmetic).
- **Rule:** Margins below 20% get a warning. Break-even above 100 units/month gets a risk flag.
- **Model settings:** temperature=0.1.

### 36.14 Agent Requirements — Launch Planner

- **Purpose:** Create a 30-day launch plan with dated, actionable tasks.
- **Input:** BusinessProfile + ValidationReport + PricingResult.
- **Output:** `PlanTask[]`: title, description, due_date, week (1-4), category (setup, content, outreach, operations).
- **Model settings:** temperature=0.3.
- **Rule:** Week 1 focuses on setup; week 2 on first sales; weeks 3-4 on growth. Each week has 5-8 tasks. Tasks are specific and actionable ("Create Instagram business account" not "Set up social media").

### 36.15 Agent Requirements — Competitor & Trend Researcher

- **Purpose:** Deep competitor analysis and hashtag research with source URLs.
- **Input:** BusinessProfile + niche + city.
- **Output:** `CompetitorReport`: competitors[] (3-5), how_to_be_better[], hashtags (broad[], niche[], local[]), confidence, source_urls[], researched_at.
- **Tools:** `web_search` (4-6 searches: competitors, hashtag trends, local market).
- **Model settings:** temperature=0.3.
- **Rule:** Hashtags are labeled as "search-informed suggestions" with date. No "trending" claims without evidence.

### 36.16 Agent Requirements — Content Strategist

- **Purpose:** Create a 30-day content outline based on research.
- **Input:** CompetitorReport + BusinessProfile.
- **Output:** `ContentOutline`: pillars[], weekly_themes[], format_distribution, day_briefs[] (one line each: day, format, pillar, goal, key_idea).
- **Model settings:** temperature=0.5.
- **Rule:** Balance pillars across the month. No more than 3 consecutive days with the same pillar. Mix of formats (Reels for engagement, carousels for education, stories for BTS).

### 36.17 Agent Requirements — Content Writer (batched)

- **Purpose:** Generate full content items from outline briefs.
- **Input:** ContentOutline day_briefs (8 items per batch, 4 batches).
- **Output:** `ContentItem[]`: all fields per §5.3 F-012.
- **Model settings:** temperature=0.7 (creative writing).
- **Rule:** Captions in the language mix specified (Roman Urdu + English default). CTA must include a specific action. Hashtags 5-8 per post, mixing tiers from research.

### 36.18 Agent Guardrails

**Input guardrail (Orchestrator):**
- Block off-topic messages (not business-related).
- Block abusive content.
- Block prompt injection attempts (e.g., "ignore your instructions").
- Log `guardrail.tripped` with the blocked text (truncated) in audit.

**Output guardrail (Content QA):**
- No guaranteed-results claims ("You WILL make Rs 50,000").
- No medical/health claims.
- No fake reviews or testimonials.
- No competitor bashing.
- No celebrity or brand-logo references in image/video prompts.
- No text inside image prompts (generators garble Urdu/English).
- Correct aspect ratio for format (4:5 feed, 9:16 reels/stories).
- Schema validation: all required fields present and valid.
- Duplicate detection: no two days with identical hooks or CTAs.
- Retry: failed items are regenerated once. If still failing, marked `needs_review`.

**Budget guardrails:**
- Per-user daily limits (default: 3 content generations, 5 total agent runs).
- Global concurrent run limit (default: 5, configurable by Super Admin).
- Kill switch: Super Admin can pause all agent runs instantly.

### 36.19 AI Security & Privacy

- Agent prompts and system instructions are not exposed to users. Only Super Admin has access to full agent traces and raw prompts via Agent Explorer.
- Full agent traces (including prompts) are visible only to Super Admin, and only through the Agent Explorer.
- User data in agent contexts is scoped — an agent running for User A never sees User B's data.
- API keys (Gemini, Tavily) are in environment variables, never in code or logs.
- Agent trace data is truncated (1500 chars) and secrets are redacted before storage.

### 36.20 AI Testing Requirements

| Test | What it verifies |
| --- | --- |
| Authorization | Each agent tool function checks caller identity and scope |
| Data isolation | Agent for User A cannot access User B's data |
| Action safety | Write operations require correct human gate status |
| Schema validation | All agent outputs match their Pydantic model |
| Prompt robustness | Input guardrail blocks known injection patterns |
| Deterministic tools | calc_pricing produces correct results for known inputs |
| Trace integrity | Every agent run produces a valid trace with spans in agent_steps |
| Failure handling | Agent failures are caught, logged, and surfaced to user |

### 36.21 AI-Assisted Development of the AI Layer

The agents themselves are built using AI coding assistants, following the protocol in §15. Agent definitions, tools, and pipelines are reviewed by Nimra before deployment. Integration tests run against a mocked LLM (fixture responses) for CI speed, with periodic live Gemini tests during development.

### 36.22 Recommended AI Technology Integration

| Component | Technology | Why |
| --- | --- | --- |
| Agent framework | OpenAI Agents SDK (v0.22.3+) | Traces, handoffs, guardrails, structured output |
| Model provider | Google Gemini 2.5 Flash via OpenAI compatibility endpoint | Free tier, fast, good structured output |
| Model wrapper | `OpenAIChatCompletionsModel` + `AsyncOpenAI(base_url=...)` | Documented approach for third-party providers |
| Tracing | Custom `DbTraceProcessor` replacing default OpenAI exporter | No OpenAI API key needed; traces go to Supabase Postgres |
| Web search | Tavily API | Best for AI agents, structured results, free tier |
| Vector store | Not needed in v2 | No RAG requirements yet; add pgvector if needed |
| Evaluation | Manual review of agent outputs during development | Formal eval sets deferred |

### 36.23 AI Phase Roadmap

| Phase | AI Components |
| --- | --- |
| P0 | `llm.py` (Gemini client), `audit_tracing.py` (DbTraceProcessor), smoke test (tool call + structured output + handoff) |
| P1 | Orchestrator, Intake, Validator, Pricing, Launch Planner, input guardrail, Human Gate 1, SSE progress |
| P2 | Researcher, Normalizer, Strategist, Writer (batched), Visual Prompt, Content QA guardrail, Human Gate 2 |
| P3 | Mentor Matcher, Mentor Brief |
| P4 | Weekly Coach, Human Gate 3 |
| P5 | Polish, demo data, rehearsal |

### 36.24 Agentic AI Acceptance Criteria

- [ ] Orchestrator routes to correct specialist based on user intent
- [ ] Intake extracts all required fields from messy Roman Urdu input
- [ ] Validator produces research with real source URLs (no hallucinated links)
- [ ] Pricing calculates correct margins and break-even (deterministic, tested)
- [ ] Content engine produces 30 valid content items from a single trigger
- [ ] Every content item has all required fields per §5.3
- [ ] Image/video prompts follow QA rules (no people, no logos, no text in images)
- [ ] Hashtags come from web search with date stamps
- [ ] Human gates block downstream actions until approved
- [ ] Agent traces are visible in Super Admin explorer with correct span hierarchy
- [ ] Kill switch immediately stops new agent runs
- [ ] Per-user limits are enforced and configurable

## 37. Updated Master Priority

| Priority | Items |
| --- | --- |
| P0 — Mandatory | Auth (3 roles, JWT, lockout) · User management · Audit log (append-only + viewer) · Agent infrastructure (llm.py, tracing, runner) · Gemini smoke test · Onboarding pipeline (Intake → Validator → Pricing → Launch Planner) · Human Gate 1 · Content Engine (Research → Strategy → Writer → Visual Prompt → QA) · Human Gate 2 · Today View with copy buttons · Manual metrics entry · Agent Explorer (run list + span timeline) · System settings + kill switch |
| P1 — Should have | Mentor Pro Panel (profile, services, availability, booking flow) · Simulated payments · Mentor Matcher + Brief · Mentor approval · Weekly Coach + Human Gate 3 · Super Admin cohort dashboard (cohort funnel, stalled list) · Performance charts · Feature flags · Notifications inbox |
| P2 — Could have | CSV export · Screenshot metrics (vision) · Email/WhatsApp draft reminders · Mentor packages · Availability calendar |
| P3 — Won't (v2) | Auto-posting · Real payments · Real email/SMS · Meta Connect · Native mobile · Multi-language UI · Offline |

## 38. Final Architectural Principle

**The API is the only owner of business logic and data. Every client — browser, AI agent, admin script, future mobile app — is a client of the API. No client holds database credentials or embeds business rules. Every significant action is audited. Every agent decision is traceable.**

---

## Appendix A — Decision log

| Date | Decision | Reason | Alternatives considered |
| --- | --- | --- | --- |
| 2026-09-29 | 3 roles (Program Admin removed) | Program Admin role is redundant for contest scope; Super Admin handles all cohort monitoring and mentor approvals | 4 roles (keeping Program Admin) |
| 2026-09-26 | Profile: Production | Data integrity and audit matter even for a contest | MVP (less security), Prototype (throw-away) |
| 2026-09-26 | Budget: Free tiers only | Solo developer, contest project | Low budget (paid tiers) |
| 2026-09-26 | Single build (no slim/full split) | Simplify development, one codebase | Two builds as originally planned |
| 2026-09-26 | Custom JWT auth (no Supabase Auth) | Full control over roles, token rotation, lockout | Supabase Auth (less control) |
| 2026-09-26 | No Redis | Scale doesn't justify it | Redis for cache/queues |
| 2026-09-26 | SSE over WebSocket | Simpler, sufficient for one-way progress updates | WebSocket (bi-directional) |
| 2026-09-26 | Tavily for web search | Best AI-agent integration, free tier | Serper, Brave |
| 2026-09-26 | Gemini 2.5 Flash | Free tier, fast, good structured output | Gemini Pro (slower/expensive) |
| 2026-09-26 | Simulated payments | Contest scope, no real money needed | Real payment integration |
| 2026-09-26 | Meta Connect cut entirely | Time constraint, product works without it | Feature-flagged Meta Connect |
| 2026-09-26 | In-app notifications only | No email service needed for contest | Resend/Postmark |
| 2026-09-26 | Solo developer (Nimra) | Actual team size | Assumed 2 developers earlier |

## Appendix B — Risks

| ID | Risk | Likelihood | Impact | Mitigation | Owner |
| --- | --- | --- | --- | --- | --- |
| RISK-001 | Scope vs time — too much for 15 days | High | High | Strict P0/P1/P2 priorities; cut from bottom; daily progress checks | Nimra |
| RISK-002 | Gemini quirks (tools + schema, handoffs, quota) | Medium | High | Smoke test on day 1 (P0 exit gate); keep two-step pattern (research then normalize); pin SDK versions | Nimra |
| RISK-003 | Tavily free tier exhaustion (1000/month) | Medium | Medium | Cache research results; limit to 1 research run per business per day; monitor usage | Nimra |
| RISK-004 | Content quality in Roman Urdu | Medium | Medium | Build a golden set of 5 example briefs; eyeball outputs every phase; temperature tuning | Nimra |
| RISK-005 | Hashtag "trending" claims without evidence | Low | Medium | Label as "search-informed suggestions" with date; no "trending" language | Nimra |
| RISK-006 | Supabase free tier limits (500MB, 2 projects) | Low | Medium | Monitor storage; seed data is minimal; agent traces truncated | Nimra |
| RISK-007 | Solo developer burnout over 15-day sprint | Medium | High | Focus on P0 first; skip polish if needed; demo what works | Nimra |
| RISK-008 | OpenAI Agents SDK changes (beta status) | Low | Medium | Pin exact version; keep abstraction layer (llm.py) | Nimra |

## Appendix C — Cost and infrastructure profile

| Service | Tier / plan | Limit that matters | Est. monthly cost |
| --- | --- | --- | --- |
| Supabase | Free | 500 MB database, 2 projects, no backups | $0 |
| Vercel | Hobby | 100 GB bandwidth, 6000 build minutes | $0 |
| FastAPI Cloud | Free tier | Managed HTTPS, autoscaling, built-in Supabase integration; deploy via `uv run fastapi deploy` | $0 |
| Gemini API | Free tier | 15 RPM, 1M tokens/day (subject to change) | $0 |
| Tavily | Free tier | 1,000 searches/month | $0 |
| GitHub Actions | Free (public repo) | 2,000 minutes/month | $0 |
| Docker Hub | Free | Public images only | $0 |
| **Total** | | | **$0/month** |

**Exit ramp at 10x scale:** Move to Supabase Pro ($25/mo), FastAPI Cloud paid tier, Gemini paid tier (~$0.01/1k tokens). Add Redis ($0 on Upstash free tier) if needed. Total: ~$30-50/month.
