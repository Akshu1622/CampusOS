# 3NF Verification

This document verifies the Third Normal Form (3NF) compliance of the logical schema and documents any deliberate denormalization.

## 1. 3NF Compliance by Table

Every table in the schema strictly adheres to 3NF principles:
- **1NF**: Every column holds atomic values, and each table has a primary key.
- **2NF**: No partial dependencies. Non-key attributes are fully functionally dependent on the entire primary key.
- **3NF**: No transitive dependencies. Non-key attributes depend only on the primary key, not on other non-key attributes.

### M1 Core
- **user_account**: PK `id`. `username` -> `password_hash`, `status`. Compliant.
- **role**: PK `id`. `id` -> `name`. Compliant.
- **permission_set**: PK `id`. `id` -> `name`. Compliant.
- **role_assignment**: PK `(user_id, role_id)`. All attributes are part of PK. Compliant.
- **admin_permission_set_assignment**: PK `(user_id, permission_set_id)`. Compliant.
- **refresh_token**: PK `token_hash`. `token_hash` -> `user_id`, `expires_at`, `is_revoked`. Compliant.
- **login_attempt**: PK `id`. `id` -> `username`, `attempt_time`, `success`. Compliant.
- **department**: PK `id`. `id` -> `code`, `name`, `head_employee_id`. Compliant.
- **program**: PK `id`. `id` -> `code`, `name`, `department_id`, `duration_years`, `credits_required`. Compliant.
- **academic_term**: PK `id`. `id` -> `term_identifier`, `year`, `start_date`, `end_date`, `is_current`. Compliant.
- **student**: PK `id`. `id` -> `global_student_id`, `first_name`, `program_id`, etc. Compliant.
- **general_audit_log**: PK `id`. `id` -> `actor_id`, `action`, `entity_name`, etc. Compliant.

### M2 Academics
- **course**: PK `id`. `id` -> `code`, `title`, `credits`, `department_id`. Compliant.
- **curriculum_mapping**: PK `id`. `id` -> `program_id`, `semester`, `course_id`. Compliant.
- **course_offering**: PK `id`. `id` -> `course_id`, `term_id`, `faculty_id`, `section`, `capacity`. Compliant.
- **enrollment**: PK `id`. `id` -> `student_id`, `offering_id`, `status`. Compliant.
- **bulk_enrollment_batch**: PK `id`. `id` -> `batch_id`, `total_success`, etc. Compliant.
- **bulk_enrollment_batch_log**: PK `id`. `id` -> `batch_id`, `status`, `message`. Compliant.

### M3 Attendance & Exams
- **attendance_session**: PK `id`. `id` -> `offering_id`, `date`, `slot`. Compliant.
- **attendance_record**: PK `(session_id, enrollment_id)`. `(session_id, enrollment_id)` -> `status`. Compliant.
- **exam**: PK `id`. `id` -> `offering_id`, `type`, `date`, `max_marks`. Compliant.
- **exam_registration**: PK `id`. `id` -> `exam_id`, `student_id`, `status`. Compliant.
- **exam_marks_result**: PK `registration_id`. `registration_id` -> `marks`, `grade`. Compliant.
- **grade_scale**: PK `id`. `id` -> `grade`, `min_marks_pct`. Compliant.
- **semester_result**: PK `id`. `id` -> `student_id`, `term_id`, `sgpa`, `cgpa`. Compliant (acts as an immutable ledger/snapshot).

### M4 Finance
- **fee_structure**: PK `id`. `id` -> `program_id`, `term_id`. Compliant.
- **fee_component**: PK `id`. `id` -> `structure_id`, `amount`, `due_date`. Compliant.
- **student_fee**: PK `id`. `id` -> `student_id`, `component_id`, `amount_due`. Compliant.
- **late_fee_rule**: PK `id`. `id` -> `rule_type`, `penalty_amount`. Compliant.
- **payment**: PK `id`. `id` -> `student_id`, `amount`, `mode`, `status`. Compliant.
- **payment_allocation**: PK `id`. `id` -> `payment_id`, `student_fee_id`, `allocated_principal`. Compliant.
- **receipt**: PK `id`. `id` -> `receipt_number`, `payment_id`. Compliant.
- **fee_audit_log**: PK `id`. `id` -> `entity_name`, `entity_id`. Compliant.
- **hostel_fee_component_link**: PK `id`. `id` -> `fee_component_id`, `hostel_id`. Compliant.

### M5 HR & Payroll
- **employee**: PK `id`. `id` -> `first_name`, `department_id`, `designation_id`. Compliant.
- **designation**: PK `id`. `id` -> `title`, `job_level`. Compliant.
- **leave_type**: PK `id`. `id` -> `name`. Compliant.
- **leave_entitlement**: PK `id`. `id` -> `leave_type_id`, `emp_type`, `annual_quota`. Compliant.
- **leave_application**: PK `id`. `id` -> `employee_id`, `status`. Compliant.
- **salary_structure**: PK `id`. `id` -> `designation_id`, `basic_pay`. Compliant.
- **payroll_run**: PK `id`. `id` -> `payroll_month`, `status`. Compliant.
- **payslip**: PK `id`. `id` -> `run_id`, `employee_id`, `net_pay`. Compliant (acts as an immutable snapshot of a month's run).
- **payslip_line**: PK `id`. `id` -> `payslip_id`, `amount`. Compliant.

### M6 Hostel
- **hostel**: PK `id`. `id` -> `name`, `gender_block`, `total_capacity`. Compliant.
- **room**: PK `id`. `id` -> `hostel_id`, `room_number`, `bed_capacity`. Compliant.
- **hostel_allocation**: PK `id`. `id` -> `student_id`, `room_id`, `status`. Compliant.
- **hostel_request**: PK `id`. `id` -> `student_id`, `status`. Compliant.

---

## 2. Intentional Denormalization and Derived Columns

| Table | Column | Justification | Maintenance Mechanism |
|---|---|---|---|
| `hostel` | `total_capacity` | Caching the sum of all room bed capacities avoids expensive aggregations on high-traffic dashboards (PRD §6.6). | Maintained via API during room creation/update/deletion. |
| `room` | `available_beds` | Required by PRD §6.6 to track live bed availability. Querying allocations repeatedly per room risks contention and is slow for large hostels. | Maintained by a **database trigger** on `hostel_allocation` (INSERT/UPDATE/DELETE). |
| `student_fee` | `amount_paid` | Allows instant querying of a student's outstanding balance without scanning the entire payment allocation ledger. | Maintained via the **fee payment stored procedure**. |
| `bulk_enrollment_batch` | `total_success`, `total_failed` | Required to provide a fast summary of a bulk operation without grouping potentially thousands of log rows. | Maintained by the **bulk enrollment stored procedure**. |
| `semester_result` | `sgpa`, `cgpa` | CGPA calculation relies on all historical grades. A snapshot is necessary to freeze the term's outcome and prevent historical drift. | Inserted/computed via API & **CGPA UDF** during result processing (E-09). |
| `payslip` | `gross_pay`, `net_pay` | A payslip must be immutable once finalized. We cannot rely on live `salary_structure` joins as structures change over time. | Computed and inserted by the **monthly payroll stored procedure**. |
