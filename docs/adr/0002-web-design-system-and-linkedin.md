# ADR 0002: Web design system, dashboard grouping and LinkedIn placeholder

- **Status:** Accepted (design system, grouping). **Proposed** (LinkedIn feature).
- **Date:** 2026-10-21
- **Decider:** Product Owner (requested in the redesign brief)

## Context

`context/ui-tokens.md` declared its token set provisional and said final branding would arrive in a
separate pass, changing only token values. The redesign brief supplies that pass: a flat purple and
pink identity modelled closely (about 90%) on a reference site, no gradients, a warm audience of
Pakistani women entrepreneurs, and a dashboard that looks like the marketing site.

Two things in the brief are not in `docs/prd/PRD.md`:
1. A **LinkedIn connection** so entrepreneurs and mentors can network.
2. A **restructured dashboard sidebar** (grouped tabs).

`AGENTS.md` requires that no business field, rule or screen be invented without a recorded change
request. This ADR is that record.

## Decision

### 1. Design system (accepted)
Adopt the system in `docs/design/design-system.md`: flat solid colour only; Anton, Barlow Condensed
and Barlow; 14px inset layout; back-ease motion with scrubbed chapters; reduced-motion and mobile
fallbacks. Implemented by changing token **values** in `apps/web/app/globals.css`, as
`ui-tokens.md` intended. Component code keeps using tokens.

Consequences of note:
- Inter is replaced as the primary face (`ui-rules.md` updated).
- Default Tailwind colour scales are remapped to the brand ("palette lock") so legacy screens render
  on-brand without per-file edits. shadcn-style alias tokens were added for the mentor screens.
- Shadows are `none`; elevation is expressed with colour and 1px ink borders.

### 2. Dashboard grouping (accepted, no new screens)
The sidebar keeps **exactly the same destinations** as before and groups them by intent
(Workspace, Plan & Validate, Grow, Support for entrepreneurs; Workspace, Clients, Support for
mentors; Overview, Operations, Governance for admins). No route, field or workflow was added.
The brief's suggestions of one page per AI agent, Learning and Messages are **not built**: they
are new screens and need PRD entries first.

### 3. LinkedIn connection (proposed, not built)
Not in the PRD, so it is not implemented. The landing page shows a clearly labelled **"Coming
soon"** section with no functional claim. To build it, a change request must define: what is
linked (OAuth identity vs. a profile URL), what is stored and where (PII, consent, retention),
what the connection enables (introductions, mentor discovery), whether it is per-role, and its
abuse/impersonation controls (verification of the linked account).

## Consequences

- The visual system can be iterated by editing token values and `docs/design/`.
- `docs/design/content-todo.md` lists placeholders that must be replaced before launch.
- Until LinkedIn is accepted, removing the landing "Network" section is a one-file change
  (`components/landing/Network.tsx` and its line in `app/page.tsx`).
