# UI Registry

Living document. Updated after every component is built (the `imprint` skill does this). Read this before building any new component — match existing patterns exactly before inventing new ones.

This file is what keeps Hunar v2 from drifting into many slightly different interpretations of the same layout.

---

## How to Use

Before building any component:

1. Check whether a similar component already exists here.
2. If yes — use it. If it needs a variant, add the variant to the existing component; do not fork it.
3. If no — build it following `ui-rules.md` and `ui-tokens.md`, then add it here.

After building any component, record: name, file path, purpose, variants, and the exact token classes used.

---

## Component Inventory

| Component | Path | Status |
| --- | --- | --- |
| AppShell | `apps/web/components/layout/AppShell.tsx` | Production |
| Sidebar | `apps/web/components/layout/Sidebar.tsx` | Production |
| BottomNav | `apps/web/components/layout/BottomNav.tsx` | Production |
| DataTable | `apps/web/components/ui/DataTable.tsx` | Production |
| FormField & Input | `apps/web/components/ui/FormField.tsx` | Production |
| StatusBadge | `apps/web/components/ui/StatusBadge.tsx` | Production |
| LoadingState | `apps/web/components/ui/LoadingState.tsx` | Production |
| EmptyState | `apps/web/components/ui/EmptyState.tsx` | Production |
| ErrorState | `apps/web/components/ui/ErrorState.tsx` | Production |
| Format Utilities | `apps/web/lib/format.ts` | Production |
| Permissions Helper | `apps/web/lib/permissions.ts` | Production |
| AgentProgressOverlay | `apps/web/components/agents/AgentProgressOverlay.tsx` | Production |
| ContentOutlineGateView | `apps/web/app/(dashboard)/content/outline/page.tsx` | Production |
| ContentCalendarView | `apps/web/app/(dashboard)/content/calendar/page.tsx` | Production |
| ContentItemEditorView | `apps/web/app/(dashboard)/content/items/[id]/page.tsx` | Production |

---

## Components

### AppShell
- **Path:** `apps/web/components/layout/AppShell.tsx`
- **Purpose:** Responsive app container providing top header, desktop sidebar (≥1024px), mobile bottom nav (<1024px), and main content viewport.
- **Props:** `role: UserRole`, `userName?: string`, `pageTitle?: string`, `onLogout?: () => void`, `actions?: React.ReactNode`, `children: React.ReactNode`.
- **Tokens used:** `bg-[var(--color-canvas)]`, `text-[var(--color-fg)]`, `border-[var(--color-border)]`, `bg-[var(--color-surface)]`.

### Sidebar
- **Path:** `apps/web/components/layout/Sidebar.tsx`
- **Purpose:** Desktop navigation drawer customized per user role (`entrepreneur`, `mentor`, `super_admin`).
- **Tokens used:** `w-[var(--layout-sidebar)]`, `h-[var(--layout-topbar)]`, `bg-[var(--color-surface)]`, `bg-[var(--color-accent-subtle)]`, `text-[var(--color-accent)]`.

### BottomNav
- **Path:** `apps/web/components/layout/BottomNav.tsx`
- **Purpose:** Mobile sticky bottom navigation bar (<1024px) with role-tailored high-frequency action tabs.
- **Tokens used:** `border-[var(--color-border)]`, `bg-[var(--color-surface)]`, `text-[var(--color-accent)]`, `shadow-[var(--shadow-lg)]`.

### DataTable
- **Path:** `apps/web/components/ui/DataTable.tsx`
- **Purpose:** Dense, accessible data table supporting generic rows, custom columns, loading/empty/error states, and row click callbacks.
- **Tokens used:** `border-[var(--color-border)]`, `bg-[var(--color-surface-sunken)]`, `h-[var(--grid-header)]`, `h-[var(--grid-row-default)]`, `hover:bg-[var(--color-surface-hover)]`.

### FormField & Input
- **Path:** `apps/web/components/ui/FormField.tsx`
- **Purpose:** Form field wrapper per PRD §5.1 adhering to top-aligned labels, error message displays, and accessible ARIA attributes.
- **Tokens used:** `h-[var(--control-md)]`, `border-[var(--color-border)]`, `focus:border-[var(--color-border-focus)]`, `text-[var(--color-danger)]`.

### StatusBadge
- **Path:** `apps/web/components/ui/StatusBadge.tsx`
- **Purpose:** Displays system, document, agent, and content lifecycle status using semantic colors mapped strictly to `context/ui-tokens.md`.
- **Variants:** `neutral`, `info`, `success`, `warning`, `danger`.
- **Tokens used:** `--color-{variant}-subtle`, `--color-{variant}`, `--color-{variant}-border`.

### LoadingState, EmptyState, ErrorState
- **Path:** `apps/web/components/ui/{LoadingState,EmptyState,ErrorState}.tsx`
- **Purpose:** Standardized feedback states for all screens and data collections.
- **Tokens used:** `border-[var(--color-border)]`, `bg-[var(--color-surface)]`, actionable retry triggers, `--color-danger` accents.

### OnboardingChat
- **Path:** `apps/web/app/(dashboard)/onboarding/page.tsx`
- **Purpose:** Conversational interactive onboarding chat interface per PRD §30.1 wireframe with SSE streaming, message persistence, thinking indicator, and completion state banner.
- **Tokens used:** `bg-[var(--color-surface)]`, `bg-[var(--color-surface-sunken)]`, `bg-[var(--color-accent)]`, `text-[var(--color-fg-inverse)]`, `border-[var(--color-border)]`, `bg-[var(--color-status-success-bg)]`, `text-[var(--color-status-success-fg)]`.

### BusinessProfileView
- **Path:** `apps/web/app/(dashboard)/business/page.tsx`
- **Purpose:** Master view and editor for entrepreneur business profile (F-004) with field grouping, multi-platform chips, tone selector, and autosave feedback.
- **Tokens used:** `bg-[var(--color-surface)]`, `border-[var(--color-border)]`, `text-[var(--color-fg)]`, `text-[var(--color-fg-muted)]`, `bg-[var(--color-accent)]`, `text-[var(--color-fg-inverse)]`.

### ProductEditor
- **Path:** `apps/web/app/(dashboard)/products/page.tsx`
- **Purpose:** Product & service catalog editor (F-005) with dynamic itemized cost breakdowns, live margin computation, selling price validation, and delete confirmation modal.
- **Tokens used:** `bg-[var(--color-surface)]`, `border-[var(--color-border)]`, `bg-[var(--color-surface-sunken)]`, `text-[var(--color-fg)]`, `text-[var(--color-fg-muted)]`, `bg-[var(--color-accent)]`, `text-[var(--color-fg-inverse)]`, `text-[var(--color-status-success-fg)]`, `text-[var(--color-danger)]`.

### ValidationReportView
- **Path:** `apps/web/app/(dashboard)/validation/page.tsx`
- **Purpose:** Business idea validation report view (F-006) showing feasibility score badge, competitor cards with pricing/strengths/weaknesses, demand level indicator, and strategic launch recommendations.
- **Tokens used:** `bg-[var(--color-surface)]`, `border-[var(--color-border)]`, `bg-[var(--color-surface-sunken)]`, `text-[var(--color-fg)]`, `text-[var(--color-fg-muted)]`, `bg-[var(--color-accent)]`, `text-[var(--color-fg-inverse)]`, `StatusBadge` variants (`success`, `warning`, `info`).

### PricingBreakEvenView
- **Path:** `apps/web/app/(dashboard)/pricing/page.tsx`
- **Purpose:** Pricing and break-even view (F-007) matching PRD §30.2 wireframe, displaying unit economics table, gross margin badges, monthly overhead slider/input, automated risk flags, AI positioning advice, and approval actions.
- **Tokens used:** `bg-[var(--color-surface)]`, `border-[var(--color-border)]`, `bg-[var(--color-surface-sunken)]`, `text-[var(--color-fg)]`, `text-[var(--color-fg-muted)]`, `bg-[var(--color-accent)]`, `text-[var(--color-fg-inverse)]`, `StatusBadge` variants (`success`, `warning`, `danger`), `formatPKR`, `formatPercentage`.

### PlanApprovalGateView
- **Path:** `apps/web/app/(dashboard)/plan/page.tsx`
- **Purpose:** Plan Approval Gate & 30-day Task Roadmap (F-008, F-009 - Human Gate 1) per PRD §30.2 wireframe. Displays consolidated validation snapshot, unit pricing economics, week-by-week interactive task checklist, Gate 1 approval/rejection modal, and execution progress tracking.
- **Tokens used:** `bg-[var(--color-surface)]`, `border-[var(--color-border)]`, `bg-[var(--color-surface-sunken)]`, `text-[var(--color-fg)]`, `text-[var(--color-fg-muted)]`, `bg-[var(--color-accent)]`, `text-[var(--color-fg-inverse)]`, `StatusBadge` variants (`success`, `warning`, `info`), `formatPKR`, `formatPercentage`, `formatDate`.

### AgentProgressOverlay
- **Path:** `apps/web/components/agents/AgentProgressOverlay.tsx`
- **Purpose:** Real-time Server-Sent Events (SSE) progress overlay bottom-sheet / modal (F-042 / PRD §648-669). Displays live agent execution steps (completed, in-progress spinner, pending), dismiss to background with floating status pill, and cancellation trigger.
- **Tokens used:** `bg-[var(--color-surface-raised)]`, `border-[var(--color-border)]`, `bg-[var(--color-surface-sunken)]`, `text-[var(--color-fg)]`, `text-[var(--color-fg-muted)]`, `bg-[var(--color-accent)]`, `text-[var(--color-accent-fg)]`, `text-[var(--color-status-success)]`, `text-[var(--color-status-danger)]`, `shadow-[var(--shadow-xl)]`.

### ContentOutlineGateView
- **Path:** `apps/web/app/(dashboard)/content/outline/page.tsx`
- **Purpose:** Content Outline Approval Gate (F-010 - Human Gate 2 / PRD §12.1, §36.7, §36.16). Displays 30-day concept briefs, weekly strategic journey themes, content mix & pillars breakdown, competitor benchmark research with search-informed hashtags, revision request dialog with feedback notes, and Gate 2 approval trigger.
- **Tokens used:** `bg-[var(--color-surface)]`, `border-[var(--color-border)]`, `bg-[var(--color-surface-sunken)]`, `text-[var(--color-fg)]`, `text-[var(--color-fg-muted)]`, `bg-[var(--color-accent)]`, `text-[var(--color-fg-inverse)]`, `StatusBadge` variants (`success`, `warning`, `info`), `LoadingState`, `EmptyState`.

### ContentCalendarView
- **Path:** `apps/web/app/(dashboard)/content/calendar/page.tsx`
- **Purpose:** 30-Day Content Calendar month view (F-011 / PRD §5.2, §12.3, §27). Displays 30-day responsive post cards with format icons (Reel, Carousel, Story, Static), strategic pillar tags, hook and caption snippets, 5-card progress summary metrics (Total, Draft, Approved, Posted, Skipped), week tabs and multi-attribute filter bar (status, format, pillar), and an accessible slide-over preview drawer with copy triggers (hook, caption, hashtags chips, visual prompts) and one-click status transitions.
- **Tokens used:** `bg-[var(--color-surface)]`, `border-[var(--color-border)]`, `bg-[var(--color-surface-hover)]`, `text-[var(--color-fg)]`, `text-[var(--color-fg-muted)]`, `bg-[var(--color-accent)]`, `text-[var(--color-fg-inverse)]`, `StatusBadge` variants (`neutral`, `success`, `info`, `warning`), `LoadingState`, `EmptyState`, `AppShell`.

### ContentItemEditorView
- **Path:** `apps/web/app/(dashboard)/content/items/[id]/page.tsx`
- **Purpose:** Full master post editor screen (F-012 / PRD §5.2, §12.3). Allows entrepreneurs to customize hook/opening line, full Roman Urdu/English caption, CTA, hashtags, best posting time hint, scheduled date, post status, and AI visual prompts (image prompt, video script storyboard) with real-time character counters, 1-click copy triggers, and status badges.
### TodayPostView
- **Path:** `apps/web/app/(dashboard)/content/today/page.tsx`
- **Purpose:** Daily post execution view (F-013 / PRD §12.3, W-003). High-focus screen for entrepreneurs featuring one-click copy buttons for opening hook, full caption, strategic hashtags, and visual prompts (AI image photography prompt, reel storyboard script), live post verification banner, and an accessible confirmation modal (`aria-modal="true"`) to mark the post as published on Instagram/Facebook with live URL capture.
- **Tokens used:** `bg-[var(--color-surface)]`, `border-[var(--color-border)]`, `bg-[var(--color-surface-hover)]`, `text-[var(--color-fg)]`, `text-[var(--color-fg-muted)]`, `bg-[var(--color-accent)]`, `text-[var(--color-fg-inverse)]`, `StatusBadge` variants, `LoadingState`, `EmptyState`, `AppShell`.

### ResearchReportView
- **Path:** `apps/web/app/(dashboard)/content/research/page.tsx`
- **Purpose:** Market & competitor research intelligence view (F-014 / PRD §5.2, §12.1, §36.15). Displays competitor teardown cards (price point, strengths, vulnerabilities), strategic differentiation levers, hashtag clusters (broad, niche, local) with copy actions, research confidence score indicator, and source reference URLs.
- **Tokens used:** `bg-[var(--color-surface)]`, `border-[var(--color-border)]`, `bg-[var(--color-surface-hover)]`, `text-[var(--color-fg)]`, `text-[var(--color-fg-muted)]`, `bg-[var(--color-accent)]`, `text-[var(--color-fg-inverse)]`, `LoadingState`, `EmptyState`, `AppShell`.

### EntrepreneurDashboardView
- **Path:** `apps/web/app/(dashboard)/dashboard/page.tsx`
- **Purpose:** Executive home dashboard (D-001 / PRD §7, §8, §29.1). Displays 4 core drill-down KPI cards (Tasks Done, Posts Published, Engagement Trend, Revenue this week in PKR), 7-day audience engagement sparkline/bar chart, Today's Post spotlight card with quick actions, upcoming launch plan tasks checklist with status badges, and quick-launchpad shortcuts.
- **Tokens used:** `bg-[var(--color-surface)]`, `border-[var(--color-border)]`, `bg-[var(--color-surface-hover)]`, `text-[var(--color-fg)]`, `text-[var(--color-fg-muted)]`, `bg-[var(--color-accent)]`, `text-[var(--color-fg-inverse)]`, `StatusBadge` variants, `LoadingState`, `EmptyState`, `AppShell`, `formatPKR`.

