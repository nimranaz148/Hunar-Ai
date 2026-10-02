# Hunar v2 — Agent Instructions

This repository is built with AI assistance under a strict, documented process. Read `context/` before doing anything else — it is the authoritative source for architecture, build sequencing, and conventions, and it wins over general knowledge or training-data defaults.

## Read First, In Order

1. `context/project-overview.md` — product vision, users, objectives, and scope
2. `context/architecture.md` — folder layout, stack decisions, API and database conventions
3. `context/code-standards.md` — implementation rules that cannot be broken
4. `context/build-plan.md` — phase sequencing and task breakdown
5. `context/library-docs.md` — usage patterns for chosen libraries
6. `context/ui-rules.md` — UI layout, form standards, accessibility
7. `context/ui-tokens.md` — Tailwind v4 design tokens and status colors
8. `context/ui-registry.md` — inventory of built UI components
9. `context/progress-tracker.md` — active phase and open questions

## Source of Truth

- **Function and Scope:** `docs/prd/PRD.md` is the single source of truth for features, forms, fields, and workflows.
- **Architecture and Stack:** `context/architecture.md` and `docs/adr/0001-stack-decision.md` win on technology choices and folder layout.
- **Coding Rules:** `context/code-standards.md` wins on conventions and code structure.

Never invent a business field, rule or screen that is not in the source documents — record a change request in `docs/adr/` first.

## Non-Negotiable Constraints

- **API is the sole owner of business logic and data access.** No business rules in frontend or raw SQL outside migrations.
- **Every route enforces authorization.** `require_role` dependency on every router; endpoints are never accidentally public.
- **Ownership scoping on every query.** Entrepreneurs access own data (`user_id = current_user.id`); mentors access profile and booked mentees only.
- **AI agents never hold database credentials in production.** Agents call approved service-layer tools.
- **Audit log is append-only.** Database trigger blocks UPDATE and DELETE on `audit_logs`.
- **No secrets in source control.** All secrets via environment variables (`DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`, `TAVILY_API_KEY`).
- **Every schema change ships as an Alembic migration.**
- **OpenAPI contract drift is verified in CI.** `verify.sh --lane contract` ensures TypeScript client matches OpenAPI.
- **Agent traces are stored and viewable.** Every agent run records spans in `agent_steps`.
- **All user input is validated.** Pydantic on backend, Zod on frontend.

## Verification — How "Done" Is Decided

Verification is mechanical and automatic. Do not hand-pick test commands, start the app, or click through the UI to convince yourself a change works.

- **`scripts/verify.sh`** is the single definition of "verified". It runs only the lanes your changes affect (`api`, `api-db`, `web`, `contract`, `infra`) with the same commands CI runs — the workflows call these lanes directly. `--all` runs everything; `--lane <name>` runs one; `--list` shows what would run.
- **Per edit** (Claude Code `PostToolUse` hook, `.claude/settings.json`): the edited file is formatted/lint-fixed in seconds; problems that cannot be auto-fixed are reported back immediately.
- **Per turn** (`Stop` hook): when you finish with uncommitted changes, `verify.sh` runs. If it fails you are not done — fix the reported failures. Never weaken, skip or delete a check to make it pass.
- **Per push** (`.githooks/pre-push`, enable once per clone with `bash scripts/install-hooks.sh`): the same lanes, for commits made outside an agent session.
- **Manual/browser checks** only for UI work, when the `review` skill calls for them.

Write tests for the behaviour the plan's **acceptance tests** name (see `architect`), plus the non-negotiable coverage in `context/code-standards.md`. Do not write tests for trivia.

**When CI fails on something `verify.sh` passed**, the fix PR carries two changes: the fix, and the check (a `verify.sh` step, an architecture test, or a lint rule) that would have caught it locally. CI should surprise us at most once per failure class.

## Skills

This repo's `skills/` directory defines the working process:

- `architect` — think through a feature before writing code; produces a plan with acceptance tests
- `imprint` — capture UI patterns into `context/ui-registry.md` after building a component
- `review` — verify a finished feature against the plan, the architecture, and production readiness
- `recover` — diagnose a failure (bug vs. polluted session vs. wrong approach) before responding to it
- `remember` — save/restore session state between sessions

## Current Status

See `context/progress-tracker.md` for the live phase/task status.
