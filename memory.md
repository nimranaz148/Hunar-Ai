# Memory — Hunar v2 Full Project Status & Hand-off

Last updated: 2026-10-10 05:10 PKT

## What was built

Hunar v2 is an AI-powered co-pilot built specifically for informal women micro-entrepreneurs in Pakistan. It combines Roman Urdu conversational agents, strict human approval gates, a mentor marketplace, and enterprise Super Admin governance.

### Recent Implementations (Phase 4 Completion & Phase 5 Start)
1. **Task 55 — Notifications Inbox (`F-038`):**
   - Backend: Alembic migration `20261009_0015_notifications_table.py` with `bigserial` PK, indexes on `user_id`, `created_at`, `(user_id, is_read)`.
   - Models & Schemas: `Notification` model in `apps/api/app/models/notification.py`, Pydantic schemas in `apps/api/app/schemas/notification.py`.
   - Endpoints: `GET /api/v1/notifications` (paginated, unread filter), `GET /api/v1/notifications/unread-count`, `PATCH /api/v1/notifications/{id}/read`, `POST /api/v1/notifications/read-all`.
   - Client SDK: Generated models & `NotificationsService` in `packages/api-client/src/services/NotificationsService.ts`.
   - Frontend: `NotificationBell.tsx` mounted in `AppShell.tsx` header with live unread badge, and dedicated `/notifications` inbox view with filter tabs, single-click mark read, and category icons.
   - Tests: 2 backend pytest tests (`apps/api/tests/test_notifications.py`) and 8 Vitest tests (`apps/web/tests/notifications.test.tsx`).
   - Git Commit: `89ca86e`.

2. **Task 56 — Cohort Dashboard Dashboard (`D-003`):**
   - Verified with `apps/web/tests/cohort-dashboard.test.tsx` (6 tests passing).
   - Fully covers PRD §7 table and §29.3 wireframe alongside Task 51.

3. **Task 58 — Database Seed Script (`scripts/seed.py`):**
   - Script: `scripts/seed.py` CLI supporting `--clean` (table wipe in reverse dependency order), `--dry-run` (rollback), and default idempotent upsert.
   - Entities Seeded:
     - 1 Super Admin (`admin@hunar.pk` / `Admin1234!`)
     - 1 Cohort Program ("Lahore Batch 1" / `LHR-2026-B1`)
     - 5 Verified Mentors (Lahore, Karachi, Islamabad, Rawalpindi) with 10 services and weekly recurring availability slots
     - 20 Pakistani Entrepreneurs across all 4 progression stages (5 Intake, 5 Plan Approved, 5 First Post, 5 First Order including Fatima Ali `fatima@hunar.pk` and Samina Bibi's Gulshan-e-Iqbal home bakery)
     - 20 Businesses, Products, Validation Reports, Pricing Results, Launch Plans, Plan Tasks
     - 10 Content Calendars, 150 daily Content Items, Research Reports
     - 35 Metrics Snapshots (views, reach, likes, inquiries, orders, PKR revenue)
     - Bookings, simulated escrow payments, 5-star reviews, in-app notifications
     - 5 Feature Flags (`weekly_coach_agent`, `mentor_marketplace`, `meta_connect`, `vision_metrics`, `user_registration`)
   - Tests: 6 unit/integration tests in `apps/api/tests/test_seed.py` (100% pass rate).
   - Git Commit: `eb721dc`.

4. **Task 59 — Contest Demo Script Rehearsal (`docs/demo-script.md`):**
   - Document: `docs/demo-script.md` detailing the authoritative 4-minute (240s) timed contest demonstration for judges on 10 Oct 2026.
   - Covers 5 sequential acts:
     - Act 1 (0:00 - 0:45): Problem Hook & Roman Urdu Onboarding Chat (`F-001`, `F-003`, `F-006`).
     - Act 2 (0:45 - 1:45): Unit Economics, Margin Breakdown, Human Gate 1 Approval (`F-007`, `F-008`, `F-009`).
     - Act 3 (1:45 - 2:30): Content Engine 30-day Calendar, Today View, Mentor Booking with Escrow (`F-011`, `F-013`, `F-018`, `F-019`).
     - Act 4 (2:30 - 3:15): Daily Metrics Logging, Visual Analytics, Weekly Coach Gate 3 Proposal (`F-015`, `F-016`, `F-017`, `F-038`).
     - Act 5 (3:15 - 4:00): Super Admin Cohort Funnel (`D-003`), Stalled Early-Warning Intervention (`F-029`), System Telemetry (`D-004`), and Agent Execution Spans in Agent Explorer (`F-033`, `F-034`).
   - Includes T-5m environment setup checklist, demo credentials matrix, timing buffer table, and fallback contingency guide.
   - Git Commit: `df74bdb`.

---

## Decisions made

1. **Password Hashing:** Argon2id via `app.auth.password.hash_password`.
2. **Frontend Framework:** Next.js 16 (App Router) + React 19 + Tailwind CSS v4 design tokens.
3. **Vitest Test Pool:** Configured to `pool: "forks"` in `apps/web/vitest.config.mts` for Windows child process stability.
4. **Agent Framework:** OpenAI Agents SDK configured with Google Gemini 2.5 Flash via OpenAI compatibility endpoint. Intelligent deterministic fallback ensures system operates smoothly even without an API key.
5. **Human Approval Gates:**
   - Gate 1: Plan Approval (`F-008`)
   - Gate 2: Content Outline Approval (`F-010`)
   - Gate 3: Weekly Coach Review Approval (`F-017`)
6. **Submodule Protection:** Never stage or commit `honeys-spec-harness` submodule modifications.
7. **Client Generation:** `@hunar/api-client` is generated from OpenAPI contract; `apps/web/lib/api.ts` proxies client services.

---

## Problems solved

1. **Vitest Worker Timeout on Windows:** `threads` pool hung indefinitely in Windows environment. Solved by configuring `pool: "forks"` in `apps/web/vitest.config.mts`, completing all frontend test runs in 15-20s.
2. **UserRole Module Import:** Fixed import path from `@/lib/permissions` in `apps/web/app/(dashboard)/notifications/page.tsx`.
3. **Lint Rule T201 (print found):** Replaced all `print` calls in `scripts/seed.py` with structured `logger.info` statements to comply with repo ruff standards.
4. **Typed Seeding Specs:** Added explicit `TypedDict` annotations (`MentorData`, `EntrepreneurSpec`) in `scripts/seed.py` to achieve strict type safety in mypy.

---

## Current state

### Project Phase Completion:
- **Phase 0 — Foundation:** 100% Complete (Tasks 00-18) ✅
- **Phase 1 — Onboarding Agents:** 100% Complete (Tasks 19-26) ✅
- **Phase 2 — Content Engine:** 100% Complete (Tasks 27-33) ✅
- **Phase 3 — Mentor Pro Panel:** 100% Complete (Tasks 34-47) ✅
- **Phase 4 — Metrics + Coach + Admin:** 100% Complete (Tasks 48-57) ✅
- **Phase 5 — Polish + Rehearsal:** IN PROGRESS (Tasks 58-59 Complete) 🚀
  - [x] Task 58: Seed data script (`scripts/seed.py`)
  - [x] Task 59: Contest demo script rehearsal (`docs/demo-script.md`)
  - [ ] Task 60: Deployment guide & config (`docs/deployment-guide.md`, `apps/api/Dockerfile`, `apps/web/vercel.json`)
  - [ ] Task 61: Documentation & polish (`README.md`, `docs/user-manual.md`)

### Health & Verification:
- **Web App:** All 41 Next.js routes compiled and statically optimized (`pnpm --filter @hunar/web build`).
- **Web Typecheck:** Passed cleanly (`tsc --noEmit`).
- **Web Tests:** Passed cleanly (`pnpm --filter @hunar/web test`).
- **API Tests:** Passed cleanly (`uv run pytest`).
- **API Lint & Typing:** Passed cleanly (`ruff check .`, `mypy app`).

---

## Next session starts with

### Phase 5 Task 60 — Deployment Guide & Configuration:
1. Create `apps/api/Dockerfile` for production containerization of FastAPI with `uv`.
2. Create `apps/web/vercel.json` (or root `vercel.json`) for Vercel deployment of Next.js.
3. Author `docs/deployment-guide.md` covering:
   - Supabase PostgreSQL setup (pooling, migrations via `alembic upgrade head`, SSL).
   - FastAPI Cloud / container hosting (environment variables, health checks).
   - Vercel frontend setup (monorepo root `apps/web`, build command, `NEXT_PUBLIC_API_URL`).
   - Post-deployment smoke test and database seeding.

### Followed by Phase 5 Task 61 — Documentation & Polish:
1. Root `README.md` with complete setup instructions.
2. `docs/user-manual.md` for end-users and judges.
3. Final UI polish and repository verification.

---

## Open questions

- None. All requirements through Task 59 are verified, passing, and committed to git.
