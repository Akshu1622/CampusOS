# Repair Progress Tracking

This document tracks the step-by-step progress of the M2 and M3 frontend build, backend verification, cross-module repair, and final regression.

## Step 0. Baseline (Completed)
- **Status:** COMPLETED
- **Branch:** `repair/m2-m3-frontend` created from `main`.
- **Database Status:** Docker container `university_erp_db` is running. `python scripts/db_reset.py` executed successfully.
- **Verification Script:** `python scripts/verify_seed.py` passed all 30 checks including edge-case cohorts and consistency queries.
- **Table Counts:** Verified all 49 base tables with a total of 1565 rows.
  - `academic_term`: 2
  - `admin_permission_set_assignment`: 7
  - `attendance_record`: 12
  - `attendance_session`: 4
  - `course`: 50
  - `course_offering`: 50
  - `department`: 5
  - `designation`: 6
  - `employee`: 30
  - `enrollment`: 986
  - `exam`: 1
  - `exam_marks_result`: 5
  - `exam_registration`: 5
  - `fee_component`: 1
  - `fee_structure`: 1
  - `grade_scale`: 7
  - `hostel`: 2
  - `hostel_allocation`: 7
  - `hostel_request`: 2
  - `late_fee_rule`: 2
  - `leave_application`: 2
  - `leave_entitlement`: 6
  - `leave_type`: 4
  - `payment`: 2
  - `payment_allocation`: 2
  - `payroll_run`: 2
  - `permission_set`: 7
  - `program`: 10
  - `receipt`: 2
  - `role`: 3
  - `role_assignment`: 12
  - `room`: 2
  - `salary_structure`: 6
  - `semester_result`: 2
  - `student`: 250
  - `student_fee`: 4
  - `user_account`: 12
- **Services:**
  - Backend running at `http://localhost:8000` (FastAPI / OpenAPI 200 OK)
  - Frontend running at `http://localhost:5173` (Vite / React 200 OK)

---

## Step 1. Verify M2 and M3 Backends
- **Status:** IN PROGRESS
- **Tasks:**
  - Write `scripts/check_m2_m3_api.py`.
  - Authenticate demo accounts (`admin_core`, `faculty1`, `student1`).
  - Test all M2 and M3 endpoints per PRD §9.2 and OpenAPI schema.
  - Verify 2xx status, role authorization (403), and domain error mapping.
  - Fix any backend errors and update `docs/api/m2_*.md` and `m3_*.md`.

---

## Step 2. Build M2 Frontend (Academics & Enrollment)
- **Status:** PENDING
- **Pages:** A-01 to A-08.

---

## Step 3. Build M3 Frontend (Attendance, Exams & Results)
- **Status:** PENDING
- **Pages:** E-01 to E-12.

---

## Step 4. Tests for M2 and M3
- **Status:** PENDING
- **Playwright E2E & Vitest unit tests**, responsive screenshots.

---

## Step 5. Fix Small Breakages Across Everything Else
- **Status:** PENDING
- `scripts/check_backend_sql.py`, `scripts/smoke_test.py`, `docs/PAGE_HEALTH.md`, standard error handling.

---

## Step 6. Final Regression & Merge
- **Status:** PENDING
- Full test suites, README update, merge to `main`.
