# Code Standards

Implementation rules and conventions for Hunar v2. Follow these in every session without exception. These rules prevent pattern drift across sessions across Python and TypeScript.

---

## Engineering Mindset

- **Think before implementing** — understand what is being built and why before writing a line
- **Read context files first** — never assume; verify against `architecture.md` and `project-overview.md`
- **Scope is sacred** — build only what the current task requires. Business fields not in the PRD require a change request
- **Every feature must be testable** — if it cannot be verified immediately after implementation, it is incomplete
- **Clean over clever** — readable code a junior developer can follow beats clever abstraction
- **One thing at a time** — complete one feature fully before touching the next
- **Reference the feature ID** — every task cites its feature/form ID or PRD section

---

## The Rules That Cannot Be Broken

These are architectural guarantees, not style preferences. A PR that violates one does not merge.
Each rule ends with `— enforced by: <check>`.

1. **No secrets in source control.** Ever. `.env.example` holds keys with empty values. — enforced by: secret scan (`security.yml`)
2. **No raw SQL string concatenation, anywhere.** Parameterized queries or the ORM only. — enforced by: SQLAlchemy ORM parameterized queries + ruff/bandit check
3. **`packages/api-client` is generated from the API contract, never hand-edited.** — enforced by: `verify.sh --lane contract` and the edit hook
5. **No business logic in the frontend.** Calculation of price, tax, stock or totals happens in the backend only. The frontend formats and displays; it does not decide. — enforced by: review layer 2 + architecture rules
6. **The AI/agent service never gets a database connection string.** If a task seems to need one, the task is wrong. — enforced by: infrastructure network policy + `verify.sh` infra lane



---

## TypeScript / React / Next.js (`apps/web`)

- Strict mode; no exceptions
- Never `any` — use `unknown` and narrow; no `as X` assertions unless commented why
- Explicit parameter and return types on all functions
- `type` for object shapes and unions; `interface` only for extendable component props
- `const` by default
- (Next.js App Router) Server Components by default; `"use client"` only for state, effects, browser APIs or client-only libraries; never on a layout unless genuinely required
- Data fetching on the server; never fetch directly from a Client Component when a server path exists
- API types come from the generated client. Hand-written request/response types are a defect
- Schema validation (Zod) mirrors backend validation for UX only — the backend remains authoritative
- Currency, date and quantity formatting always goes through one `lib/format` module. Never inline `toLocaleString`
- Permission checks go through one `can(module, screen, action)` helper — unauthorized actions are hidden or disabled
- Every list view implements loading, empty, error and unauthorized states. All four, every time

## Python (`apps/api`)

- Python 3.12+; type hints on everything; `mypy --strict` in `verify.sh`
- Pydantic models for every input and output — no untyped dicts crossing a boundary
- `ruff` for lint and format; the edit hook runs `ruff --fix` on every touched file
- Timeouts on every outbound call
- Structured logging with a correlation/execution ID

---

## Naming

| Thing | Convention | Example |
| --- | --- | --- |
| Database tables | snake_case, plural | users, businesses, content_items |
| API models | PascalCase | BusinessProfile, ContentItem |
| React components | PascalCase | TodayView, ContentCalendar |
| Functions & endpoints | snake_case | get_business, generate_calendar |
| API routes | kebab-case, plural | `/api/v1/purchase-orders` |
| Branches | `type/short-description` | `feat/f-001-short-name` |

---

## Error Handling

- **Backend:** one global handler returns structured problem details (RFC 7807). Domain rule violations return 422 with the rule; permission failures 403; never leak stack traces or SQL to the client
- **Frontend:** every mutation surfaces success and error with an actionable message. Never a bare "Something went wrong"
- Sensitive data is masked in all logs

---

## Testing

| Layer | Tooling | What is tested |
| API unit & integration | pytest + httpx TestClient | Endpoints, auth, scoping, agent tools |
| Database migrations | alembic check + PostgreSQL | Models match migrations, round-trip |
| Frontend | Vitest + React Testing Library | UI components, form validation, states |
| E2E | Playwright | Critical user journeys |

Non-negotiable test coverage (keep only what applies to this project):

- Every audited action actually writes an audit row
- Every permission — the API rejects an unauthorized action even when the UI would have hidden it
- Every AI tool — authorization, data isolation, action safety, schema validation, audit

Prefer one architecture test covering every endpoint/entity over a hand-written test per feature for the same rule. A new "every X must Y" invariant belongs in the architecture tests; a deliberate exception goes in that test's exemption list with its reason.

### Verification loop

`scripts/verify.sh` is the local mirror of CI and the definition of "verified" (see `AGENTS.md` — Verification). Run it, or let the Claude Code hooks run it, instead of choosing commands by hand. A new CI check is added as a `verify.sh` lane step that the workflow calls, so local and CI cannot drift.

---

## Git & Pull Requests

- Protected `main`. No direct pushes
- One logical change per PR
- PR description records: the requirement (feature ID / PRD section), test evidence, and database migration notes
- Every PR is reviewed and understood by a human developer. AI-generated code is the author's responsibility, not the tool's
- CI must pass: verify.sh passes for api, api-db, web, contract, infra lanes; security.yml secret scan passes
- When CI fails on something `verify.sh` passed, the fix PR carries two changes: the fix, and the check that would have caught it locally

---

## AI-Assisted Development Protocol

1. **Requirement** — a small, testable story with acceptance criteria
2. **Context** — supply the relevant structure, conventions and constraints. `context/` is that context
3. **Design** — agree database/API/UI design *before* large generation (`/architect`)
4. **Generate** — scaffolding, implementation, refactoring, tests
5. **Review** — a human reviews all generated code, queries, security and error handling (`/review`)
6. **Test** — the acceptance tests from step 1 were written first and pass; `scripts/verify.sh` passes
7. **PR** — requirement, test evidence, migration notes
8. **Merge** — only approved, passing PRs reach protected branches

AI tooling is never given unrestricted production credentials or unrestricted database write access. Production deployment uses controlled CI/CD credentials only.
