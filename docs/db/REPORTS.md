# Analytical Reports and Views

This document lists the supporting views and analytical reports derived from PRD §5, §6 and §11.5, to be implemented in Phase 6.

## 1. Core PRD Reports (RP-1 to RP-10)

| ID | Name / File | Type | Description |
|---|---|---|---|
| RP-1 | `01_vw_dept_student_ranking.sql` | View | Department-wise student ranking by CGPA. (JOIN, RANK() OVER PARTITION BY) |
| RP-2 | `02_vw_program_term_ranking.sql` | View | Top N students per program per term. Base view with RANK(); API filters `WHERE rank <= N`. (Window function) |
| RP-3 | `03_vw_course_attendance_summary.sql` | View | Courses with average attendance below a threshold. Base view; API filters threshold. (JOIN, GROUP BY, HAVING) |
| RP-4 | `04_vw_fee_collection_summary.sql` | View | Fee collection summary by program and term; defaulters above X. (JOIN, GROUP BY, HAVING) |
| RP-5 | `05_vw_high_dues_students.sql` | View | Students whose dues exceed the average dues. (Subquery) |
| RP-6 | `06_vw_hostel_occupancy.sql` | View | Hostel occupancy by hostel. (JOIN, GROUP BY) |
| RP-7 | `07_vw_payroll_summary.sql` | View | Payroll summary by department and month. (JOIN, GROUP BY) |
| RP-8 | `08_vw_faculty_leave_utilisation.sql` | View | Faculty leave utilisation vs entitlement. (JOIN, UDF) |
| RP-9 | `09_vw_course_pass_percentage.sql` | View | Course-wise pass percentage and grade distribution. (GROUP BY, conditional aggregation) |
| RP-10 | `10_vw_exam_blocked_students.sql` | View | Exam registration blocked / ineligible list. (JOIN) |

## 2. Audit and Integrity

| ID | Name / File | Type | Description |
|---|---|---|---|
| R-03 | `11_vw_audit_log_unified.sql` | View | Unified audit-log view combining general audit log and fee audit log. |
| R-04 | `12_sp_run_integrity_checks.sql` | Procedure | Integrity checks procedure returning PASS/WARN/FAIL for various rules. |

## 3. Dashboard Aggregates

| ID | Name / File | Type | Description |
|---|---|---|---|
| C-02 | `13_vw_admin_dashboard.sql` | View | Dashboard aggregates for Admin (system-wide metrics). |
| C-03 | `14_sp_faculty_dashboard.sql` | Procedure | Dashboard aggregates for Faculty, parameterised by faculty_id. |
| C-04 | `15_sp_student_dashboard.sql` | Procedure | Dashboard aggregates for Student, parameterised by student_id. |

## 4. Supporting Views for Pages

| ID | Name / File | Type | Description |
|---|---|---|---|
| E-04 | `16_vw_attendance_shortage.sql` | View | Attendance shortage list (< 75%). |
| F-09 | `17_vw_fee_defaulters.sql` | View | Fee defaulter list. |
| A-08 | `18_vw_enrollment_roster.sql` | View | Enrollment roster / My teaching view. |
| H-09 | `19_vw_payroll_register.sql` | View | Payroll register (month/department view). |
| E-12 | `20_vw_course_result_summary.sql` | View | Course result summary (pass %, averages). |
