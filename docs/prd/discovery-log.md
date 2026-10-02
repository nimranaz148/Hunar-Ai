# Discovery Log — Hunar v2

Date: 2026-09-26

## Round 0 — Mode and seed idea
- **Existing spec?** Yes — `Hunar v2 Product & System Design.docx` (converted to `existing-spec.md`)
- **Mode:** Create mode (the existing doc is an overview/design doc, not a formal PRD)
- **What are you building?** AI-powered platform for Pakistani home-business women — agents turn an idea into a validated, priced business with a 30-day content calendar, mentoring marketplace, and program management.
- **Anything already built?** The design document describes the full system; no code exists yet.

## Round 1 — Ambition, budget and constraints
- **Profile:** Production — uptime and data-integrity matter, proper audit/security
- **Budget:** Free tiers and open source only (Supabase free, Vercel hobby, Gemini free tier)
- **Team:** Solo developer (Nimra) — Python + JavaScript skills
- **Timeline:** Contest on 10 Oct 2026, development starts 25 Sep 2026
- **Hosting:** Vercel (frontend) + FastAPI Cloud (backend) + Supabase (DB)
- **Licensing:** No specific constraints

## Round 2 — Users, scale and shape
- **Users:** 3 roles (Entrepreneur, Mentor, Super Admin) — Program Admin merged into Super Admin
- **Scale:** ~30 demo users, design ceiling ~500 entrepreneurs, ~20 concurrent
- **Tenancy:** Single organization, optional cohort tagging
- **Data volume:** < 10k rows per main entity
- **Pages:** ~40 screens (30-50 range)
- **Devices:** Desktop web-first, mobile responsive
- **Language:** UI English, content Roman Urdu + English mix
- **Currency:** PKR only
- **Accessibility:** Not required for contest
- **Offline:** Not applicable — online only

## Round 3 — Domain, features and phases
- **Modules:** Auth, Onboarding, Content Engine, Metrics, Mentor Pro Panel, Super Admin (with Cohort & Stalled monitoring)
- **Mentor Pro Panel:** Yes — priced services marketplace with booking (simulated payments)
- **Phases:** 6 (P0-P5), single build (slim/full split dropped)
- **Compliance:** None required
- **Payments:** Simulated now, real payments deferred to Phase 6+
- **Two builds:** Dropped — single build only

## Round 4 — Stack
- **Stack confirmed (Preset A):**
  - Frontend: Next.js 15 (App Router, TypeScript) + Tailwind CSS v4 + shadcn/ui
  - Backend: FastAPI + SQLAlchemy 2 + Alembic migrations
  - Database: PostgreSQL (Supabase free tier)
  - AI: OpenAI Agents SDK + Gemini 2.5 Flash
  - Search: Tavily (free tier)
  - Repo: Monorepo (apps/api, apps/web, apps/agents)
- **Realtime:** SSE for agent progress
- **Notifications:** In-app only, simulated outbox
- **Containers:** Docker Compose (local) + GitHub Actions (CI)

## Round 5 — Services
- **Auth:** Custom JWT (short-lived access + rotating refresh, httpOnly cookies)
- **Authorization:** Role-based, API-enforced
- **Redis/Cache:** Not needed at this scale
- **Background jobs:** Agent runs as background tasks (agent_runs table + semaphore)
- **Search:** Postgres pg_trgm + FTS (no external search engine)
- **File storage:** Not needed initially (no file uploads in MVP)
- **Email/SMS:** Simulated (in-app outbox)
- **Payments:** Simulated
- **Observability:** Structured logs + agent traces to DB

## Round 6 — AI
- **Agents:** 12 agents as per design document
- **Framework:** OpenAI Agents SDK
- **Model:** Gemini 2.5 Flash via OpenAI compatibility endpoint
- **Autonomy:** L1-L3 for most agents, Weekly Coach L3 (draft with approval)
- **Guardrails:** Input guardrail, Content QA guardrail, action gates, budget guard

## Round 7 — Integrations
- **Meta Connect:** Fully cut from this build
- **No external integrations** in this build

## Round 8 — Non-functional and delivery
- **Performance:** API < 500ms, search < 1s, agent runs async
- **Testing:** Unit + Integration + E2E on critical flows (pytest, Vitest)
- **Deliverables:** Code + README + deployment guide + OpenAPI docs + user manual + demo script + seed data + ERD
- **Approver:** Nimra (solo developer / product owner)
