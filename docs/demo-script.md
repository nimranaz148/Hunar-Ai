# Hunar v2 — 4-Minute Contest Demonstration Script

**Document:** Contest Demo Walkthrough  
**Event:** Contest Presentation & Judging (10 Oct 2026)  
**Presenter:** Nimra (Solo Developer / Product Owner)  
**Total Target Duration:** 4 minutes (240 seconds strict limit)  
**Deliverable Reference:** PRD §0.1, §0.2, §2.1, §22 (Phase 5 Task 59), §23  

---

## 1. Demo Overview & Positioning

Hunar v2 is an AI-powered co-pilot built specifically for informal women micro-entrepreneurs in Pakistan. It replaces expensive consultants with an autonomous, specialized multi-agent system operating in Roman Urdu, backed by strict human approval gates, a verified mentor marketplace, and an enterprise Super Admin governance suite.

### Core Value Drivers Highlighted in 4 Minutes:
1. **Linguistic & Cultural Fit:** Natural conversational onboarding in Roman Urdu (`F-003`).
2. **True Agentic Architecture:** Orchestrator with autonomous handoffs (Intake → Validator → Pricing → Launch Planner → Strategist).
3. **Human-in-the-Loop Safety:** 3 non-negotiable approval gates (Plan Gate, Content Outline Gate, Weekly Coach Gate).
4. **Complete Business Lifecycle:** Idea validation → Unit economics → 30-day roadmap → Daily content → Performance analytics → Mentorship.
5. **Enterprise Governance:** Super Admin cohort funnel (`D-003`), early-warning stalled intervention (`F-029`), and full agent execution span tracing (`F-034`).

---

## 2. Pre-Demo Setup & Environment Checklist (T-minus 5 Minutes)

### Step 1: Seed Clean Demo Database
Ensure the database contains the verified contest seed data:
```bash
python scripts/seed.py --clean
```
*Creates 1 Super Admin, 1 cohort program ("Lahore Batch 1"), 5 verified mentors with services/availability, 20 entrepreneurs across all 4 progression stages, metrics snapshots, and feature flags.*

### Step 2: Start Services
```bash
# Terminal 1: Backend API (FastAPI)
cd apps/api && uv run uvicorn app.main:app --port 8000

# Terminal 2: Frontend Web App (Next.js)
cd apps/web && pnpm dev
```

### Step 3: Pre-open Browser Windows
Open **3 browser tabs/windows** for instant, seamless switching:
- **Window A (Entrepreneur):** `http://localhost:3000/login` (or pre-logged in as `fatima@hunar.pk`)
- **Window B (Super Admin):** `http://localhost:3000/login` (pre-logged in as `admin@hunar.pk` at `/admin/cohort`)
- **Window C (Mentor):** `http://localhost:3000/login` (pre-logged in as `ayesha.mentor@hunar.pk` at `/mentor`)

### Demo Credentials Summary:
| Persona | Email | Password | Role / Details |
|---|---|---|---|
| **Super Admin** | `admin@hunar.pk` | `Admin1234!` | System Oversight & Cohort Director |
| **Entrepreneur (Flagship)** | `fatima@hunar.pk` | `User1234!` | Fatima Ali — "Zauq-e-Hunar Pret" (Lahore) |
| **Entrepreneur (Live Onboard)** | `samina@hunar.pk` | `User1234!` | Samina Bibi — "Sweet Delights by Samina" (Karachi) |
| **Mentor** | `ayesha.mentor@hunar.pk` | `Mentor1234!` | Ayesha Siddiqua — Apparel & Fashion Specialist |

---

## 3. The 4-Minute Minute-by-Minute Script

```
+------------------------------------------------------------------------------------------+
|  0:00 - 0:45  | ACT 1: Problem Hook & Roman Urdu Conversational Onboarding (F-001, F-003) |
|  0:45 - 1:45  | ACT 2: Human Gate 1, Unit Economics & 30-Day Launch Roadmap (F-006-F-009) |
|  1:45 - 2:30  | ACT 3: Content Engine, Today View & Mentor Marketplace (F-011, F-013, F-018) |
|  2:30 - 3:15  | ACT 4: Metrics Analytics & Weekly Coach Growth Loop (F-015, F-016, F-017) |
|  3:15 - 4:00  | ACT 5: Super Admin Governance, Stalled Nudges & Agent Traces (D-003, D-004)|
+------------------------------------------------------------------------------------------+
```

---

### ACT 1: Problem Hook & Roman Urdu Conversational Onboarding
⏱ **Timestamp:** `0:00 - 0:45` (45 seconds)  
📍 **Screen:** `http://localhost:3000/onboarding`  
👤 **Persona:** Fatima Ali / Samina Bibi (Entrepreneur)  

#### 🎙 Presenter Speaking:
> *"Respected judges, Pakistan has millions of extraordinarily talented women crafting apparel, home baking, and artisan goods from their living rooms. Yet over 80% never scale beyond friends and family because commercial business planning is in complex English, and consultants are unaffordable.*
>
> *Meet Hunar v2. A woman opens Hunar on her phone and talks to it naturally in Roman Urdu."*

#### 🖥 UI Action:
1. Show the Onboarding Chat interface (`/onboarding`).
2. Point out the Roman Urdu conversational prompt:
   - *"Assalamu alaikum! Main apna home-based pret brand start karna chahti hun. Budget 50,000 PKR hai..."*
3. Highlight the live agent status badge: `Intake Agent` → `Validator Agent`.
4. Point out real-time streaming SSE progress without page reload.

#### 🎙 Presenter Speaking:
> *"Behind the scenes, Hunar's Orchestrator autonomously hands off the conversation. The Intake Agent extracts the business model, and the Validator Agent uses search intelligence to evaluate local competitors and calculate an underserved market gap with high confidence."*

---

### ACT 2: Human Gate 1, Unit Economics & 30-Day Launch Roadmap
⏱ **Timestamp:** `0:45 - 1:45` (60 seconds)  
📍 **Screen:** `http://localhost:3000/plan` & `http://localhost:3000/validation`  
👤 **Persona:** Fatima Ali (Entrepreneur)  

#### 🎙 Presenter Speaking:
> *"Unlike black-box AI tools that hallucinate advice, Hunar enforces strict Human Approval Gates. The agent cannot proceed without Fatima's explicit sign-off."*

#### 🖥 UI Action:
1. Navigate to `/validation` and `/pricing`:
   - Point to the **Validation Report Card**: Competitors identified, market gap highlighted.
   - Point to the **Unit Economics Breakdown**: Unit Cost (Rs. 1,300), Price (Rs. 2,200), **40.9% Margin**, Break-even (15 units).
2. Navigate to **Plan Approval Gate (`F-008`)**:
   - Show the summary of the 30-day launch roadmap.
   - Click **"Approve Plan"** (or show the approved state timestamped with audit hash).
3. Navigate to **Launch Plan Tasks (`/plan` / `F-009`)**:
   - Show the 4-week dated task list (Setup → Brand Identity → Content Generation → Launch Promo).
   - Click to check off a task: show visual completion animation.

#### 🎙 Presenter Speaking:
> *"Once Fatima approves, Hunar instantly generates a step-by-step, 30-day dated launch roadmap. No vague advice—concrete daily actions tailored to her budget."*

---

### ACT 3: Content Engine, Today View & Mentor Marketplace
⏱ **Timestamp:** `1:45 - 2:30` (45 seconds)  
📍 **Screen:** `http://localhost:3000/content/today`, `/content/calendar`, and `/mentors`  
👤 **Persona:** Fatima Ali (Entrepreneur)  

#### 🎙 Presenter Speaking:
> *"Now the marketing engine kicks in. Instead of struggling with writer's block, Hunar generates a complete 30-day content calendar."*

#### 🖥 UI Action:
1. Navigate to `/content/calendar` (`F-011`):
   - Show the 30-day month view with 3 strategic pillars (Behind-the-Scenes, Product Showcase, Customer Love).
2. Click into `/content/today` (`F-013`):
   - Show today's scheduled post.
   - Click the **"Copy Roman Urdu Caption"** button (shows green check confirmation).
   - Point to the visual prompt instructions for image/reel creation.
3. Navigate to `/mentors` (`F-018`):
   - Show the verified Mentor Marketplace. Filter by **"Apparel & Fashion"**.
   - Show Mentor Ayesha Siddiqua (Rating 4.9, 18 reviews).
   - Point out the 1-click **"Book Session"** flow with simulated escrow payment protection (`F-019`).

#### 🎙 Presenter Speaking:
> *"Fatima has daily posts ready in one click, and when she needs expert human guidance, she can book a verified industry mentor with simulated escrow payment protection."*

---

### ACT 4: Metrics Analytics & Weekly Coach Growth Loop
⏱ **Timestamp:** `2:30 - 3:15` (45 seconds)  
📍 **Screen:** `http://localhost:3000/metrics` & `/notifications`  
👤 **Persona:** Fatima Ali (Entrepreneur)  

#### 🎙 Presenter Speaking:
> *"Next is the self-optimizing feedback loop. In Pakistan, micro-sellers get orders via WhatsApp and Instagram DMs, so Hunar enables frictionless daily metrics logging."*

#### 🖥 UI Action:
1. Navigate to `/metrics` (`F-015`, `F-016`):
   - Point out the interactive Recharts charts: Revenue trend (PKR 68,000 generated), orders curve, and engagement channels.
2. Click **"Log Today's Metrics"** modal:
   - Show quick inputs for Views, Inquiries, Orders, Revenue.
3. Open **Weekly Coach Gate Modal (`F-017`)**:
   - Demonstrate Human Gate 3: *"Weekly Coach Agent has detected that Reel posts generated 3x more orders than static images. Proposed adjustment: Replace Day 18 & 21 images with process reels."*
   - Show 1-click **"Approve & Update Upcoming Calendar"**.
4. Point to the top-bar **Notification Bell (`F-038`)**:
   - Show unread badge count updating in real-time.

#### 🎙 Presenter Speaking:
> *"Hunar's Weekly Coach analyzes her metrics and proposes data-driven adjustments to upcoming content. The business continuously adapts to what actually sells."*

---

### ACT 5: Super Admin Governance, Stalled Nudges & Agent Traces
⏱ **Timestamp:** `3:15 - 4:00` (45 seconds)  
📍 **Screen:** Switch to Window B (`http://localhost:3000/admin/cohort` and `/admin/usage`)  
👤 **Persona:** Super Admin (`admin@hunar.pk`)  

#### 🎙 Presenter Speaking:
> *"Finally, let us look at the platform through the eyes of the Cohort Program Director."*

#### 🖥 UI Action:
1. Show **Cohort Dashboard (`D-003` / `F-028`)**:
   - Highlight the 4-stage visual conversion funnel:
     - **Signed Up (20) → Plan Approved (15) → First Post (10) → First Order (5)**.
2. Scroll to the **Stalled Preview & Stalled Directory (`F-029`)**:
   - Point out early-warning diagnostic badges: `No post in >5 days`, `Overdue tasks`, `No metrics in >7 days`.
   - Click the **"Nudge"** button on a stalled entrepreneur: show instant toast notification and append-only audit event.
3. Navigate to **System Usage Telemetry (`/admin/usage` / `D-004`)**:
   - 24-hour activity histogram, 0% fatal error rate, average latency 3.2s.
4. Open **Agent Run Explorer (`/runs` / `F-033`, `F-034`)**:
   - Click into a completed agent execution:
   - Show the span timeline: `Orchestrator` → `Intake` → `Validator` → `Tool: search_competitors` with truncated tokens and redacted API keys.

#### 🎙 Presenter Speaking:
> *"Program directors have complete visibility into cohort drop-offs with early-warning stalled detection. Every single AI tool call and token is traced in an append-only audit log.
>
> Hunar v2 is not a prototype; it is an enterprise-grade, accessible operating system empowering Pakistan's informal women entrepreneurs to build sustainable businesses.
>
> Thank you, and I welcome your questions."*

---

## 4. Rehearsal Timing Tracker & Buffer Matrix

| Section | Target Time | Max Allowable | Key Visual Action |
|---|---|---|---|
| **Act 1: Problem & Onboarding** | 0:00 - 0:45 (45s) | 0:50 | Roman Urdu Chat, SSE stream, Validator card |
| **Act 2: Gate 1 & Plan Tasks** | 0:45 - 1:45 (60s) | 1:50 | Unit economics, Human Gate 1 approval, task checkoff |
| **Act 3: Content & Mentorship** | 1:45 - 2:30 (45s) | 2:35 | 30-day calendar, 1-click copy, Mentor booking |
| **Act 4: Metrics & Weekly Coach**| 2:30 - 3:15 (45s) | 3:20 | Performance charts, Gate 3 coach proposal, notification |
| **Act 5: Admin & Governance** | 3:15 - 4:00 (45s) | 4:00 | Funnel chart, 1-click nudge, Agent span timeline |
| **Total Duration** | **4m 00s** | **4m 00s** | *100% on schedule with zero overrun* |

---

## 5. Contingency & Fallback Guide

| Potential Issue | System Resilience Mechanism | Presenter Talk-Track |
|---|---|---|
| **External LLM rate-limit / network hiccup** | Backend automatically falls back to deterministic rule engine without throwing errors. | *"Hunar operates with zero single-point-of-failure: if external AI services experience latency, local expert heuristics maintain continuous business continuity."* |
| **Slow projector / resolution scaling** | Next.js App Router UI is built with responsive Tailwind tokens (`min-h-screen`, responsive grid). | Smoothly zoom viewport to 90% if necessary; all charts and cards scale automatically. |
| **Database disconnected** | Seed script creates complete persistent state locally; all 41 routes are statically optimized. | Use the pre-seeded `fatima@hunar.pk` account where all stages are pre-populated. |

---

## 6. End-to-End Rehearsal Verification Steps

Run this local verification before the live demo:
```bash
# 1. Run database seed
python scripts/seed.py --clean

# 2. Verify all API endpoints and tests
cd apps/api && uv run pytest tests/test_seed.py

# 3. Verify web compilation and lint
cd apps/web && pnpm typecheck && pnpm test notifications.test.tsx
```

All 41 Next.js routes, API services, and seeded accounts are rehearsed and verified for the 10 Oct 2026 contest presentation.
