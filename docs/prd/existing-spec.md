## Hunar v2: Product & System Design

Sep 25, 2026 · @Mohummad Anees

Extends the Hunar challenge brief. Stack: Next.js + FastAPI + Supabase Postgres (custom auth) + OpenAI Agents SDK running Gemini. Contest: 10 Oct 2026.

### What Hunar v2 is

A woman with a home-business idea signs up, and agents turn it into a validated, priced business, a 30-day launch plan, and a **full 30-day Instagram + Facebook content calendar** (caption, hashtags from fresh web research, competitor gaps, and copy-paste image/video prompts).

She posts manually, logs views/reach (or connects Meta), and a weekly coach agent reads the numbers and re-plans. Mentors run a **Pro panel** where they list priced services she can book. Program admins watch a cohort; a Super Admin owns users, settings and the audit trail.

### Scope and priorities

The scope grew a lot (content engine + marketplace + metrics + Meta API), so for a first agentic app build in this order and **cut from the bottom**.

| Priority | Item |
| --- | --- |
| **Must** | Auth + 4 roles + user creation; Intake → Validator → Pricing → Launch Planner; **Content Engine** (research → strategy → captions/hashtags → image/video prompts); Today view; manual metrics entry; audit log + agent trace viewer |
| **Should** | Mentor Pro panel + booking (simulated payment); Mentor Matcher; Weekly Coach re-plan; Program Admin dashboard |
| **Could** | Metrics from screenshot (vision); CSV export; email/WhatsApp draft reminders |
| **Won't (v2)** | Auto-posting to Instagram/Facebook; real payments; real email/WhatsApp sending |
| **Optional, last** | "Connect Meta" (token + guide + daily sync), behind a feature flag |

**Two builds, on purpose.** The 10 Oct contest is the real competition and this is practice. Plan a **Full build** (finish by ~7 Oct) and a **contest-day slim build** she can recreate fast: auth + roles, Intake → Pricing → Launch Plan, 7-day content preview, mentor match, audit/trace view. Rehearse the slim build on 8-9 Oct.

### Roles and permissions

Four roles, enforced by a FastAPI require_role(...) on every route plus ownership/program scoping inside every query.

| Role | Who | Can do | Cannot do |
| --- | --- | --- | --- |
| **Entrepreneur** | Home-business owner | Own business, plan, content calendar, metrics, bookings; chat with agents | See other users' data |
| **Mentor** | Vetted expert (Pro panel) | Manage profile/services/availability, accept bookings, see AI brief + progress for **booked mentees only**, leave session notes, see simulated earnings | See non-mentees; change prices after a booking is accepted |
| **Program Admin** | NGO/incubator staff | Everything scoped to **their program**: cohort dashboard, approve mentors, override matches, stalled-business list | See other programs; view raw agent prompts; manage Super Admins |
| **Super Admin** | Platform owner | Create/suspend users and Program Admins, all audit logs and agent traces, system settings, feature flags, usage limits, kill switch | Nothing is blocked; every action is audited |

Supabase is only the Postgres host (no Supabase Auth), so Row Level Security is not the primary guard; the API is.

# app/auth/deps.py  (needs: pip install fastapi pyjwt) import os import jwt from fastapi import Depends, HTTPException, Request  SECRET = os.environ["JWT_SECRET"]  def current_user(request: Request) -> dict:     token = request.cookies.get("access_token")     if not token:         raise HTTPException(401, "Not authenticated")     try:         return jwt.decode(token, SECRET, algorithms=["HS256"])  # {sub, role, program_id, exp}     except jwt.PyJWTError:         raise HTTPException(401, "Invalid or expired token")  def require_role(*roles: str):     def dep(user: dict = Depends(current_user)) -> dict:         if user["role"] not in roles:             raise HTTPException(403, "Forbidden")         return user     return dep  # usage # @router.get("/admin/audit", dependencies=[Depends(require_role("super_admin"))])

### Auth, login and user creation

Email + password, argon2 (or bcrypt) hashing, short-lived access token plus rotating refresh token in httpOnly cookies.

**Login**

- **Access token:** JWT, ~15 min, claims sub, role, program_id.
- **Refresh token:** opaque random string, ~7 days, both as **httpOnly, Secure, SameSite=Lax cookies** set by FastAPI.
- Refresh tokens are stored **hashed** in refresh_tokens and **rotated on every use**; reuse of an old token revokes the whole family.
- 5 failed logins → 15-minute lock. Every login (success/fail), logout, refresh-reuse and lock is written to the audit log.
**How each role gets created**

| Role | Creation path | Approval | Initial status |
| --- | --- | --- | --- |
| Super Admin | CLI script only: python -m app.scripts.create_super_admin (or first-run env bootstrap). **No public route exists.** | none | active |
| Program Admin | Created by Super Admin in the panel (invite link or temporary password, forced change on first login) | Super Admin is the creator | active |
| Mentor | Self-serve "Apply as mentor" form **or** invite from a Program Admin | Program Admin (or Super Admin) approves before the Pro panel unlocks | pending → active |
| Entrepreneur | Public signup, optional **program invite code** that attaches her to a cohort | none (auto) | active |

- **Account states:** pending, active, suspended. Suspended users get 403 on every route and their refresh tokens are revoked.
- **Password reset / email verification:** simulated in the MVP (reset link shown in an outbox screen, saved in notifications); real email later.
- **Stretch:** TOTP 2FA for Super Admin.

### Users and scale

Assumptions, change if needed: a demo of ~30 users and a design ceiling of ~500 entrepreneurs. The real bottleneck is LLM latency and quota, not user count.

| Tier | Numbers |
| --- | --- |
| Demo / judging | 1 Super Admin, 1-2 Program Admins, ~5 mentors, ~20-30 seeded entrepreneurs, 3-5 people live at once |
| Design ceiling | ~500 entrepreneurs, ~50 mentors, ~20 concurrent users |

So:

- Agent work runs as a **background job** (agent_runs row: queued → running → awaiting_approval → succeeded | failed | blocked); the UI shows progress by SSE or polling.
- A global semaphore limits concurrent agent runs (start at 3-5).
- Per-user daily limits (for example, 3 content-month generations per day), editable by Super Admin.
- One FastAPI instance and one Supabase Postgres are enough. No Redis, Kafka or microservices.

### Feature specs

#### 6.1 Entrepreneur journey

- **Sign up / login**, then an onboarding chat (Urdu / Roman Urdu / English): idea, city/area, budget, hours per week, products, target customer, tone, platforms (Instagram, Facebook).
- **Validation + pricing** by agents; she edits assumptions and **approves** the plan (human gate 1).
- **30-day launch plan** as dated tasks.
- **Content month** (6.2): she reviews the outline and **approves** (human gate 2), then daily posts are generated.
- **Today view (daily loop):** shows today's post with copy buttons for caption, hashtags, image prompt and video prompt. She generates the media elsewhere, posts manually, and clicks **Mark as posted** (optional post URL).
- **Log results** (6.3), daily or weekly.
- **Weekly review:** the Weekly Coach proposes changes and she approves (human gate 3).
- **Book a mentor service** (6.4) when the coach or matcher suggests it.

#### 6.2 Content Engine (the core value)

**Inputs:** products, niche, city, audience, brand tone, language mix, platforms, start date, offers and seasonal moments (Eid, wedding season), budget and time limits.

**Output per day** (one content_items row):

{   "day": 3,   "date": "2026-10-14",   "platform": ["instagram", "facebook"],   "format": "reel | carousel | static | story | fb_post",   "pillar": "education | behind_the_scenes | social_proof | offer | engagement",   "goal": "awareness | engagement | leads | sales",   "hook": "first line that stops the scroll",   "caption": "full caption in the chosen language mix",   "cta": "DM 'ORDER' / WhatsApp link / comment prompt",   "hashtags": ["#..."],   "best_time_hint": "evening (generic until her own metrics exist)",   "image_prompt": { "subject": "", "scene": "", "style": "", "lighting": "", "composition": "", "aspect_ratio": "4:5", "palette": "", "negative": "", "prompt_text": "copy-paste ready" },   "video_prompt": { "duration_sec": 12, "aspect_ratio": "9:16", "scenes": [{"shot": "", "motion": "", "on_screen_text": ""}], "voiceover": "", "music_mood": "", "prompt_text": "copy-paste ready" },   "alt_text": "",   "status": "draft | approved | posted | skipped" }

**Competitor analysis and "how to be better"** (stored in research_reports):

- 3-5 comparable local/online competitors: what they post, price band, what they do well, **the gap she can exploit**, with source URLs.
- "How to be better" is a list of concrete moves the Strategist **must** turn into calendar items (for example, competitors never show prices, so add a price-transparent carousel every week).
- A confidence level (low / medium / high) with reasoning.
**Hashtags "with latest search":**

- The Researcher searches the web for current tags for this niche and city and returns three tiers: **broad**, **niche**, **local/branded**, plus researched_at and source_urls.
- Honest limit: there is no official Instagram API for trending hashtags, so tags are _search-informed suggestions_. The UI says so and shows the date. The Weekly Coach refreshes them.
- Default 5-8 tags per post (configurable), mixing the three tiers.
**Image/video prompts** are written to paste into any external generator. The QA agent enforces:

- No real people or celebrities, no brand logos, no copyrighted characters.
- Prefer **no text inside the image** (generators garble Urdu/English text); put the exact overlay text in on_screen_text and add it later in a design tool.
- Correct aspect ratio for the format (4:5 feed, 9:16 reels/stories, 1:1 optional).
**Generation strategy (so it is reliable):**

- Research → Strategy → **outline of 30 days** (one line each) → approve.
- Expand in **4 parallel batches** (days 1-8, 9-15, 16-23, 24-30) so no single call is huge; the UI shows batch progress.
- The Visual Prompt agent adds prompts per item; the QA agent validates every item (schema + rules) and retries a failed item once.
- Every item is editable, and "regenerate this day" is a small run.

#### 6.3 Metrics: two ingestion options, one table

Both options write to **one table**, metrics_snapshots, with source = manual | screenshot | meta_api. The Weekly Coach only reads this table, so it does not care where the numbers came from.

**Option A: Manual entry (build fully, this is the MVP)**

- Quick form per posted item or per day/week: platform, **views, reach**, likes, comments, shares, saves, follower change, profile visits.
- **Business outcomes** (this makes the coaching real): inquiries/DMs, orders, revenue in PKR. Content → sales is the story judges remember.
- Charts: trend by week, best format, best day.
- _Could-have:_ upload an Insights screenshot, a vision model extracts the numbers, she confirms, saved with source = screenshot. (Gemini's OpenAI-compatible endpoint supports image input.)
**Option B: "Connect Meta" (optional, feature-flagged, guide inside the app)**

In-app wizard, as a checklist with status ticks:

- Convert Instagram to a **Professional** account (Business or Creator). The insights API does not work for personal accounts.
- Have a **Facebook Page** and link the Instagram account to it.
- Create a Meta developer account and an app; add the user as a role/tester on the app (Development mode).
- Generate a token through the Facebook Login flow with these permissions, then exchange it for a long-lived token:
- Instagram: instagram_basic, instagram_manage_insights (or, with Instagram Login, instagram_business_basic, instagram_business_manage_insights)
- Facebook Page: pages_show_list, pages_read_engagement, read_insights (a **Page access token** is required)
- Paste Page ID, Instagram Business Account ID and token into Hunar, press **Test connection**. The token is saved **encrypted at rest** (Fernet/AES, key from env), with expiry shown and a "Disconnect" button (deletes the token, audited).
A daily sync job normalises the results into metrics_snapshots. Facts to design around (checked against Meta docs on 24-25 Sep 2026):

- Instagram insights work only for professional accounts. Some metrics are unavailable under 100 followers, and user metrics are kept up to 90 days. When data is unavailable the API returns an **empty set, not 0**, so store null.
- Instagram impressions is deprecated; use views and reach (also accounts_engaged, likes, comments, shares, saves, total_interactions).
- **Facebook Page metrics changed on 15 June 2026:** page_impressions_unique (reach) was replaced by page_total_media_view_unique, post reach by post_total_media_views_unique, and about 25 metrics were retired with no replacement. Keep a **metric registry** (our name → Meta metric name, with fallback to null) instead of hard-coding names.
- Accounts you own or manage and have added to the app work with Standard Access; other people's accounts need Advanced Access (App Review). For the contest, demo with accounts added to your own app.
- Token lifetime and exact flows change; re-verify on the day you build it.
**Recommendation:** ship A first and completely. Build B only after the Must/Should items are done, behind feature_flags.meta_connect, and demo it with one test account. If time runs out, cut it; the product still works.

#### 6.4 Mentor Pro panel (services marketplace)

_Assumption:_ "pro panel" is the mentor's professional workspace where she sells services in her niche at her own prices and entrepreneurs book them.

**Mentor profile:** niches (food, stitching/fashion, beauty, handmade, tutoring, digital), languages, city, bio, availability slots, rating.

**Services** (mentor_services): title, description, niche, **price (PKR)**, duration, and a type:

- session: 30/60 min 1:1
- review: pricing review, Instagram profile audit, content-calendar review
- done_with_you: packaging guidance, photo-shoot guidance
- optional package: e.g., a 4-session bundle
**Booking flow:** requested → accepted | declined → scheduled → completed → reviewed

- **Payment is simulated:** a payments_sim row moves held → released, with a platform fee (e.g., 10%) and mentor payout shown in the panel and to admins. No real money.
- Before each session the **Mentor Brief Agent** prepares a one-page brief (business summary, plan progress, metrics trend, current blockers). The mentor's session notes feed the Weekly Coach.
**Mentor panel screens:** dashboard (requests, upcoming), services CRUD, availability, mentees (booked only), earnings (simulated), reviews.

**Mentor Matcher** ranks mentors/services on niche fit, language, availability overlap, price versus her budget, and rating, then returns the top 3 with reasoning. It is a _recommendation_; the entrepreneur decides.

#### 6.5 Program Admin panel

- Cohort funnel: signed up → plan approved → first post → first order.
- **Stalled list:** no post in 5 days, no metrics in 7 days, or tasks overdue.
- Approve or decline mentor applications, reassign mentors, view bookings and simulated payouts, export CSV.
- Can open a business's plan, calendar and metrics (read-only). Cannot see raw agent prompts.

#### 6.6 Super Admin panel

- **Users:** create Program Admins, create/suspend/reactivate anyone, reset password, change role (audited with before/after).
- **Approvals:** any pending mentor.
- **Audit log viewer:** filter by actor, action, target, date; export CSV.
- **Agent run explorer:** list of agent_runs; open one to see the **span timeline** (agent → generation → tool call → handoff → guardrail) with latency and errors. This _is_ the "agent trace / logs" deliverable.
- **Settings:** model name (GEMINI_MODEL), per-user daily limits, max concurrent runs, feature flags (meta_connect, screenshot_metrics), and a **kill switch** to pause all agent runs.
- **Usage:** runs per day, failures, average latency, top users by runs.

### Agent architecture

Twelve agents, built in phases, with the LLM never doing arithmetic: break-even, margins, weekly stats and "best format" are computed by Python tools and the agents interpret the numbers.

#### 7.1 Roster

| # | Agent | Job | Tools | Output | Phase |
| --- | --- | --- | --- | --- | --- |
| 1 | **Orchestrator** | Chat entry, routes to specialists via handoffs, applies the input guardrail | handoffs | routing + final message | P1 |
| 2 | **Intake** | Messy idea to structured business profile | none | BusinessProfile | P1 |
| 3 | **Idea Validator** | Demand and competitors for the idea | web_search | ValidationReport | P1 |
| 4 | **Pricing** | Cost, price, margin, break-even, risk flags | calc tools (deterministic Python) | PricingResult | P1 |
| 5 | **Launch Planner** | 30-day plan and first-10-customers plan | DB tools | dated PlanTask[] | P1 |
| 6 | **Competitor & Trend Researcher** | Competitor teardown, "how to be better", fresh hashtags | web_search | CompetitorReport | P2 |
| 7 | **Content Strategist** | Pillars, weekly themes, format mix, 30-day outline from the research | none | ContentOutline | P2 |
| 8 | **Content Writer** | Caption, hook, CTA, hashtags per day | none | ContentItem[] | P2 |
| 9 | **Visual Prompt** | Image and video prompts per item | none | image_prompt, video_prompt | P2 |
| 10 | **Content QA** (guardrail) | Schema, tone, claims, IP/celebrity/logo rules, duplicates | none | pass / fix list | P2 |
| 11 | **Mentor Matcher / Mentor Brief** | Rank mentors; prepare the session brief | DB tools | ranked list; brief | P3 |
| 12 | **Weekly Coach** | Read stats, decide adjustments, propose re-plan, escalate stuck cases | metrics tools, web_search, DB tools | WeeklyReview + proposed changes | P4 |

#### 7.2 Flows (human approval gates marked)

**A. Onboarding**

flowchart TD   U[User text] --> O[Orchestrator<br/>input guardrail]   O --> I[Intake]   I --> V[Validator<br/>web_search]   V --> P[Pricing<br/>calc tools]   P --> L[Launch Planner]   L --> G{Approve plan<br/>and pricing}   G --> T[Tasks saved to DB<br/>simulated execution]   L -.parallel.-> M[Mentor Matcher]

**B. Content month**

flowchart TD   R[Researcher<br/>web_search] --> N[Normalizer<br/>structured output]   N --> S[Strategist<br/>30-day outline]   S --> G{Approve outline}   G --> W[Writer x4 batches<br/>in parallel]   W --> VP[Visual Prompt]   VP --> Q[Content QA<br/>retry once per item]   Q --> D[Draft content_items<br/>she edits and approves]

**C. Weekly loop (the autonomous one)**

flowchart TD   T[Scheduler or<br/>Run weekly review] --> G[Gather metrics, posts,<br/>tasks, mentor notes]   G --> C[Python computes stats]   C --> W[Weekly Coach decides]   W --> A1[Keep plan]   W --> A2[Shift content mix]   W --> A3[Refresh hashtags<br/>via Researcher]   W --> A4[Suggest mentor service<br/>via Matcher]   W --> A5[Notify mentor if stuck]   A1 & A2 & A3 & A4 & A5 --> H{Entrepreneur approves}   H --> U[Update upcoming<br/>content_items + audit]

**D. Mentor booking**

flowchart TD   M[Matcher: top 3] --> B[Entrepreneur books]   B --> A[Mentor accepts]   A --> P[Simulated payment held]   P --> BR[Mentor Brief Agent]   BR --> S[Session]   S --> N[Notes + completion]   N --> R[Payment released]   R --> V[Review]

Flows A, B and D are _deterministic pipelines whose steps are agents_ (reliable). Autonomy shows up in the Orchestrator's handoffs and especially in the **Weekly Coach**, which chooses among actions based on data.

#### 7.3 Guardrails

- **Input guardrail** (Orchestrator): blocks off-topic, abusive and prompt-injection text; logs guardrail.tripped.
- **Output guardrail** (Content QA): no guaranteed-results or medical claims, no fake reviews, no competitor bashing, no celebrity or brand-logo prompts.
- **Action gates:** nothing that changes her plan or calendar is applied without her approval.
- **Budget guard:** per-user daily limits and a Super Admin kill switch.

#### 7.4 Running Gemini through the OpenAI Agents SDK

OpenAIChatCompletionsModel + AsyncOpenAI(base_url=...) is the right approach. Gotchas, and how each was checked:

| Topic | What to know | Verified how |
| --- | --- | --- |
| Endpoint | base_url="https://generativelanguage.googleapis.com/v1beta/openai/"; the SDK calls /chat/completions | Google docs + offline test |
| Tracing | The default exporter needs an OpenAI key. Either set_tracing_disabled(True) or **replace the processors with your own** (set_trace_processors) so traces go to your DB. We use the second option. | SDK docs + offline test (no OpenAI upload attempted) |
| Hosted tools | WebSearchTool and file search are not reliably supported on third-party providers, so use your own @function_tool web_search (Tavily/Serper/Brave). | SDK docs |
| Structured output | Google lists structured outputs as supported, but the SDK warns that provider support varies. Keep **tools andoutput_typein separate agents** (research, then normalizer). Gemini has been fussy about combining them; this is a defensive choice, not tested on real Gemini here. | SDK docs + offline test of the pattern |
| agent.as_tool() | A GitHub issue reports it failing with Gemini (closed as "not planned"). Avoid it; use Python-orchestrated pipelines and handoffs. | GitHub issue #986 |
| Handoffs | Provider-dependent. **Smoke-test a handoff against real Gemini on day 1.** | SDK docs (not tested live) |
| Compat status | Google calls the OpenAI compatibility layer **beta**. Keep the model id in settings; ids change. | Google docs |
| Versions | Pin exact versions after your first successful run (openai, openai-agents). | Sandbox install (openai-agents 0.22.3) |

**Tested in this sandbox** (code below was extracted from the design file and run): the four agent files ran end to end against a _mocked_ Gemini endpoint (real SDK code path: tool call, structured output, spans, one trace with metadata); the require_role dependency returned 401/403/200 correctly under FastAPI's TestClient; the SQL in section 8 was applied on PostgreSQL 16, the append-only trigger blocked UPDATE and DELETE, and the pg_sink stored real SDK spans in agent_steps. This does **not** prove real Gemini quality or quirks; do a live smoke test with your key first.

app/agents/llm.py

import os  from openai import AsyncOpenAI from agents import OpenAIChatCompletionsModel  GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"  _client: AsyncOpenAI | None = None   def get_client() -> AsyncOpenAI:     global _client     if _client is None:         _client = AsyncOpenAI(             api_key=os.environ["GEMINI_API_KEY"],             base_url=GEMINI_BASE_URL,         )     return _client   def gemini(model: str | None = None, client: AsyncOpenAI | None = None) -> OpenAIChatCompletionsModel:     """Model id comes from env/settings so Super Admin can switch it without a deploy."""     return OpenAIChatCompletionsModel(         model=model or os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),         openai_client=client or get_client(),     )

app/agents/tools.py

from agents import function_tool   async def search_provider(query: str, n: int) -> list[dict]:     """Plug in Tavily / Serper / Brave here. Return [{"title","url","snippet"}]."""     raise NotImplementedError   @function_tool async def web_search(query: str, max_results: int = 5) -> str:     """Search the web for current information (competitors, prices, trends, hashtags).      Args:         query: What to search for. Include the city/area for local questions.         max_results: How many results to return (1-8).     """     results = await search_provider(query, min(max(max_results, 1), 8))     return "\n".join(         f"- {r['title']} | {r['url']} | {r['snippet']}" for r in results     ) or "No results."

app/agents/pipeline.py (research step with tools, then a structuring step, in ONE trace)

from pydantic import BaseModel from agents import Agent, Runner, ModelSettings, trace  from .llm import gemini from .tools import web_search   class Competitor(BaseModel):     name: str     what_they_do_well: str     gap_we_can_exploit: str     source_url: str | None = None   class CompetitorReport(BaseModel):     competitors: list[Competitor]     how_to_be_better: list[str]     hashtags_broad: list[str]     hashtags_niche: list[str]     hashtags_local: list[str]     confidence: str  # low | medium | high   researcher = Agent(     name="Competitor & Trend Researcher",     instructions=(         "You research a small home business. Use web_search several times: "         "local competitors, what they post, their price range, and current hashtags "         "for this niche and city. Report findings with source URLs. Never invent handles."     ),     model=gemini(),     tools=[web_search],     model_settings=ModelSettings(temperature=0.3), )  normalizer = Agent(     name="Research Normalizer",     instructions="Convert the research notes into the required schema. Do not add facts.",     model=gemini(),     output_type=CompetitorReport, )   async def research_competitors(brief: str, meta: dict) -> CompetitorReport:     """meta = {"user_id":..., "business_id":..., "run_id":...}; one trace covers both steps."""     with trace("competitor_research", group_id=meta["business_id"], metadata=meta):         raw = await Runner.run(researcher, brief, max_turns=8)         structured = await Runner.run(normalizer, raw.final_output)     return structured.final_output_as(CompetitorReport)

app/agents/audit_tracing.py (SDK traces to your DB, no OpenAI key needed)

import queue import threading from typing import Any, Callable  from agents import set_trace_processors from agents.tracing import TracingProcessor  MAX_STR = 1500 SECRET_KEYS = {"api_key", "authorization", "access_token", "token", "password"}   def redact(obj: Any) -> Any:     """Truncate long strings and mask secrets before anything is stored."""     if isinstance(obj, dict):         return {k: ("***" if k.lower() in SECRET_KEYS else redact(v)) for k, v in obj.items()}     if isinstance(obj, list):         return [redact(v) for v in obj]     if isinstance(obj, str) and len(obj) > MAX_STR:         return obj[:MAX_STR] + f"...[+{len(obj) - MAX_STR} chars]"     return obj   class DbTraceProcessor(TracingProcessor):     """Callbacks run inside the event loop, so they only enqueue.     A daemon thread drains the queue and calls sink(row) (a sync DB insert)."""      def init(self, sink: Callable[[dict], None]):         self._sink = sink         self._q: "queue.Queue[dict | None]" = queue.Queue()         threading.Thread(target=self._drain, daemon=True).start()      def _drain(self) -> None:         while (row := self._q.get()) is not None:             try:                 self._sink(row)             except Exception as exc:  # logging must never break a run                 print("trace sink error:", exc)      def on_trace_start(self, trace) -> None:         d = trace.export() or {}         self._q.put({"kind": "trace_start", "trace_id": d.get("id"), "data": redact(d)})      def on_trace_end(self, trace) -> None:         d = trace.export() or {}         self._q.put({"kind": "trace_end", "trace_id": d.get("id"), "data": redact(d)})      def on_span_start(self, span) -> None:         pass      def on_span_end(self, span) -> None:         d = span.export() or {}         data = d.get("span_data") or {}         self._q.put({             "kind": "span",             "trace_id": d.get("trace_id"),             "span_id": d.get("id"),             "parent_id": d.get("parent_id"),             "span_type": data.get("type"),  # agent | generation | function | handoff | guardrail | custom             "started_at": d.get("started_at"),             "ended_at": d.get("ended_at"),             "error": d.get("error"),             "data": redact(data),         })      def shutdown(self) -> None:         self._q.put(None)      def force_flush(self) -> None:         while not self._q.empty():             threading.Event().wait(0.01)   def install_audit_tracing(sink: Callable[[dict], None]) -> DbTraceProcessor:     """Replace the default OpenAI exporter with ours. Call once at FastAPI startup."""     proc = DbTraceProcessor(sink)     set_trace_processors([proc])     return proc

Wiring at startup (tested against local Postgres 16; use a sync SQLAlchemy engine on your Supabase Postgres URL, postgresql+psycopg2://...):

# app/main.py import json from contextlib import asynccontextmanager from fastapi import FastAPI from sqlalchemy import create_engine, text from app.agents.audit_tracing import install_audit_tracing  engine = create_engine(DATABASE_URL_SYNC)  def pg_sink(row: dict) -> None:     if row["kind"] != "span":         return  # trace_start/end: update agent_runs by trace_id if you want     with engine.begin() as c:         c.execute(text("""             insert into agent_steps (trace_id, span_id, parent_id, span_type, started_at, ended_at, data, error)             values (:trace_id, :span_id, :parent_id, :span_type, :started_at, :ended_at,                     cast(:data as jsonb), cast(:error as jsonb))             on conflict (span_id) do nothing         """), {**row, "data": json.dumps(row["data"]), "error": json.dumps(row["error"])})  @asynccontextmanager async def lifespan(app: FastAPI):     install_audit_tracing(pg_sink)     yield  app = FastAPI(lifespan=lifespan)

Tip: create the agent_runs row **before** the workflow and pass its trace id into trace(..., trace_id=...), so the run and its spans join on trace_id.

### Audit logs and traces

Two separate logs: audit_logs records who did what (security and business events), and agent_runs + agent_steps record how the agents thought and acted.

#### 8.1 audit_logs (append-only)

create table audit_logs (   id          bigserial primary key,   at          timestamptz not null default now(),   request_id  uuid,   actor_id    uuid references users(id),   actor_role  text,   action      text not null,          -- e.g. 'auth.login.failed'   target_type text,   target_id   text,   program_id  uuid,   ip          inet,   user_agent  text,   before      jsonb,   after       jsonb,   meta        jsonb not null default '{}'::jsonb ); create index on audit_logs (at desc); create index on audit_logs (actor_id, at desc); create index on audit_logs (action, at desc);  create function audit_logs_immutable() returns trigger language plpgsql as $$ begin   raise exception 'audit_logs is append-only'; end $$;  create trigger audit_logs_no_change before update or delete on audit_logs for each row execute function audit_logs_immutable();

Event catalogue (written from one audit(...) helper called by routes and services):

| Category | Actions |
| --- | --- |
| Auth | auth.login.success, auth.login.failed, auth.locked, auth.logout, auth.refresh.reuse_detected, auth.password.changed |
| Users | user.created, user.invited, user.role_changed, user.suspended, user.reactivated, mentor.approved, mentor.declined |
| Business | plan.approved, content_outline.approved, content_item.edited, content_item.posted, metrics.logged |
| Mentor marketplace | service.created, service.price_changed, booking.requested, booking.accepted, booking.completed, payment_sim.released |
| Integrations | meta.connected, meta.disconnected, meta.sync.failed |
| Agents | agent.run.started, agent.run.blocked, guardrail.tripped, agent.proposal.approved, agent.proposal.rejected |
| Admin | settings.changed, feature_flag.changed, kill_switch.toggled, audit.exported |

Rules: store **before/after** for changes; never store passwords or tokens; mask emails and phones in meta.

#### 8.2 agent_runs and agent_steps (traces)

create table agent_runs (   id             uuid primary key default gen_random_uuid(),   trace_id       text unique,   workflow       text not null,       -- onboarding | content_month | weekly_review | mentor_match ...   user_id        uuid references users(id),   business_id    uuid references businesses(id),   status         text not null default 'queued',  -- queued|running|awaiting_approval|succeeded|failed|blocked   input_summary  text,   output_summary text,   error          text,   started_at     timestamptz,   ended_at       timestamptz,   created_at     timestamptz not null default now() );  create table agent_steps (   id         bigserial primary key,   trace_id   text not null,   span_id    text not null unique,   parent_id  text,   span_type  text not null,           -- agent | generation | function | handoff | guardrail | custom   started_at timestamptz,   ended_at   timestamptz,   data       jsonb,                   -- redacted + truncated   error      jsonb ); create index on agent_steps (trace_id);

Rules: truncate payloads (1,500 chars) and redact secrets (done in redact); full prompts only behind a Super Admin flag; Program Admins see run status but not raw prompts.

### Data model

About 25 tables; key columns below. audit_logs, agent_runs and agent_steps are defined in section 8.

| Table | Key columns |
| --- | --- |
| users | id, email (unique), password_hash, role, status, program_id, name, language, created_by, created_at |
| refresh_tokens | id, user_id, token_hash, family_id, expires_at, revoked_at, replaced_by |
| programs | id, name, invite_code, created_by |
| businesses | id, owner_id, program_id, name, niche, city, area, budget_pkr, hours_per_week, tone, languages, platforms |
| products | id, business_id, name, description, cost_inputs (jsonb), price_pkr |
| validation_reports | id, business_id, report (jsonb), confidence, sources (jsonb), researched_at |
| pricing_results | id, business_id, product_id, assumptions (jsonb), unit_cost, price, margin_pct, break_even_units, approved_at |
| launch_plans / plan_tasks | plan: id, business_id, status; task: title, due_date, status, week |
| research_reports | id, business_id, competitors (jsonb), how_to_be_better (jsonb), hashtags (jsonb: broad/niche/local), source_urls, researched_at |
| content_calendars | id, business_id, start_date, strategy (jsonb), outline (jsonb), status |
| content_items | id, calendar_id, day, date, platform[], format, pillar, goal, hook, caption, cta, hashtags[], image_prompt (jsonb), video_prompt (jsonb), status, posted_at, post_url |
| metrics_snapshots | id, business_id, content_item_id (nullable), platform, period_start, period_end, views, reach, likes, comments, shares, saves, follower_delta, inquiries, orders, revenue_pkr, source (manual/screenshot/meta_api), raw (jsonb) |
| social_connections | id, business_id, platform, external_ids (jsonb), token_encrypted, expires_at, status |
| mentor_profiles | user_id, niches[], languages[], city, bio, rating, approved_by, approved_at |
| mentor_services | id, mentor_id, title, description, niche, type, price_pkr, duration_min, active |
| mentor_availability | id, mentor_id, weekday, start_time, end_time |
| bookings | id, service_id, entrepreneur_id, mentor_id, status, scheduled_at, notes, price_pkr |
| payments_sim | id, booking_id, amount, platform_fee, mentor_payout, status (held/released/refunded) |
| reviews | id, booking_id, rating, comment |
| proposals | id, business_id, run_id, type, payload (jsonb), status (pending/approved/rejected): agent proposals awaiting a human gate |
| notifications | id, user_id, kind, body, read_at (also the simulated email/WhatsApp outbox) |
| settings / feature_flags | key, value, updated_by, updated_at |

### API surface

Route groups, each guarded by require_role:

- /auth: register (entrepreneur), login, refresh, logout, mentor-apply, change-password
- /admin/users: create Program Admin, invite, suspend/reactivate, change role (Super Admin, or scoped Program Admin)
- /businesses, /plans, /pricing: entrepreneur CRUD and approvals
- /agents/runs: start a workflow (returns run_id), GET status/stream (SSE), approve/reject proposals
- /content: calendar, items (edit, regenerate, mark posted), research report
- /metrics: log manual, upload screenshot (could), list/charts; /integrations/meta: connect/test/disconnect/sync (flagged)
- /mentors, /services, /bookings: browse, match, book, accept, complete, review, earnings (simulated)
- /program: cohort dashboard, stalled list, mentor approvals
- /admin/audit, /admin/runs, /admin/settings, /admin/usage: Super Admin only

### Build phases

Map these to your 9-file harness phases. P0 to P2 are never cut; Meta Connect goes first if time runs short.

| Phase | Dates | Deliverable | Cut line |
| --- | --- | --- | --- |
| **P0 Foundation** | 25-26 Sep | Repo, Supabase schema, auth + 4 roles + user creation paths, audit() helper, llm.py, trace processor, **live Gemini smoke test (tool call, structured output, one handoff)** | never cut |
| **P1 Onboarding agents** | 27-29 Sep | Intake → Validator → Pricing → Launch Planner, approval gate, plan dashboard | never cut |
| **P2 Content Engine** | 30 Sep - 3 Oct | Researcher, Strategist, Writer (batches), Visual Prompt, QA, calendar UI, **Today view** | never cut |
| **P3 Mentor Pro panel** | 4-5 Oct | Services, availability, booking, simulated payment, Matcher, Mentor Brief | simplify: no packages or availability calendar |
| **P4 Metrics + Coach + Admin** | 6-7 Oct | Manual metrics, charts, Weekly Coach, Program Admin dashboard, Super Admin audit + run explorer | drop Program Admin extras, keep audit + runs |
| **P5 Polish + rehearsal** | 8-9 Oct | Seed data, demo script, README, **rebuild the slim contest version once** | Meta Connect only if everything else is done |
| Contest | 10 Oct | Slim build |  |

### Demo script (4 minutes)

- Entrepreneur types in Roman Urdu: home bakery, Gulshan-e-Iqbal, Rs. 20,000 budget.
- Validation with sources, then pricing and break-even, then she approves.
- **Content month:** competitor gaps, fresh hashtags, 30-day calendar; open Day 3 to show caption + hashtags + image prompt + Reel prompt.
- Today view: copy, mark posted, log views/reach and 2 orders.
- The Weekly Coach proposes "shift to more Reels, add a price carousel, book a pricing-review service"; she approves.
- Mentor Pro panel: the mentor accepts the booking; the brief is generated.
- Super Admin: the audit trail of the whole story and the agent run timeline (this is the trace deliverable).

### Risks and open questions

**Risks**

- **Scope vs time.** Protect P0 to P2 above everything.
- **Gemini quirks** (tools + schema, handoffs, quota). Smoke-test on day 1 and keep the two-step pattern.
- **Hashtag "trending" claims.** Label them as search-informed suggestions with a date.
- **Meta API changes often** (Page metrics were cut on 15 Jun 2026). Keep the metric registry and keep Connect optional.
- **Content quality in Roman Urdu.** Build a golden set of 5 example briefs and eyeball outputs every phase.
**Please confirm**

- ☐ "Pro panel" means the mentor sells priced services that entrepreneurs book (as written in 6.4)?
- ☐ Do the contest rules require a specific platform or a mobile app? (The earlier Antigravity PDF did; Next.js may need to be mobile-first/PWA.)
- ☐ Search provider preference (Tavily, Serper, Brave) and whether a free tier is enough.

### Sources

- Models - OpenAI Agents SDK
- Tracing - OpenAI Agents SDK
- OpenAI compatibility | Gemini API
- Agent-as-tool with Gemini, issue #986
- Instagram Platform: Insights
- Instagram User insights reference
- Facebook Pages API: Insights
- Facebook Insights metrics retirement, June 2026 (Supermetrics)
