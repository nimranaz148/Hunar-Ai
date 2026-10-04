# Progress Tracker

Update this file after every completed task. Anyone reading it should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** Phase 2 — Content Engine
**Last completed:** 29 Content Item Detail / Editor — F-012 (Single item GET/PUT API with audit logging, Python 3.14 datetime schema stability, full-featured post editor UI at /content/items/[id] with hook/caption/CTA/hashtags/prompts and 1-click copy actions, Vitest component suite)
**In progress:** 30 Today View — F-013
**Next:** 30 Today View — F-013 (Content; list; P0; roles: Entrepreneur)
**Blockers:** None

---

## Phase 0 — Foundation (25-26 Sep): Repo structure, Docker Compose, Supabase schema, Alembic migrations, auth (register/login/refresh/logout + 3 roles + user creation paths), audit() helper, llm.py (Gemini client), trace processor (agent_steps), live Gemini smoke test (tool call, structured output, one handoff), Super Admin panel (user management, audit viewer, agent explorer, settings)

- [x] 00 Architecture Decision Record + sign-off — write `docs/adr/0001-stack-decision.md` from PRD §3.1 (stack, why, rejected alternatives)
- [x] 01 Repo scaffold — folders per PRD §3.4 (`apps/api`, `apps/web`, `apps/agents`, `infra`, `packages/api-client`), package managers, `.env.example` with empty values
- [x] 02 CI/CD + verification — one workflow per lane (api, web, agents, infra, client) calling `scripts/verify.sh`; secret scan; dependency scan
- [x] 03 Database foundation — PostgreSQL 16 (Supabase free tier) + Alembic; first migration; naming and key conventions from PRD §12.2; migration check in `verify.sh`
- [x] 04 Authentication & authorization — login/refresh/logout, roles and permission matrix from PRD §14.2, enforced in the API
- [x] 05 Audit infrastructure — audit rows for the actions in PRD §14.1, sensitive-field masking, test that each audited action writes a row
- [x] 06 API conventions + contract — versioned base path, error format, OpenAPI, generated client (openapi), drift check in `verify.sh`
- [x] 07 UI foundation — design tokens, layout shell, the mandated form layout (PRD §5.1), reusable grid/form/status components, `context/ui-registry.md` started
- [x] 08 Agent service skeleton — separate service, no database credentials, tool catalog wired to the API with the caller's identity (PRD §36.2-36.4)
- [x] 09 Vertical slice — the smallest end-to-end feature across every layer, to prove the pattern later tasks copy
- [x] 10 Signup — F-001 (Auth; master; P0; roles: public)
- [x] 11 Login — F-002 (Auth; master; P0; roles: public)
- [x] 12 User Management — F-031 (Admin; list; P0; roles: Super Admin)
- [x] 13 Audit Log Viewer — F-032 (Admin; list; P0; roles: Super Admin)
- [x] 14 Agent Run Explorer — F-033 (Admin; list; P0; roles: Super Admin)
- [x] 15 Agent Run Detail (span timeline) — F-034 (Admin; report; P0; roles: Super Admin)
- [x] 16 System Settings — F-035 (Admin; settings; P0; roles: Super Admin)
- [x] 17 Change Password — F-039 (Auth; master; P0; roles: all roles)
- [x] 18 Integration: Gemini API — I-001 (Outbound; HTTPS (OpenAI-compatible))

## Phase 1 — Onboarding agents (27-29 Sep): Orchestrator + Intake + Validator + Pricing + Launch Planner, approval gate (Human Gate 1), plan dashboard, SSE progress streaming, agent progress overlay

- [x] 19 Onboarding Chat — F-003 (Onboarding; transaction; P0; roles: Entrepreneur)
- [x] 20 Business Profile View — F-004 (Business; master; P0; roles: Entrepreneur)
- [x] 21 Product Editor — F-005 (Business; master; P0; roles: Entrepreneur)
- [x] 22 Validation Report View — F-006 (Business; report; P0; roles: Entrepreneur)
- [x] 23 Pricing & Break-even View — F-007 (Business; report; P0; roles: Entrepreneur)
- [x] 24 Plan Approval Gate — F-008 (Onboarding; transaction; P0; roles: Entrepreneur)
- [x] 25 Launch Plan / Tasks — F-009 (Plan; list; P0; roles: Entrepreneur)
- [x] 26 Agent Progress (SSE overlay) — F-042 (System; report; P0; roles: Entrepreneur)

## Phase 2 — Content Engine (30 Sep - 3 Oct): Researcher (Tavily) + Normalizer + Strategist + Writer (4 batches) + Visual Prompt + Content QA, content outline approval (Human Gate 2), content calendar UI, Today View, research report view

- [x] 27 Content Outline Approval — F-010 (Content; transaction; P0; roles: Entrepreneur)
- [x] 28 Content Calendar (month view) — F-011 (Content; list; P0; roles: Entrepreneur)
- [x] 29 Content Item Detail / Editor — F-012 (Content; master; P0; roles: Entrepreneur)
- [x] 30 Today View — F-013 (Content; list; P0; roles: Entrepreneur)
- [x] 31 Research Report View — F-014 (Content; report; P0; roles: Entrepreneur)
- [ ] 32 Entrepreneur Home dashboard — D-001 (role: Entrepreneur; KPIs: Tasks completed this week, Posts published, Engagement trend (likes+comments), Revenue this week (PKR))
- [ ] 33 Integration: Tavily Search API — I-002 (Outbound; HTTPS REST)

## Phase 3 — Mentor Pro Panel (4-5 Oct): Mentor profile, services CRUD, availability, booking flow (request → accept → complete → review), simulated payment, Mentor Matcher agent, Mentor Brief agent, mentor approval by Super Admin

- [ ] 34 Browse Mentor Services — F-018 (Mentor; list; P1; roles: Entrepreneur)
- [ ] 35 Book a Service — F-019 (Mentor; transaction; P1; roles: Entrepreneur)
- [ ] 36 My Bookings — F-020 (Mentor; list; P1; roles: Entrepreneur)
- [ ] 37 Mentor Profile Editor — F-021 (Mentor; master; P1; roles: Mentor)
- [ ] 38 Service CRUD — F-022 (Mentor; master; P1; roles: Mentor)
- [ ] 39 Availability Editor — F-023 (Mentor; master; P1; roles: Mentor)
- [ ] 40 Mentor Dashboard — F-024 (Mentor; list; P1; roles: Mentor)
- [ ] 41 Mentee View (brief + progress) — F-025 (Mentor; report; P1; roles: Mentor)
- [ ] 42 Earnings View — F-026 (Mentor; report; P1; roles: Mentor)
- [ ] 43 Session Notes — F-027 (Mentor; master; P1; roles: Mentor)
- [ ] 44 Mentor Approval — F-030 (Program; transaction; P1; roles: Super Admin)
- [ ] 45 Mentor Application — F-040 (Auth; master; P1; roles: public)
- [ ] 46 Review Form — F-041 (Mentor; master; P1; roles: Entrepreneur)
- [ ] 47 Mentor Dashboard dashboard — D-002 (role: Mentor; KPIs: Pending requests, Upcoming sessions this week, Total earnings (simulated), Average rating)

## Phase 4 — Metrics + Coach + Admin (6-7 Oct): Manual metrics entry form, performance charts, Weekly Coach agent (Human Gate 3), Super Admin cohort panel (cohort funnel, stalled list), feature flags, usage stats, notifications inbox

- [ ] 48 Metrics Entry Form — F-015 (Metrics; master; P0; roles: Entrepreneur)
- [ ] 49 Performance Charts — F-016 (Metrics; report; P1; roles: Entrepreneur)
- [ ] 50 Weekly Review Approval — F-017 (Metrics; transaction; P1; roles: Entrepreneur)
- [ ] 51 Cohort Dashboard — F-028 (Program; report; P1; roles: Super Admin)
- [ ] 52 Stalled List — F-029 (Program; list; P1; roles: Super Admin)
- [ ] 53 Feature Flags — F-036 (Admin; settings; P1; roles: Super Admin)
- [ ] 54 Usage Stats — F-037 (Admin; report; P1; roles: Super Admin)
- [ ] 55 Notifications Inbox — F-038 (System; list; P1; roles: all roles)
- [ ] 56 Cohort Dashboard dashboard — D-003 (role: Super Admin; KPIs: Funnel: signed up → plan approved → first post → first order, Stalled count, Active mentors, Bookings this week)
- [ ] 57 System Dashboard dashboard — D-004 (role: Super Admin; KPIs: Active users today, Agent runs today (success/fail), Avg agent latency, Error rate, Top 5 users by runs)

## Phase 5 — Polish + Rehearsal (8-9 Oct): Seed data script, demo script rehearsal, bug fixes, README, deployment guide, user manual, final UI polish

- [ ] 58 Seed data script — `scripts/seed.py` generating demo accounts, mentors, businesses, calendars and bookings
- [ ] 59 Contest demo script rehearsal — end-to-end rehearsal of the 4-minute demo walkthrough
- [ ] 60 Deployment guide & config — test deployment on FastAPI Cloud, Vercel, and Supabase
- [ ] 61 Documentation & polish — final README, user manual, and UI polish


## Decisions Log

_Date — decision — reason. Append only._

- 2026-10-01 — Phase 0 completed and verified. Super Admin panel (Tasks 12-16), Change Password (Task 17), and Gemini 2.5 Flash SDK Integration (Task 18) built and verified with `verify.sh` across all lanes (`api`, `web`, `contract`).
- 2026-10-01 — Task 18 smoke tests verify tool execution, structured output schemas, and multi-agent handoffs using OpenAI Agents SDK with Gemini endpoint.
- 2026-10-01 — Task 19 Onboarding Chat (F-003) built with persistent conversation (`onboarding_messages`), real-time SSE streaming, Gemini-powered Intake Agent with rule fallback, automatic `businesses` and `products` creation upon profile completion, and append-only audit logging (`business.created`).


## Open Questions

_From PRD §0.4. Resolve or escalate before the task that depends on it._

- Q-001 Real payment integration timing and provider selection (blocks §36+ (Phase 6+))
- Q-002 Exact Gemini API quota limits on free tier and fallback strategy (blocks §36, P0)
- Q-003 Tavily free tier (1000 searches/month) sufficient for content research at scale? (blocks §36, P2)
- [RESOLVED 2026-10-01] Q-004 Handoff behavior with Gemini via OpenAI compatibility endpoint: OpenAI Agents SDK `handoffs` parameter correctly transfers execution context between agents with specialized instructions while `DbTraceProcessor` records continuous spans in `agent_steps`.
