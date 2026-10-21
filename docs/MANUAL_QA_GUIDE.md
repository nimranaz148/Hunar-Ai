# Hunar v2 — Complete End-to-End Manual QA Manual (Roman Urdu)

**Date:** October 2026  
**System Version:** v0.1.0 (Production Profile)  
**Target Audience:** QA Engineers, Testers, Product Owners, Judges  
**Single Source of Truth:** `docs/prd/PRD.md` & `context/architecture.md`  

---

## Fihrist (Table of Contents)
1. [Nizam Ka Jaiza Aur Credentials (System Overview & Credentials)](#1-nizam-ka-jaiza-aur-credentials)
2. [OG AI Agents Pipeline Ka Tareeqa-e-Kar (Core Agents System)](#2-og-ai-agents-pipeline-ka-tareeqa-e-kar)
3. [Entrepreneur Portal QA (Complete Manual Testing)](#3-entrepreneur-portal-qa)
   - 3.1 [Signup & Login (F-001, F-002)](#31-signup--login-f-001-f-002)
   - 3.2 [AI Onboarding Chat — Intake Agent (F-003, F-042)](#32-ai-onboarding-chat--intake-agent-f-003-f-042)
   - 3.3 [Today View / Entrepreneur Dashboard (F-013)](#33-today-view--entrepreneur-dashboard-f-013)
   - 3.4 [Business Profile & Products Catalog (F-004, F-005)](#34-business-profile--products-catalog-f-004-f-005)
   - 3.5 [Idea Validation Report — Validator Agent (F-006)](#35-idea-validation-report--validator-agent-f-006)
   - 3.6 [Pricing & Break-even Calculator (F-007)](#36-pricing--break-even-calculator-f-007)
   - 3.7 [30-Day Launch Plan & Human Gate 1 (F-008, F-009)](#37-30-day-launch-plan--human-gate-1-f-008-f-009)
   - 3.8 [Content Engine: Calendar, Outline, Today & Items (F-010 to F-014)](#38-content-engine-calendar-outline-today--items-f-010-to-f-014)
   - 3.9 [Performance Metrics & Weekly Coach (F-015, F-016, F-017)](#39-performance-metrics--weekly-coach-f-015-f-016-f-017)
   - 3.10 [Mentor Marketplace & Escrow Booking (F-018, F-019, F-020, F-041)](#310-mentor-marketplace--escrow-booking-f-018-f-019-f-020-f-041)
   - 3.11 [Notifications & Change Password (F-038, F-039)](#311-notifications--change-password-f-038-f-039)
4. [Mentor Portal QA (Pro Panel Manual Testing)](#4-mentor-portal-qa)
   - 4.1 [Mentor Application & Login (F-040)](#41-mentor-application--login-f-040)
   - 4.2 [Mentor Dashboard (F-024)](#42-mentor-dashboard-f-024)
   - 4.3 [Profile & Bio Management (F-021)](#43-profile--bio-management-f-021)
   - 4.4 [Services CRUD & Pricing (F-022)](#44-services-crud--pricing-f-022)
   - 4.5 [Weekly Availability Slots (F-023)](#45-weekly-availability-slots-f-023)
   - 4.6 [Mentees Management & Session Notes (F-025, F-027)](#46-mentees-management--session-notes-f-025-f-027)
   - 4.7 [Earnings & Escrow Release (F-026)](#47-earnings--escrow-release-f-026)
5. [Super Admin Console QA (Full Administrative Oversight)](#5-super-admin-console-qa)
   - 5.1 [Admin Overview Portal (PRD §4.3)](#51-admin-overview-portal)
   - 5.2 [User Management & Password Reset (F-031)](#52-user-management--password-reset-f-031)
   - 5.3 [Mentor Verification & Approval (F-030)](#53-mentor-verification--approval-f-030)
   - 5.4 [Cohort Monitoring & Conversion Funnel (F-028)](#54-cohort-monitoring--conversion-funnel-f-028)
   - 5.5 [Stalled Businesses List & Interventions (F-029)](#55-stalled-businesses-list--interventions-f-029)
   - 5.6 [Feature Flags & Emergency Kill Switch (F-036)](#56-feature-flags--emergency-kill-switch-f-036)
   - 5.7 [System Usage Statistics & Health Leaderboard (F-037)](#57-system-usage-statistics--health-leaderboard-f-037)
   - 5.8 [Agent Explorer: Trace Trees & Span Timelines (F-033, F-034)](#58-agent-explorer-trace-trees--span-timelines-f-033-f-034)
   - 5.9 [Immutable Audit Log Viewer (F-032)](#59-immutable-audit-log-viewer-f-032)
   - 5.10 [System Concurrency & Settings (F-035)](#510-system-concurrency--settings-f-035)
6. [Kamyabi Ka Mayar (Pass / Fail Criteria & Sign-off)](#6-kamyabi-ka-mayar)

---

## 1. Nizam Ka Jaiza Aur Credentials

### Server Status Check
Pehle yeh confirm karein ke dono servers chal rahe hain:
* **Backend:** `http://127.0.0.1:8000/api/v1/health` ➡️ Response: `{"status":"ok","version":"0.1.0"}`
* **Frontend:** `http://localhost:3000` ➡️ Landing Page active

### QA Demo Credentials
| Role | Email | Password | Details / Pre-seeded Data |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@hunar.pk` | `Admin1234!` | Tamam admin controls, cohort funnel, feature flags, telemetry, audit logs |
| **Entrepreneur (Flagship)** | `fatima@hunar.pk` | `User1234!` | Fatima Ali (Zauq-e-Hunar Pret) — First Order Stage, Complete Plan, Products, Content Calendar |
| **Entrepreneur (Intake)** | `sadia@hunar.pk` | `User1234!` | Sadia Malik — Fresh Intake Stage (Clay Studio) |
| **Entrepreneur (Plan)** | `rabia@hunar.pk` | `User1234!` | Rabia Akram — Plan Approved Stage |
| **Entrepreneur (Post)** | `sana@hunar.pk` | `User1234!` | Sana Tariq — First Post Published |
| **Mentor (Fashion)** | `ayesha.mentor@hunar.pk` | `Mentor1234!` | Ayesha Siddiqua (Lahore) — 4.9 rating, 2 services, availability slots, active bookings |
| **Mentor (Marketing)** | `bilal.mentor@hunar.pk` | `Mentor1234!` | Bilal Ahmed (Karachi) — Digital Marketing & Meta Ads specialist |

---

## 2. OG AI Agents Pipeline Ka Tareeqa-e-Kar

Hunar v2 ka dil iska **Multi-Agent Engine** hai jo OpenAI Agents SDK aur Gemini 1.5/2.5 Flash par mushtamil hai. Testing ke doran har agent ka behavior aur human gate zaroor verify karein:

1. **Intake Agent (`intake.py`):**
   * **Zuban:** Natural Roman Urdu aur English.
   * **Maqsad:** Khawateen se baat cheet karke 5 cheezain extract karna: Niche, City, Budget (PKR), Weekly Hours, Target Audience.
   * **Action:** Profile mukammal hote hi automatically `Business` aur `Product` create karta hai aur user ko Gate 1 par pohanchata hai.

2. **Market Validator Agent (`validator.py`):**
   * **Maqsad:** Tavily Search API ke zariye Pakistani local market search karta hai.
   * **Score:** 0 se 100 tak Viability Score deta hai (e.g. 78/100).
   * **Output:** Competitor analysis, 3 major risk factors, aur actionable recommendations.

3. **Pricing & Unit Economics Agent (`pricing.py`):**
   * **Maqsad:** Raw materials, packing, labor, courier cost aur monthly overheads calculate karta hai.
   * **Output:** Recommended Selling Price, Gross Margin %, Break-even unit target.

4. **Launch Planner Agent (`planner.py`):**
   * **Maqsad:** 30-Day Go-to-Market Launch Plan banata hai (4 Weeks, 6 categorized tasks).
   * **Human Gate 1:** Jab tak entrepreneur khud **"Approve Plan"** button nahi dabati, tab tak agla stage block rehta hai.

5. **Content Writer Agent (`content.py`):**
   * **Maqsad:** 15 se 30 din ka social media calendar banata hai (Instagram Reels, Carousels, Stories).
   * **Features:** Roman Urdu hook, cultural caption, WhatsApp direct CTA, aur trending hashtags.

6. **Weekly Coach Agent (`weekly_coach.py`):**
   * **Maqsad:** Entrepreneur ki metrics (likes, views, orders, revenue) analyze karke performance report aur agle hafte ki tips deta hai.

7. **Mentor Briefing Agent (`mentor_brief.py`):**
   * **Maqsad:** Session se pehle mentor ke liye mentee ki business history ka 1-page summary banata hai.

---

## 3. Entrepreneur Portal QA

### 3.1 Signup & Login (F-001, F-002)
* **URL:** `http://localhost:3000/login` aur `http://localhost:3000/signup`
* **Page Purpose:** Khawateen micro-entrepreneurs ka secure entry point.
* **Buttons & Inputs:**
  * `Email` input field (type email, mandatory).
  * `Password` input field (min 8 chars, 1 uppercase, 1 number).
  * `Sign In` / `Create Account` button.
  * Role selection switch (Entrepreneur vs Mentor).
* **Test Steps:**
  1. Ghalat password daal kar check karein ➡️ "Invalid credentials" error aana chahiye.
  2. `fatima@hunar.pk` aur `User1234!` daal kar `Sign In` click karein.
  3. **Expected Result:** Token local storage/cookies mein save ho aur seedha `/dashboard` ya `/business` par redirect ho.

### 3.2 AI Onboarding Chat — Intake Agent (F-003, F-042)
* **URL:** `http://localhost:3000/onboarding`
* **Page Purpose:** Roman Urdu conversational chat jahan AI agent business details collect karta hai.
* **Buttons & Inputs:**
  * Chat text area: `Apna message yahan likhein...`
  * `Send` button (Airplane icon).
  * Real-time Agent Status Badge (`Intake Agent`, `Thinking...`, `Streaming`).
* **Test Steps:**
  1. Login as `sadia@hunar.pk` (fresh intake user).
  2. Message likhein: `"Assalamu alaikum! Main Lahore Gulberg mein rehti hun aur clay mugs ka business start karna chahti hun, mera budget 30,000 PKR hai."`
  3. `Send` click karein.
  4. **Expected Result:** SSE stream ke zariye AI response chunk-by-chunk screen par type hoga. AI Roman Urdu mein encourage karega aur profile details extract karke confirm karega.
  5. Profile summary card screen par show ho jayega.

### 3.3 Today View / Entrepreneur Dashboard (F-013)
* **URL:** `http://localhost:3000/dashboard`
* **Page Purpose:** Entrepreneur ka daily control room jahan aaj ke tasks, content post status aur progress nazar aati hai.
* **Buttons & Inputs:**
  * `Mark Complete` button on today's tasks.
  * `Post Now` / `Copy Caption` button on today's content piece.
  * `Log Daily Metrics` button.
  * Navigation shortcuts to Plan, Calendar, Mentors.
* **Test Steps:**
  1. Login as `fatima@hunar.pk`.
  2. Check karein ke "Zauq-e-Hunar Pret" ka business name aur stage badge "First Order Achieved" nazar aa raha hai.
  3. Today's task par `Mark Complete` click karein ➡️ Task checked off hona chahiye aur progress bar update honi chahiye.

### 3.4 Business Profile & Products Catalog (F-004, F-005)
* **URL:** `http://localhost:3000/business` aur `http://localhost:3000/products`
* **Page Purpose:** Karobar ki bunyadi details (City, Niche, Budget) aur product SKU management.
* **Buttons & Inputs:**
  * `Edit Profile` button.
  * `Add New Product` button.
  * Form Fields: `Product Name`, `Category`, `Cost Price (PKR)`, `Selling Price (PKR)`.
  * `Save Changes` button.
* **Test Steps:**
  1. `/products` par jayein. Fatima ka seeded product "Zauq-e-Hunar Pret Signature Collection" nazar aayega.
  2. Selling price verify karein (2,200 PKR, Margin ~40.9%).
  3. Naya product add karein aur save karein ➡️ Product list mein foran shamil hona chahiye.

### 3.5 Idea Validation Report — Validator Agent (F-006)
* **URL:** `http://localhost:3000/validation`
* **Page Purpose:** Market viability report, competitor landscape, aur risk audit.
* **Buttons & Inputs:**
  * `Re-run Validation` button.
  * Viability Score gauge (0 to 100).
  * Risk Accordions (Low, Medium, High).
  * `Proceed to Pricing` button.
* **Test Steps:**
  1. Score check karein (80+ hona chahiye apparel ke liye).
  2. Competitor analysis section dekhein: Azam Cloth Market, local Instagram competitors list honay chahiye.
  3. Risk factors read karein: Fabric shrinkage, season change inflation risk properly documented hona chahiye.

### 3.6 Pricing & Break-even Calculator (F-007)
* **URL:** `http://localhost:3000/pricing`
* **Page Purpose:** Unit economics visualizer (Variable vs Fixed Cost, Target Margin).
* **Buttons & Inputs:**
  * Sliders/Inputs: `Raw Material Cost`, `Packaging Cost`, `Courier Delivery`, `Monthly Fixed Overheads`.
  * `Recalculate Margin` button.
  * `Accept Pricing` button.
* **Test Steps:**
  1. Cost 1,300 PKR aur Selling Price 2,200 PKR verify karein.
  2. Break-even units check karein (e.g. 15 units/month).
  3. Sliders move karke dekhein ke Profit margin real-time update ho raha hai.

### 3.7 30-Day Launch Plan & Human Gate 1 (F-008, F-009)
* **URL:** `http://localhost:3000/plan`
* **Page Purpose:** 4-hafte ka structured roadmap aur PRD Human Approval Gate 1.
* **Buttons & Inputs:**
  * `Approve Launch Plan` (Green Button — Human Gate 1).
  * `Request Revision` (Secondary button).
  * Week Tabs: `Week 1`, `Week 2`, `Week 3`, `Week 4`.
  * Task check-boxes: `Completed` / `Pending`.
* **Test Steps:**
  1. Fatima ka plan pehle se "Approved" nazar aayega.
  2. Checkboxes click karein ➡️ Backend API `/api/v1/businesses/{id}/plan/tasks/{task_id}` ko PATCH request bhej kar status update karega.

### 3.8 Content Engine: Calendar, Outline, Today & Items (F-010 to F-014)
* **URL:** `http://localhost:3000/content` aur `http://localhost:3000/content/calendar`
* **Page Purpose:** AI generated 15-30 din ka ready-to-publish social media calendar.
* **Buttons & Inputs:**
  * `Month View` / `List View` toggle buttons.
  * `Today's Post` quick action.
  * Calendar grid dates (clickable cards).
  * Post Item Modal: `Copy Hook`, `Copy Caption`, `Copy Hashtags`, `Preview Media Prompt`.
  * `Mark as Posted` button with `Post URL` input field.
* **Test Steps:**
  1. Calendar mein kisi bhi post card par click karein.
  2. Roman Urdu caption check karein: `"Assalamu alaikum! Aaj hum share kar rahe hain..."`.
  3. `Copy Caption` button dabayein ➡️ "Copied to clipboard" toast aani chahiye.
  4. Post status change karke `Mark as Posted` karein ➡️ Status badge green ("Posted") ho jana chahiye.

### 3.9 Performance Metrics & Weekly Coach (F-015, F-016, F-017)
* **URL:** `http://localhost:3000/metrics`
* **Page Purpose:** Social media reach, inquiries, orders, aur AI Weekly Coach feedback.
* **Buttons & Inputs:**
  * `Log Metrics` button (opens entry drawer).
  * Inputs: `Impressions`, `Reach`, `Likes`, `WhatsApp Inquiries`, `Confirmed Orders`, `Revenue (PKR)`.
  * `Submit Weekly Metrics` button.
  * Performance Charts (Recharts line & bar graphs).
  * `Weekly Review Approval` (Human Gate).
* **Test Steps:**
  1. Charts verify karein: Impressions aur Revenue ka 7-day trend chart show ho raha hoga.
  2. `Log Metrics` click karke entry submit karein ➡️ Snapshot save hoga aur chart refresh hoga.

### 3.10 Mentor Marketplace & Escrow Booking (F-018, F-019, F-020, F-041)
* **URL:** `http://localhost:3000/mentors` aur `http://localhost:3000/mentors/bookings`
* **Page Purpose:** Verified mentors browse karna, 1-on-1 session book karna, aur simulated payment escrow mein hold karna.
* **Buttons & Inputs:**
  * Niche Filter dropdown (`Apparel & Fashion`, `Digital Marketing`, `Home Bakery`, etc.).
  * Mentor Cards with Avatar, Rating, Bio, aur Price badge.
  * `Book Session` button.
  * Booking Modal: `Select Date`, `Select Time Slot`, `Session Notes/Questions`.
  * `Confirm & Pay (Simulated Escrow)` button.
  * `My Bookings` tab: `Join Session`, `Leave Review` (Stars 1-5 + comment).
* **Test Steps:**
  1. Ayesha Siddiqua ka card search karein (Apparel Specialist, PKR 3,000).
  2. `Book Session` click karein, slot choose karein, aur confirm karein.
  3. Booking ban kar `My Bookings` mein "scheduled" status ke sath aani chahiye aur simulated payment status "held" hona chahiye.

### 3.11 Notifications & Change Password (F-038, F-039)
* **URL:** `http://localhost:3000/notifications` aur `http://localhost:3000/change-password`
* **Buttons:** `Mark All as Read`, `Update Password`.
* **Test Steps:** Notification bell click karein ➡️ Seeded milestone notifications ("Milestone Achieved: First Order!", "Weekly Review Ready") nazar aayengi.

---

## 4. Mentor Portal QA

### 4.1 Mentor Application & Login (F-040)
* **URL:** `http://localhost:3000/mentor-apply` aur `http://localhost:3000/login`
* **Credentials:** `ayesha.mentor@hunar.pk` / `Mentor1234!`
* **Test Steps:** Login karte hi auto-redirect `/mentor` dashboard par hona chahiye.

### 4.2 Mentor Dashboard (F-024)
* **URL:** `http://localhost:3000/mentor`
* **Page Purpose:** Mentor ka primary hub jahan upcoming sessions, pending requests aur monthly earnings summary show hoti hai.
* **Elements:**
  * Summary KPI cards: `Upcoming Sessions`, `Total Mentees`, `Rating (4.9)`, `Total Earnings (PKR)`.
  * `Accept / Reschedule` buttons on session requests.

### 4.3 Profile & Bio Management (F-021)
* **URL:** `http://localhost:3000/mentor/profile`
* **Elements:** `Full Name`, `City`, `Niches/Specialties` tags, `Bio textarea`, `Languages`, `Save Profile` button.
* **Test Steps:** Bio mein text edit karke `Save` dabayein ➡️ Database mein profile update honi chahiye.

### 4.4 Services CRUD & Pricing (F-022)
* **URL:** `http://localhost:3000/mentor/services`
* **Elements:**
  * `Create New Service` button.
  * Service title, type (`1-on-1 Session`, `Collection Review`), `Price (PKR)`, `Duration (Mins)`.
  * `Active / Inactive` toggle switch.
* **Test Steps:** Nayi service PKR 2,500 ki create karein ➡️ Entrepreneur marketplace mein foran nazar aani chahiye.

### 4.5 Weekly Availability Slots (F-023)
* **URL:** `http://localhost:3000/mentor/availability`
* **Elements:** Weekday selectors (Mon-Sun), `Start Time` (e.g. 15:00), `End Time` (e.g. 18:00), `Add Slot` button.
* **Test Steps:** Slot add karein aur verify karein ke booking form mein sirf wahi time slots select karne ki ijazat milti hai.

### 4.6 Mentees Management & Session Notes (F-025, F-027)
* **URL:** `http://localhost:3000/mentor/mentees`
* **Page Purpose:** Booked mentees ki list, AI-generated briefing dossier, aur session ke baad action notes likhna.
* **Elements:**
  * `View Mentee Dossier` button (shows Fatima Ali's business stage, launch plan, products).
  * `Write Session Notes` modal / textarea.
  * `Complete Session & Release Payment` button.
* **Test Steps:** Fatima Ali ka profile open karein ➡️ AI pre-session brief check karein ➡️ Session notes add karke "Complete" karein.

### 4.7 Earnings & Escrow Release (F-026)
* **URL:** `http://localhost:3000/mentor/earnings`
* **Elements:**
  * `Available Balance (PKR)`, `Pending in Escrow (PKR)`.
  * Transaction history table with Booking ID, Date, Mentee, Amount, Status (`released`).
* **Test Steps:** Session complete hote hi escrow amount available balance mein shift honi chahiye.

---

## 5. Super Admin Console QA

### 5.1 Admin Overview Portal
* **URL:** `http://localhost:3000/admin`
* **Credentials:** `admin@hunar.pk` / `Admin1234!`
* **Page Purpose:** Central command center for system health, cohort progress, and platform security.
* **Elements:** 6 Master Navigation Cards:
  * `Cohort Monitoring` ➡️ `/admin/cohort`
  * `Mentor Approvals` ➡️ `/admin/mentors`
  * `User Management` ➡️ `/admin/users`
  * `Audit Log Viewer` ➡️ `/admin/audit`
  * `Agent Explorer` ➡️ `/admin/runs`
  * `System Settings` ➡️ `/admin/settings`

### 5.2 User Management & Password Reset (F-031)
* **URL:** `http://localhost:3000/admin/users`
* **Page Purpose:** Tamam 26 seeded users ki list, role change, ban/unban aur password reset.
* **Buttons & Inputs:**
  * `Search Users` input box (by name or email).
  * `Role Filter` dropdown (`All`, `entrepreneur`, `mentor`, `super_admin`).
  * `Status Filter` dropdown (`active`, `suspended`).
  * `Add User` button.
  * Action buttons per row: `Reset Password`, `Suspend / Reactivate`.
* **Test Steps:**
  1. `fatima@hunar.pk` search karein ➡️ Row match honi chahiye.
  2. `Reset Password` button dabayein ➡️ Temporary password generate hona chahiye aur audit log mein record banna chahiye.

### 5.3 Mentor Verification & Approval (F-030)
* **URL:** `http://localhost:3000/admin/mentors`
* **Page Purpose:** New mentor applications ko review karna, credentials dekhna aur approve/reject karna.
* **Buttons & Inputs:**
  * `Pending Applications` tab vs `Active Mentors` tab.
  * `Approve Application` (Green button).
  * `Decline / Request Info` (Red button).
* **Test Steps:** Pending mentor application par `Approve` click karein ➡️ Mentor status "active" ho jaye aur marketplace mein show hone lagay.

### 5.4 Cohort Monitoring & Conversion Funnel (F-028)
* **URL:** `http://localhost:3000/admin/cohort`
* **Page Purpose:** "Lahore Batch 1" cohort ka funnel monitor karna.
* **Metrics Tracked:**
  * `Total Enrolled` (20 Entrepreneurs)
  * `Intake Complete` (15)
  * `Plan Approved` (10)
  * `First Post Published` (10)
  * `First Order Achieved` (5)
* **Test Steps:** Funnel stage counts match karein seeded database se.

### 5.5 Stalled Businesses List & Interventions (F-029)
* **URL:** `http://localhost:3000/admin/cohort/stalled`
* **Page Purpose:** Aise businesses identify karna jo kisi step par phans gaye hon:
  * *Condition 1:* No post in >5 days (e.g. Sana Tariq).
  * *Condition 2:* No metrics in >7 days (e.g. Rabia Akram).
  * *Condition 3:* Overdue tasks in plan (e.g. Nadia Jamil).
* **Buttons:** `Send Reminder WhatsApp / Notification`, `Assign Priority Mentor`.
* **Test Steps:** Stalled list mein 3 entrepreneurs nazar aane chahiye unke exact reason badge ke sath.

### 5.6 Feature Flags & Emergency Kill Switch (F-036)
* **URL:** `http://localhost:3000/admin/feature-flags`
* **Page Purpose:** System features toggle karna aur crisis mode mein AI agents ko disable karna.
* **Flags Mojood Hain:**
  1. `weekly_coach_agent` (Enabled)
  2. `mentor_marketplace` (Enabled)
  3. `meta_connect` (Disabled)
  4. `vision_metrics` (Disabled)
  5. `user_registration` (Enabled)
* **Test Steps:** `mentor_marketplace` toggle switch OFF karein ➡️ Entrepreneur portal par `/mentors` disable/hidden ho jana chahiye. Phir dobara ON karein.

### 5.7 System Usage Statistics & Health Leaderboard (F-037)
* **URL:** `http://localhost:3000/admin/usage`
* **Page Purpose:** 24-hour real-time telemetry, agent runs volume, average duration, aur error rate.
* **Elements:**
  * 4 KPI Cards: `Active Users Today`, `Runs Today`, `Avg Duration (seconds)`, `Error Rate (%)`.
  * `24-Hour Hourly Activity Bar Chart` (Recharts).
  * `Top Active Users Leaderboard` table.
  * `Auto-refresh (60s)` toggle button.
  * `Refresh` button.
* **Test Steps:** `Refresh` button click karein ➡️ API `/api/v1/admin/usage` se live data load hona chahiye.

### 5.8 Agent Explorer: Trace Trees & Span Timelines (F-033, F-034)
* **URL:** `http://localhost:3000/admin/runs`
* **Page Purpose:** PRD §36 ke mutabiq har AI agent execution ka span timeline, token cost, prompt aur latency dekhna.
* **Buttons & Inputs:**
  * `Workflow Filter` (`onboarding_intake`, `market_validator`, `pricing_calculator`, `launch_planner`, `content_writer`).
  * `Status Filter` (`succeeded`, `running`, `failed`).
  * Runs table (Trace ID, Workflow, User ID, Duration, Started At).
  * Row Click ➡️ Navigates to `/admin/runs/{id}` detail view.
* **Test Steps:**
  1. Kisi bhi run row par click karein.
  2. Span Tree check karein: `Agent Step` ➡️ `LLM Generation` ➡️ `Tool Call (Tavily/DB)` ➡️ `Output Guardrail`.
  3. Latency timing aur status badge verify karein.

### 5.9 Immutable Audit Log Viewer (F-032)
* **URL:** `http://localhost:3000/admin/audit`
* **Page Purpose:** PostgreSQL append-only security log jismein har login, approval, status change record hoti hai.
* **Buttons & Inputs:**
  * `Action Filter` dropdown (`login`, `approve_plan`, `book_service`, etc.).
  * `Export CSV` button.
  * Audit Table (Timestamp, Actor, Action, Target Type, Target ID, IP Address).
* **Test Steps:** `Export CSV` button click karein ➡️ Browser mein `.csv` file download honi chahiye.

### 5.10 System Concurrency & Settings (F-035)
* **URL:** `http://localhost:3000/admin/settings`
* **Page Purpose:** Maximum concurrent agent runs (semaphore default 5) aur rate limits manage karna.
* **Test Steps:** Concurrency quota update karein aur `Save Settings` click karein.

---

## 6. Kamyabi Ka Mayar (Pass / Fail Criteria)

Har page par QA sign-off ke liye mandarja zail 5 usool lazmi hain:

1. **HTTP Status Code 200:** Har page aur API request 200 OK return kare (koi 404, 500 ya unhandled 422 na ho).
2. **Data Isolation / Authorization:** Entrepreneur sirf apna business dekhe, Mentor sirf apne mentees, aur Super Admin ke paas mukammal audit visibility ho.
3. **Human Gate Enforcement:** Launch Plan aur Content Calendar user ki sarih ijazat (Explicit Approval) ke baghair aglay marhalay par move na kare.
4. **Roman Urdu Clarity:** Tamam AI generated prompts aur responses natural, ba-adab, aur Pakistani market context ke ain mutabiq hon.
5. **Audit Logging:** Har ahem action (Gate approval, booking, role change) `audit_logs` table mein foran register ho.
