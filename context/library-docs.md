# Library Docs

Project-specific usage patterns for every third-party library in this project. This file covers how *we* use each library in Hunar v2 — rules, patterns and constraints specific to this project. It is not a substitute for the official docs.

---

## Before Using Any Library

1. **Check `AGENTS.md`** at the project root for installed skills.
2. **Fetch current API documentation** (Context7 MCP or the official docs) — library APIs change and training data goes stale. This is required, not optional, for any library question.
3. **Read this file** for project-specific patterns that override general library knowledge.

Order of authority:

```
Current official docs -> Skills via AGENTS.md -> This file (project rules) -> General knowledge
```

---

## Adding a library

When a task adopts a new library, add a section here **in the same PR** using this shape:

```
## <Library> (<package name>, <pinned version>)

Where it is configured: <file>
Project rules:
- <the pattern we always use>
- <the thing we never do, and why>
Gotchas found in this project:
- <symptom> -> <cause> -> <fix>
```

## FastAPI (fastapi, 0.115+)
Where it is configured: apps/api/app/main.py
Project rules:
- Async route handlers; Pydantic v2 schemas for all inputs and responses
- Centralized exception handlers for RFC 7807 problem details
- Dependencies for auth and scoping (require_role)

## SQLAlchemy 2 (sqlalchemy, 2.0+)
Where it is configured: apps/api/app/core/database.py
Project rules:
- AsyncSession with asyncpg/psycopg
- Explicit transactions; all queries scoped to user ownership

## OpenAI Agents SDK
Where it is configured: apps/api/app/agents/
Project rules:
- Gemini 2.5 Flash via OpenAI compatibility endpoint (OpenAIChatCompletionsModel)
- Custom DbTraceProcessor writes spans to agent_steps table
- Agents access data via service-layer tools, never raw DB credentials

## Next.js (next, 15+)
Where it is configured: apps/web/
Project rules:
- App Router with TypeScript strict mode
- Server Components by default; Client Components only for interactivity
- Tailwind CSS v4 + shadcn/ui components
