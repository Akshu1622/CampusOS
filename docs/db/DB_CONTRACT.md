# Database Contract (Backend Handoff)

This document specifies the database objects that the FastAPI backend must interact with.

## 1. Routines (Procedures and Functions)

| Type | Name | Return Type | Parameters (Mode, Name, Type) |
|---|---|---|---|
| FUNCTION | fn_attendance_pct | decimal | IN p_student_id bigint, IN p_offering_id bigint |
| FUNCTION | fn_generate_batch_id | varchar | IN p_date varchar(8) |
| FUNCTION | fn_generate_employee_id | varchar | IN p_year varchar(4) |
| FUNCTION | fn_generate_payment_ref | varchar |  |
| FUNCTION | fn_generate_receipt_number | varchar | IN p_date varchar(8) |
| FUNCTION | fn_generate_student_id | varchar | IN p_year varchar(4) |
| FUNCTION | fn_get_next_sequence | bigint | IN p_seq_name varchar(100) |
| FUNCTION | fn_is_valid_batch_id | tinyint | IN p_id varchar(17) |
| FUNCTION | fn_is_valid_course_code | tinyint | IN p_code varchar(10) |
| FUNCTION | fn_is_valid_employee_id | tinyint | IN p_id varchar(13) |
| FUNCTION | fn_is_valid_payment_ref | tinyint | IN p_id varchar(16) |
| FUNCTION | fn_is_valid_payroll_month | tinyint | IN p_id varchar(7) |
| FUNCTION | fn_is_valid_receipt_number | tinyint | IN p_id varchar(20) |
| FUNCTION | fn_is_valid_student_id | tinyint | IN p_id varchar(15) |
| FUNCTION | fn_is_valid_term_id | tinyint | IN p_id varchar(15) |
| FUNCTION | fn_late_fee_penalty | decimal | IN p_rule_id int, IN p_due_date date, IN p_as_of_date date |
| FUNCTION | fn_leave_balance | decimal | IN p_employee_id bigint, IN p_leave_type_id int, IN p_year int |
| FUNCTION | fn_student_cgpa | decimal | IN p_student_id bigint |
| PROCEDURE | sp_bulk_enrollment | void | IN p_payload json, IN p_policy varchar(20), IN p_dry_run tinyint(1), IN p_acting_user bigint |
| PROCEDURE | sp_faculty_dashboard | void | IN p_faculty_id bigint |
| PROCEDURE | sp_fee_collection_summary | void | IN p_defaulter_threshold decimal(10,2) |
| PROCEDURE | sp_fee_payment | void | IN p_student_id bigint, IN p_due_ids json, IN p_amount decimal(10,2), IN p_mode varchar(20), IN p_reference_no varchar(50), IN p_acting_user bigint |
| PROCEDURE | sp_monthly_payroll | void | IN p_payroll_month varchar(7), IN p_mode varchar(20), IN p_acting_user bigint |
| PROCEDURE | sp_run_integrity_checks | void |  |
| PROCEDURE | sp_student_dashboard | void | IN p_student_id bigint |
| PROCEDURE | test_alloc_duplicate | void |  |
| PROCEDURE | test_exam_reg_closed | void |  |
| PROCEDURE | test_exam_reg_not_enrolled | void |  |
| PROCEDURE | test_fee_overpayment | void |  |
| PROCEDURE | test_payroll_finalized | void |  |

## 2. Triggers

| Name | Event | Timing | Table |
|---|---|---|---|
| trg_exam_registration_bi | INSERT | BEFORE | exam_registration |
| trg_fee_component_ad | DELETE | AFTER | fee_component |
| trg_fee_component_ai | INSERT | AFTER | fee_component |
| trg_fee_component_au | UPDATE | AFTER | fee_component |
| trg_fee_structure_ad | DELETE | AFTER | fee_structure |
| trg_fee_structure_ai | INSERT | AFTER | fee_structure |
| trg_fee_structure_au | UPDATE | AFTER | fee_structure |
| trg_hostel_allocation_bd | DELETE | BEFORE | hostel_allocation |
| trg_hostel_allocation_bi | INSERT | BEFORE | hostel_allocation |
| trg_hostel_allocation_bu | UPDATE | BEFORE | hostel_allocation |
| trg_student_fee_ad | DELETE | AFTER | student_fee |
| trg_student_fee_ai | INSERT | AFTER | student_fee |
| trg_student_fee_au | UPDATE | AFTER | student_fee |

## 3. Views

| Name |
|---|
| vw_admin_dashboard |
| vw_attendance_shortage |
| vw_audit_log_unified |
| vw_course_attendance_summary |
| vw_course_pass_percentage |
| vw_course_result_summary |
| vw_dept_student_ranking |
| vw_enrollment_roster |
| vw_exam_blocked_students |
| vw_faculty_leave_utilisation |
| vw_fee_defaulters |
| vw_high_dues_students |
| vw_hostel_occupancy |
| vw_payroll_register |
| vw_payroll_summary |
| vw_program_term_ranking |

## 4. API Session Variables

The API must set the following session variables for triggers (e.g. audit logs) to work correctly:
```sql
SET @app_user_id = 123;
```

## 5. Calling Procedures with OUT parameters

To call a procedure with an OUT parameter, use session variables:
```sql
CALL my_procedure(1, @out_param);
SELECT @out_param;
```

## 6. Error Codes and HTTP Mapping

| DB Error (SQLSTATE) | Description | HTTP Status |
|---|---|---|
| 45000 | Custom Business Rule Violation (SIGNAL) | 400 Bad Request |
| 23000 | Integrity Constraint Violation | 409 Conflict |

## 7. Transaction Rules

1. API must NOT manage transactions when calling Procedures that contain their own transaction control (`START TRANSACTION`, `COMMIT`, `ROLLBACK`).
2. For multiple table updates not covered by a procedure, the API should wrap them in a transaction.
3. Read operations do not need explicit transaction management.
