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

## Step 2. Build M2 Frontend (Academics & Enrollment) (Completed)
- **Status:** COMPLETED
- **Features Created (`frontend/src/features/m2_academics/`):**
  - `api.ts`: Typed client for courses, curriculum mapping, course offerings, roster, enrollments, bulk enrollment validation & execution, student self-service (`/me/courses`), faculty teaching (`/faculty/me/offerings`), and master lookups.
  - `hooks.ts`: Comprehensive React Query hooks with query key factories and cache invalidation.
  - `pages/A01CourseCatalogPage.tsx`: Course catalog with code (mono), title, credits, department, status, T-LIST filter/search, add/edit drawer, delete dialog.
  - `pages/A02CurriculumMappingPage.tsx`: Program selector, semester column cards, credit totals, credits mismatch warning alert, add course to semester drawer, remove confirmation.
  - `pages/A03CourseOfferingsPage.tsx`: Course offerings list, section, faculty, fill level filter, capacity progress bar & status pills (amber >= 90%, error at 100%), add/edit drawer, class roster drawer.
  - `pages/A04IndividualEnrollmentPage.tsx`: Compact single student enrollment form with live validation panel (student, offering, seats available, term status) and exact backend error alert display.
  - `pages/A05BulkEnrollmentPage.tsx`: 4-step wizard: 1. Source (CSV/JSON/XML upload or cohort generation); 2. Validate & preview with KPI strip and per-row table; 3. Options & policy selection (ALL_OR_NOTHING vs SKIP_INVALID) with confirmation checkbox; 4. Execution result with summary cards and report link.
  - `pages/A06EnrollmentRecordsPage.tsx`: Enrollment records list, student search, status & offering filters, CSV export, withdraw enrollment confirmation dialog.
  - `pages/A07MyCoursesPage.tsx`: Student self-service courses with grid/list view toggle, course cards, instructor, credits, status pills, and detail drawer.
  - `pages/A08MyTeachingPage.tsx`: Faculty self-service teaching sections with enrollment progress, quick links to mark attendance and grade entry, roster drawer with search and CSV export.
- **Routing & Navigation:**
  - Registered all routes in `frontend/src/routes/index.tsx` for Admin (`/admin/academics/*`), Faculty (`/faculty/teaching`, `/faculty/courses`), and Student (`/student/courses`).
  - Added navigation items to `frontend/src/components/AppShell.tsx` for Admin, Faculty, and Student roles.
- **Verification:**
  - TypeScript compilation and production build (`npm run build`) succeeded with 0 errors.

---

## Step 3. Build M3 Frontend (Attendance, Exams & Results) (Completed)
- **Status:** COMPLETED
- **Features Created (`frontend/src/features/m3_attendance_exams/`):**
  - `api.ts`: Fully typed client for attendance sessions, records, shortage report, student attendance, exams, exam registration, marks entry, result processing, result publishing, student results & grade cards, student CGPA UDF lookup, course result summaries, and grade scale configuration.
  - `hooks.ts`: Complete React Query hooks with query invalidation and optimistic updates.
  - `pages/E01MarkAttendancePage.tsx`: Mark Attendance workspace with offering selector, session date, slot (1-8), bulk "Mark All Present" / "Mark All Absent", live present/absent KPI pills, Present/Absent segmented buttons per student, and warning alert with update mode when editing an existing session.
  - `pages/E02AttendanceHistoryPage.tsx`: Attendance History table with offering filter, date range, slot, session details drawer with student records table, and quick jump to edit attendance session.
  - `pages/E03MyAttendancePage.tsx`: Student self-service attendance dashboard with overall percentage KPI card, 75% rule alert banner, per-course progress bar with vertical 75% threshold marker, and eligibility status pill.
  - `pages/E04AttendanceShortageReportPage.tsx`: Admin/Faculty shortage report listing students below 75% threshold, gap-to-75 classes needed calculation, threshold filter (default 75%), offering filter, and CSV export.
  - `pages/E05ExamManagementPage.tsx`: Exam schedule & management table with type pills (QUIZ, MIDTERM, FINAL, PRACTICAL, ASSIGNMENT), schedule exam drawer, edit drawer, and delete confirmation dialog.
  - `pages/E06ExamRegistrationPage.tsx`: Student exam registration workspace with 75% attendance eligibility check, registered/eligible/blocked status pills, one-click registration, and display of database trigger rejection messages (`Registration blocked: attendance 50.00% is below 75%`).
  - `pages/E07ExamRegistrationMonitorPage.tsx`: Admin monitor table for exam registrations with student search, exam filter, attendance % at registration, and CSV export.
  - `pages/E08MarksEntryPage.tsx`: Faculty/Admin marks entry grid with max_marks validation (0 to max_marks inline warning), draft saving vs final submission, and lock alert if results are already published.
  - `pages/E09ResultProcessingPage.tsx`: Result processing workspace with grade scale mapping, readiness checklist (total registered, marks entered, pending), one-click process calculation, and publish confirmation dialog with irreversible lock warning.
  - `pages/E10MyResultsPage.tsx`: Student self-service results page with term results, SGPA card, UDF-calculated cumulative CGPA badge, course grade cards with grade points and status pills, and browser print grade card button.
  - `pages/E11GradeScaleConfigPage.tsx`: Grade scale configuration table with min/max percentage ranges, grade points, description, and add/edit drawer.
  - `pages/E12CourseResultSummaryPage.tsx`: Course result analytics with summary KPI cards (total students, pass rate %, highest, lowest, average marks), student ranking table, and CSV export.
  - `index.ts`: Barrel export of all components and hooks.
- **Routing & Navigation:**
  - Added all M3 routes in `frontend/src/routes/index.tsx`:
    - Admin: `/admin/attendance/mark`, `/admin/attendance/history`, `/admin/attendance/shortage`, `/admin/exams/manage`, `/admin/exams/registrations`, `/admin/exams/marks`, `/admin/exams/results`, `/admin/exams/grade-scale`, `/admin/exams/summary`.
    - Faculty: `/faculty/attendance/mark`, `/faculty/attendance/history`, `/faculty/attendance/shortage`, `/faculty/exams/marks`, `/faculty/exams/summary`.
    - Student: `/student/attendance`, `/student/exams/register`, `/student/results`.
  - Added navigation items to `frontend/src/components/AppShell.tsx` for Admin (Attendance, Exams & Results sub-menus), Faculty (Attendance & Marks sub-menus), and Student (My Attendance, Exam Registration, My Results).
- **Verification:**
  - TypeScript compilation and production build (`npm run build`) succeeded with 0 errors (2739 modules transformed).

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
