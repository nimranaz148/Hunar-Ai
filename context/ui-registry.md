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
| MentorServicesBrowseView | `apps/web/app/(dashboard)/mentors/page.tsx` | Production |
| BookingTransactionView | `apps/web/app/(dashboard)/mentors/book/page.tsx` | Production |
| MyBookingsListView | `apps/web/app/(dashboard)/mentors/bookings/page.tsx` | Production |
| MentorProfileEditorView | `apps/web/app/(dashboard)/mentor/profile/page.tsx` | Production |
| MentorAvailabilityView | `apps/web/app/(dashboard)/mentor/availability/page.tsx` | Production |
| MentorDashboardView | `apps/web/app/(dashboard)/mentor/page.tsx` | Production |
| MenteeReportView | `apps/web/app/(dashboard)/mentor/mentees/page.tsx` | Production |
| MentorEarningsView | `apps/web/app/(dashboard)/mentor/earnings/page.tsx` | Production |
| SessionNotesModal | `apps/web/components/mentor/SessionNotesModal.tsx` | Production |
| MentorApprovalView | `apps/web/app/(admin)/admin/mentors/page.tsx` | Production |
| ReviewModal | `apps/web/components/mentor/ReviewModal.tsx` | Production |
| MetricsEntryModal | `apps/web/components/metrics/MetricsEntryModal.tsx` | Production |
| PerformanceMetricsView | `apps/web/app/(dashboard)/metrics/page.tsx` | Production |
| PerformanceCharts | `apps/web/components/metrics/PerformanceCharts.tsx` | Production |
| WeeklyReviewGateModal | `apps/web/components/metrics/WeeklyReviewGateModal.tsx` | Production |


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

### MentorServicesBrowseView
- **Path:** `apps/web/app/(dashboard)/mentors/page.tsx`
- **Purpose:** Mentor services discovery catalog and marketplace for entrepreneurs (F-018 / PRD §5, §12.3, §13.2). Features search input across service titles, descriptions, and mentor names; specialty/niche filter pills (Handmade, Fashion, Food, Beauty, Tutoring, Digital); format filter select (1-on-1 Session, Review, Done-With-You, Package); maximum budget input (PKR); responsive service cards with mentor avatars, ratings, review counts, durations, and fees; and an accessible slide-over detail drawer (`role="dialog"`) with full service breakdowns and "Continue to Book" action.
- **Tokens used:** `bg-[var(--color-surface)]`, `border-[var(--color-border)]`, `bg-[var(--color-surface-hover)]`, `bg-[var(--color-accent-subtle)]`, `text-[var(--color-accent)]`, `text-[var(--color-fg)]`, `text-[var(--color-fg-muted)]`, `shadow-[var(--shadow-sm)]`, `EmptyState`, `AppShell`.

### BookingTransactionView
- **Path:** `apps/web/app/(dashboard)/mentors/book/page.tsx`
- **Purpose:** Mentor session booking and simulated escrow checkout transaction view (F-019 / PRD §5, §10 W-005, §12.3, §13.2). Displays selected mentor and service overview (avatar, title, niche, duration, rating), required consultation notes/challenges input with 1000-character counter, optional preferred date/time selector, PKR payment summary, simulated escrow guarantee badge and trust disclosures, and post-booking confirmation receipt card displaying generated booking reference ID, mentor details, and next-steps guidance.
- **Tokens used:** `bg-[var(--color-surface)]`, `bg-[var(--color-surface-subtle)]`, `border-[var(--color-border)]`, `text-[var(--color-fg)]`, `text-[var(--color-fg-subtle)]`, `bg-[var(--color-accent)]`, `text-[var(--color-fg-inverse)]`, `shadow-[var(--shadow-sm)]`, `shadow-[var(--shadow-md)]`, `AppShell`.

### MyBookingsListView
- **Path:** `apps/web/app/(dashboard)/mentors/bookings/page.tsx`
- **Purpose:** Participant mentorship booking management screen for entrepreneurs (F-020 / PRD §5, §10 W-005, §12.3, §13.2). Displays sub-navigation tabs between "Browse Services" and "My Bookings"; status filter tabs (All, Requested, Accepted & Scheduled, Completed, Cancelled & Declined); booking cards with mentor info, service details, date/time scheduling, amount in PKR, simulated escrow status (held, released, refunded), and lifecycle badge; slide-over drawer with full consultation goals and mentor session feedback notes; and a cancellation confirmation modal with instant escrow refund guarantee.
- **Tokens used:** `bg-[var(--color-surface)]`, `border-[var(--color-border)]`, `bg-[var(--color-surface-hover)]`, `bg-[var(--color-accent-subtle)]`, `text-[var(--color-accent)]`, `text-[var(--color-fg)]`, `text-[var(--color-fg-muted)]`, `shadow-[var(--shadow-sm)]`, `AppShell`.

### MentorProfileEditorView
- **Path:** `apps/web/app/(dashboard)/mentor/profile/page.tsx`
- **Purpose:** Advisor profile editor and management interface for registered mentors (F-021 / PRD §5.1, §12.3, §13.2). Displays read-only account credentials (name, email), primary Pakistani city selector, avatar image URL input, coaching specialties/niches multi-select toggle pills, languages spoken multi-select toggle pills, 2000-character markdown/text bio editor with live counter, rating and review counters, profile state badge, reset changes action, save profile trigger with inline toast alerts, and audit metadata footer.
- **Tokens used:** `bg-[var(--color-surface)]`, `border-[var(--color-border)]`, `bg-[var(--color-surface-hover)]`, `bg-[var(--color-accent)]`, `text-[var(--color-accent)]`, `text-[var(--color-fg)]`, `text-[var(--color-fg-muted)]`, `text-[var(--color-fg-inverse)]`, `shadow-[var(--shadow-sm)]`, `AppShell`.

### MentorServicesManagementView
- **Path:** `apps/web/app/(dashboard)/mentor/services/page.tsx`
- **Purpose:** Coaching service offerings CRUD management dashboard for mentors (F-022 / PRD §5, §12.3, §13.2, §14.1). Features summary KPI cards (Total Services, Active Offerings, Average Fee in PKR), responsive catalog cards with format and niche badges, duration in minutes, PKR pricing, one-click toggle for Active/Paused status, full-featured Create/Edit modal with strict validation (title, description, duration in 15m increments, niche, format, price), accessible Delete Confirmation dialog with active bookings safety guard, and feedback toast notifications.
- **Tokens used:** `bg-[var(--color-surface)]`, `border-[var(--color-border)]`, `bg-[var(--color-surface-hover)]`, `bg-[var(--color-accent)]`, `text-[var(--color-accent)]`, `text-[var(--color-fg)]`, `text-[var(--color-fg-muted)]`, `text-[var(--color-fg-inverse)]`, `shadow-[var(--shadow-sm)]`, `shadow-[var(--shadow-xl)]`, `AppShell`, `formatPKR`.

### MentorAvailabilityView
- **Path:** `apps/web/app/(dashboard)/mentor/availability/page.tsx`
- **Purpose:** Weekly recurrent mentoring availability editor for mentors (F-023 / PRD §5, §12.3, §13.2, §14.1, §14.2). Features a 7-day schedule matrix (Monday–Sunday) with active/inactive toggles, time interval selectors in 30-minute increments, live duration calculation, helper quick actions ("Copy Mon to Weekdays", "Reset Defaults"), KPI metrics (Weekly Available Hours, Active Days of 7, Timezone PKT), inline validation preventing `start_time >= end_time`, unsaved change detection banner, and persisted updates via `PUT /api/v1/mentors/me/availability` with audit logging.
- **Tokens used:** `bg-card`, `border-border`, `bg-muted`, `bg-primary`, `text-primary`, `text-primary-foreground`, `text-muted-foreground`, `text-foreground`, `text-destructive`, `shadow-xs`, `shadow-sm`, `AppShell`.

### MentorDashboardView
- **Path:** `apps/web/app/(dashboard)/mentor/page.tsx`
- **Purpose:** Executive operations dashboard for registered mentors (F-024 / D-002 / PRD §5, §7, §8, §29.2). Displays 4 core PRD drill-down KPI cards (Pending Requests with urgent review alert, Upcoming Sessions with direct mentee link, Total Simulated Earnings in PKR via `formatPKR`, Client Rating with star count and review total); Pending Requests management cards with mentee name, service title, requested fee, duration, entrepreneur session goals/notes, and inline 1-click "Accept Request" and "Decline" (with escrow refund confirmation dialog); Upcoming Sessions agenda grid with scheduled datetime formatting, status badges, and Mentee Brief shortcuts; and Quick Actions launchpad to Availability, Services, and Profile.
- **Tokens used:** `bg-card`, `border-border`, `bg-muted`, `bg-emerald-50`, `text-emerald-700`, `bg-blue-50`, `text-blue-700`, `bg-purple-50`, `text-purple-600`, `bg-amber-50`, `text-amber-800`, `text-muted-foreground`, `text-foreground`, `shadow-2xs`, `shadow-xs`, `shadow-xl`, `StatusBadge`, `LoadingState`, `EmptyState`, `AppShell`, `formatPKR`, `formatDate`, `formatDateTime`.

### MenteeReportView
- **Path:** `apps/web/app/(dashboard)/mentor/mentees/page.tsx`
- **Purpose:** Mentee roster, progress inspection, and AI synthesis brief viewer for mentors (F-025 / PRD §5, §10 W-005, §12.3, §13.2, §36.14, §36.23). Displays 3 top-level KPI cards (Total Booked Mentees, Tasks Completed Across Mentees, Average Execution Rate), instant search filter across mentee names, ventures, niches, and Pakistani cities, mentee summary cards with launch progress bar and "View Mentee Brief" actions; deep link URL state synchronization (`?id=menteeId`); and a comprehensive slide-in detail report featuring:
  - Venture Identity Header: entrepreneur details, budget, weekly hours, platforms, languages, and target customer profile.
  - AI Mentor Brief Card: venture maturity stage badge, executive summary narrative, identified bottlenecks & blockers, recommended session focus areas, bilingual Urdu/English discussion prompts, and 1-2 week growth priorities.
  - 30-Day Launch Roadmap Execution: completion percentage bar and categorized task milestone cards with status badges and due dates.
  - Market Validation & Content Engine Snapshot: validation confidence indicator, competitor differentiator summary, product catalog count, and content calendar publication progress bar.
  - Session History With Mentor: chronological list of past and upcoming advisory sessions with fees, dates, mentee goals, and mentor consultation notes.
- **Tokens used:** `bg-card`, `border-border`, `bg-muted`, `bg-primary`, `text-primary`, `bg-emerald-50`, `text-emerald-800`, `border-emerald-300`, `bg-blue-50`, `text-blue-900`, `border-blue-200`, `text-amber-600`, `text-purple-600`, `text-muted-foreground`, `text-foreground`, `shadow-2xs`, `shadow-xs`, `StatusBadge`, `LoadingState`, `EmptyState`, `ErrorState`, `AppShell`, `formatPKR`, `formatDate`.

### MentorEarningsView
- **Path:** `apps/web/app/(dashboard)/mentor/earnings/page.tsx`
- **Purpose:** Mentor earnings, escrow transparency, and transaction ledger report (F-026 / R-006 / PRD §5.2, §8, §10 W-005, §12.3, §13.2, §14.2). Displays 4 primary drill-down KPI cards (Total Earned in PKR released, In Escrow pending in PKR, Total Sessions Delivered, and Average Session Fee in PKR), period filter pills (All Time, This Month, Last Month, This Year), simulated escrow payout guarantee disclosure banner with Raast/bank deposit status, monthly earnings trend chart with proportional bar columns, transaction status filter pills (All, Released, In Escrow, Refunded), keyword search across mentee names and session titles, and a dense, responsive transaction ledger table with timestamps, mentee details, gross fees, and semantic status badges.
- **Tokens used:** `bg-card`, `border-border`, `bg-muted`, `bg-primary`, `text-primary`, `text-primary-foreground`, `text-emerald-600`, `bg-emerald-50`, `border-emerald-300`, `text-amber-600`, `text-blue-600`, `text-purple-600`, `text-muted-foreground`, `text-foreground`, `shadow-2xs`, `StatusBadge`, `LoadingState`, `EmptyState`, `ErrorState`, `AppShell`, `formatPKR`, `formatDate`.

### SessionNotesModal
- **Path:** `apps/web/components/mentor/SessionNotesModal.tsx`
- **Purpose:** Post-session consultation notes editor and automated escrow release trigger for mentors (F-027 / PRD §5.2, §10 W-005, §13.2). Displays session context (mentee name, service title, scheduled time, gross fee in PKR), textarea with live character counter enforcing 10–2000 character validation, escrow release guarantee banner, and submission handling that transitions booking to `completed` and releases simulated escrow payout.
- **Props:** `isOpen: boolean`, `booking: { id: string; mentee_name: string; service_title: string; amount_pkr: number; scheduled_at?: string | null; session_notes?: string | null } | null`, `onClose: () => void`, `onSuccess: (updatedBooking: BookingDetailResponse) => void`.
- **Tokens used:** `bg-card`, `border-border`, `bg-muted`, `bg-primary`, `text-primary-foreground`, `bg-emerald-50`, `border-emerald-300`, `text-emerald-950`, `text-emerald-700`, `text-emerald-600`, `text-destructive`, `shadow-xl`, `shadow-2xs`, `formatPKR`.

### MentorApprovalView
- **Path:** `apps/web/app/(admin)/admin/mentors/page.tsx`
- **Purpose:** Super Admin mentor registration review and verification portal (F-030 / PRD §5.2, §10 W-006, §13.2 line 1072). Enables Super Admins to inspect pending mentor applications, search and filter by niche or keyword, review applicant biography, city, and spoken languages, perform 1-click approvals (`POST /api/v1/admin/mentors/{id}/approve`) that activate the mentor user account and unlock the mentor profile, or decline applications with an optional feedback reason dialog (`POST /api/v1/admin/mentors/{id}/decline`), generating tamper-proof `mentor.approved` and `mentor.declined` audit events.
- **Tokens used:** `bg-[var(--color-surface)]`, `border-[var(--color-border)]`, `text-[var(--color-fg)]`, `text-[var(--color-fg-muted)]`, `bg-[var(--color-accent)]`, `text-[var(--color-fg-inverse)]`, `bg-[var(--color-accent-subtle)]`, `text-[var(--color-accent)]`, `bg-[var(--color-success-subtle)]`, `border-[var(--color-success)]`, `text-[var(--color-success-fg)]`, `bg-[var(--color-danger-subtle)]`, `border-[var(--color-danger)]`, `text-[var(--color-danger-fg)]`, `shadow-[var(--shadow-sm)]`, `AppShell`, `StatusBadge`, `FormField`, `formatDate`.

### MentorApplicationView
- **Path:** `apps/web/app/(auth)/mentor-apply/page.tsx`
- **Purpose:** Public prospective mentor registration and application portal (F-040 / PRD §5.2, §10 W-006, §13.2). Enables industry experts to apply as mentors by entering name, email, password with strict complexity validation (min 8 chars, 1 uppercase, 1 digit), Pakistani city, detailed biography (10-2000 chars), interactive niche tag pills (Embroidery, Baking, Tailoring, Candle Making, Digital Marketing, etc.), and multilingual teaching selections (Urdu, English, Punjabi, Sindhi, Pashto). Submits to `POST /api/v1/auth/mentor-apply`, creating pending `User` and `MentorProfile` records with a `mentor.applied` audit event, and transitions to a clean confirmation screen awaiting Super Admin review.
- **Tokens used:** `bg-[var(--color-canvas)]`, `bg-[var(--color-surface)]`, `border-[var(--color-border)]`, `text-[var(--color-fg)]`, `text-[var(--color-fg-muted)]`, `bg-[var(--color-accent)]`, `text-[var(--color-fg-inverse)]`, `bg-[var(--color-danger-subtle)]`, `border-[var(--color-danger-border)]`, `text-[var(--color-danger)]`, `text-[var(--color-success)]`, `shadow-[var(--shadow-md)]`, `shadow-[var(--shadow-sm)]`, `FormField`, `Input`.

### ReviewModal
- **Path:** `apps/web/components/mentor/ReviewModal.tsx`
- **Purpose:** Post-session mentorship evaluation modal for entrepreneurs (F-041 / PRD §5.2, §10 W-005, §13.2). Enables mentees to rate completed sessions on an interactive 1-5 star scale with semantic qualitative rating labels (Needs Improvement, Fair, Good, Very Helpful, Excellent & Highly Recommended), optional written qualitative feedback with a 1000-character live counter, inline API error handling, and trust transparency banner assuring verified public display. Transitions booking state from `completed` to `reviewed`, recalculates mentor average rating and total review counts, and creates a `booking.reviewed` audit event.
- **Props:** `isOpen: boolean`, `booking: { id: string; mentor_name: string; service_title: string; amount_pkr?: number; scheduled_at?: string | null } | null`, `onClose: () => void`, `onSuccess: (updatedBooking: BookingDetailResponse) => void`.
- **Tokens used:** `bg-[var(--color-canvas)]`, `bg-[var(--color-surface)]`, `border-[var(--color-border)]`, `text-[var(--color-fg)]`, `text-[var(--color-fg-muted)]`, `text-[var(--color-fg-subtle)]`, `bg-[var(--color-accent)]`, `text-[var(--color-fg-inverse)]`, `bg-[var(--color-accent-subtle)]`, `text-[var(--color-accent)]`, `text-amber-400`, `fill-amber-400`, `shadow-2xl`, `shadow-xs`, `Star`, `MessageSquare`, `Loader2`.

### MetricsEntryModal
- **Path:** `apps/web/components/metrics/MetricsEntryModal.tsx`
- **Purpose:** Manual social engagement, customer DMs, and sales logging modal (Task 48 / F-015 / PRD §5.2, §10 W-004, §12.3, §13.2). Allows entrepreneurs to log manual performance metrics across Instagram and Facebook channels with date range selection (`period_start`, `period_end`), optional post attribution link to content items, engagement metrics (views, reach, likes, comments, shares, saves), and conversion numbers (follower delta, inquiries, orders, revenue PKR). Validates date chronologies and non-negative values, calls `POST /api/v1/businesses/{id}/metrics`, and logs append-only `metrics.logged` audit events.
- **Props:** `isOpen: boolean`, `businessId: string`, `recentPosts?: Array<{ id: string; day: number; format: string; hook: string }>`, `onClose: () => void`, `onSuccess: (snapshot: MetricsSnapshotResponse) => void`.
- **Tokens used:** `bg-[var(--color-canvas)]`, `bg-[var(--color-surface)]`, `border-[var(--color-border)]`, `text-[var(--color-fg)]`, `text-[var(--color-fg-muted)]`, `bg-[var(--color-accent)]`, `text-[var(--color-fg-inverse)]`, `bg-[var(--color-accent-subtle)]`, `text-[var(--color-accent)]`, `bg-[var(--color-danger-subtle)]`, `text-[var(--color-danger)]`, `shadow-2xl`, `shadow-xs`, `InstagramIcon`, `FacebookIcon`.

### PerformanceMetricsView
- **Path:** `apps/web/app/(dashboard)/metrics/page.tsx`
- **Purpose:** Central marketing & sales performance dashboard (Task 48 / F-015 / PRD §5.2, §10 W-004, §12.3, §13.2). Displays 3-day coaching threshold unlock indicator (PRD §10 W-004) for Weekly AI Coach, 4 summary KPI cards (Total Logged Revenue PKR, Total Views, Customer Inquiries/DMs, Net Follower Delta), channel filter tabs (All Channels, Instagram, Facebook), ledger of recorded snapshot cards with engagement breakdown and linked post badges, and a slide-over detail drawer for deep metric review.
- **Tokens used:** `AppShell`, `bg-[var(--color-surface)]`, `border-[var(--color-border)]`, `text-[var(--color-fg)]`, `text-[var(--color-fg-muted)]`, `bg-[var(--color-accent)]`, `text-[var(--color-fg-inverse)]`, `bg-[var(--color-accent-subtle)]`, `text-[var(--color-accent)]`, `bg-emerald-500/10`, `text-emerald-600`, `bg-pink-500/10`, `text-pink-600`, `bg-blue-500/10`, `text-blue-600`, `shadow-xs`, `shadow-2xl`.

### PerformanceCharts
- **Path:** `apps/web/components/metrics/PerformanceCharts.tsx`
- **Purpose:** Interactive analytics visualizer with time series trends, conversion tracking, reach & engagement multi-bar comparisons, and platform share donuts (Task 49 / F-016 / PRD §2.1, §4, §5.2, §10 W-004, §13.2 line 1055, §29.1). Provides timeframe filter pills (7, 14, 30 days, All Time) and channel switchers (All Channels, Instagram, Facebook). Renders dual-axis Revenue (PKR) & Customer Orders area chart with responsive gradients, reach & engagement activity breakdown (Views, Interactions, DMs/Inquiries), channel distribution donuts, and top performing attributed content items ranking.
- **Props:** `chartsData: MetricsChartsResponse`, `days: number | null`, `platform: string | null`, `onDaysChange: (days: number | null) => void`, `onPlatformChange: (platform: string | null) => void`.
- **Tokens used:** `bg-[var(--color-surface)]`, `border-[var(--color-border)]`, `text-[var(--color-fg)]`, `text-[var(--color-fg-muted)]`, `bg-[var(--color-accent)]`, `text-[var(--color-fg-inverse)]`, `bg-[var(--color-accent-subtle)]`, `text-[var(--color-accent)]`, `bg-emerald-500/10`, `text-emerald-600`, `shadow-xs`.

### WeeklyReviewGateModal
- **Path:** `apps/web/components/metrics/WeeklyReviewGateModal.tsx`
- **Purpose:** Human Gate 3 approval dialog for Weekly AI Coach strategy (Task 50 / F-017 / PRD §5.2, §10 W-004, §13.2 line 1044-1046, §36.7). Presents empirical marketing diagnosis (views, revenue, customer inquiries, winning format), Weekly Coach rationale, proposed adjustments to upcoming content calendar items (format shifts, upgraded Urdu/Roman-Urdu hooks, recommended hashtags), and mentor consultation advice. Provides 1-click Approve Strategy (applying updates to content items and logging `agent.proposal.approved`) and Reject with Feedback (recording reason and logging `agent.proposal.rejected`).
- **Props:** `isOpen: boolean`, `businessId: string`, `proposal: ProposalDetailResponse | null`, `onClose: () => void`, `onApproved: (updatedProposal: ProposalDetailResponse) => void`, `onRejected: (updatedProposal: ProposalDetailResponse) => void`, `onRefreshNeeded?: () => void`.
- **Tokens used:** `bg-[var(--color-surface)]`, `bg-[var(--color-canvas)]`, `border-[var(--color-border)]`, `text-[var(--color-fg)]`, `text-[var(--color-fg-muted)]`, `bg-purple-500/10`, `text-purple-600`, `bg-emerald-500/10`, `text-emerald-600`, `bg-rose-500/10`, `text-rose-600`, `shadow-2xl`.






