# Project Overview

> Generated from `docs/prd/PRD.md` (v0.1.0, profile `production`) by Honey's Spec Harness. This is a living document: edit it freely; the PRD stays the source for scope.

## About the Project

Hunar v2 is an AI-powered platform that empowers Pakistani women with home-business ideas to build validated, priced businesses with professional social media presence. A woman signs up, describes her idea in Roman Urdu or English, and a pipeline of 12 specialized AI agents turns it into a validated business model, pricing strategy, 30-day launch plan, and a complete 30-day Instagram/Facebook content calendar — with copy-paste-ready captions, hashtags from fresh web research, and image/video generation prompts.

The platform operates at **production profile**: audit logging, role-based security, and data integrity are non-negotiable, even though the infrastructure runs on free tiers. The system serves three roles: **Entrepreneurs** (the primary users), **Mentors** (who sell expert services through a Pro panel), and **Super Admins** (platform operators who also manage cohorts, approve mentors, and oversee the audit trail).

The deployment model is cloud-native on free tiers: Vercel for the Next.js frontend, FastAPI Cloud (Tiangolo's official managed hosting, deployed via `uv run fastapi deploy`) for the FastAPI backend, and Supabase for PostgreSQL. AI agents run via the OpenAI Agents SDK with Google Gemini 2.5 Flash as the LLM provider. The platform is built by a solo developer (Nimra) in 6 phases from 25 Sep to 10 Oct 2026, targeting a contest demonstration.

What makes Hunar v2 different: **(1)** The content engine produces not just strategy but day-by-day, platform-specific, copy-paste-ready content with researched hashtags and image/video prompts. **(2)** Every agent action is traceable — the Super Admin can replay the full decision chain from idea to published content. **(3)** The mentor marketplace connects entrepreneurs to real experts with transparent pricing, even with simulated payments.

## Product Objectives

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

## Modules & Primary Screens

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

## Feature Priority

| Priority | Meaning | Items |
| --- | --- | --- |
| P0 — Mandatory | Cannot ship without | Auth + 3 roles + user creation; Intake → Validator → Pricing → Launch Planner; Content Engine (research → strategy → captions/hashtags → image/video prompts); Today View; manual metrics entry; audit log + agent trace viewer |
| P1 — Should have | First commercial release | Mentor Pro panel + booking (simulated payment); Mentor Matcher; Weekly Coach re-plan; Super Admin cohort dashboard; Notifications; Feature flags |
| P2 — Could have | Expansion | Metrics from screenshot (vision); CSV export; email/WhatsApp draft reminders; Performance charts |
| P3 — Won't (v2) | Differentiation / future | Auto-posting; real payments; real email/SMS; Meta Connect; native mobile app |

## Non-Negotiable Architectural Constraints

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

## Deployment Models

| Environment | Purpose | Infrastructure | Secrets |
| --- | --- | --- | --- |
| Local | Development | Docker Compose (Postgres + API + optional Next.js dev server) | `.env` file (gitignored) |
| CI | Automated testing | GitHub Actions + Docker Compose (ephemeral Postgres) | GitHub Secrets |
| Production | Live application | Vercel (web) + FastAPI Cloud (API) + Supabase (DB) | FastAPI Cloud env vars + platform secret managers |

**Configuration:** All secrets via environment variables. `.env.example` has every key with empty values. Required variables: `DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`, `TAVILY_API_KEY`.

## Definition of Done

- Requirement implemented and demonstrated
- Database migration included
- API and UI completed
- Validation and authorization implemented
- Audit requirements implemented
- Automated tests added and passing; `scripts/verify.sh` passes
- No critical/high unresolved defects
- Code reviewed by Nimra (including AI-generated code)
- Documentation updated

