# Hunar v2 - Complete Manual Testing Guide

**Date:** October 14, 2026
**Tester:** [Your Name]
**Environment:** Local Development

---

## Table of Contents
1. [Setup & Startup](#1-setup--startup)
2. [API Testing](#2-api-testing)
3. [Authentication Testing](#3-authentication-testing)
4. [Entrepreneur Flow Testing](#4-entrepreneur-flow-testing)
5. [AI Agents Testing](#5-ai-agents-testing)
6. [Mentor Flow Testing](#6-mentor-flow-testing)
7. [Admin Dashboard Testing](#7-admin-dashboard-testing)
8. [Performance & Error Testing](#8-performance--error-testing)

---

## 1. Setup & Startup

### Step 1.1: Start Backend (FastAPI)

**Terminal 1:**
```bash
cd C:\Users\USER\Desktop\hunar-ai\apps\api
uv run uvicorn app.main:app --reload --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

**✅ Check:**
- [ ] No errors in console
- [ ] Server starts successfully
- [ ] Port 8000 is accessible

---

### Step 1.2: Start Frontend (Next.js)

**Terminal 2:**
```bash
cd C:\Users\USER\Desktop\hunar-ai\apps\web
pnpm dev
```

**Expected Output:**
```
▲ Next.js 16.x.x
- Local:        http://localhost:3000
✓ Ready in Xms
```

**✅ Check:**
- [ ] No compilation errors
- [ ] Port 3000 is accessible
- [ ] Shows "Ready" message

---

## 2. API Testing

### Step 2.1: Health Check

**Browser/Postman:** `http://localhost:8000/api/v1/health`

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-10-14T...",
  "database": "connected"
}
```

**✅ Check:**
- [ ] Status is "healthy"
- [ ] Database is "connected"
- [ ] Response time < 500ms

---

### Step 2.2: API Documentation

**Browser:** `http://localhost:8000/api/v1/docs`

**✅ Check:**
- [ ] Swagger UI loads successfully
- [ ] All endpoints are listed
- [ ] Can expand endpoint details
- [ ] Schemas are visible

**Key Endpoints to Verify:**
- [ ] POST `/api/v1/auth/register`
- [ ] POST `/api/v1/auth/login`
- [ ] POST `/api/v1/onboarding/start`
- [ ] GET `/api/v1/businesses/me`
- [ ] GET `/api/v1/mentors`
- [ ] GET `/api/v1/admin/cohort/funnel`

---

## 3. Authentication Testing

### Step 3.1: User Registration

**URL:** `http://localhost:3000/register`

**Test Case 1: Entrepreneur Registration**

**Input:**
```
Email: test.entrepreneur@example.com
Password: Test1234!
Password Confirm: Test1234!
Full Name: Test Entrepreneur
Role: Entrepreneur
```

**✅ Check:**
- [ ] Form validation works (email format, password strength)
- [ ] Registration succeeds
- [ ] Redirects to onboarding or dashboard
- [ ] Success message appears

**Test Case 2: Invalid Registration**

**Input:**
```
Email: invalid-email
Password: weak
```

**✅ Check:**
- [ ] Shows email format error
- [ ] Shows password strength error
- [ ] Form doesn't submit

---

### Step 3.2: User Login

**URL:** `http://localhost:3000/login`

**Test Case 1: Valid Login - Entrepreneur**

**Credentials:**
```
Email: test.entrepreneur@example.com
Password: Test1234!
```

**✅ Check:**
- [ ] Login succeeds
- [ ] JWT token stored in localStorage/cookies
- [ ] Redirects to entrepreneur dashboard
- [ ] User name/email displayed in UI

**Test Case 2: Invalid Login**

**Input:**
```
Email: test.entrepreneur@example.com
Password: WrongPassword123!
```

**✅ Check:**
- [ ] Shows "Invalid credentials" error
- [ ] Does not redirect
- [ ] No token stored

---

### Step 3.3: Logout

**✅ Check:**
- [ ] Logout button visible in navbar/menu
- [ ] Click logout
- [ ] Redirects to login page
- [ ] Token cleared from storage
- [ ] Cannot access protected routes

---

## 4. Entrepreneur Flow Testing

### Step 4.1: Onboarding Chat (Roman Urdu)

**URL:** `http://localhost:3000/onboarding`

**Test Script:**

**Message 1:**
```
Assalamu alaikum! Main apna home-based pret business start karna chahti hun.
```

**✅ Check:**
- [ ] Chat interface loads
- [ ] Message sends successfully
- [ ] AI agent responds (Intake Agent)
- [ ] Agent status badge shows "Intake Agent"
- [ ] Response is in Roman Urdu

**Message 2:**
```
Mera budget 50,000 PKR hai aur main Lahore mein hun.
```

**✅ Check:**
- [ ] Intake agent extracts business details
- [ ] Transitions to Validator Agent
- [ ] Status badge updates to "Validator Agent"
- [ ] Real-time streaming (SSE) works

**Message 3:**
```
Main social media par bechungi aur WhatsApp pe orders lungi.
```

**✅ Check:**
- [ ] Validator agent completes
- [ ] Pricing agent starts
- [ ] Eventually shows completion message
- [ ] "View Validation Report" or "Next Steps" button appears

---

### Step 4.2: Validation Report

**URL:** `http://localhost:3000/validation`

**✅ Check:**
- [ ] Report card displays
- [ ] Market gap analysis shown
- [ ] Competitor list displayed (from Tavily API)
- [ ] Confidence score visible
- [ ] Can approve/reject validation

**Key Metrics to Verify:**
- [ ] Market size estimation
- [ ] Competition level (Low/Medium/High)
- [ ] Recommended pricing range
- [ ] Target audience insights

---

### Step 4.3: Unit Economics (Pricing)

**URL:** `http://localhost:3000/pricing`

**✅ Check:**
- [ ] Unit cost breakdown visible
- [ ] Selling price shown
- [ ] Profit margin calculated (e.g., 40.9%)
- [ ] Break-even units calculated
- [ ] Visual chart/table displays data clearly

**Example Expected Data:**
```
Unit Cost: Rs. 1,300
Selling Price: Rs. 2,200
Profit Margin: 40.9%
Break-even: 15 units
```

---

### Step 4.4: Launch Plan Approval (Human Gate 1)

**URL:** `http://localhost:3000/plan`

**✅ Check:**
- [ ] 30-day launch roadmap displayed
- [ ] Tasks organized by week
- [ ] Each task has date, description, status
- [ ] "Approve Plan" button visible
- [ ] Click "Approve Plan"
- [ ] Approval confirmation modal/toast
- [ ] Plan status changes to "Approved"
- [ ] Timestamp and audit hash recorded

---

### Step 4.5: Task Management

**URL:** `http://localhost:3000/plan` (after approval)

**✅ Check:**
- [ ] Task list displays all tasks
- [ ] Can check/uncheck tasks
- [ ] Task status updates in real-time
- [ ] Visual completion animation
- [ ] Progress bar updates (e.g., "5/30 tasks completed")
- [ ] Filter by week or status

**Test Actions:**
- [ ] Mark task as complete
- [ ] Mark task as incomplete
- [ ] Verify task count updates

---

### Step 4.6: Content Calendar

**URL:** `http://localhost:3000/content/calendar`

**✅ Check:**
- [ ] 30-day calendar view loads
- [ ] Posts organized by date
- [ ] 3 content pillars visible:
  - Behind-the-Scenes
  - Product Showcase
  - Customer Love
- [ ] Can click on individual days
- [ ] Post preview shows caption + image prompt

---

### Step 4.7: Today's Content

**URL:** `http://localhost:3000/content/today`

**✅ Check:**
- [ ] Today's scheduled post displays
- [ ] Roman Urdu caption visible
- [ ] "Copy Caption" button works
- [ ] Click shows green checkmark/confirmation
- [ ] Visual prompt for image/reel creation
- [ ] Post type indicated (Image/Reel/Story)
- [ ] Can navigate to previous/next days

---

### Step 4.8: Metrics Logging

**URL:** `http://localhost:3000/metrics`

**✅ Check:**
- [ ] Performance charts display (Recharts)
- [ ] Revenue trend graph
- [ ] Orders trend graph
- [ ] Engagement by channel
- [ ] "Log Today's Metrics" button
- [ ] Click opens modal with form:
  - Views
  - Inquiries
  - Orders
  - Revenue
- [ ] Submit metrics
- [ ] Charts update with new data

---

### Step 4.9: Weekly Coach (Human Gate 3)

**URL:** `http://localhost:3000/metrics` (after 7+ days of metrics)

**✅ Check:**
- [ ] Weekly coach notification appears
- [ ] Coach analysis displayed:
  - "Reels generated 3x more orders than images"
- [ ] Proposed adjustment shown:
  - "Replace Day 18 & 21 images with reels"
- [ ] "Approve & Update Calendar" button
- [ ] Click approval
- [ ] Content calendar updates automatically
- [ ] Confirmation message

---

## 5. AI Agents Testing

### Step 5.1: Intake Agent

**Trigger:** Start new onboarding chat

**✅ Check:**
- [ ] Responds in Roman Urdu
- [ ] Extracts business name
- [ ] Extracts budget
- [ ] Extracts location
- [ ] Extracts product category
- [ ] Asks follow-up questions if info missing
- [ ] Transitions to Validator automatically

---

### Step 5.2: Validator Agent

**Trigger:** Continues from Intake

**✅ Check:**
- [ ] Uses Tavily API for market research
- [ ] Identifies competitors
- [ ] Calculates market gap
- [ ] Provides confidence score
- [ ] Generates validation report
- [ ] Stores report in database

**Verify in Database (Optional):**
```sql
SELECT * FROM validation_reports ORDER BY created_at DESC LIMIT 1;
```

---

### Step 5.3: Pricing Agent

**Trigger:** After validation

**✅ Check:**
- [ ] Calculates unit costs
- [ ] Suggests selling price
- [ ] Computes profit margin
- [ ] Calculates break-even units
- [ ] Stores pricing result in DB

---

### Step 5.4: Planner Agent

**Trigger:** After pricing

**✅ Check:**
- [ ] Generates 30-day roadmap
- [ ] Tasks are specific and actionable
- [ ] Tasks have dates
- [ ] Organized into phases (Setup, Brand, Content, Launch)
- [ ] Stores plan in database
- [ ] Waits for human approval (Gate 1)

---

### Step 5.5: Content Strategist

**Trigger:** After plan approval

**✅ Check:**
- [ ] Generates 30-day content calendar
- [ ] Posts aligned with 3 pillars
- [ ] Captions in Roman Urdu
- [ ] Visual prompts included
- [ ] Mix of post types (Images, Reels, Stories)
- [ ] Stores content items in DB

---

### Step 5.6: Weekly Coach Agent

**Trigger:** After 7+ days of metrics logging

**✅ Check:**
- [ ] Analyzes performance data
- [ ] Identifies trends (best-performing content types)
- [ ] Proposes calendar adjustments
- [ ] Waits for human approval (Gate 3)
- [ ] Updates calendar after approval

---

## 6. Mentor Flow Testing

### Step 6.1: Mentor Registration/Login

**URL:** `http://localhost:3000/login`

**Credentials (if seeded):**
```
Email: ayesha.mentor@hunar.pk
Password: Mentor1234!
```

**✅ Check:**
- [ ] Login succeeds
- [ ] Redirects to mentor dashboard
- [ ] Different UI from entrepreneur

---

### Step 6.2: Mentor Profile

**URL:** `http://localhost:3000/mentor/profile`

**✅ Check:**
- [ ] Profile information displayed
- [ ] Specialization/expertise shown
- [ ] Rating and review count
- [ ] Can edit profile (bio, hourly rate, expertise)
- [ ] Upload profile picture (if implemented)

---

### Step 6.3: Mentor Services

**URL:** `http://localhost:3000/mentor/services`

**✅ Check:**
- [ ] List of services displayed
- [ ] Can add new service
- [ ] Can edit existing service
- [ ] Can delete service
- [ ] Service details: name, description, price, duration

---

### Step 6.4: Availability Management

**URL:** `http://localhost:3000/mentor/availability`

**✅ Check:**
- [ ] Weekly calendar view
- [ ] Can set available time slots
- [ ] Can block unavailable times
- [ ] Time slots save successfully
- [ ] Visual indication of availability

---

### Step 6.5: Booking Management

**URL:** `http://localhost:3000/mentor/bookings`

**✅ Check:**
- [ ] Upcoming bookings displayed
- [ ] Past bookings shown
- [ ] Booking details: entrepreneur name, date, time, service
- [ ] Can confirm booking
- [ ] Can cancel booking (with reason)
- [ ] Status badges (Pending, Confirmed, Completed, Cancelled)

---

### Step 6.6: Mentor Marketplace (Entrepreneur View)

**URL:** `http://localhost:3000/mentors` (login as entrepreneur)

**✅ Check:**
- [ ] List of verified mentors displayed
- [ ] Filter by specialization (Apparel, Food, Beauty, etc.)
- [ ] Mentor cards show:
  - Name
  - Specialization
  - Rating (e.g., 4.9 stars)
  - Review count
  - Hourly rate
- [ ] Can click "View Profile"
- [ ] Can click "Book Session"

---

### Step 6.7: Booking Flow (Entrepreneur)

**Trigger:** Click "Book Session" on a mentor

**✅ Check:**
- [ ] Booking modal opens
- [ ] Select service from dropdown
- [ ] Select available date
- [ ] Select available time slot
- [ ] Shows total price
- [ ] "Confirm Booking" button
- [ ] Simulated escrow payment UI
- [ ] Booking confirmation
- [ ] Email/notification sent (if implemented)

---

### Step 6.8: Review System

**URL:** `http://localhost:3000/mentor/reviews` (mentor view)
**URL:** `http://localhost:3000/mentors/[id]` (entrepreneur leaves review)

**✅ Check:**
- [ ] Entrepreneur can leave review after completed session
- [ ] Rating (1-5 stars)
- [ ] Written review text
- [ ] Review submission
- [ ] Review appears on mentor profile
- [ ] Mentor can view all reviews
- [ ] Average rating updates

---

## 7. Admin Dashboard Testing

### Step 7.1: Admin Login

**URL:** `http://localhost:3000/login`

**Credentials (if seeded):**
```
Email: admin@hunar.pk
Password: Admin1234!
```

**✅ Check:**
- [ ] Login succeeds
- [ ] Redirects to admin dashboard
- [ ] Admin-only navigation visible

---

### Step 7.2: Cohort Funnel

**URL:** `http://localhost:3000/admin/cohort`

**✅ Check:**
- [ ] 4-stage conversion funnel displays:
  - Signed Up
  - Plan Approved
  - First Post
  - First Order
- [ ] User counts per stage
- [ ] Visual funnel chart (bars/funnel shape)
- [ ] Conversion percentages between stages
- [ ] Can click stage to see users in that stage

---

### Step 7.3: Stalled Users Detection

**URL:** `http://localhost:3000/admin/cohort` (scroll to stalled section)

**✅ Check:**
- [ ] List of stalled entrepreneurs
- [ ] Diagnostic badges:
  - "No post in >5 days"
  - "Overdue tasks"
  - "No metrics in >7 days"
- [ ] "Nudge" button per user
- [ ] Click "Nudge"
- [ ] Confirmation modal
- [ ] Nudge sent (notification to entrepreneur)
- [ ] Toast notification appears
- [ ] Audit log entry created

---

### Step 7.4: System Telemetry

**URL:** `http://localhost:3000/admin/usage`

**✅ Check:**
- [ ] 24-hour activity histogram
- [ ] Total API calls count
- [ ] Error rate (should be 0% or very low)
- [ ] Average response latency
- [ ] Most-used endpoints
- [ ] Active users count

---

### Step 7.5: Agent Run Explorer

**URL:** `http://localhost:3000/admin/runs`

**✅ Check:**
- [ ] List of recent agent executions
- [ ] Each run shows:
  - Agent type (Intake, Validator, etc.)
  - Status (Running, Success, Failed)
  - Start/end timestamp
  - Duration
  - User email
- [ ] Can click into individual run

---

### Step 7.6: Agent Run Details

**URL:** `http://localhost:3000/admin/runs/[id]`

**✅ Check:**
- [ ] Full span timeline displayed
- [ ] Orchestrator → Child agent flow
- [ ] Each step shows:
  - Agent name
  - Tool calls (e.g., "search_competitors")
  - Input/output (truncated for privacy)
  - Token count
- [ ] API keys are redacted
- [ ] Sensitive data masked
- [ ] Can expand/collapse steps

---

### Step 7.7: Feature Flags

**URL:** `http://localhost:3000/admin/features`

**✅ Check:**
- [ ] List of feature flags
- [ ] Each flag shows:
  - Name
  - Description
  - Status (Enabled/Disabled)
- [ ] Toggle switch to enable/disable
- [ ] Changes persist after page reload
- [ ] Affects feature availability in app

**Test Example:**
- [ ] Disable "Mentor Marketplace" flag
- [ ] Login as entrepreneur
- [ ] Verify `/mentors` route shows "Feature disabled" or redirects
- [ ] Re-enable flag
- [ ] Verify feature works again

---

### Step 7.8: User Management

**URL:** `http://localhost:3000/admin/users`

**✅ Check:**
- [ ] List all users (entrepreneurs, mentors, admins)
- [ ] Filter by role
- [ ] Search by email/name
- [ ] Each user shows:
  - Email
  - Role
  - Status (Active, Suspended)
  - Registration date
- [ ] Can view user details
- [ ] Can suspend/reactivate user (if implemented)

---

## 8. Performance & Error Testing

### Step 8.1: Page Load Speed

**✅ Check (for each major page):**
- [ ] `/onboarding` - loads in < 2 seconds
- [ ] `/plan` - loads in < 2 seconds
- [ ] `/content/calendar` - loads in < 2 seconds
- [ ] `/metrics` - loads in < 2 seconds
- [ ] `/mentors` - loads in < 2 seconds
- [ ] `/admin/cohort` - loads in < 3 seconds

**Tool:** Browser DevTools → Network tab → Check "Load" time

---

### Step 8.2: API Response Times

**✅ Check (in API Docs or Postman):**
- [ ] GET `/api/v1/businesses/me` - < 500ms
- [ ] GET `/api/v1/mentors` - < 1000ms
- [ ] POST `/api/v1/onboarding/message` - < 5000ms (AI call)
- [ ] GET `/api/v1/admin/cohort/funnel` - < 1000ms

---

### Step 8.3: Error Handling

**Test Case 1: Network Offline**

**✅ Check:**
- [ ] Disconnect internet
- [ ] Try to submit form
- [ ] Shows "Network error" or "Please check connection"
- [ ] Doesn't crash
- [ ] Can retry after reconnecting

**Test Case 2: Invalid API Response**

**✅ Check:**
- [ ] Stop backend server
- [ ] Try to access data
- [ ] Shows error message (not just blank page)
- [ ] Doesn't expose stack traces to user

**Test Case 3: Validation Errors**

**✅ Check:**
- [ ] Submit form with missing required fields
- [ ] Shows field-specific error messages
- [ ] Highlights invalid fields
- [ ] Doesn't submit

---

### Step 8.4: Concurrent Users

**Test Setup:**
- [ ] Open 3 browser windows (Chrome, Firefox, Edge)
- [ ] Login as different users in each
- [ ] Perform actions simultaneously

**✅ Check:**
- [ ] All sessions work independently
- [ ] No data leakage between users
- [ ] Real-time updates work (if websockets/SSE)
- [ ] No race conditions or conflicts

---

### Step 8.5: Database Integrity

**After all tests, verify in database:**

```sql
-- Check user count
SELECT COUNT(*) FROM users;

-- Check businesses created
SELECT COUNT(*) FROM businesses;

-- Check agent runs logged
SELECT COUNT(*) FROM agent_runs;

-- Check audit logs
SELECT COUNT(*) FROM audit_logs;
```

**✅ Check:**
- [ ] All records saved correctly
- [ ] No orphaned records
- [ ] Foreign keys intact
- [ ] Timestamps populated

---

## 9. Mobile Responsiveness (Bonus)

**Test on different screen sizes:**

**Desktop (1920x1080):**
- [ ] All pages render correctly
- [ ] No horizontal scroll

**Tablet (768x1024):**
- [ ] Navigation adapts (hamburger menu?)
- [ ] Charts/tables responsive
- [ ] Forms usable

**Mobile (375x667):**
- [ ] All features accessible
- [ ] Touch targets large enough
- [ ] Text readable without zooming
- [ ] No overlapping elements

---

## 10. Testing Summary Checklist

### Critical Features (Must Work)
- [ ] User registration and login
- [ ] Onboarding chat with AI agents
- [ ] Validation report generation
- [ ] Unit economics calculation
- [ ] Launch plan approval (Human Gate 1)
- [ ] Content calendar generation
- [ ] Metrics logging
- [ ] Mentor marketplace and booking
- [ ] Admin cohort funnel
- [ ] Agent execution tracing

### Important Features (Should Work)
- [ ] Task management
- [ ] Weekly coach recommendations (Gate 3)
- [ ] Mentor availability management
- [ ] Stalled user detection
- [ ] System telemetry dashboard
- [ ] Feature flags

### Nice-to-Have (Can Have Issues)
- [ ] Real-time notifications
- [ ] Profile picture uploads
- [ ] Email notifications
- [ ] Advanced filtering/search

---

## 11. Bug Tracking Template

When you find a bug, document it:

**Bug ID:** BUG-001
**Severity:** High / Medium / Low
**Page/Feature:** [e.g., Content Calendar]
**Steps to Reproduce:**
1. ...
2. ...

**Expected Result:** ...
**Actual Result:** ...
**Screenshots:** [Attach if helpful]
**Browser/Device:** [e.g., Chrome 120 on Windows 11]
**Notes:** ...

---

## 12. Final Test Report

**Date:** [Fill in]
**Total Features Tested:** [Fill in]
**Features Passed:** [Fill in]
**Features Failed:** [Fill in]
**Critical Bugs Found:** [Fill in]
**Overall Status:** Pass / Needs Work / Fail

**Next Steps:**
- [ ] Fix critical bugs
- [ ] Retest failed features
- [ ] Document known issues
- [ ] Prepare for deployment

---

**End of Manual Testing Guide**

Good luck with your testing! 🚀
