# Build Plan

> Generated from `docs/prd/PRD.md` (v0.1.0, profile `production`) by Honey's Spec Harness. This is a living document: edit it freely; the PRD stays the source for scope.

## Core Principle

Full-page UI built with mock data first and verified visually before any logic is written; then functionality is wired step by step. Every feature is visible and testable before the next one starts. No invisible backend phases.

Every task cites its **feature ID** (F-, D-, R-, W-, I-xxx) or PRD section. Never invent a business field that is not in the PRD (PRD §5.3); record a change request first (PRD §25).

## Phase Map

| Phase | Scope | Exit Criteria |
| --- | --- | --- |
| 0 | Foundation (25-26 Sep): Repo structure, Docker Compose, Supabase schema, Alembic migrations, auth (register/login/refresh/logout + 3 roles + user creation paths), audit() helper, llm.py (Gemini client), trace processor (agent_steps), live Gemini smoke test (tool call, structured output, one handoff), Super Admin panel (user management, audit viewer, agent explorer, settings) | A user can register as entrepreneur, login, see empty dashboard. Super Admin can login, manage users, view audit log. A smoke test calls Gemini with a tool and gets a structured response. CI is green. |
| 1 | Onboarding agents (27-29 Sep): Orchestrator + Intake + Validator + Pricing + Launch Planner, approval gate (Human Gate 1), plan dashboard, SSE progress streaming, agent progress overlay | An entrepreneur types a business idea → agents produce validation report, pricing, and launch plan → she approves → plan tasks are visible. Agent run appears in Super Admin's explorer with spans. |
| 2 | Content Engine (30 Sep - 3 Oct): Researcher (Tavily) + Normalizer + Strategist + Writer (4 batches) + Visual Prompt + Content QA, content outline approval (Human Gate 2), content calendar UI, Today View, research report view | Entrepreneur approves plan → content engine generates research, strategy, 30-day calendar → she reviews outline (gate 2) → approves → items appear in calendar → Today View shows today's post with copy buttons → she marks posted. |
| 3 | Mentor Pro Panel (4-5 Oct): Mentor profile, services CRUD, availability, booking flow (request → accept → complete → review), simulated payment, Mentor Matcher agent, Mentor Brief agent, mentor approval by Super Admin | A mentor applies → Super Admin approves → mentor creates a service → entrepreneur browses and books → mentor accepts → brief is generated → session completed → payment released → review left. |
| 4 | Metrics + Coach + Admin (6-7 Oct): Manual metrics entry form, performance charts, Weekly Coach agent (Human Gate 3), Super Admin cohort panel (cohort funnel, stalled list), feature flags, usage stats, notifications inbox | Entrepreneur logs metrics for 3+ days → triggers Weekly Coach → coach proposes changes → she approves → upcoming content updated. Super Admin sees cohort funnel and stalled list. |
| 5 | Polish + Rehearsal (8-9 Oct): Seed data script, demo script rehearsal, bug fixes, README, deployment guide, user manual, final UI polish | Demo script runs end-to-end without errors. All documentation is written. Deployment guide tested on a fresh environment. |

---

## Phase 0 — Foundation

Exit gate: A user can register as entrepreneur, login, see empty dashboard. Super Admin can login, manage users, view audit log. A smoke test calls Gemini with a tool and gets a structured response. CI is green.

Each task: acceptance tests first, then build, then `bash scripts/verify.sh`, then `/review`.

---

### ✅ Task 00 — Architecture Decision Record (DONE)

`docs/adr/0001-stack-decision.md` written during bootstrap. Stack, rationale, and rejected alternatives documented per PRD §3.1.

---

### Task 01 — Repo Scaffold

**What:** Create folder structure per PRD §3.4: `apps/api` (FastAPI + uv), `apps/web` (Next.js 15 + pnpm), `apps/agents/` (placeholder), `infra/` (Docker Compose for local Postgres 16), `packages/api-client/` (placeholder). Initialize package managers. Create `.env.example` with all required env vars. Create root `pnpm-workspace.yaml`.

**Acceptance tests:**
- Infra — `docker compose -f infra/docker-compose.yml config` validates without error (§3.4)
- API — `uv run python -c "from app.main import app; print(app.title)"` prints the app name in `apps/api/` (§3.4)
- Web — `pnpm --filter @hunar/web build` succeeds (§3.4)
- Structure — All directories exist: `apps/api/app/{auth,routes,services,models,schemas,agents,core}`, `apps/web/app/`, `packages/api-client/`, `infra/`, `apps/agents/`
- Env — `.env.example` contains: `DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`, `TAVILY_API_KEY`, `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`

**Build steps:**
1. Create `apps/api/pyproject.toml` with uv, all deps (fastapi, uvicorn, sqlalchemy[asyncio], alembic, pydantic, pydantic-settings, asyncpg, argon2-cffi, pyjwt, structlog, httpx, openai-agents, python-multipart; dev: pytest, pytest-asyncio, pytest-cov, ruff, mypy)
2. Create `apps/api/app/main.py` (FastAPI skeleton with lifespan, health endpoint at `/api/v1/health`)
3. Create `apps/api/app/__init__.py` and all sub-package `__init__.py` files (auth, routes, services, models, schemas, agents, core)
4. Create `apps/web/` via `pnpm create next-app` with TypeScript, Tailwind, App Router, ESLint
5. Create `apps/agents/.gitkeep`
6. Create `infra/docker-compose.yml` (Postgres 16, port 5432, volume for data, healthcheck)
7. Create `infra/docker-compose.ci.yml` (Postgres 16, no volume, for CI)
8. Create `packages/api-client/package.json` placeholder with name `@hunar/api-client`
9. Create root `pnpm-workspace.yaml` (packages: `apps/web`, `packages/*`)
10. Create `.env.example` with all required keys (empty values)
11. Create root `README.md` with project intro and quick-start
12. Run acceptance tests. `scripts/verify.sh` passes.

---

### ✅ Task 02 — CI/CD + Verification (DONE)

GitHub Actions workflows (`api.yml`, `api-db.yml`, `web.yml`, `contract.yml`, `infra.yml`, `security.yml`, `e2e.yml`) and `scripts/verify.sh` with 5 lanes created during bootstrap. Git hooks installed.

---

### Task 03 — Database Foundation

**What:** Set up PostgreSQL 16 connection via SQLAlchemy 2 async. Configure Alembic. Write first migration creating core tables: `users`, `refresh_tokens`, `programs`, `audit_logs`, `agent_runs`, `agent_steps`. Follow naming/key conventions from PRD §12.2. Add `audit_logs_immutable()` trigger.

**Acceptance tests:**
- Integration — Alembic `upgrade head` against Docker Postgres creates all 6 tables with correct columns and constraints (§12.2)
- Integration — Alembic `downgrade base` then `upgrade head` round-trips without error (§12.4)
- Unit — `alembic check` passes (no model/migration drift) (§12.4)
- Integration — `audit_logs` trigger blocks UPDATE and DELETE (§14.1)
- Integration — `users.role` CHECK constraint accepts only `entrepreneur`, `mentor`, `super_admin` (§12.3)
- Integration — `users.email` has UNIQUE constraint (§12.3)
- Unit — UUID primary keys use `gen_random_uuid()` for main entities; `bigserial` for `audit_logs` and `agent_steps` (§12.2)

**Build steps:**
1. Write acceptance tests (pytest fixtures with Docker Postgres via `docker compose -f infra/docker-compose.ci.yml up`)
2. Create `apps/api/app/core/config.py` — Pydantic Settings loading `DATABASE_URL` from env
3. Create `apps/api/app/core/database.py` — async engine, async session factory, `get_db` dependency
4. Create `apps/api/app/models/base.py` — declarative base with common columns (id, created_at, updated_at)
5. Create `apps/api/app/models/user.py` — `users` and `refresh_tokens` tables per §12.3
6. Create `apps/api/app/models/program.py` — `programs` table
7. Create `apps/api/app/models/audit.py` — `audit_logs` table (append-only) per §12.3
8. Create `apps/api/app/models/agent.py` — `agent_runs` and `agent_steps` tables per §12.3
9. Init Alembic: `alembic init migrations`, configure `env.py` for async
10. Generate first migration: `alembic revision --autogenerate -m "initial_schema"`
11. Add `audit_logs_immutable()` trigger in migration (raw SQL for trigger function)
12. Run acceptance tests. `scripts/verify.sh --lane api-db` passes.

---

### Task 04 — Authentication & Authorization

**What:** Implement JWT auth: register (F-001 fields), login, token refresh, logout. Argon2 password hashing. Short-lived access token (15min) + rotating httpOnly refresh token (7d) with family revocation. `require_role()` FastAPI dependency for authorization. Account lockout after 5 failed attempts (15-min cooldown). PRD §14.2 permission matrix enforced.

**Acceptance tests:**
- Integration — POST `/api/v1/auth/register` with valid data creates user with role=entrepreneur, status=active, password hashed with argon2 (F-001, §14)
- Integration — POST `/api/v1/auth/register` with duplicate email returns 409 (F-001)
- Integration — POST `/api/v1/auth/register` with valid `invite_code` links user to program (F-001)
- Integration — POST `/api/v1/auth/login` with correct credentials returns access token + sets httpOnly refresh cookie (F-002, §14)
- Integration — POST `/api/v1/auth/login` with wrong password increments `failed_login_count`; after 5 failures, account locked for 15 min (§14)
- Integration — POST `/api/v1/auth/refresh` with valid refresh token rotates token (new token pair, old revoked) (§14)
- Integration — POST `/api/v1/auth/refresh` with revoked/reused refresh token revokes entire family (§14)
- Integration — POST `/api/v1/auth/logout` revokes refresh token (§14)
- Integration — GET `/api/v1/auth/me` returns current user profile (§13.2)
- Integration — `require_role('super_admin')` on an endpoint rejects entrepreneur with 403 (§14.2)
- Integration — `require_role('entrepreneur')` on an endpoint rejects unauthenticated with 401 (§14.2)

**Build steps:**
1. Write acceptance tests (all should fail initially)
2. Create `apps/api/app/auth/password.py` — argon2 hash/verify functions
3. Create `apps/api/app/auth/jwt.py` — create_access_token, create_refresh_token, decode_token
4. Create `apps/api/app/auth/dependencies.py` — `get_current_user`, `require_role(*roles)` FastAPI dependencies
5. Create `apps/api/app/schemas/auth.py` — RegisterRequest, LoginRequest, TokenResponse, UserResponse (Pydantic)
6. Create `apps/api/app/services/auth.py` — register_user, authenticate, refresh_tokens, logout, lockout logic
7. Create `apps/api/app/routes/auth.py` — `/api/v1/auth/*` endpoints (register, login, refresh, logout, me)
8. Wire auth router into `main.py`
9. Run acceptance tests. `scripts/verify.sh --lane api` passes.

---

### Task 05 — Audit Infrastructure

**What:** Create `audit()` helper function that writes append-only audit rows for all actions in PRD §14.1. Mask sensitive fields (emails, phones) in `meta`. Wire audit calls into auth service (login success/fail, lockout, logout, refresh reuse). Test that each audited action writes a row.

**Acceptance tests:**
- Integration — Successful login writes `auth.login.success` audit row with actor_id, ip, user_agent (§14.1)
- Integration — Failed login writes `auth.login.failed` audit row (§14.1)
- Integration — Account lockout writes `auth.locked` audit row (§14.1)
- Integration — Logout writes `auth.logout` audit row (§14.1)
- Integration — Refresh token reuse writes `auth.refresh.reuse_detected` audit row (§14.1)
- Integration — User creation writes `user.created` audit row with before=null, after=user_data (§14.1)
- Unit — `audit()` helper masks email addresses in `meta` field (§14.1)
- Unit — `audit()` helper never stores passwords or tokens in any field (§14.1)
- Integration — UPDATE on `audit_logs` raises error (trigger enforcement) (§14.1)
- Integration — DELETE on `audit_logs` raises error (trigger enforcement) (§14.1)

**Build steps:**
1. Write acceptance tests
2. Create `apps/api/app/core/audit.py` — `audit()` async function: accepts action, actor, target, before/after, meta; masks sensitive fields; inserts into audit_logs
3. Create `apps/api/app/core/middleware.py` — request_id middleware (X-Request-Id header, correlation ID)
4. Wire audit calls into `services/auth.py` for all auth actions
5. Run acceptance tests. `scripts/verify.sh --lane api` passes.

---

### Task 06 — API Conventions + Contract

**What:** Establish API conventions per §13.1: versioned base path `/api/v1`, RFC 7807 error format, pagination (`?page=1&page_size=20`), correlation ID (`X-Request-Id`). Configure OpenAPI generation. Set up `packages/api-client` with openapi-typescript codegen. Add contract drift check to `verify.sh`.

**Acceptance tests:**
- Integration — Error responses follow RFC 7807 format: `{type, title, status, detail, instance, errors}` (§13.1)
- Integration — All responses include `X-Request-Id` header (§13.1)
- Integration — Paginated endpoints return `{items, total, page, page_size}` (§13.1)
- Integration — OpenAPI spec served at `/api/v1/openapi.json` (§13.1)
- Unit — Generated TypeScript client compiles without errors (§3.1)
- Infra — `verify.sh --lane contract` passes (no drift between API and client) (AGENTS.md)

**Build steps:**
1. Write acceptance tests
2. Create `apps/api/app/core/errors.py` — global exception handler returning RFC 7807 format
3. Create `apps/api/app/schemas/common.py` — PaginatedResponse, ErrorResponse, pagination dependency
4. Update middleware to inject X-Request-Id on all responses
5. Set up `packages/api-client/package.json` with openapi-typescript-codegen dependency
6. Create `packages/api-client/scripts/generate.sh` — fetches OpenAPI spec, generates TypeScript client
7. Generate initial client from current OpenAPI spec
8. Run acceptance tests. `scripts/verify.sh --lane contract` passes.

---

### Task 07 — UI Foundation

**What:** Set up shadcn/ui in `apps/web`. Configure Tailwind v4 design tokens from `context/ui-tokens.md`. Create layout shell (sidebar nav for desktop, bottom nav for mobile, role-aware menu). Create reusable components: DataTable, FormField, StatusBadge, LoadingState, EmptyState, ErrorState. Follow PRD §5.1 form layout. Update `context/ui-registry.md`.

**Acceptance tests:**
- Component — Layout shell renders sidebar with correct menu items for each role (§4, §14.2)
- Component — DataTable renders columns, handles loading/empty/error states (§32)
- Component — FormField renders label, input, validation error with correct spacing (§5.1)
- Component — StatusBadge renders correct color for each status (§ui-tokens.md)
- Component — Page layouts are responsive: sidebar on desktop (≥1024px), bottom nav on mobile (<1024px) (§5.1)
- Component — All components use shadcn/ui CSS variables, no hard-coded colors (§31)

**Build steps:**
1. Write component tests (Vitest + React Testing Library)
2. Init shadcn/ui: `pnpm dlx shadcn@latest init`
3. Configure Tailwind v4 tokens per `context/ui-tokens.md`
4. Install base shadcn components: Button, Input, Label, Card, Badge, Table, Dialog, Sheet, Toast, Skeleton
5. Create layout shell: `app/layout.tsx` → `components/layout/AppShell.tsx` (sidebar + header + main)
6. Create `components/layout/Sidebar.tsx` — role-aware navigation menu
7. Create `components/ui/DataTable.tsx` — wrapper around TanStack Table with loading/empty/error states
8. Create `components/ui/FormField.tsx` — React Hook Form + Zod wrapper
9. Create `components/ui/StatusBadge.tsx` — maps status → color per ui-tokens
10. Create `components/ui/LoadingState.tsx`, `EmptyState.tsx`, `ErrorState.tsx`
11. Create `lib/format.ts` — currency (PKR), date, quantity formatters
12. Create `lib/permissions.ts` — `can(module, screen, action)` helper
13. Update `context/ui-registry.md` with all new components
14. Run component tests. `scripts/verify.sh --lane web` passes.

---

### Task 08 — Agent Service Skeleton

**What:** Create the agent infrastructure: `llm.py` (Gemini client via OpenAI compatibility endpoint), `DbTraceProcessor` (custom trace processor storing spans in `agent_steps`), agent runner with semaphore (max 5 concurrent runs). Agents run in-process within FastAPI but access data only through service-layer functions (§36.2-36.4). No actual agents yet — just the framework.

**Acceptance tests:**
- Unit — `llm.py` creates an `AsyncOpenAI` client pointed at Gemini's base URL with API key from env (§36.22)
- Unit — `DbTraceProcessor` writes spans to `agent_steps` table with trace_id, span_id, parent_id, span_type, timestamps, data (§36.9)
- Unit — `DbTraceProcessor` truncates `data` field to 1500 chars and redacts API keys (§36.19)
- Integration — Agent runner creates `agent_runs` row with status transitions: queued → running → succeeded/failed (§12.3)
- Integration — Agent runner enforces semaphore: 6th concurrent run gets status=queued (§36.18)
- Unit — Tool catalog structure exists with type hints for all tool functions (§36.4)

**Build steps:**
1. Write acceptance tests
2. Create `apps/api/app/agents/llm.py` — `get_model()` returning `OpenAIChatCompletionsModel` configured for Gemini
3. Create `apps/api/app/agents/tracing.py` — `DbTraceProcessor` implementing trace export to `agent_steps`
4. Create `apps/api/app/agents/runner.py` — `run_agent()` with semaphore, status tracking in `agent_runs`
5. Create `apps/api/app/agents/tools/__init__.py` — tool catalog structure (empty implementations)
6. Create `apps/api/app/agents/config.py` — agent settings (max concurrent, per-user limits)
7. Run acceptance tests. `scripts/verify.sh --lane api` passes.

---

### Task 09 — Vertical Slice

**What:** The smallest end-to-end feature proving the pattern: health check API → generated TypeScript client → Next.js page that calls the API and displays the response. Proves: API serves OpenAPI → client is generated → frontend calls the API → CORS works → everything wires together.

**Acceptance tests:**
- E2E — `GET /api/v1/health` returns `{"status": "ok", "version": "0.1.0"}` (§13.2)
- E2E — Generated TypeScript client has a `health` function that calls the endpoint
- E2E — Next.js page at `/` calls the health endpoint and displays the status
- Integration — CORS allows requests from `http://localhost:3000` to `http://localhost:8000`

**Build steps:**
1. Write acceptance tests
2. Add health endpoint to `apps/api/app/routes/health.py`
3. Regenerate TypeScript client
4. Create `apps/web/app/page.tsx` — calls health endpoint, displays result
5. Configure CORS in `apps/api/app/main.py`
6. Test end-to-end with Docker Compose running Postgres + API + Web
7. Run acceptance tests. `scripts/verify.sh` passes.

---

### Task 10 — Signup (F-001)

**What:** Entrepreneur signup form (frontend) wired to `POST /api/v1/auth/register`. Fields per F-001: name, email, password, confirm_password, language, invite_code. Zod validation mirrors backend. Success → redirect to login. Error → inline validation messages.

**Acceptance tests:**
- E2E — User fills signup form with valid data → account created → redirected to login page (F-001)
- Component — Form validates: name 2-100 chars, valid email, password min 8 chars + 1 uppercase + 1 digit, confirm matches (F-001)
- Component — Form shows inline error for duplicate email (409 from API) (F-001)
- Component — invite_code field is optional; if filled, validates against API (F-001)
- Integration — API rejects invalid input with RFC 7807 error (§13.1)
- Integration — `user.created` audit row written on successful signup (§14.1)

**Build steps:**
1. Write acceptance tests (E2E with Playwright, component with Vitest)
2. Create `apps/web/app/(auth)/signup/page.tsx` — signup form with React Hook Form + Zod
3. Create `apps/web/lib/schemas/auth.ts` — Zod schemas for signup validation
4. Wire form to generated API client `POST /api/v1/auth/register`
5. Handle success (redirect) and error (inline messages) states
6. Run acceptance tests. `scripts/verify.sh` passes.

---

### Task 11 — Login (F-002)

**What:** Login form (frontend) wired to `POST /api/v1/auth/login`. Fields per F-002: email, password. Success → redirect to role-based dashboard. Error → inline message. Handle locked account state. Token stored in httpOnly cookie (set by API).

**Acceptance tests:**
- E2E — User fills login form with valid credentials → token set → redirected to dashboard (F-002)
- E2E — Login with wrong password → inline error "Invalid email or password" (F-002)
- E2E — Login with locked account → inline error "Account locked, try again in X minutes" (F-002, §14)
- Component — Form validates: valid email, non-empty password (F-002)
- Integration — `auth.login.success` audit row on successful login (§14.1)
- Integration — `auth.login.failed` audit row on failed login (§14.1)
- E2E — After login, entrepreneur sees `/dashboard`, super_admin sees `/admin` (§14.2)

**Build steps:**
1. Write acceptance tests
2. Create `apps/web/app/(auth)/login/page.tsx` — login form
3. Create auth context/provider for managing logged-in state
4. Create `apps/web/middleware.ts` — Next.js middleware for route protection (redirect unauthenticated to /login, redirect by role)
5. Create `apps/web/app/(dashboard)/layout.tsx` — authenticated layout using AppShell
6. Create `apps/web/app/(dashboard)/page.tsx` — empty entrepreneur dashboard placeholder
7. Create `apps/web/app/(admin)/layout.tsx` — admin layout
8. Create `apps/web/app/(admin)/page.tsx` — empty admin dashboard placeholder
9. Run acceptance tests. `scripts/verify.sh` passes.

---

### Task 12 — User Management (F-031)

**What:** Super Admin user list + create/edit. API: `GET /api/v1/admin/users` (paginated, filterable by role/status), `POST /api/v1/admin/users` (create with temporary password), `PATCH /api/v1/admin/users/{id}` (suspend/reactivate/change role), `POST /api/v1/admin/users/{id}/reset-password`. Frontend: DataTable with filters, create modal, edit drawer. Fields per F-031: name, email, role, program_id, status.

**Acceptance tests:**
- Integration — `GET /api/v1/admin/users` returns paginated user list, super_admin only (F-031, §14.2)
- Integration — `GET /api/v1/admin/users` rejects entrepreneur with 403 (§14.2)
- Integration — `POST /api/v1/admin/users` creates user with role, temporary password, `force_password_change=true` (F-031)
- Integration — `PATCH /api/v1/admin/users/{id}` can suspend/reactivate user; writes `user.suspended`/`user.reactivated` audit row (F-031, §14.1)
- Integration — `PATCH /api/v1/admin/users/{id}` can change role; writes `user.role_changed` audit row with before/after (F-031, §14.1)
- Integration — `POST /api/v1/admin/users/{id}/reset-password` generates new temporary password (F-031)
- Component — User list table shows name, email, role, status, created_at with sorting and filtering (F-031)
- Component — Create user modal validates required fields (F-031)

**Build steps:**
1. Write acceptance tests
2. Create `apps/api/app/schemas/user.py` — UserListResponse, CreateUserRequest, UpdateUserRequest
3. Create `apps/api/app/services/user.py` — list_users, create_user, update_user, reset_password
4. Create `apps/api/app/routes/admin.py` — `/api/v1/admin/users/*` endpoints with `require_role('super_admin')`
5. Regenerate TypeScript client
6. Create `apps/web/app/(admin)/users/page.tsx` — user management page with DataTable
7. Create `apps/web/app/(admin)/users/components/CreateUserDialog.tsx`
8. Create `apps/web/app/(admin)/users/components/EditUserDrawer.tsx`
9. Run acceptance tests. `scripts/verify.sh` passes.

---

### Task 13 — Audit Log Viewer (F-032)

**What:** Super Admin audit log viewer. API: `GET /api/v1/admin/audit` (paginated, filterable by actor, action, date range). Frontend: DataTable per wireframe §30.4 with filters and CSV export. Columns: time, actor, action, target.

**Acceptance tests:**
- Integration — `GET /api/v1/admin/audit` returns paginated audit log, super_admin only (F-032, §14.2)
- Integration — `GET /api/v1/admin/audit` rejects non-super_admin with 403 (§14.2)
- Integration — Filter by action works: `?action=auth.login.success` returns only matching rows (F-032)
- Integration — Filter by date range works: `?from=2026-09-01&to=2026-09-30` (F-032)
- Integration — Filter by actor works: `?actor_id={uuid}` (F-032)
- Component — Audit table renders time, actor, action, target columns per wireframe §30.4
- Component — Export CSV downloads filtered results (F-032)
- Integration — Accessing audit viewer writes `audit.exported` audit row (§14.1)

**Build steps:**
1. Write acceptance tests
2. Create `apps/api/app/schemas/audit.py` — AuditLogResponse, AuditLogFilter
3. Create `apps/api/app/services/audit.py` — list_audit_logs with filters, export_csv
4. Add audit endpoints to `apps/api/app/routes/admin.py`
5. Regenerate TypeScript client
6. Create `apps/web/app/(admin)/audit/page.tsx` — audit log viewer with filters + DataTable
7. Run acceptance tests. `scripts/verify.sh` passes.

---

### Task 14 — Agent Run Explorer (F-033)

**What:** Super Admin agent run list. API: `GET /api/v1/admin/runs` (paginated, filterable by workflow, status, user). Frontend: DataTable showing trace_id, workflow, user, status, duration, started_at. Click row → Agent Run Detail (Task 15).

**Acceptance tests:**
- Integration — `GET /api/v1/admin/runs` returns paginated agent runs, super_admin only (F-033, §14.2)
- Integration — `GET /api/v1/admin/runs` rejects non-super_admin with 403 (§14.2)
- Integration — Filter by workflow: `?workflow=onboarding` (F-033)
- Integration — Filter by status: `?status=failed` (F-033)
- Component — Run table renders workflow, user, status (with StatusBadge), duration, started_at (F-033)
- Component — Clicking a row navigates to `/admin/runs/{id}` (F-033 → F-034)

**Build steps:**
1. Write acceptance tests
2. Create `apps/api/app/schemas/agent.py` — AgentRunListResponse, AgentRunFilter
3. Create `apps/api/app/services/agent_admin.py` — list_runs with filters
4. Add agent run endpoints to `apps/api/app/routes/admin.py`
5. Regenerate TypeScript client
6. Create `apps/web/app/(admin)/runs/page.tsx` — agent run explorer with DataTable
7. Run acceptance tests. `scripts/verify.sh` passes.

---

### Task 15 — Agent Run Detail (F-034)

**What:** Super Admin agent run detail view with span timeline. API: `GET /api/v1/admin/runs/{id}` returns run + all spans. Frontend: header with run metadata, visual span timeline tree showing agent → generation → function → handoff → guardrail hierarchy with timing. Per §36.9: who triggered, workflow, status, duration, span tree, tool inputs/outputs (truncated), errors, cost estimate.

**Acceptance tests:**
- Integration — `GET /api/v1/admin/runs/{id}` returns run with nested spans ordered by started_at (F-034, §36.9)
- Integration — `GET /api/v1/admin/runs/{id}` rejects non-super_admin with 403 (§14.2)
- Integration — Span data is truncated to 1500 chars, secrets redacted (§36.19)
- Component — Run header shows: user, workflow, status, duration, started_at, ended_at (F-034)
- Component — Span timeline renders tree hierarchy: parent spans contain child spans (F-034)
- Component — Each span shows: type (icon), name, duration bar, status (F-034)
- Component — Clicking a span shows tool inputs/outputs in a detail panel (F-034)

**Build steps:**
1. Write acceptance tests
2. Create `apps/api/app/schemas/agent.py` — AgentRunDetailResponse, SpanResponse (add to existing)
3. Create `apps/api/app/services/agent_admin.py` — get_run_detail with spans (add to existing)
4. Add run detail endpoint to `apps/api/app/routes/admin.py`
5. Regenerate TypeScript client
6. Create `apps/web/app/(admin)/runs/[id]/page.tsx` — run detail page
7. Create `apps/web/components/agent/SpanTimeline.tsx` — visual span tree
8. Create `apps/web/components/agent/SpanDetail.tsx` — tool input/output panel
9. Run acceptance tests. `scripts/verify.sh` passes.

---

### Task 16 — System Settings (F-035)

**What:** Super Admin settings page. API: `GET /api/v1/admin/settings` and `PATCH /api/v1/admin/settings`. Settings stored in `settings` table (key-value). Initial settings: `agent_max_concurrent` (default 5), `agent_per_user_daily_limit` (default 5), `agent_kill_switch` (default false), `rate_limit_per_minute` (default 100). Kill switch toggle at `POST /api/v1/admin/kill-switch`. All changes audited.

**Acceptance tests:**
- Integration — `GET /api/v1/admin/settings` returns all settings, super_admin only (F-035, §14.2)
- Integration — `PATCH /api/v1/admin/settings` updates settings and writes `settings.changed` audit row with before/after (F-035, §14.1)
- Integration — `POST /api/v1/admin/kill-switch` toggles agent kill switch and writes `kill_switch.toggled` audit row (§14.1, §36.18)
- Integration — Non-super_admin gets 403 on all settings endpoints (§14.2)
- Component — Settings form shows current values, saves on submit (F-035)
- Component — Kill switch is a prominent toggle with confirmation dialog (F-035)

**Build steps:**
1. Write acceptance tests
2. Create Alembic migration for `settings` table (key text PK, value jsonb, updated_at)
3. Create `apps/api/app/models/settings.py` — Settings model
4. Create `apps/api/app/schemas/settings.py` — SettingsResponse, UpdateSettingsRequest
5. Create `apps/api/app/services/settings.py` — get_settings, update_settings, toggle_kill_switch
6. Add settings endpoints to `apps/api/app/routes/admin.py`
7. Regenerate TypeScript client
8. Create `apps/web/app/(admin)/settings/page.tsx` — settings form with kill switch toggle
9. Run acceptance tests. `scripts/verify.sh` passes.

---

### Task 17 — Change Password (F-039)

**What:** Authenticated users can change their own password. API: `POST /api/v1/auth/change-password` (requires current_password + new_password). Also handles `force_password_change` flow for admin-created accounts. Frontend: change password form accessible from user menu.

**Acceptance tests:**
- Integration — `POST /api/v1/auth/change-password` with correct current password changes password and writes `auth.password.changed` audit row (F-039, §14.1)
- Integration — `POST /api/v1/auth/change-password` with wrong current password returns 401 (F-039)
- Integration — New password must meet requirements: min 8 chars, 1 uppercase, 1 digit (F-001 rules apply)
- Integration — After change, old refresh tokens are revoked (security) (§14)
- Integration — Users with `force_password_change=true` are redirected to change password page on login (F-039)
- Component — Change password form validates: current password required, new password meets rules, confirm matches (F-039)

**Build steps:**
1. Write acceptance tests
2. Add `change_password` to `apps/api/app/services/auth.py`
3. Add change-password endpoint to `apps/api/app/routes/auth.py`
4. Regenerate TypeScript client
5. Create `apps/web/app/(dashboard)/change-password/page.tsx` — change password form
6. Update auth middleware to redirect `force_password_change` users
7. Run acceptance tests. `scripts/verify.sh` passes.

---

### Task 18 — Integration: Gemini API (I-001)

**What:** Live smoke test proving Gemini 2.5 Flash works via OpenAI Agents SDK. Test 3 capabilities: (1) tool call — agent calls a function and gets result, (2) structured output — agent returns a Pydantic model, (3) handoff — one agent hands off to another. This resolves Q-004 (handoff behavior). Requires `GEMINI_API_KEY` env var.

**Acceptance tests:**
- Integration — Agent with a simple tool (e.g., `add(a, b)`) calls the tool and returns correct result via Gemini (I-001, §36.22)
- Integration — Agent with `output_type=SomeModel` returns valid structured output matching the Pydantic model (I-001, §36.22)
- Integration — Agent A hands off to Agent B; Agent B responds; trace shows both agents (I-001, §36.22, Q-004)
- Integration — `DbTraceProcessor` records all spans from the smoke test in `agent_steps` (§36.9)
- Integration — Failed API call (invalid key) is caught and logged, not crashed (I-001)
- Unit — `llm.py` retries 3x with exponential backoff on transient failures (I-001)

**Build steps:**
1. Write acceptance tests (mark as `@pytest.mark.live` — skipped in CI, run manually with real API key)
2. Implement retry logic in `apps/api/app/agents/llm.py`
3. Create `apps/api/tests/agents/test_gemini_smoke.py` — the 3 smoke tests
4. Run with real `GEMINI_API_KEY` to verify
5. Document Q-004 answer in `context/progress-tracker.md`
6. Run acceptance tests. `scripts/verify.sh --lane api` passes (live tests skipped in CI).

---

## Phase 1 — Onboarding agents (27-29 Sep): Orchestrator + Intake + Validator + Pricing + Launch Planner, approval gate (Human Gate 1), plan dashboard, SSE progress streaming, agent progress overlay

Exit gate: [x] COMPLETED & VERIFIED (`test_phase1_exit_gate.py`)
An entrepreneur types a business idea → agents produce validation report, pricing, and launch plan → she approves → plan tasks are visible. Agent run appears in Super Admin's explorer with spans.

- [x] 19 Onboarding Chat — F-003 (Onboarding; transaction; P0; roles: Entrepreneur)
- [x] 20 Business Profile View — F-004 (Business; master; P0; roles: Entrepreneur)
- [x] 21 Product Editor — F-005 (Business; master; P0; roles: Entrepreneur)
- [x] 22 Validation Report View — F-006 (Business; report; P0; roles: Entrepreneur)
- [x] 23 Pricing & Break-even View — F-007 (Business; report; P0; roles: Entrepreneur)
- [x] 24 Plan Approval Gate — F-008 (Onboarding; transaction; P0; roles: Entrepreneur)
- [x] 25 Launch Plan / Tasks — F-009 (Plan; list; P0; roles: Entrepreneur)
- [x] 26 Agent Progress (SSE overlay) — F-042 (System; report; P0; roles: Entrepreneur)

Each task: acceptance tests first (`/architect`), then build, then `bash scripts/verify.sh`, then `/review`.

## Phase 2 — Content Engine (30 Sep - 3 Oct): Researcher (Tavily) + Normalizer + Strategist + Writer (4 batches) + Visual Prompt + Content QA, content outline approval (Human Gate 2), content calendar UI, Today View, research report view

Exit gate: Entrepreneur approves plan → content engine generates research, strategy, 30-day calendar → she reviews outline (gate 2) → approves → items appear in calendar → Today View shows today's post with copy buttons → she marks posted.

- [ ] 27 Content Outline Approval — F-010 (Content; transaction; P0; roles: Entrepreneur)
- [ ] 28 Content Calendar (month view) — F-011 (Content; list; P0; roles: Entrepreneur)
- [ ] 29 Content Item Detail / Editor — F-012 (Content; master; P0; roles: Entrepreneur)
- [ ] 30 Today View — F-013 (Content; list; P0; roles: Entrepreneur)
- [ ] 31 Research Report View — F-014 (Content; report; P0; roles: Entrepreneur)
- [ ] 32 Entrepreneur Home dashboard — D-001 (role: Entrepreneur; KPIs: Tasks completed this week, Posts published, Engagement trend (likes+comments), Revenue this week (PKR))
- [ ] 33 Integration: Tavily Search API — I-002 (Outbound; HTTPS REST)

Each task: acceptance tests first (`/architect`), then build, then `bash scripts/verify.sh`, then `/review`.

## Phase 3 — Mentor Pro Panel (4-5 Oct): Mentor profile, services CRUD, availability, booking flow (request → accept → complete → review), simulated payment, Mentor Matcher agent, Mentor Brief agent, mentor approval by Super Admin

Exit gate: A mentor applies → Super Admin approves → mentor creates a service → entrepreneur browses and books → mentor accepts → brief is generated → session completed → payment released → review left.

- [x] 34 Browse Mentor Services — F-018 (Mentor; list; P1; roles: Entrepreneur)
- [x] 35 Book a Service — F-019 (Mentor; transaction; P1; roles: Entrepreneur)
- [x] 36 My Bookings — F-020 (Mentor; list; P1; roles: Entrepreneur)
- [x] 37 Mentor Profile Editor — F-021 (Mentor; master; P1; roles: Mentor)
- [x] 38 Service CRUD — F-022 (Mentor; master; P1; roles: Mentor)
- [x] 39 Availability Editor — F-023 (Mentor; master; P1; roles: Mentor)
- [x] 40 Mentor Dashboard — F-024 (Mentor; list; P1; roles: Mentor)
- [x] 41 Mentee View (brief + progress) — F-025 (Mentor; report; P1; roles: Mentor)
- [x] 42 Earnings View — F-026 (Mentor; report; P1; roles: Mentor)
- [x] 43 Session Notes — F-027 (Mentor; master; P1; roles: Mentor)
- [x] 44 Mentor Approval — F-030 (Program; transaction; P1; roles: Super Admin)
- [x] 45 Mentor Application — F-040 (Auth; master; P1; roles: public)
- [x] 46 Review Form — F-041 (Mentor; master; P1; roles: Entrepreneur)
- [x] 47 Mentor Dashboard dashboard — D-002 (role: Mentor; KPIs: Pending requests, Upcoming sessions this week, Total earnings (simulated), Average rating)

Each task: acceptance tests first (`/architect`), then build, then `bash scripts/verify.sh`, then `/review`.

## Phase 4 — Metrics + Coach + Admin (6-7 Oct): Manual metrics entry form, performance charts, Weekly Coach agent (Human Gate 3), Super Admin cohort panel (cohort funnel, stalled list), feature flags, usage stats, notifications inbox

Exit gate: Entrepreneur logs metrics for 3+ days → triggers Weekly Coach → coach proposes changes → she approves → upcoming content updated. Super Admin sees cohort funnel and stalled list.

- [x] 48 Metrics Entry Form — F-015 (Metrics; master; P0; roles: Entrepreneur)
- [x] 49 Performance Charts — F-016 (Metrics; report; P1; roles: Entrepreneur)
- [ ] 50 Weekly Review Approval — F-017 (Metrics; transaction; P1; roles: Entrepreneur)
- [ ] 51 Cohort Dashboard — F-028 (Program; report; P1; roles: Super Admin)
- [ ] 52 Stalled List — F-029 (Program; list; P1; roles: Super Admin)
- [ ] 53 Feature Flags — F-036 (Admin; settings; P1; roles: Super Admin)
- [ ] 54 Usage Stats — F-037 (Admin; report; P1; roles: Super Admin)
- [ ] 55 Notifications Inbox — F-038 (System; list; P1; roles: all roles)
- [ ] 56 Cohort Dashboard dashboard — D-003 (role: Super Admin; KPIs: Funnel: signed up → plan approved → first post → first order, Stalled count, Active mentors, Bookings this week)
- [ ] 57 System Dashboard dashboard — D-004 (role: Super Admin; KPIs: Active users today, Agent runs today (success/fail), Avg agent latency, Error rate, Top 5 users by runs)

Each task: acceptance tests first (`/architect`), then build, then `bash scripts/verify.sh`, then `/review`.

## Phase 5 — Polish + Rehearsal (8-9 Oct): Seed data script, demo script rehearsal, bug fixes, README, deployment guide, user manual, final UI polish

Exit gate: Demo script runs end-to-end without errors. All documentation is written. Deployment guide tested on a fresh environment.

- [ ] 58 Seed data script — `scripts/seed.py` generating demo accounts, mentors, businesses, calendars and bookings
- [ ] 59 Contest demo script rehearsal — end-to-end rehearsal of the 4-minute demo walkthrough
- [ ] 60 Deployment guide & config — test deployment on FastAPI Cloud, Vercel, and Supabase
- [ ] 61 Documentation & polish — final README, user manual, and UI polish

Each task: acceptance tests first (`/architect`), then build, then `bash scripts/verify.sh`, then `/review`.

