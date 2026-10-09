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

## Step 1. Verify M2 and M3 Backends (Completed)
- **Status:** COMPLETED
- **Script:** `scripts/check_m2_m3_api.py` executed with 57/57 tests passing (0 failures).
- **Authentication & RBAC:**
  - Verified demo accounts (`admin_core`, `faculty1`, `student1`, `student3`).
  - Confirmed 403 Forbidden for unauthorized roles across all endpoints.
- **Derived Endpoints Added (`[DERIVED]` in API docs):**
  - `GET /courses/{id}`
  - `DELETE /courses/{id}`
  - `GET /curriculum/{id}`
  - `GET /offerings/{id}`
  - `GET /enrollments/{id}`
  - `GET /attendance/sessions/{id}` (includes full session detail and student roster records)
- **Domain Rejection & Error Code Mappings:**
  - Standardized PyMySQL 16-bit negative error code resolution in `app/core/errors.py` and `app/db/helpers.py`.
  - Attendance < 75% exam registration rejection: maps to 403 `ATTENDANCE_BELOW_THRESHOLD` with exact trigger message (`Registration blocked: attendance 50.00% is below 75%`).
  - Duplicate exam registration: 409 `EXAM_DUPLICATE_REGISTRATION`.
  - Duplicate enrollment: 409 `DUPLICATE_ENROLLMENT`.
  - Capacity full: 409 `ENROLLMENT_CAPACITY_FULL`.
  - Published result modification attempt: 409 `RESULT_ALREADY_PUBLISHED`.
  - Marks out of bounds: 400 `MARKS_OUT_OF_BOUNDS`.
- **Bulk Enrollment Procedure Execution:**
  - Updated `call_bulk_enrollment` in `M2Repository` to parse multiple result sets from `sp_bulk_enrollment`, providing batch totals and per-row status/reasons.
- **Documentation:**
  - Created `docs/api/m2_academics.md` and `docs/api/m3_attendance_exams.md`.
  - Updated `docs/DECISIONS_LOG.md`.

---

## Step 2. Build M2 Frontend (Academics & Enrollment)
- **Status:** IN PROGRESS
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
