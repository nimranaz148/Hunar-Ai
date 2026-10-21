# QA Test Suite — OG Multi-Agent Engine

**Module:** AI Agent Pipelines, Traces, Guardrails, & Human Approval Gates  
**SDK Stack:** OpenAI Agents SDK + Google Gemini 1.5/2.5 Flash + Tavily Web Search  
**PRD Reference:** §36 Multi-Agent Architecture (Agents 1 through 7)  

---

## 1. Multi-Agent Architecture Overview

```
                      ┌────────────────────────────┐
                      │    Entrepreneur Request    │
                      └─────────────┬──────────────┘
                                    │
                                    ▼
                      ┌────────────────────────────┐
                      │    Agent Runner Engine     │
                      │  (Concurrency Semaphore=5) │
                      └─────────────┬──────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
┌──────────────┐             ┌──────────────┐             ┌──────────────┐
│ Intake Agent │             │  Validator   │             │   Pricing    │
│ (Roman Urdu) │             │ (Tavily Web) │             │  Calculator  │
└──────┬───────┘             └──────┬───────┘             └──────┬───────┘
       │                            │                            │
       └────────────────────────────┼────────────────────────────┘
                                    │
                                    ▼
                      ┌────────────────────────────┐
                      │   HUMAN APPROVAL GATE 1    │
                      │  (Explicit User Approval)  │
                      └─────────────┬──────────────┘
                                    │
       ┌────────────────────────────┴────────────────────────────┐
       ▼                                                         ▼
┌──────────────┐                                          ┌──────────────┐
│Launch Planner│                                          │Content Writer│
│ (4-Wk Tasks) │                                          │(30-Day Posts)│
└──────┬───────┘                                          └──────┬───────┘
       │                                                         │
       └────────────────────────────┬────────────────────────────┘
                                    │
                                    ▼
                      ┌────────────────────────────┐
                      │   HUMAN APPROVAL GATE 2    │
                      │ (Outline & Content Review) │
                      └─────────────┬──────────────┘
                                    │
       ┌────────────────────────────┴────────────────────────────┐
       ▼                                                         ▼
┌──────────────┐                                          ┌──────────────┐
│ Weekly Coach │                                          │ Mentor Brief │
│ (Performance)│                                          │ (Pre-Session)│
└──────────────┘                                          └──────────────┘
```

---

## 2. Agent Inventory & Execution Specifications

### Agent 1: Onboarding Intake Agent
* **File:** `apps/api/app/agents/intake.py`
* **Model:** Gemini 1.5/2.5 Flash
* **Zuban:** Conversational Roman Urdu / English
* **Extraction Targets:**
  1. `business_name` (e.g. Zauq-e-Hunar Pret)
  2. `niche` (stitching_fashion, food, beauty, handmade, tutoring, digital)
  3. `city` (Karachi, Lahore, Islamabad, etc.)
  4. `budget_pkr` (Minimum 1,000 PKR)
  5. `hours_per_week` (Default: 20)
* **Test Verification:**
  - Send: `"Mera naam Fatima hai aur main Lahore mein pret collection start karna chahti hun, budget 50000 hai."`
  - Agent sets `is_complete = True` and auto-proposes `BusinessProfile`.

### Agent 2: Market Validator Agent
* **File:** `apps/api/app/agents/validator.py`
* **Tools Used:** Tavily Search API (`tavily_search`)
* **Evaluation Dimensions:**
  - Viability Score (0 - 100)
  - Demand index
  - Local competitor saturation
  - 3 concrete risks
* **Test Verification:**
  - Output contains viability score: `82/100`.
  - Pakistani city-specific insights returned (e.g. Liberty Market, fabric pricing in Azam Market).

### Agent 3: Pricing & Break-even Calculator
* **File:** `apps/api/app/agents/pricing.py`
* **Formulas:**
  - `COGS = Raw Material + Packaging + Direct Labor`
  - `Gross Margin % = ((Selling Price - COGS - Courier) / Selling Price) * 100`
  - `Break-even Units = Monthly Overhead / (Selling Price - COGS - Courier)`
* **Test Verification:**
  - With Cost = 1,300 PKR, Selling Price = 2,200 PKR, Courier = 250 PKR, Overhead = 5,000 PKR:
  - Unit Contribution = 650 PKR
  - Margin = ~40.9%
  - Break-even = ~8-15 units.

### Agent 4: Launch Planner Agent
* **File:** `apps/api/app/agents/planner.py`
* **Output Structure:** 4 Weeks, 6 Actionable Tasks:
  - Week 1: Unit economics & WhatsApp setup
  - Week 2: Packaging, Instagram bio, Story highlights
  - Week 3: Behind-the-scenes content reels
  - Week 4: Early-bird launch promo
* **Test Verification:**
  - Gate 1 status remains `pending` until user explicitly clicks **"Approve Plan"**.

### Agent 5: Content Engine Writer
* **File:** `apps/api/app/agents/content.py`
* **Output Structure:** 15 to 30 Social Media Posts:
  - Platform: Instagram / Facebook
  - Format: Reel / Carousel / Story
  - Hook: Attention grabber in Roman Urdu
  - Caption: Relatable, culturally grounded story
  - CTA: "DM to order on WhatsApp"
  - Hashtags: 5-8 hyper-relevant hashtags (`#lahorecreatives`, `#madeinpakistan`)
* **Test Verification:**
  - Posts span all 3 content pillars:
    1. Behind The Scenes (35%)
    2. Product Showcase (40%)
    3. Customer Love / Reviews (25%)

### Agent 6: Weekly Coach Agent
* **File:** `apps/api/app/agents/weekly_coach.py`
* **Inputs:** Last 7 days metrics snapshots (Reach, likes, orders, revenue).
* **Test Verification:**
  - Compares week-over-week growth.
  - Suggests 2 concrete content fixes if reach is dropping.

### Agent 7: Mentor Briefing Agent
* **File:** `apps/api/app/agents/mentor_brief.py`
* **Target Audience:** Mentor Pro Panel
* **Test Verification:**
  - Generates 1-page structured brief before a booked call.
  - Summarizes entrepreneur's stage, launch plan status, and booking agenda.
