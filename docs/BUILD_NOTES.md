# Build Notes

This file records technical assumptions, design rationale, and edge-case handling decisions made during autonomous execution per the Working Agreement.

---

## Task 27: Content Outline Approval — F-010 (Human Gate 2)

### Assumptions & Decisions
1. **Database Schema & Migrations (`0007_content_calendars_and_research`):**
   - Implemented `content_calendars` table storing the 30-day concept plan with JSONB columns for `pillars`, `weekly_themes`, `format_distribution`, and `day_briefs`.
   - Implemented `research_reports` table storing competitor teardowns, strategic differentiation recommendations (`how_to_be_better`), search-informed hashtags (`broad`, `niche`, `local`), and confidence score.
   - Used strict check constraints for `status` (`'not_started', 'researching', 'strategizing', 'awaiting_approval', 'generating', 'qa', 'ready', 'approved', 'revision_requested'`).
   - Updated `test_database.py` Alembic head revision assertion to `0007_content_calendars_and_research`.

2. **Authorization & Multi-Tenancy:**
   - Enforced business ownership scoping on `GET /api/v1/businesses/{id}/content/outline`, `POST /approve`, and `POST /revise`.
   - Cross-tenant access is rejected with `403 Forbidden` (`test_get_content_outline_cross_tenant_forbidden`).
   - Role protection enforced via `require_role("entrepreneur", "super_admin")`.

3. **Audit Trail:**
   - Append-only audit rows logged for `content_outline.approved` and `content_outline.revision_requested`.
   - Used `meta` parameter in `record_audit_log` with business ID and note details for PII-safe logging.

4. **Frontend Architecture & React 19 Compatibility:**
   - Built responsive Human Gate 2 approval interface at `apps/web/app/(dashboard)/content/outline/page.tsx`.
   - Rendered strategic pillars, weekly themes, format distribution badges (Reels, Carousels, Stories, Static), and week-by-week filtering for the 30 day-brief items.
   - Avoided manual `useMemo` dependency mismatch warnings with React 19 compiler by computing day filtering directly during render.
   - Configured `pool: "threads"` in `vitest.config.mts` ensuring clean execution on WSL environments.
   - All 4 web component acceptance tests pass (`content-outline.test.tsx`), with zero ESLint and TypeScript issues.

5. **Verification:**
   - `scripts/verify.sh --lane api`: PASSED (97 unit/integration tests).
   - `scripts/verify.sh --lane web`: PASSED (45 Vitest tests, ESLint, TypeScript, Next.js 16 build).
   - `scripts/verify.sh --lane contract`: PASSED (OpenAPI client sync, 0 drift).

---

## Task 28: Content Calendar (month view) — F-011 (P0; role: Entrepreneur)

### Assumptions & Decisions
1. **Database Schema & Migration (`0008_content_items`):**
   - Implemented `content_items` table storing individual post items across the 30-day calendar cycle.
   - Schema fields: `id` (UUID PK), `calendar_id` (FK `content_calendars.id`), `day` (INT 1-30), `date` (DATE), `platform` (TEXT[]), `format` (VARCHAR), `pillar` (VARCHAR), `goal` (VARCHAR), `hook` (VARCHAR), `caption` (TEXT), `cta` (VARCHAR), `hashtags` (TEXT[]), `best_time_hint` (VARCHAR), `image_prompt` (JSONB), `video_prompt` (JSONB), `alt_text` (TEXT), `status` (VARCHAR default `'draft'`), `posted_at` (TIMESTAMPTZ), `post_url` (VARCHAR), `created_at`, `updated_at`.
   - Added check constraint on `status`: `'draft', 'approved', 'posted', 'skipped', 'needs_review'`.
   - Updated `test_database.py` Alembic head revision assertion to `0008_content_items`.

2. **Service & Multi-Tenancy Layer:**
   - `get_or_create_calendar_items`: Automatically initializes 30 individual content items from the approved `content_calendars.day_briefs` if not yet generated, guaranteeing a complete 30-day calendar view for entrepreneurs.
   - `get_calendar_view`: Computes live aggregate stats (`total`, `draft`, `approved`, `posted`, `skipped`, `needs_review`) and supports optional query filtering by `status`, `format`, and `pillar`.
   - Ownership scoping strictly enforced: Cross-tenant access returns 403 Forbidden.
   - Status updates via `update_content_item_status`: Updates status with append-only audit trail logging `content_item.status_changed`.

3. **API Endpoints & OpenAPI Contract:**
   - Added `GET /api/v1/businesses/{business_id}/content/calendar` to fetch 30-day items and summary metrics.
   - Added `PATCH /api/v1/businesses/{business_id}/content/items/{item_id}/status` to update post status (`draft`, `approved`, `posted`, `skipped`).
   - Synced `@hunar/api-client` with 0 contract drift (`verify.sh --lane contract`).

4. **Frontend Architecture (`apps/web/app/(dashboard)/content/calendar/page.tsx` & `/content/page.tsx`):**
   - 30-Day Calendar Grid layout with weekly tabs (W1: Days 1-7, W2: Days 8-14, W3: Days 15-21, W4: Days 22-30, All).
   - Format icons (Reel, Carousel, Story, Static), Pillar tags, Hook previews, and Status badges.
   - Filter bar: Status filter, Format filter, Pillar filter, and Week filter.
   - Metrics summary banner: 5 cards showing live counts for Total, Drafts, Approved, Posted, and Skipped.
   - Interactive Slide-over Preview Drawer (`aria-modal="true"`):
     - Displays full caption, hashtags chips with copy button, visual prompts (image prompt, video prompt) with copy buttons.
     - Quick status updater buttons (`Draft`, `Approve`, `Posted`, `Skip`) that dynamically recalculate stats and local calendar view state.
   - Created re-export at `apps/web/app/(dashboard)/content/page.tsx` so clicking "Content Calendar" in the sidebar works out of the box.
   - Fixed Vitest scoped assertions using `within(drawer)` and strict typing (`Record<string, unknown>`).

5. **Verification Results:**
   - `scripts/verify.sh --lane api`: PASSED (100 backend tests, Ruff, Mypy).
   - `scripts/verify.sh --lane contract`: PASSED (OpenAPI client sync, 0 drift).
   - `scripts/verify.sh --lane web`: PASSED (50 Vitest tests, ESLint, TypeScript, Turbopack build 22/22 routes).

---

## Task 29: Content Item Detail / Editor — F-012 (P0; role: Entrepreneur)

### Assumptions & Decisions
1. **API Endpoints & Schemas:**
   - Added `GET /api/v1/businesses/{business_id}/content/items/{item_id}` to fetch full item details.
   - Added `PUT /api/v1/businesses/{business_id}/content/items/{item_id}` with `UpdateContentItemRequest` schema, allowing full customization of hook, caption, cta, hashtags, best_time_hint, image_prompt, video_prompt, alt_text, status, and scheduled date.
   - Used `import datetime as dt` in schemas to avoid namespace shadowing in Python 3.14.

2. **Authorization & Audit Trail:**
   - Enforced tenant ownership verification: Cross-tenant attempts return 403 Forbidden.
   - Append-only audit logging emits `content_item.updated` recording `actor_id`, `actor_role`, `item.id`, and list of updated fields in `meta`.

3. **Frontend Architecture (`apps/web/app/(dashboard)/content/items/[id]/page.tsx`):**
   - Built full-featured master editor screen for individual campaign posts.
   - Top metadata summary: Campaign Day, Format & Strategic Pillar badges, scheduled date picker, and status dropdown with semantic `StatusBadge`.
   - Post messaging form: Hook / opening line, full multi-line caption with real-time character counter, CTA field, best posting time hint, and space/comma-separated hashtags.
   - Visual production directives: AI image generation prompt / photography directive textarea with 1-click copy, and video storyboard script textarea with 1-click copy.
   - Copy actions with temporary "Copied!" feedback and toast notifications on save.

4. **Verification Results:**
   - `scripts/verify.sh --lane api`: PASSED (103 backend tests, Ruff, Mypy).
   - `scripts/verify.sh --lane contract`: PASSED (OpenAPI client sync, 0 drift).
   - `scripts/verify.sh --lane web`: PASSED (53 Vitest tests, ESLint, TypeScript, Next.js Turbopack build with dynamic route `/content/items/[id]`).

---

## Task 30: Today View — F-013 (P0; role: Entrepreneur)

### Assumptions & Decisions
1. **API Endpoints & Schemas:**
   - Added `GET /api/v1/businesses/{business_id}/content/today` to return the post scheduled for today's exact date (`date.today()`). Fallback behavior: If no post is scheduled for today's exact date, surfaces the earliest upcoming approved/unposted post.
   - Added `POST /api/v1/businesses/{business_id}/content/items/{item_id}/post` with `MarkPostAsPostedRequest` schema (`post_url?: string`), updating item status to `posted` and recording `posted_at = datetime.now(timezone.utc)`.
   - Append-only audit logging: Emits `content_item.posted` with post url and posted timestamp.
   - Cross-tenant requests strictly return 403 Forbidden.

2. **Frontend Architecture (`apps/web/app/(dashboard)/content/today/page.tsx`):**
   - Clean, high-focus daily execution view for entrepreneurs.
   - 1-click clipboard copy buttons for Opening Hook, Full Caption, Strategic Hashtags, Image Prompt, and Video Storyboard Script.
   - Published indicator banner with direct link to live social media URL if already posted.
   - Accessible Mark as Posted modal (`aria-modal="true"`) to confirm publication with optional live URL.
   - Refresh button and direct navigation to Month Calendar and Content Item Editor.

3. **Verification Results:**
   - `apps/api/tests/test_content_today.py`: PASSED (4/4 tests).
   - `apps/web/tests/content-today.test.tsx`: PASSED (4/4 tests).
   - `scripts/verify.sh --lane contract`: PASSED (0 drift).
   - Web typecheck (`tsc --noEmit`) and lint (`eslint`): PASSED.

---

## Task 31: Research Report View — F-014 (P0; role: Entrepreneur)

### Assumptions & Decisions
1. **API Endpoints & Schemas:**
   - Added `GET /api/v1/businesses/{business_id}/content/research` to return competitor teardowns, strategic differentiation levers, localized hashtag clusters, and search confidence score (`ResearchReportResponse`).
   - Reused existing `get_or_create_research_report` service function; verified strict business ownership isolation via `get_business_by_id(db, business_id, user)` (cross-tenant access returns 403 Forbidden).
   - OpenApi TypeScript client regenerated and verified drift-free.

2. **Frontend Architecture (`apps/web/app/(dashboard)/content/research/page.tsx`):**
   - High-value market intelligence report screen for entrepreneurs.
   - 3 top-level metrics cards: Competitors Profiled count, Research Confidence indicator (e.g. 88% High Confidence), and Curated Hashtag count.
   - Competitor Teardown grid displaying competitor names, handles, price point badges, verified key strengths, and identified vulnerabilities/market gaps.
   - "How to Outperform Competitors" section featuring strategic differentiation levers derived by the research agents.
   - Strategic Hashtag Clusters section categorized by Broad Reach, Niche Specific, and Local Geographic tags with individual cluster copy buttons and "Copy All" trigger.
   - External reference URLs list linking to competitor exploration tags and marketplaces.

3. **Verification Results:**
   - `apps/api/tests/test_content_research.py`: PASSED (3/3 tests).
   - `apps/web/tests/content-research.test.tsx`: PASSED (3/3 tests).
   - `scripts/verify.sh --lane contract`: PASSED (0 drift).
   - Web typecheck (`tsc --noEmit`) and lint (`eslint`): PASSED.

---

## Task 32: Entrepreneur Home Dashboard — D-001 (role: Entrepreneur)

### Assumptions & Decisions
1. **API Endpoints & Schemas (`EntrepreneurDashboardResponse`):**
   - Added `GET /api/v1/businesses/{business_id}/dashboard` consolidating 4 Core PRD KPIs:
     - `tasks_done_count` and `total_tasks_count` (aggregated from `launch_plans` + `plan_tasks`).
     - `posts_published_count` and `total_posts_count` (aggregated from `content_calendars` + `content_items`).
     - `engagement_change_pct` (7-day audience trend, e.g. +23%).
     - `revenue_this_week_pkr` (achieved/estimated revenue this week).
   - Spotlight post (`today_post`): dynamically locates scheduled post for today or earliest unposted approved item.
   - 7-day engagement points (`trend_7d`): Mon-Sun daily engagement & reach points for visual sparkline.
   - Top upcoming tasks (`upcoming_tasks`): 5 next pending tasks with title, category, week, status, and due date.
   - Ownership isolation enforced via `get_business_by_id(db, business_id, user)`.

2. **Frontend Architecture (`apps/web/app/(dashboard)/dashboard/page.tsx`):**
   - Implemented full executive home dashboard matching PRD §7, §8, §29.1 wireframes.
   - 4 Drill-Down KPI Cards linking to respective records:
     - Tasks Done → `/plan`
     - Posts Published → `/content/calendar`
     - Engagement (+23%) → `/metrics`
     - Revenue This Week → `/pricing`
   - 7-day audience engagement sparkline/bar chart with daily reach/interactions.
   - Today's Post Spotlight with day badge, format icon, strategic pillar, hook snippet, and `[Go to Today View →]` button.
   - Upcoming Launch Plan checklist with category badges and one-click execution shortcuts.
   - Quick launchpad links to Market Research, Pricing, and Content Outline.
   - Updated `apps/web/vitest.config.mts` to use `pool: "forks"` for stable test runner execution under WSL2.

3. **Verification Results:**
   - `apps/api/tests/test_dashboard.py`: PASSED (3/3 tests).
   - `apps/web/tests/dashboard.test.tsx`: PASSED (2/2 tests).
   - `scripts/verify.sh --lane contract`: PASSED (0 drift).
   - Web typecheck (`tsc --noEmit`) and lint (`eslint`): PASSED.

---

## Task 33: Integration: Tavily Search API — I-002 (Outbound; HTTPS REST)

### Assumptions & Decisions
1. **Architecture & Service Design (`apps/api/app/services/tavily.py`):**
   - Implemented `TavilyClient` with direct HTTPS REST communication to `https://api.tavily.com/search`.
   - Loaded API credentials strictly via environment variable `TAVILY_API_KEY` through `settings.TAVILY_API_KEY` (no secrets hardcoded or committed).
   - Per PRD §13.3, implemented 2x retry with exponential backoff on HTTP 5xx server errors and network/timeout exceptions (total 3 attempts).
   - Failure handling: If retries are exhausted or `TAVILY_API_KEY` is omitted, returns graceful `TavilySearchResponse(success=False, error=...)` with empty results list so upstream callers and agents never crash unhandled.
   - Added specialized `search_competitors(niche, city, max_results)` helper targeting Pakistani handcrafted brands and prices.

2. **Agent Tool Catalog Integration (`apps/api/app/agents/tools/__init__.py`):**
   - Wired `search_market(query, city)` to execute via `tavily_client.search`.
   - Structured output provides `title`, `url`, `content`, `score`, and caller isolation.

3. **Verification Results:**
   - `apps/api/tests/test_tavily_integration.py`: PASSED (6/6 tests covering valid responses, 2x retry recovery, exhausted retry failure handling, missing API key handling, query formulation, and tool integration).
   - `apps/api`: Ruff (0 issues) and Mypy (0 issues across 103 source files).

---

## Task 34: Browse Mentor Services — F-018 (PRD §5, §12.3, §13.2)

### Assumptions & Decisions
1. **Database Schema & Migrations (`apps/api/app/models/mentor.py` & migration `0009`):**
   - Created `MentorProfile` (`mentor_profiles` table) with `user_id` (FK to `users.id`, 1:1 unique), `headline`, `bio`, `specialties` (JSON list), `city`, `avatar_url`, `rating` (Decimal 3,2, default 5.00), `review_count` (int, default 0), and `status` ('active' / 'inactive' check constraint).
   - Created `MentorService` (`mentor_services` table) with `mentor_id` (FK to `mentor_profiles.id`), `title`, `description`, `service_type` ('1_on_1_call', 'audit', 'workshop' check constraint), `duration_minutes` (15–180 min check constraint), `price_pkr` (positive decimal check constraint), and `is_active` (boolean, default True).
   - Generated and tested Alembic migration `20261005_0009_mentor_profiles_and_services.py` with foreign key indexes and check constraints.
   - Updated migration test head assertion in `apps/api/tests/test_database.py`.

2. **API Service Layer & Endpoints (`apps/api/app/routes/mentor.py`, `apps/api/app/services/mentor.py`):**
   - Implemented `GET /api/v1/services` with query filtering (`search`, `service_type`, `specialty`, `max_price`, `page`, `page_size`) and eager loading of mentor profiles.
   - Implemented `GET /api/v1/services/{id}` returning full detail including mentor bio, headline, and ratings.
   - Implemented `GET /api/v1/mentors` returning active mentor profiles.
   - Enforced role security using `require_role("entrepreneur", "super_admin", "mentor")`.
   - Comprehensive backend test coverage in `apps/api/tests/test_mentor_services.py` (6 tests).

3. **Client SDK & Dashboard UI (`packages/api-client`, `apps/web/app/(dashboard)/mentors/page.tsx`):**
   - Regenerated OpenAPI TypeScript SDK in `packages/api-client` exposing `ServicesService` and `MentorsService`.
   - Built responsive mentor marketplace UI at `apps/web/app/(dashboard)/mentors/page.tsx` featuring search bar, specialty filter pills, format dropdown, max price slider/input, service cards, and an accessible slide-over detail drawer (`role="dialog"`).
   - Unit and integration tests in `apps/web/tests/mentors-browse.test.tsx` (4 tests).
   - Imprinted `MentorServicesBrowseView` into `context/ui-registry.md`.

4. **Verification Results:**
   - `scripts/verify.sh --lane contract`: PASSED (0 drift).
   - `scripts/verify.sh --lane api`: PASSED (125 tests, Ruff 0 issues, Mypy 0 issues across 109 source files).
   - `scripts/verify.sh --lane web`: PASSED (66 Vitest tests, ESLint clean, TypeScript clean, Turbopack build 25/25 routes).

---

## Task 35: Book a Service — F-019 (PRD §5, §10 W-005, §12.3, §13.2)

### Assumptions & Decisions
1. **Database Schema & Migrations (`apps/api/app/models/booking.py` & migration `0010`):**
   - Created `Booking` (`bookings` table) with `service_id` (FK to `mentor_services.id`), `mentor_id` (FK to `mentor_profiles.id`), `entrepreneur_id` (FK to `users.id`), `status` ('requested', 'accepted', 'declined', 'scheduled', 'completed', 'cancelled', 'reviewed' check constraint), `scheduled_at` (nullable timestamptz), `notes` (text), and `session_notes` (text).
   - Created `PaymentSim` (`payments_sim` table) with `booking_id` (FK to `bookings.id`, unique 1:1), `amount_pkr` (> 0 integer check constraint), and `status` ('held', 'released', 'refunded' check constraint).
   - Created and verified Alembic migration `20261006_0010_bookings_and_payments_sim.py` with foreign key indexes and check constraints.
   - Updated Alembic migration head assertion to `0010_bookings_and_payments_sim` in `apps/api/tests/test_database.py`.

2. **Backend API Endpoints & Services (`apps/api/app/routes/booking.py`, `apps/api/app/services/booking.py`):**
   - Implemented `POST /api/v1/bookings` with role restriction to `entrepreneur` and `super_admin`. Creates booking in `requested` state, initializes simulated escrow payment in `held` state matching service `price_pkr`, and writes immutable `booking.created` audit log.
   - Enforced validation rules: inactive services/mentors cannot be booked (400), mentors cannot book their own services (400).
   - Implemented `GET /api/v1/bookings` scoped by role: entrepreneurs see only their bookings (`entrepreneur_id = current_user.id`), mentors see requests for their profile, super admin sees all.
   - Implemented `GET /api/v1/bookings/{booking_id}` with strict participant authorization check (403 if unauthorized).
   - Acceptance test suite in `apps/api/tests/test_bookings.py` (8/8 passed).

3. **TypeScript Client SDK & Frontend Booking Flow (`packages/api-client`, `apps/web/app/(dashboard)/mentors/book/page.tsx`):**
   - Regenerated OpenAPI TypeScript SDK in `packages/api-client` exporting `BookingsService` and request/response models.
   - Built dedicated checkout and booking flow at `/mentors/book?service_id=...` featuring mentor summary, required session focus notes with 1000-char counter, preferred date/time input, PKR order breakdown, and Hunar Escrow Guarantee disclosures.
   - Implemented interactive confirmation receipt displaying reference ID and next steps.
   - Component test suite in `apps/web/tests/booking.test.tsx` (4/4 passed).
   - Imprinted `BookingTransactionView` in `context/ui-registry.md`.

4. **Verification Results:**
   - `scripts/verify.sh --lane contract`: PASSED (0 drift).
   - `scripts/verify.sh --lane api`: PASSED (134 tests, Ruff 0 issues, Mypy 0 issues across 115 source files).
   - `scripts/verify.sh --lane web`: PASSED (70 Vitest tests, ESLint clean, TypeScript clean, Turbopack build 26/26 routes).

---

## Task 36: My Bookings — F-020 (PRD §5, §10 W-005, §12.3, §13.2)

### Assumptions & Decisions
1. **API Endpoints & Schemas (`apps/api/app/routes/booking.py`, `apps/api/app/schemas/booking.py`, `apps/api/app/services/booking.py`):**
   - Implemented `PATCH /api/v1/bookings/{id}` with `BookingUpdateRequest` schema (`status`, `notes`, `session_notes`, `scheduled_at`).
   - Transition handling:
     - Cancellation (`status='cancelled'`): Allowed by entrepreneur for bookings in `requested`, `accepted`, or `scheduled` status; automatically updates linked `payments_sim.status = 'refunded'` and logs `booking.cancelled` audit event with before/after state.
     - Acceptance & Completion: Mentor or super admin can accept (`status='accepted'`) and complete (`status='completed'`), which releases escrow (`payments_sim.status = 'released'`).
   - Extended `BookingItemResponse` with `payment_status` ('held', 'released', 'refunded') so booking cards display escrow financial protection status immediately.
   - Comprehensive Pytest acceptance tests in `apps/api/tests/test_bookings.py` covering cancellation success, invalid transitions on completed bookings (400), mentor acceptance, and third-party access prevention (403).

2. **TypeScript Client SDK & Frontend Dashboard UI (`packages/api-client`, `apps/web/app/(dashboard)/mentors/bookings/page.tsx`):**
   - Synced OpenAPI TypeScript SDK in `packages/api-client` exposing `BookingsService.updateBookingDetailsApiV1BookingsBookingIdPatch` and `BookingUpdateRequest`.
   - Built dedicated My Bookings list view at `/mentors/bookings` featuring:
     - Sub-navigation tabs connecting "Browse Services" and "My Bookings".
     - Status tabs: All, Requested, Accepted & Scheduled, Completed, Cancelled & Declined.
     - Responsive booking cards with mentor info, service badges, duration, scheduled date/time, price in PKR, lifecycle badge, and escrow protection badge.
     - Accessible slide-over detail drawer displaying full session goals, service description, and mentor feedback.
     - Cancellation confirmation dialog with clear escrow refund disclosures.
     - Empty state with direct link to browse mentor services.
   - Component test suite in `apps/web/tests/my-bookings.test.tsx` (5/5 passed).
   - Imprinted `MyBookingsListView` in `context/ui-registry.md`.

3. **Verification Results:**
   - `scripts/verify.sh --lane contract`: PASSED (0 drift).
   - `scripts/verify.sh --lane api`: PASSED (137 tests, Ruff 0 issues, Mypy 0 issues across 115 source files).
   - `scripts/verify.sh --lane web`: PASSED (75 Vitest tests across 15 suites, ESLint clean, TypeScript clean, Next.js Turbopack build 27/27 routes).

---

## Task 37: Mentor Profile Editor — F-021 (PRD §5.1, §12.3, §13.2, §14.2)

### Assumptions & Decisions
1. **API Endpoints & Schemas (`apps/api/app/routes/mentor.py`, `apps/api/app/schemas/mentor.py`, `apps/api/app/services/mentor.py`):**
   - Implemented `GET /api/v1/mentors/me` and `PATCH /api/v1/mentors/me` restricted to authenticated mentors (`require_role("mentor", "super_admin")`).
   - Implemented auto-initialization fallback in `get_my_mentor_profile` so mentors without a profile row yet automatically get an active base profile rather than 404.
   - Profile update handles `city`, `bio`, `avatar_url`, `niches`, and `languages` with immutable audit logging (`mentor.profile_updated`).
   - Comprehensive Pytest suite in `apps/api/tests/test_mentor_profile.py` verifying profile fetch, update, audit record generation, and 403 authorization guard for non-mentors.

2. **Client SDK & Frontend Profile Editor UI (`packages/api-client`, `apps/web/app/(dashboard)/mentor/profile/page.tsx`):**
   - Synced OpenAPI TypeScript client SDK exporting `MentorsService.getOwnMentorProfileApiV1MentorsMeGet` and `MentorsService.updateOwnMentorProfileApiV1MentorsMePatch`.
   - Created dedicated Mentor Profile Editor at `/mentor/profile` with:
     - Read-only account overview (Name, Email).
     - City selection across major Pakistani hubs.
     - Specialty/niche toggle pill buttons (Handmade, Stitching & Fashion, Food & Baking, Beauty, Tutoring, Digital).
     - Languages spoken toggle pills (Urdu, Roman Urdu, English, Sindhi, Punjabi, Pashto).
     - 2000-character bio textarea with live character counter.
     - Rating/reviews badge and active status badge.
     - Reset Changes and Save Profile actions with success/error alerts.
     - Audit metadata footer displaying Profile ID and timestamps.
   - Updated `Sidebar.tsx` navigation to include "My Profile" (`/mentor/profile`) for mentor roles.
   - Component test suite in `apps/web/tests/mentor-profile.test.tsx` (4/4 passed).
   - Imprinted `MentorProfileEditorView` into `context/ui-registry.md`.

3. **Verification Results:**
   - `scripts/verify.sh --lane contract`: PASSED (0 drift).
   - `scripts/verify.sh --lane api`: PASSED (141 tests, Ruff 0 issues, Mypy 0 issues across 116 source files).
   - `scripts/verify.sh --lane web`: PASSED (79 Vitest tests across 16 suites, ESLint clean, TypeScript clean, Next.js Turbopack build 28/28 routes).

---

## Task 38: Service CRUD — F-022 (PRD §5, §12.3, §13.2, §14.1, §14.2)

### Assumptions & Decisions
1. **API Endpoints & Constraints (`apps/api/app/routes/mentor.py`, `apps/api/app/schemas/mentor.py`, `apps/api/app/services/mentor.py`):**
   - Implemented `GET /api/v1/mentors/me/services`, `POST /api/v1/mentors/me/services`, `PATCH /api/v1/mentors/me/services/{id}`, and `DELETE /api/v1/mentors/me/services/{id}`.
   - Pydantic models `MentorServiceCreateRequest` and `MentorServiceUpdateRequest` enforcing PRD §5 F-022:
     - `title`: 2-200 characters
     - `description`: 10-1000 characters
     - `niche`: one of `food`, `stitching_fashion`, `beauty`, `handmade`, `tutoring`, `digital`
     - `type`: one of `session`, `review`, `done_with_you`, `package`
     - `duration_min`: 15-180 in 15-minute increments
     - `price_pkr`: integer > 0
   - Business Constraints:
     - Price update (`price_pkr`) is blocked with HTTP 400 if an accepted or scheduled booking already exists ("Cannot change after accepted booking").
     - Deletion is blocked with HTTP 400 if active bookings exist (`requested`, `accepted`, `scheduled`), directing the mentor to pause/deactivate instead.
   - Audit logging:
     - `service.created`, `service.price_changed`, `service.updated`, and `service.deleted` logged with actor role, target id, and before/after diffs.
   - Pytest suite in `apps/api/tests/test_mentor_services.py` with 9 test cases covering listing, creating, validation errors, updating, price freeze guard, deletion, and active booking blocking.

2. **TypeScript SDK & Frontend Services Dashboard (`packages/api-client`, `apps/web/app/(dashboard)/mentor/services/page.tsx`):**
   - OpenAPI client regenerated exposing `MentorServiceCreateRequest`, `MentorServiceUpdateRequest`, `MentorServiceResponse`, and CRUD methods on `MentorsService`.
   - Built full dashboard at `/mentor/services`:
     - 3 overview KPI cards: Total Services, Active Offerings, Average Fee in PKR (`formatPKR`).
     - Responsive service catalog cards with format badge, niche badge, duration, price, and one-click Active/Paused toggle.
     - Accessible Create and Edit modal with input validations, character counters, step selection for 15-minute intervals, and feedback alerts.
     - Accessible Delete confirmation modal with safety guard against active client bookings.
     - Empty state with CTA to create first service.
   - Component test suite in `apps/web/tests/mentor-services.test.tsx` (5/5 tests passing).
   - Imprinted `MentorServicesManagementView` into `context/ui-registry.md`.

3. **Verification Results:**
   - `scripts/verify.sh --lane contract`: PASSED (0 drift).
   - `scripts/verify.sh --lane api`: PASSED (144 tests, Ruff 0 issues, Mypy 0 issues in 116 source files).
   - `scripts/verify.sh --lane web`: PASSED (84 Vitest tests across 17 suites, ESLint clean, TypeScript clean, Next.js Turbopack build 29/29 routes).

---

## Task 39: Availability Editor — F-023 (PRD §5, §12.3, §13.2, §14.1, §14.2)

### Assumptions & Decisions
1. **Database Schema & Migrations (`apps/api/app/models/mentor.py` & migration `0011`):**
   - Created `MentorAvailability` (`mentor_availability` table) with `mentor_id` (FK to `mentor_profiles.id`), `weekday` (0=Monday to 6=Sunday), `start_time` (HH:MM), `end_time` (HH:MM), and `is_available` (boolean).
   - Applied Alembic migration `20261006_0011_mentor_availability.py` with foreign key indexes and check constraints.
   - Updated Alembic migration head assertion to `0011_mentor_availability` in `apps/api/tests/test_database.py`.

2. **API Service Layer & Schemas (`apps/api/app/routes/mentor.py`, `apps/api/app/schemas/mentor.py`, `apps/api/app/services/mentor.py`):**
   - Implemented `GET /api/v1/mentors/me/availability` returning 7-day schedule (Mon-Sun) with default 09:00-17:00 active hours for unconfigured days.
   - Implemented `PUT /api/v1/mentors/me/availability` accepting `MentorAvailabilityUpdateRequest` with slot array.
   - Time validation enforces `start_time < end_time` and 24-hour format matching `HH:MM`.
   - Audit trail logs `mentor.availability_updated` with actor ID and slot counts.
   - Generic schema `PaginatedResponse` updated with `arbitrary_types_allowed=True` for compatibility with Pydantic 2.13+.
   - Pytest suite in `apps/api/tests/test_mentor_availability.py` (6/6 tests passing).

3. **TypeScript Client SDK & Frontend Availability Editor (`packages/api-client`, `apps/web/app/(dashboard)/mentor/availability/page.tsx`):**
   - Regenerated OpenAPI TypeScript SDK in `packages/api-client` exposing `MentorAvailabilityResponse`, `MentorAvailabilityUpdateRequest`, `AvailabilitySlotItem`, and MentorsService methods.
   - Built interactive availability manager at `/mentor/availability`:
     - 7-day schedule cards (Mon-Sun) with active toggles and time dropdown pickers.
     - "Copy Monday to Weekdays" fast configuration button.
     - "Reset Defaults" action.
     - Unsaved changes indicator and save status banners.
     - Mobile-responsive layout conforming to Tailwind tokens.
   - Component test suite in `apps/web/tests/mentor-availability.test.tsx` (6/6 tests passing).
   - Imprinted `MentorAvailabilityView` in `context/ui-registry.md`.

4. **Verification Results:**
   - `scripts/verify.sh --lane contract`: PASSED (0 drift).
   - `scripts/verify.sh --lane api`: PASSED (150 tests, Ruff 0 issues, Mypy 0 issues in 117 source files).
   - `scripts/verify.sh --lane web`: PASSED (90 Vitest tests across 18 suites, ESLint clean, TypeScript clean, Next.js Turbopack build 30/30 routes).

---

## Task 40: Mentor Dashboard — F-024 / D-002 (PRD §5, §7, §8, §29.2)

### Assumptions & Decisions
1. **API Endpoints & Schemas (`apps/api/app/routes/mentor.py`, `apps/api/app/schemas/mentor.py`, `apps/api/app/services/mentor.py`):**
   - Implemented `GET /api/v1/mentors/me/dashboard` consolidating:
     - `pending_requests_count` (bookings with status `requested`)
     - `upcoming_sessions_count` (bookings with status `accepted` or `scheduled`)
     - `total_earnings_pkr` (cumulative released escrow amounts from completed sessions)
     - `average_rating` and `review_count` from `MentorProfile`
     - `pending_requests: list[MentorDashboardSessionItem]` with mentee name, requested service, fee, duration, and session notes
     - `upcoming_sessions: list[MentorDashboardSessionItem]` with mentee name, service title, scheduled datetime, duration, and status
     - `recent_reviews: list[MentorReviewItem]`
   - Profile fallback: Auto-initializes base active profile if not yet created.
   - Guarded with `require_role("mentor", "super_admin")`; cross-role/entrepreneur calls return `403 Forbidden`.
   - Backend acceptance tests in `apps/api/tests/test_mentor_dashboard.py` (4/4 tests passing).

2. **TypeScript Client SDK Sync (`packages/api-client`, `apps/web/lib/api.ts`):**
   - Generated and synced OpenAPI SDK with models `MentorDashboardResponse`, `MentorDashboardSessionItem`, `MentorReviewItem`, and `MentorsService.getOwnDashboardApiV1MentorsMeDashboardGet`.
   - Verified zero contract drift and strict TypeScript typing.

3. **Frontend Dashboard UI (`apps/web/app/(dashboard)/mentor/page.tsx`):**
   - Implemented responsive Mentor Pro dashboard matching PRD §7 (D-002), §8, and §29.2 wireframe.
   - 4 Core KPI cards linking directly to drill-down sections/views (Pending Requests, Upcoming Sessions, Earnings Breakdown, Profile).
   - Actionable Pending Requests card list:
     - One-click **Accept Request** updating booking status to `accepted` via `BookingsService.updateBookingDetailsApiV1BookingsBookingIdPatch`.
     - One-click **Decline** modal with Escrow Refund Guarantee disclosure, updating booking status to `declined` and refunding escrow.
   - Upcoming Sessions agenda grid displaying scheduled datetimes and direct Mentee Brief navigation links.
   - Quick launchpad to Availability Schedule (`/mentor/availability`), My Services (`/mentor/services`), and Profile (`/mentor/profile`).
   - Loading skeletons and accessible error retry banners.
   - Component test suite in `apps/web/tests/mentor-dashboard.test.tsx` (6/6 tests passing).
   - Imprinted `MentorDashboardView` in `context/ui-registry.md`.

4. **Verification Results:**
   - `scripts/verify.sh --lane contract`: PASSED (0 drift).
   - `scripts/verify.sh --lane api`: PASSED (154 tests, Ruff 0 issues, Mypy 0 issues in 117 source files).
   - `scripts/verify.sh --lane web`: PASSED (96 Vitest tests across 19 suites, ESLint clean, TypeScript clean, Next.js Turbopack build 31/31 routes).


