# QA Test Suite — Super Admin Console

**Module:** Administrative Oversight, Security, & Telemetry  
**Super Admin Account:** `admin@hunar.pk` / `Admin1234!`  
**PRD References:** F-028 to F-037, PRD §36  

---

## 1. Page Matrix & Endpoints

| Page Title | Route (Frontend) | Backend API Endpoint | Key Action / Button | PRD Code |
| :--- | :--- | :--- | :--- | :--- |
| **Admin Portal Hub** | `/admin` | N/A (Overview Cards) | Navigate to Modules | PRD §4.3 |
| **Cohort Funnel** | `/admin/cohort` | `GET /api/v1/admin/cohort/funnel` | View Stage Conversion % | F-028 |
| **Stalled Businesses** | `/admin/cohort/stalled` | `GET /api/v1/admin/cohort/stalled` | Trigger Intervention | F-029 |
| **Mentor Approvals** | `/admin/mentors` | `GET/POST /api/v1/admin/mentors/approve` | Approve / Reject Mentor | F-030 |
| **User Management** | `/admin/users` | `GET/POST /api/v1/admin/users` | Reset Password, Ban User | F-031 |
| **Security Audit Log** | `/admin/audit` | `GET /api/v1/admin/audit` | Filter Actions, Export CSV | F-032 |
| **Agent Explorer** | `/admin/runs` | `GET /api/v1/admin/runs` | Filter Workflows, Open Trace | F-033 |
| **Agent Run Detail** | `/admin/runs/{id}` | `GET /api/v1/admin/runs/{id}` | Inspect Span Tree & Costs | F-034 |
| **System Settings** | `/admin/settings` | `GET/PUT /api/v1/admin/settings` | Save Concurrency Limits | F-035 |
| **Feature Flags** | `/admin/feature-flags` | `GET/PATCH /api/v1/admin/feature-flags` | Toggle Feature / Kill Switch | F-036 |
| **Usage Statistics** | `/admin/usage` | `GET /api/v1/admin/usage` | 24-Hr Charts, Refresh Leaderboard | F-037 |

---

## 2. Detailed Test Cases

### TC-ADM-01: Cohort Conversion Funnel & Stalled Monitoring
* **Pre-condition:** Login as `admin@hunar.pk`.
* **Action:**
  1. Open `/admin/cohort`.
  2. Verify funnel stages:
     - `Enrolled`: 20
     - `Intake`: 15
     - `Plan Approved`: 10
     - `First Post`: 10
     - `First Order`: 5
  3. Navigate to `/admin/cohort/stalled`.
* **Verification:**
  - Identifies 3 stalled entrepreneurs:
    - `Rabia Akram` (Reason: `no_metrics` > 7 days)
    - `Sana Tariq` (Reason: `no_post` > 5 days)
    - `Nadia Jamil` (Reason: `overdue_tasks`)
  - Stalled reason badges render with distinct color codings.

### TC-ADM-02: User Password Reset & Suspension
* **Pre-condition:** Login as `admin@hunar.pk`.
* **Action:**
  1. Navigate to `/admin/users`.
  2. Search for user `fatima@hunar.pk`.
  3. Click **"Reset Password"** in action menu.
* **Verification:**
  - Generates secure temporary password.
  - Sets `force_password_change = true` on user record.
  - Generates append-only entry in `audit_logs` table with `action = reset_password`.

### TC-ADM-03: Feature Flags & Agent Kill Switch
* **Pre-condition:** Login as `admin@hunar.pk`.
* **Action:**
  1. Open `/admin/feature-flags`.
  2. Locate `mentor_marketplace` flag.
  3. Toggle switch to **Disabled**.
* **Verification:**
  - API receives `PATCH /api/v1/admin/feature-flags/mentor_marketplace`.
  - Entrepreneur navbar hides "Mentors" tab immediately.
  - Visiting `/mentors` directly redirects or renders disabled message.

### TC-ADM-04: Agent Explorer & Span Timeline Inspection
* **Pre-condition:** Login as `admin@hunar.pk`.
* **Action:**
  1. Open `/admin/runs`.
  2. Filter by status `succeeded` or workflow `onboarding_intake`.
  3. Click a run row to open `/admin/runs/{id}`.
* **Verification:**
  - Header displays: `Trace ID`, `Workflow Name`, `Status`, `Duration (e.g. 1.4s)`.
  - Span tree timeline renders hierarchical steps:
    1. `IntakeAgent` (Root Span)
    2. `Gemini Generation` (Tokens in/out)
    3. `Database Tool Execution`
    4. `Guardrail Check`
  - Tool inputs and outputs are inspectable and properly redacted.

### TC-ADM-05: Immutable Audit Trail & CSV Export
* **Pre-condition:** Login as `admin@hunar.pk`.
* **Action:**
  1. Open `/admin/audit`.
  2. Filter by action `login`.
  3. Click **"Export CSV"**.
* **Verification:**
  - Table shows login timestamps, actor IP, and user ID.
  - Browser downloads a CSV file with full audit records.
  - SQL UPDATE/DELETE queries on `audit_logs` are blocked by database trigger.
