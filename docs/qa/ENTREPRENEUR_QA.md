# QA Test Suite — Entrepreneur Portal

**Module:** Entrepreneur Dashboard & Workflows  
**Flagship Demo Account:** `fatima@hunar.pk` / `User1234!`  
**Fresh Onboarding Account:** `sadia@hunar.pk` / `User1234!`  
**PRD References:** F-001 to F-020, F-041, F-042  

---

## 1. Page Matrix & Endpoints

| Page Title | Route (Frontend) | Backend API Endpoint | Key Action / Button | PRD Code |
| :--- | :--- | :--- | :--- | :--- |
| **Login / Signup** | `/login`, `/signup` | `POST /api/v1/auth/login` | Sign In, Create Account | F-001, F-002 |
| **Onboarding Chat** | `/onboarding` | `POST /api/v1/onboarding/chat` | Send Message (SSE stream) | F-003, F-042 |
| **Today's Dashboard** | `/dashboard` | `GET /api/v1/businesses/dashboard` | Mark Task Complete | F-013 |
| **My Business Profile** | `/business` | `GET /api/v1/businesses` | Edit Profile | F-004 |
| **Products Catalog** | `/products` | `GET /api/v1/businesses/{id}/products` | Add Product, Edit Margin | F-005 |
| **Validation Report** | `/validation` | `GET /api/v1/businesses/{id}/validation` | Re-run Validation | F-006 |
| **Pricing & Margin** | `/pricing` | `GET /api/v1/businesses/{id}/pricing` | Adjust Sliders, Accept Price | F-007 |
| **30-Day Launch Plan** | `/plan` | `GET /api/v1/businesses/{id}/plan` | **Approve Plan (Gate 1)** | F-008, F-009 |
| **Content Calendar** | `/content/calendar` | `GET /api/v1/businesses/{id}/content/calendar` | View Month, Copy Caption | F-011 |
| **Today's Content Post** | `/content/today` | `GET /api/v1/businesses/{id}/content/today` | Copy Hook, Mark as Posted | F-013 |
| **Performance Metrics** | `/metrics` | `GET /api/v1/metrics/snapshots` | Log Weekly Metrics | F-015, F-016 |
| **Mentor Marketplace** | `/mentors` | `GET /api/v1/mentors` | Book 1-on-1 Session | F-018, F-019 |
| **My Bookings** | `/mentors/bookings`| `GET /api/v1/bookings` | Join Session, Leave Review | F-020, F-041 |
| **Notifications** | `/notifications` | `GET /api/v1/notifications` | Mark as Read | F-038 |

---

## 2. Detailed Test Cases

### TC-ENT-01: Onboarding Chat with Intake Agent
* **Pre-condition:** Login as `sadia@hunar.pk`.
* **Action:**
  1. Open `/onboarding`.
  2. Send message: `"Assalamu alaikum! Main Lahore mein clay mugs aur handcrafted pottery ka kaam start karna chahti hun, budget 25000 PKR hai."`
* **Verification:**
  - Status indicator changes from "Idle" ➡️ "Thinking..." ➡️ "Streaming".
  - Response streams in real-time in Roman Urdu.
  - Business profile card displays extracted fields:
    - Business Name: *Sadia's Clay Studio*
    - Niche: *Handmade & Crafts*
    - City: *Lahore*
    - Budget: *25,000 PKR*

### TC-ENT-02: Human Gate 1 — Launch Plan Approval
* **Pre-condition:** Login as `rabia@hunar.pk` or view `/plan`.
* **Action:**
  1. Inspect the 4-week task checklist.
  2. Click **"Approve Launch Plan"** button.
* **Verification:**
  - Status transitions to `approved`.
  - Timestamp is recorded in `launch_plans.approved_at`.
  - Next stage (Content Generation) becomes unblocked.
  - An entry is created in `audit_logs` with action `approve_plan`.

### TC-ENT-03: Content Copy-Paste & Social Post Workflow
* **Pre-condition:** Login as `fatima@hunar.pk`.
* **Action:**
  1. Navigate to `/content/today`.
  2. Click **"Copy Caption"**.
  3. Enter simulated post URL: `https://instagram.com/p/hunar_demo_test`.
  4. Click **"Mark as Posted"**.
* **Verification:**
  - Toast displays: `"Caption copied to clipboard"`.
  - Post status changes from `draft` to `posted`.
  - Daily progress ring on `/dashboard` updates by +1 post.

### TC-ENT-04: Mentor Booking & Escrow Simulation
* **Pre-condition:** Login as `fatima@hunar.pk`.
* **Action:**
  1. Open `/mentors`.
  2. Select Ayesha Siddiqua (Apparel Specialist).
  3. Select Tuesday slot (15:00 - 16:00).
  4. Add notes: *"Need advice on Eid lawn fabric procurement."*
  5. Click **"Confirm & Hold Escrow (PKR 3,000)"**.
* **Verification:**
  - Booking is created with status `scheduled`.
  - Simulated payment record created in `payments_sim` with status `held`.
  - Notification sent to Mentor and Entrepreneur.
