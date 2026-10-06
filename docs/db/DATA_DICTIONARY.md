# Data Dictionary

## Table: academic_term

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | int | NO | PRI |  |  |
| term_identifier | varchar(15) | NO | UNI |  |  |
| term_year | int | NO |  |  |  |
| term_label | varchar(20) | NO |  |  |  |
| start_date | date | NO |  |  |  |
| end_date | date | NO |  |  |  |
| is_current | tinyint(1) | NO |  | 0 |  |
| is_current_unique | int | YES | UNI |  |  |

## Table: admin_permission_set_assignment

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| user_id | bigint | NO | PRI |  |  |
| permission_set_id | int | NO | PRI |  |  |

## Table: attendance_record

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| session_id | bigint | NO | PRI |  |  |
| enrollment_id | bigint | NO | PRI |  |  |
| status | enum('PRESENT','ABSENT') | NO |  | PRESENT |  |

## Table: attendance_session

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | bigint | NO | PRI |  |  |
| offering_id | bigint | NO | MUL |  |  |
| session_date | date | NO |  |  |  |
| slot | varchar(50) | NO |  |  |  |
| marked_by | bigint | NO | MUL |  |  |
| marked_at | datetime | NO |  | CURRENT_TIMESTAMP |  |

## Table: bulk_enrollment_batch

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | bigint | NO | PRI |  |  |
| batch_id | varchar(17) | NO | UNI |  |  |
| run_by | bigint | NO | MUL |  |  |
| run_date | datetime | NO |  | CURRENT_TIMESTAMP |  |
| total_processed | int | NO |  | 0 |  |
| total_success | int | NO |  | 0 |  |
| total_failed | int | NO |  | 0 |  |

## Table: bulk_enrollment_batch_log

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | bigint | NO | PRI |  |  |
| batch_id | bigint | NO | MUL |  |  |
| student_id | bigint | YES |  |  |  |
| offering_id | bigint | YES |  |  |  |
| status | enum('SUCCESS','FAILED','SKIPPED') | NO |  |  |  |
| message | varchar(255) | YES |  |  |  |

## Table: course

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | int | NO | PRI |  |  |
| code | varchar(10) | NO | UNI |  |  |
| title | varchar(100) | NO |  |  |  |
| credits | int | NO |  |  |  |
| department_id | int | NO | MUL |  |  |
| status | enum('ACTIVE','RETIRED') | NO |  | ACTIVE |  |

## Table: course_offering

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | bigint | NO | PRI |  |  |
| course_id | int | NO | MUL |  |  |
| term_id | int | NO | MUL |  |  |
| faculty_id | bigint | NO | MUL |  |  |
| section | varchar(10) | NO |  |  |  |
| capacity | int | NO |  |  |  |

## Table: curriculum_mapping

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | int | NO | PRI |  |  |
| program_id | int | NO | MUL |  |  |
| semester | int | NO |  |  |  |
| course_id | int | NO | MUL |  |  |
| type | enum('CORE','ELECTIVE') | NO |  | CORE |  |

## Table: department

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | int | NO | PRI |  |  |
| code | varchar(10) | NO | UNI |  |  |
| name | varchar(100) | NO |  |  |  |
| head_employee_id | bigint | YES | MUL |  |  |

## Table: designation

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | int | NO | PRI |  |  |
| title | varchar(100) | NO | UNI |  |  |
| job_level | int | NO |  |  |  |

## Table: employee

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | bigint | NO | PRI |  |  |
| employee_id | varchar(13) | NO | UNI |  |  |
| first_name | varchar(50) | NO |  |  |  |
| last_name | varchar(50) | NO |  |  |  |
| department_id | int | NO | MUL |  |  |
| designation_id | int | NO | MUL |  |  |
| joining_date | date | NO |  |  |  |
| emp_type | enum('FACULTY','STAFF') | NO |  |  |  |
| status | enum('ACTIVE','INACTIVE') | NO |  | ACTIVE |  |

## Table: enrollment

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | bigint | NO | PRI |  |  |
| student_id | bigint | NO | MUL |  |  |
| offering_id | bigint | NO | MUL |  |  |
| status | enum('ENROLLED','DROPPED','WITHDRAWN') | NO | MUL | ENROLLED |  |
| enrolled_date | datetime | NO |  | CURRENT_TIMESTAMP |  |
| active_unique | varchar(255) | YES | UNI |  |  |

## Table: exam

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | bigint | NO | PRI |  |  |
| offering_id | bigint | NO | MUL |  |  |
| exam_type | varchar(50) | NO |  |  |  |
| exam_date | date | NO |  |  |  |
| max_marks | decimal(5,2) | NO |  |  |  |
| reg_start_date | datetime | NO |  |  |  |
| reg_end_date | datetime | NO |  |  |  |

## Table: exam_marks_result

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| registration_id | bigint | NO | PRI |  |  |
| marks | decimal(5,2) | NO |  |  |  |
| grade | varchar(2) | YES | MUL |  |  |
| grade_points | decimal(4,2) | YES |  |  |  |
| is_published | tinyint(1) | NO |  | 0 |  |

## Table: exam_registration

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | bigint | NO | PRI |  |  |
| exam_id | bigint | NO | MUL |  |  |
| student_id | bigint | NO | MUL |  |  |
| status | enum('REGISTERED','CANCELLED') | NO |  | REGISTERED |  |
| registered_at | datetime | NO |  | CURRENT_TIMESTAMP |  |

## Table: fee_audit_log

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | bigint | NO | PRI |  |  |
| entity_name | varchar(50) | NO | MUL |  |  |
| entity_id | int | NO |  |  |  |
| old_value | json | YES |  |  |  |
| new_value | json | YES |  |  |  |
| changed_by | varchar(50) | YES |  |  |  |
| changed_at | datetime | NO |  | CURRENT_TIMESTAMP |  |

## Table: fee_component

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | int | NO | PRI |  |  |
| structure_id | int | NO | MUL |  |  |
| component_name | varchar(50) | NO |  |  |  |
| amount | decimal(10,2) | NO |  |  |  |
| due_date | date | NO |  |  |  |

## Table: fee_structure

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | int | NO | PRI |  |  |
| program_id | int | NO | MUL |  |  |
| term_id | int | NO | MUL |  |  |
| structure_name | varchar(100) | NO |  |  |  |

## Table: general_audit_log

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | bigint | NO | PRI |  |  |
| actor_user_id | bigint | YES | MUL |  |  |
| action | varchar(50) | NO |  |  |  |
| entity_name | varchar(50) | NO | MUL |  |  |
| entity_id | varchar(50) | NO |  |  |  |
| before_state | json | YES |  |  |  |
| after_state | json | YES |  |  |  |
| timestamp | datetime | NO | MUL | CURRENT_TIMESTAMP |  |

## Table: grade_scale

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | int | NO | PRI |  |  |
| grade | varchar(2) | NO | UNI |  |  |
| min_marks_pct | decimal(5,2) | NO |  |  |  |
| max_marks_pct | decimal(5,2) | NO |  |  |  |
| grade_points | decimal(4,2) | NO |  |  |  |

## Table: hostel

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | int | NO | PRI |  |  |
| name | varchar(100) | NO | UNI |  |  |
| gender_block | enum('MALE','FEMALE','COED') | NO |  |  |  |
| total_capacity | int | NO |  | 0 |  |

## Table: hostel_allocation

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | bigint | NO | PRI |  |  |
| student_id | bigint | NO | MUL |  |  |
| room_id | int | NO | MUL |  |  |
| from_date | date | NO |  |  |  |
| to_date | date | YES |  |  |  |
| status | enum('ACTIVE','VACATED') | NO |  | ACTIVE |  |
| active_unique | bigint | YES | UNI |  |  |

## Table: hostel_fee_component_link

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | int | NO | PRI |  |  |
| fee_component_id | int | NO | MUL |  |  |
| hostel_id | int | NO | MUL |  |  |

## Table: hostel_request

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | bigint | NO | PRI |  |  |
| student_id | bigint | NO | MUL |  |  |
| request_type | enum('ALLOCATION','ROOM_CHANGE','VACATE') | NO |  |  |  |
| details | text | YES |  |  |  |
| status | enum('PENDING','APPROVED','REJECTED') | NO | MUL | PENDING |  |
| decision_by | bigint | YES | MUL |  |  |
| remark | text | YES |  |  |  |

## Table: id_sequences

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| sequence_name | varchar(100) | NO | PRI |  |  |
| next_value | bigint | NO |  |  |  |
| updated_at | datetime | YES |  | CURRENT_TIMESTAMP |  |

## Table: late_fee_rule

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | int | NO | PRI |  |  |
| rule_type | enum('FLAT','PER_DAY') | NO |  |  |  |
| penalty_amount | decimal(10,2) | NO |  |  |  |
| max_penalty | decimal(10,2) | YES |  |  |  |

## Table: leave_application

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | bigint | NO | PRI |  |  |
| employee_id | bigint | NO | MUL |  |  |
| leave_type_id | int | NO | MUL |  |  |
| start_date | date | NO |  |  |  |
| end_date | date | NO |  |  |  |
| days | decimal(4,1) | NO |  |  |  |
| reason | text | YES |  |  |  |
| status | enum('PENDING','APPROVED','REJECTED') | NO | MUL | PENDING |  |
| decision_by | bigint | YES | MUL |  |  |
| decision_date | datetime | YES |  |  |  |

## Table: leave_entitlement

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | int | NO | PRI |  |  |
| leave_type_id | int | NO | MUL |  |  |
| emp_type | enum('FACULTY','STAFF') | NO |  |  |  |
| annual_quota | int | NO |  |  |  |
| carry_forward | tinyint(1) | NO |  | 0 |  |

## Table: leave_type

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | int | NO | PRI |  |  |
| name | varchar(50) | NO | UNI |  |  |
| is_paid | tinyint(1) | NO |  | 1 |  |

## Table: login_attempt

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | bigint | NO | PRI |  |  |
| username | varchar(50) | NO | MUL |  |  |
| attempt_time | datetime | NO |  | CURRENT_TIMESTAMP |  |
| success | tinyint(1) | NO |  |  |  |

## Table: payment

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | bigint | NO | PRI |  |  |
| student_id | bigint | NO | MUL |  |  |
| amount | decimal(10,2) | NO |  |  |  |
| payment_mode | enum('CASH','ONLINE','DD') | NO |  |  |  |
| reference_no | varchar(50) | YES | UNI |  |  |
| payment_date | datetime | NO |  | CURRENT_TIMESTAMP |  |
| status | enum('SUCCESS','FAILED') | NO |  | SUCCESS |  |

## Table: payment_allocation

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | bigint | NO | PRI |  |  |
| payment_id | bigint | NO | MUL |  |  |
| student_fee_id | bigint | NO | MUL |  |  |
| allocated_principal | decimal(10,2) | NO |  | 0.00 |  |
| allocated_late_fee | decimal(10,2) | NO |  | 0.00 |  |

## Table: payroll_run

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | int | NO | PRI |  |  |
| payroll_month | varchar(7) | NO | UNI |  |  |
| run_date | datetime | NO |  | CURRENT_TIMESTAMP |  |
| status | enum('DRAFT','FINALIZED') | NO |  | DRAFT |  |
| run_by | bigint | NO | MUL |  |  |
| finalized_unique | varchar(7) | YES | UNI |  |  |

## Table: payslip

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | bigint | NO | PRI |  |  |
| run_id | int | NO | MUL |  |  |
| employee_id | bigint | NO | MUL |  |  |
| gross_pay | decimal(10,2) | NO |  |  |  |
| total_deductions | decimal(10,2) | NO |  |  |  |
| net_pay | decimal(10,2) | NO |  |  |  |
| leave_days_deducted | decimal(4,1) | NO |  | 0.0 |  |

## Table: payslip_line

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | bigint | NO | PRI |  |  |
| payslip_id | bigint | NO | MUL |  |  |
| component_type | enum('EARNING','DEDUCTION') | NO |  |  |  |
| description | varchar(100) | NO |  |  |  |
| amount | decimal(10,2) | NO |  |  |  |

## Table: permission_set

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | int | NO | PRI |  |  |
| name | varchar(50) | NO | UNI |  |  |

## Table: program

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | int | NO | PRI |  |  |
| code | varchar(10) | NO | UNI |  |  |
| name | varchar(100) | NO |  |  |  |
| department_id | int | NO | MUL |  |  |
| duration_years | int | NO |  |  |  |
| credits_required | int | NO |  |  |  |

## Table: receipt

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | bigint | NO | PRI |  |  |
| receipt_number | varchar(20) | NO | UNI |  |  |
| payment_id | bigint | NO | UNI |  |  |
| generated_at | datetime | NO |  | CURRENT_TIMESTAMP |  |

## Table: refresh_token

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| token_hash | varchar(255) | NO | PRI |  |  |
| user_id | bigint | NO | MUL |  |  |
| expires_at | datetime | NO |  |  |  |
| is_revoked | tinyint(1) | NO |  | 0 |  |

## Table: role

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | int | NO | PRI |  |  |
| name | varchar(50) | NO | UNI |  |  |

## Table: role_assignment

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| user_id | bigint | NO | PRI |  |  |
| role_id | int | NO | PRI |  |  |

## Table: room

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | int | NO | PRI |  |  |
| hostel_id | int | NO | MUL |  |  |
| room_number | varchar(20) | NO |  |  |  |
| bed_capacity | int | NO |  |  |  |
| available_beds | int | NO |  |  |  |

## Table: salary_structure

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | int | NO | PRI |  |  |
| designation_id | int | NO | UNI |  |  |
| basic_pay | decimal(10,2) | NO |  |  |  |
| allowances | decimal(10,2) | NO |  | 0.00 |  |
| standard_deductions | decimal(10,2) | NO |  | 0.00 |  |

## Table: schema_version

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| version | int | NO | PRI |  |  |
| applied_at | datetime | YES |  | CURRENT_TIMESTAMP |  |
| file_name | varchar(255) | NO |  |  |  |

## Table: semester_result

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | bigint | NO | PRI |  |  |
| student_id | bigint | NO | MUL |  |  |
| term_id | int | NO | MUL |  |  |
| total_credits | int | NO |  |  |  |
| sgpa | decimal(4,2) | NO |  |  |  |
| cgpa | decimal(4,2) | NO | MUL |  |  |
| computed_at | datetime | NO |  | CURRENT_TIMESTAMP |  |

## Table: student

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | bigint | NO | PRI |  |  |
| global_student_id | varchar(15) | NO | UNI |  |  |
| first_name | varchar(50) | NO |  |  |  |
| last_name | varchar(50) | NO |  |  |  |
| email | varchar(100) | NO | UNI |  |  |
| phone | varchar(20) | YES |  |  |  |
| program_id | int | NO | MUL |  |  |
| batch_year | int | NO | MUL |  |  |
| status | enum('ACTIVE','ALUMNI','DROPPED') | NO |  | ACTIVE |  |

## Table: student_fee

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | bigint | NO | PRI |  |  |
| student_id | bigint | NO | MUL |  |  |
| component_id | int | NO | MUL |  |  |
| amount_due | decimal(10,2) | NO |  |  |  |
| amount_paid | decimal(10,2) | NO |  | 0.00 |  |
| status | enum('PENDING','PARTIAL','PAID') | NO | MUL | PENDING |  |

## Table: user_account

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| id | bigint | NO | PRI |  |  |
| username | varchar(50) | NO | UNI |  |  |
| password_hash | varchar(255) | NO |  |  |  |
| status | enum('ACTIVE','INACTIVE','LOCKED') | NO |  | ACTIVE |  |
| last_login | datetime | YES |  |  |  |
| student_id | bigint | YES | MUL |  |  |
| employee_id | bigint | YES | MUL |  |  |

## Table: vw_admin_dashboard

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| total_students | bigint | YES |  |  |  |
| total_faculty | bigint | YES |  |  |  |
| active_enrollments | bigint | YES |  |  |  |
| fees_collected_current | decimal(32,2) | YES |  |  |  |
| fees_due_current | decimal(32,2) | YES |  |  |  |
| beds_available | decimal(32,0) | YES |  |  |  |
| pending_leaves | bigint | YES |  |  |  |
| pending_hostel_requests | bigint | YES |  |  |  |
| students_low_attendance | bigint | YES |  |  |  |

## Table: vw_attendance_shortage

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| student_id | bigint | NO |  | 0 |  |
| global_student_id | varchar(15) | NO |  |  |  |
| student_name | varchar(101) | NO |  |  |  |
| term_label | varchar(20) | NO |  |  |  |
| course_code | varchar(10) | NO |  |  |  |
| course_title | varchar(100) | NO |  |  |  |
| department_name | varchar(100) | NO |  |  |  |
| program_name | varchar(100) | NO |  |  |  |
| faculty_name | varchar(101) | NO |  |  |  |
| attendance_pct | decimal(5,2) | YES |  |  |  |

## Table: vw_audit_log_unified

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| source | varchar(7) | NO |  |  |  |
| log_id | bigint | NO |  | 0 |  |
| entity_name | varchar(50) | NO |  |  |  |
| entity_id | varchar(50) | NO |  |  |  |
| action | varchar(50) | NO |  |  |  |
| before_state | longtext | YES |  |  |  |
| after_state | longtext | YES |  |  |  |
| actor | varchar(50) | YES |  |  |  |
| timestamp | datetime | NO |  | 0000-00-00 00:00:00 |  |

## Table: vw_course_attendance_summary

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| offering_id | bigint | NO |  | 0 |  |
| course_code | varchar(10) | NO |  |  |  |
| course_title | varchar(100) | NO |  |  |  |
| term_label | varchar(20) | NO |  |  |  |
| faculty_name | varchar(101) | NO |  |  |  |
| total_enrollments | bigint | YES |  | 0 |  |
| total_sessions | bigint | YES |  |  |  |
| avg_attendance_pct | decimal(29,2) | YES |  |  |  |

## Table: vw_course_pass_percentage

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| offering_id | bigint | NO |  | 0 |  |
| term_label | varchar(20) | NO |  |  |  |
| course_code | varchar(10) | NO |  |  |  |
| course_title | varchar(100) | NO |  |  |  |
| faculty_name | varchar(101) | NO |  |  |  |
| total_results | bigint | NO |  | 0 |  |
| passed_count | decimal(23,0) | YES |  |  |  |
| failed_count | decimal(23,0) | YES |  |  |  |
| pass_pct | decimal(29,2) | YES |  |  |  |
| grade_a_count | decimal(23,0) | YES |  |  |  |
| grade_b_count | decimal(23,0) | YES |  |  |  |
| grade_c_count | decimal(23,0) | YES |  |  |  |
| grade_f_count | decimal(23,0) | YES |  |  |  |

## Table: vw_course_result_summary

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| offering_id | bigint | NO |  | 0 |  |
| term_label | varchar(20) | NO |  |  |  |
| course_code | varchar(10) | NO |  |  |  |
| course_title | varchar(100) | NO |  |  |  |
| total_students | bigint | NO |  | 0 |  |
| passed | decimal(23,0) | YES |  |  |  |
| failed | decimal(23,0) | YES |  |  |  |
| pass_pct | decimal(29,2) | YES |  |  |  |
| avg_marks | decimal(6,2) | YES |  |  |  |
| avg_grade_points | decimal(5,2) | YES |  |  |  |

## Table: vw_dept_student_ranking

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| department_id | int | NO |  | 0 |  |
| department_name | varchar(100) | NO |  |  |  |
| program_name | varchar(100) | NO |  |  |  |
| student_id | bigint | NO |  | 0 |  |
| first_name | varchar(50) | NO |  |  |  |
| last_name | varchar(50) | NO |  |  |  |
| cgpa | decimal(4,2) | YES |  |  |  |
| dept_rank | bigint unsigned | NO |  | 0 |  |

## Table: vw_enrollment_roster

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| offering_id | bigint | NO |  | 0 |  |
| faculty_id | bigint | NO |  |  |  |
| course_code | varchar(10) | NO |  |  |  |
| course_title | varchar(100) | NO |  |  |  |
| term_label | varchar(20) | NO |  |  |  |
| section | varchar(10) | NO |  |  |  |
| student_id | bigint | NO |  | 0 |  |
| global_student_id | varchar(15) | NO |  |  |  |
| student_name | varchar(101) | NO |  |  |  |
| program_name | varchar(100) | NO |  |  |  |
| enrollment_date | datetime | NO |  | CURRENT_TIMESTAMP |  |
| status | enum('ENROLLED','DROPPED','WITHDRAWN') | NO |  | ENROLLED |  |

## Table: vw_exam_blocked_students

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| student_id | bigint | NO |  | 0 |  |
| global_student_id | varchar(15) | NO |  |  |  |
| student_name | varchar(101) | NO |  |  |  |
| term_label | varchar(20) | NO |  |  |  |
| course_code | varchar(10) | NO |  |  |  |
| course_title | varchar(100) | NO |  |  |  |
| attendance_pct | decimal(5,2) | YES |  |  |  |

## Table: vw_faculty_leave_utilisation

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| employee_id | bigint | NO |  | 0 |  |
| first_name | varchar(50) | NO |  |  |  |
| last_name | varchar(50) | NO |  |  |  |
| department_name | varchar(100) | NO |  |  |  |
| leave_type_name | varchar(50) | NO |  |  |  |
| annual_quota | int | NO |  |  |  |
| used_leave | decimal(12,1) | YES |  |  |  |
| available_balance | decimal(5,1) | YES |  |  |  |

## Table: vw_fee_defaulters

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| student_id | bigint | NO |  | 0 |  |
| global_student_id | varchar(15) | NO |  |  |  |
| student_name | varchar(101) | NO |  |  |  |
| program_name | varchar(100) | NO |  |  |  |
| component_name | varchar(50) | NO |  |  |  |
| term_label | varchar(20) | NO |  |  |  |
| due_date | date | NO |  |  |  |
| amount_due | decimal(10,2) | NO |  |  |  |
| amount_paid | decimal(10,2) | NO |  | 0.00 |  |
| late_fee | decimal(10,2) | YES |  |  |  |
| total_balance | decimal(12,2) | YES |  |  |  |

## Table: vw_high_dues_students

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| student_id | bigint | NO |  | 0 |  |
| global_student_id | varchar(15) | NO |  |  |  |
| first_name | varchar(50) | NO |  |  |  |
| last_name | varchar(50) | NO |  |  |  |
| program_name | varchar(100) | NO |  |  |  |
| total_dues | decimal(33,2) | YES |  |  |  |
| average_dues | decimal(37,6) | YES |  |  |  |

## Table: vw_hostel_occupancy

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| hostel_id | int | NO |  | 0 |  |
| hostel_name | varchar(100) | NO |  |  |  |
| gender_block | enum('MALE','FEMALE','COED') | NO |  |  |  |
| total_capacity | decimal(32,0) | YES |  |  |  |
| occupied_beds | decimal(33,0) | YES |  |  |  |
| available_beds | decimal(32,0) | YES |  |  |  |
| occupancy_pct | decimal(39,2) | YES |  |  |  |

## Table: vw_payroll_register

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| payroll_month | varchar(7) | NO |  |  |  |
| run_status | enum('DRAFT','FINALIZED') | NO |  | DRAFT |  |
| department_name | varchar(100) | NO |  |  |  |
| employee_id | bigint | NO |  | 0 |  |
| global_employee_id | varchar(13) | NO |  |  |  |
| employee_name | varchar(101) | NO |  |  |  |
| designation | varchar(100) | NO |  |  |  |
| gross_pay | decimal(10,2) | NO |  |  |  |
| total_deductions | decimal(10,2) | NO |  |  |  |
| net_pay | decimal(10,2) | NO |  |  |  |
| leave_days_deducted | decimal(4,1) | NO |  | 0.0 |  |

## Table: vw_payroll_summary

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| payroll_month | varchar(7) | NO |  |  |  |
| department_id | int | NO |  | 0 |  |
| department_name | varchar(100) | NO |  |  |  |
| employee_count | bigint | NO |  | 0 |  |
| total_gross_pay | decimal(32,2) | YES |  |  |  |
| total_deductions | decimal(32,2) | YES |  |  |  |
| total_net_pay | decimal(32,2) | YES |  |  |  |

## Table: vw_program_term_ranking

| Column Name | Type | Nullable | Key | Default | Comment |
|---|---|---|---|---|---|
| program_id | int | NO |  | 0 |  |
| program_name | varchar(100) | NO |  |  |  |
| term_id | int | NO |  | 0 |  |
| term_year | int | NO |  |  |  |
| term_label | varchar(20) | NO |  |  |  |
| student_id | bigint | NO |  | 0 |  |
| first_name | varchar(50) | NO |  |  |  |
| last_name | varchar(50) | NO |  |  |  |
| cgpa | decimal(4,2) | NO |  |  |  |
| prog_term_rank | bigint unsigned | NO |  | 0 |  |
