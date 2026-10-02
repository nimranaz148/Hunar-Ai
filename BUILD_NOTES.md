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


