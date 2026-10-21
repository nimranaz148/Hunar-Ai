# QA Test Suite — Mentor Portal (Pro Panel)

**Module:** Mentor Professional Services & Client Management  
**Flagship Demo Mentor:** `ayesha.mentor@hunar.pk` / `Mentor1234!`  
**PRD References:** F-021 to F-027, F-040  

---

## 1. Page Matrix & Endpoints

| Page Title | Route (Frontend) | Backend API Endpoint | Key Action / Button | PRD Code |
| :--- | :--- | :--- | :--- | :--- |
| **Mentor Dashboard** | `/mentor` | `GET /api/v1/mentor/dashboard` | View Upcoming Sessions | F-024 |
| **Profile & Bio** | `/mentor/profile` | `GET/PATCH /api/v1/mentor/profile` | Update Bio, Niches, City | F-021 |
| **My Services** | `/mentor/services` | `GET/POST /api/v1/mentor/services` | Create Service, Edit Price | F-022 |
| **Availability Editor** | `/mentor/availability` | `GET/PUT /api/v1/mentor/availability` | Add / Remove Weekly Slots | F-023 |
| **My Mentees & Briefs**| `/mentor/mentees` | `GET /api/v1/mentor/mentees` | View Mentee AI Dossier | F-025 |
| **Session Notes** | `/mentor/mentees` | `POST /api/v1/bookings/{id}/notes` | Save Action Items | F-027 |
| **Earnings & Escrow** | `/mentor/earnings` | `GET /api/v1/mentor/earnings` | View Escrow vs Available | F-026 |

---

## 2. Detailed Test Cases

### TC-MEN-01: Services Setup & Pricing CRUD
* **Pre-condition:** Login as `ayesha.mentor@hunar.pk`.
* **Action:**
  1. Navigate to `/mentor/services`.
  2. Click **"Add New Service"**.
  3. Enter:
     - Title: `Pret Sourcing Audit`
     - Type: `session`
     - Price: `3500` PKR
     - Duration: `60` mins
  4. Click **"Save Service"**.
* **Verification:**
  - Service appears in the table.
  - Price displays formatted: `PKR 3,500`.
  - Entrepreneur marketplace reflects the new service immediately.

### TC-MEN-02: Availability Slots Configuration
* **Pre-condition:** Login as `ayesha.mentor@hunar.pk`.
* **Action:**
  1. Open `/mentor/availability`.
  2. Add Monday slot: `15:00` to `18:00`.
  3. Add Wednesday slot: `15:00` to `18:00`.
  4. Click **"Save Availability"**.
* **Verification:**
  - Slots display on the interactive weekly calendar.
  - Booking modal for entrepreneurs only permits booking inside these defined windows.

### TC-MEN-03: Mentee Dossier & Pre-Session Briefing
* **Pre-condition:** Login as `ayesha.mentor@hunar.pk`.
* **Action:**
  1. Navigate to `/mentor/mentees`.
  2. Locate booked mentee `Fatima Ali` (Zauq-e-Hunar Pret).
  3. Click **"View AI Mentee Brief"**.
* **Verification:**
  - Brief summarizes Fatima's business model, top product, current margin (40.9%), and booking note.
  - No access is granted to non-booked entrepreneurs (scoping enforced).

### TC-MEN-04: Session Completion & Escrow Payout
* **Pre-condition:** Session scheduled with Fatima Ali.
* **Action:**
  1. Open the booking details.
  2. Input session advice: *"Detailed 3 reliable suppliers in Azam Cloth Market. Advised batching dye orders."*
  3. Click **"Complete Session & Release Escrow"**.
* **Verification:**
  - Booking status changes to `completed`.
  - Payment status in `payments_sim` transitions from `held` to `released`.
  - `/mentor/earnings` reflects +3,000 PKR in Available Balance.
