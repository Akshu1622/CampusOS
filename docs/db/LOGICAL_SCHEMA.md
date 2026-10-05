# Logical Schema

This document details the logical schema for the University ERP.

## Table Count
Final table count: 47 tables across 7 modules (M7 uses views).

## M1: Core Module

### 1. user_account
- **Purpose**: Stores authentication credentials and links to personal records.
- **PRD Section**: §10, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | BIGINT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | username | VARCHAR(50) | NOT NULL | - | UK1 | - | - | Unique login identifier |
  | password_hash | VARCHAR(255) | NOT NULL | - | - | - | - | Bcrypt/Argon2 hash |
  | status | ENUM | NOT NULL | 'ACTIVE' | - | - | IN ('ACTIVE', 'INACTIVE', 'LOCKED') | Account status |
  | last_login | DATETIME | NULL | - | - | - | - | Last login timestamp |
  | student_id | BIGINT | NULL | - | FK | student.id | - | Linked student record |
  | employee_id | BIGINT | NULL | - | FK | employee.id | - | Linked employee record |
- **Unique Constraints**: `UK_username` (username)
- **Indexes**: `idx_student` (student_id), `idx_employee` (employee_id)
- **Referential Actions**: student_id (RESTRICT), employee_id (RESTRICT)
- **Maintained By**: API (CRUD)
- **Derived Columns**: None

### 2. role
- **Purpose**: RBAC roles (Admin, Faculty, Student).
- **PRD Section**: §3, §10, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | INT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | name | VARCHAR(50) | NOT NULL | - | UK1 | - | - | Role name |
- **Unique Constraints**: `UK_name` (name)
- **Indexes**: None
- **Referential Actions**: None
- **Maintained By**: API

### 3. permission_set
- **Purpose**: Admin permission scopes (Academic Admin, Exam Admin, etc.).
- **PRD Section**: §3, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | INT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | name | VARCHAR(50) | NOT NULL | - | UK1 | - | - | Set name |
- **Unique Constraints**: `UK_name` (name)
- **Indexes**: None
- **Referential Actions**: None
- **Maintained By**: API

### 4. role_assignment
- **Purpose**: Maps users to roles.
- **PRD Section**: §10, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | user_id | BIGINT | NOT NULL | - | PK, FK1 | user_account.id | - | User |
  | role_id | INT | NOT NULL | - | PK, FK2 | role.id | - | Role |
- **Unique Constraints**: `PK_user_role` (user_id, role_id)
- **Indexes**: `idx_role` (role_id)
- **Referential Actions**: user_id (CASCADE), role_id (RESTRICT)
- **Maintained By**: API

### 5. admin_permission_set_assignment
- **Purpose**: Maps admin users to permission sets.
- **PRD Section**: §3, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | user_id | BIGINT | NOT NULL | - | PK, FK1 | user_account.id | - | Admin user |
  | permission_set_id | INT | NOT NULL | - | PK, FK2 | permission_set.id | - | Permission set |
- **Unique Constraints**: `PK_user_perm` (user_id, permission_set_id)
- **Indexes**: `idx_permission_set` (permission_set_id)
- **Referential Actions**: user_id (CASCADE), permission_set_id (RESTRICT)
- **Maintained By**: API

### 6. refresh_token
- **Purpose**: Tracks active and revoked refresh tokens.
- **PRD Section**: §10
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | token_hash | VARCHAR(255) | NOT NULL | - | PK | - | - | Hashed token |
  | user_id | BIGINT | NOT NULL | - | FK | user_account.id | - | User |
  | expires_at | DATETIME | NOT NULL | - | - | - | - | Expiry date |
  | is_revoked | TINYINT(1) | NOT NULL | 0 | - | - | - | Revocation status |
- **Unique Constraints**: None
- **Indexes**: `idx_user` (user_id)
- **Referential Actions**: user_id (CASCADE)
- **Maintained By**: API

### 7. login_attempt
- **Purpose**: Limits login attempts.
- **PRD Section**: §10
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | BIGINT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | username | VARCHAR(50) | NOT NULL | - | - | - | - | Attempted username |
  | attempt_time | DATETIME | NOT NULL | CURRENT_TIMESTAMP | - | - | - | Time of attempt |
  | success | TINYINT(1) | NOT NULL | - | - | - | - | Whether successful |
- **Unique Constraints**: None
- **Indexes**: `idx_username_time` (username, attempt_time)
- **Referential Actions**: None
- **Maintained By**: API

### 8. department
- **Purpose**: Academic and administrative departments.
- **PRD Section**: §6.1, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | INT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | code | VARCHAR(10) | NOT NULL | - | UK1 | - | - | Dept code |
  | name | VARCHAR(100) | NOT NULL | - | - | - | - | Dept name |
  | head_employee_id | BIGINT | NULL | - | FK | employee.id | - | Dept Head |
- **Unique Constraints**: `UK_code` (code)
- **Indexes**: `idx_head` (head_employee_id)
- **Referential Actions**: head_employee_id (SET NULL) - Note: Deferred FK creation to avoid circular dep.
- **Maintained By**: API

### 9. program
- **Purpose**: Degree programs.
- **PRD Section**: §6.1, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | INT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | code | VARCHAR(10) | NOT NULL | - | UK1 | - | - | Program code |
  | name | VARCHAR(100) | NOT NULL | - | - | - | - | Program name |
  | department_id | INT | NOT NULL | - | FK | department.id | - | Owning dept |
  | duration_years | INT | NOT NULL | - | - | - | duration_years > 0 | Duration |
  | credits_required | INT | NOT NULL | - | - | - | credits_required > 0 | Total credits |
- **Unique Constraints**: `UK_code` (code)
- **Indexes**: `idx_department` (department_id)
- **Referential Actions**: department_id (RESTRICT)
- **Maintained By**: API

### 10. academic_term
- **Purpose**: Academic terms (semesters).
- **PRD Section**: §6.1, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | INT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | term_identifier | VARCHAR(15) | NOT NULL | - | UK1 | - | REGEXP '^[0-9]{4}-(FALL\|SPRING\|SUMMER\|WINTER)$' | Term global ID |
  | term_year | INT | NOT NULL | - | - | - | - | Year |
  | term_label | VARCHAR(20) | NOT NULL | - | - | - | - | Label |
  | start_date | DATE | NOT NULL | - | - | - | - | Start |
  | end_date | DATE | NOT NULL | - | - | - | end_date > start_date | End |
  | is_current | TINYINT(1) | NOT NULL | 0 | - | - | - | Current term flag |
- **Unique Constraints**: `UK_term_identifier` (term_identifier)
- **Indexes**: None
- **Referential Actions**: None
- **Maintained By**: API / DB Trigger (ensure only one is_current=1)

### 11. student
- **Purpose**: Student master records.
- **PRD Section**: §6.1, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | BIGINT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | global_student_id | VARCHAR(15) | NOT NULL | - | UK1 | - | REGEXP '^STU-[0-9]{4}-[0-9]{6}$' | Global Student ID |
  | first_name | VARCHAR(50) | NOT NULL | - | - | - | - | First name |
  | last_name | VARCHAR(50) | NOT NULL | - | - | - | - | Last name |
  | email | VARCHAR(100) | NOT NULL | - | UK2 | - | - | Contact email |
  | phone | VARCHAR(20) | NULL | - | - | - | - | Contact phone |
  | program_id | INT | NOT NULL | - | FK | program.id | - | Enrolled program |
  | batch_year | INT | NOT NULL | - | - | - | - | Admission year |
  | status | ENUM | NOT NULL | 'ACTIVE' | - | - | IN ('ACTIVE', 'ALUMNI', 'DROPPED') | Status |
- **Unique Constraints**: `UK_global_id` (global_student_id), `UK_email` (email)
- **Indexes**: `idx_program` (program_id), `idx_batch` (batch_year)
- **Referential Actions**: program_id (RESTRICT)
- **Maintained By**: API

### 12. general_audit_log
- **Purpose**: General system audit log.
- **PRD Section**: §6.7, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | BIGINT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | actor_user_id | BIGINT | NULL | - | FK | user_account.id | - | User who acted |
  | action | VARCHAR(50) | NOT NULL | - | - | - | - | E.g. CREATE |
  | entity_name | VARCHAR(50) | NOT NULL | - | - | - | - | Table name |
  | entity_id | VARCHAR(50) | NOT NULL | - | - | - | - | PK of entity |
  | before_state | JSON | NULL | - | - | - | - | Old data |
  | after_state | JSON | NULL | - | - | - | - | New data |
  | timestamp | DATETIME | NOT NULL | CURRENT_TIMESTAMP | - | - | - | When |
- **Unique Constraints**: None
- **Indexes**: `idx_actor` (actor_user_id), `idx_entity` (entity_name, entity_id), `idx_time` (timestamp)
- **Referential Actions**: actor_user_id (SET NULL)
- **Maintained By**: API / Triggers

## M2: Academics and Enrollment

### 13. course
- **Purpose**: Course catalog.
- **PRD Section**: §6.2, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | INT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | code | VARCHAR(10) | NOT NULL | - | UK1 | - | REGEXP '^[A-Z]{2,4}[0-9]{3,4}$' | Global code |
  | title | VARCHAR(100) | NOT NULL | - | - | - | - | Title |
  | credits | INT | NOT NULL | - | - | - | credits >= 0 | Credits |
  | department_id | INT | NOT NULL | - | FK | department.id | - | Dept owner |
  | status | ENUM | NOT NULL | 'ACTIVE' | - | - | IN ('ACTIVE', 'RETIRED') | Status |
- **Unique Constraints**: `UK_code` (code)
- **Indexes**: `idx_department` (department_id)
- **Referential Actions**: department_id (RESTRICT)
- **Maintained By**: API

### 14. curriculum_mapping
- **Purpose**: Map courses to program semesters.
- **PRD Section**: §6.2, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | INT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | program_id | INT | NOT NULL | - | FK1 | program.id | - | Program |
  | semester | INT | NOT NULL | - | - | - | semester > 0 | Semester |
  | course_id | INT | NOT NULL | - | FK2 | course.id | - | Course |
  | type | ENUM | NOT NULL | 'CORE' | - | - | IN ('CORE', 'ELECTIVE') | Core/Elective |
- **Unique Constraints**: `UK_prog_sem_course` (program_id, semester, course_id)
- **Indexes**: `idx_course` (course_id)
- **Referential Actions**: program_id (RESTRICT), course_id (RESTRICT)
- **Maintained By**: API

### 15. course_offering
- **Purpose**: Instance of a course in a term.
- **PRD Section**: §6.2, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | BIGINT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | course_id | INT | NOT NULL | - | FK1 | course.id | - | Course |
  | term_id | INT | NOT NULL | - | FK2 | academic_term.id | - | Term |
  | faculty_id | BIGINT | NOT NULL | - | FK3 | employee.id | - | Instructor |
  | section | VARCHAR(10) | NOT NULL | - | - | - | - | Section identifier |
  | capacity | INT | NOT NULL | - | - | - | capacity > 0 | Max students |
- **Unique Constraints**: `UK_course_term_sec` (course_id, term_id, section)
- **Indexes**: `idx_term` (term_id), `idx_faculty` (faculty_id)
- **Referential Actions**: course_id (RESTRICT), term_id (RESTRICT), faculty_id (RESTRICT)
- **Maintained By**: API

### 16. enrollment
- **Purpose**: Student enrolled in an offering.
- **PRD Section**: §6.2, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | BIGINT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | student_id | BIGINT | NOT NULL | - | FK1 | student.id | - | Student |
  | offering_id | BIGINT | NOT NULL | - | FK2 | course_offering.id | - | Offering |
  | status | ENUM | NOT NULL | 'ENROLLED' | - | - | IN ('ENROLLED', 'DROPPED', 'WITHDRAWN') | Enrollment status |
  | enrolled_date | DATETIME | NOT NULL | CURRENT_TIMESTAMP | - | - | - | Timestamp |
- **Unique Constraints**: `UK_student_offering` (student_id, offering_id)
- **Indexes**: `idx_offering` (offering_id)
- **Referential Actions**: student_id (RESTRICT), offering_id (RESTRICT)
- **Maintained By**: API, Stored Procedure (Bulk)

### 17. bulk_enrollment_batch
- **Purpose**: Batch tracking for bulk enrollments.
- **PRD Section**: §6.2, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | BIGINT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | batch_id | VARCHAR(17) | NOT NULL | - | UK1 | - | REGEXP '^BAT-[0-9]{8}-[0-9]{4}$' | Global Batch ID |
  | run_by | BIGINT | NOT NULL | - | FK | user_account.id | - | Admin user |
  | run_date | DATETIME | NOT NULL | CURRENT_TIMESTAMP | - | - | - | When |
  | total_processed | INT | NOT NULL | 0 | - | - | total_processed >= 0 | Count |
  | total_success | INT | NOT NULL | 0 | - | - | total_success >= 0 | Count |
  | total_failed | INT | NOT NULL | 0 | - | - | total_failed >= 0 | Count |
- **Unique Constraints**: `UK_batch_id` (batch_id)
- **Indexes**: `idx_run_by` (run_by)
- **Referential Actions**: run_by (RESTRICT)
- **Maintained By**: Stored Procedure

### 18. bulk_enrollment_batch_log
- **Purpose**: Row-level outcome for bulk enrollments.
- **PRD Section**: §6.2, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | BIGINT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | batch_id | BIGINT | NOT NULL | - | FK | bulk_enrollment_batch.id | - | Batch |
  | student_id | BIGINT | NULL | - | - | - | - | Student ID (if found) |
  | offering_id | BIGINT | NULL | - | - | - | - | Offering ID (if found) |
  | status | ENUM | NOT NULL | - | - | - | IN ('SUCCESS', 'FAILED', 'SKIPPED') | Row status |
  | message | VARCHAR(255) | NULL | - | - | - | - | Error reason |
- **Unique Constraints**: None
- **Indexes**: `idx_batch` (batch_id)
- **Referential Actions**: batch_id (CASCADE)
- **Maintained By**: Stored Procedure

## M3: Attendance, Exams, and Results

### 19. attendance_session
- **Purpose**: Session for which attendance is marked.
- **PRD Section**: §6.3, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | BIGINT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | offering_id | BIGINT | NOT NULL | - | FK1 | course_offering.id | - | Course offering |
  | session_date | DATE | NOT NULL | - | - | - | - | Date |
  | slot | VARCHAR(50) | NOT NULL | - | - | - | - | Slot identifier |
  | marked_by | BIGINT | NOT NULL | - | FK2 | user_account.id | - | Faculty/Admin |
  | marked_at | DATETIME | NOT NULL | CURRENT_TIMESTAMP | - | - | - | Timestamp |
- **Unique Constraints**: `UK_offering_date_slot` (offering_id, session_date, slot)
- **Indexes**: `idx_marked_by` (marked_by)
- **Referential Actions**: offering_id (RESTRICT), marked_by (RESTRICT)
- **Maintained By**: API

### 20. attendance_record
- **Purpose**: Student attendance per session.
- **PRD Section**: §6.3, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | session_id | BIGINT | NOT NULL | - | PK, FK1 | attendance_session.id | - | Session |
  | enrollment_id | BIGINT | NOT NULL | - | PK, FK2 | enrollment.id | - | Enrollment |
  | status | ENUM | NOT NULL | 'PRESENT' | - | - | IN ('PRESENT', 'ABSENT') | Status |
- **Unique Constraints**: None (PK handles it)
- **Indexes**: `idx_enrollment` (enrollment_id)
- **Referential Actions**: session_id (CASCADE), enrollment_id (RESTRICT)
- **Maintained By**: API

### 21. exam
- **Purpose**: Examination events.
- **PRD Section**: §6.3, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | BIGINT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | offering_id | BIGINT | NOT NULL | - | FK | course_offering.id | - | Course offering |
  | exam_type | VARCHAR(50) | NOT NULL | - | - | - | - | Type (Midterm, Final) |
  | exam_date | DATE | NOT NULL | - | - | - | - | Date of exam |
  | max_marks | DECIMAL(5,2)| NOT NULL | - | - | - | max_marks > 0 | Max marks |
  | reg_start_date | DATETIME | NOT NULL | - | - | - | - | Registration starts |
  | reg_end_date | DATETIME | NOT NULL | - | - | - | reg_end_date > reg_start_date | Registration ends |
- **Unique Constraints**: `UK_offering_type` (offering_id, exam_type)
- **Indexes**: None
- **Referential Actions**: offering_id (RESTRICT)
- **Maintained By**: API

### 22. exam_registration
- **Purpose**: Student registration for an exam.
- **PRD Section**: §6.3, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | BIGINT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | exam_id | BIGINT | NOT NULL | - | FK1 | exam.id | - | Exam |
  | student_id | BIGINT | NOT NULL | - | FK2 | student.id | - | Student |
  | status | ENUM | NOT NULL | 'REGISTERED' | - | - | IN ('REGISTERED', 'CANCELLED') | Status |
  | registered_at | DATETIME | NOT NULL | CURRENT_TIMESTAMP | - | - | - | Timestamp |
- **Unique Constraints**: `UK_exam_student` (exam_id, student_id)
- **Indexes**: `idx_student` (student_id)
- **Referential Actions**: exam_id (RESTRICT), student_id (RESTRICT)
- **Maintained By**: API, DB Trigger (enforces 75% rule)

### 23. exam_marks_result
- **Purpose**: Marks and grades for an exam registration.
- **PRD Section**: §6.3, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | registration_id | BIGINT | NOT NULL | - | PK, FK | exam_registration.id | - | Registration |
  | marks | DECIMAL(5,2)| NOT NULL | - | - | - | marks >= 0 | Scored marks |
  | grade | VARCHAR(2) | NULL | - | - | - | - | Grade (e.g. A, B+) |
  | grade_points | DECIMAL(4,2)| NULL | - | - | - | grade_points >= 0 | Grade points |
  | is_published | TINYINT(1) | NOT NULL | 0 | - | - | - | Published flag |
- **Unique Constraints**: None (PK is unique)
- **Indexes**: None
- **Referential Actions**: registration_id (RESTRICT)
- **Maintained By**: API

### 24. grade_scale
- **Purpose**: Grade scale configuration.
- **PRD Section**: §6.3, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | INT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | grade | VARCHAR(2) | NOT NULL | - | UK1 | - | - | Grade label |
  | min_marks_pct | DECIMAL(5,2)| NOT NULL | - | - | - | min_marks_pct >= 0 | Min % |
  | max_marks_pct | DECIMAL(5,2)| NOT NULL | - | - | - | max_marks_pct <= 100 | Max % |
  | grade_points | DECIMAL(4,2)| NOT NULL | - | - | - | grade_points >= 0 | Grade points |
- **Unique Constraints**: `UK_grade` (grade)
- **Indexes**: None
- **Referential Actions**: None
- **Maintained By**: API

### 25. semester_result
- **Purpose**: Computed SGPA/CGPA snapshot per term.
- **PRD Section**: §6.3, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | BIGINT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | student_id | BIGINT | NOT NULL | - | FK1 | student.id | - | Student |
  | term_id | INT | NOT NULL | - | FK2 | academic_term.id | - | Term |
  | total_credits | INT | NOT NULL | - | - | - | total_credits >= 0 | Term credits |
  | sgpa | DECIMAL(4,2)| NOT NULL | - | - | - | sgpa >= 0 | Term SGPA |
  | cgpa | DECIMAL(4,2)| NOT NULL | - | - | - | cgpa >= 0 | Cumulative CGPA |
  | computed_at | DATETIME | NOT NULL | CURRENT_TIMESTAMP | - | - | - | Timestamp |
- **Unique Constraints**: `UK_student_term` (student_id, term_id)
- **Indexes**: `idx_term` (term_id)
- **Referential Actions**: student_id (RESTRICT), term_id (RESTRICT)
- **Maintained By**: API

## M4: Finance

### 26. fee_structure
- **Purpose**: Defines fee groups.
- **PRD Section**: §6.4, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | INT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | program_id | INT | NOT NULL | - | FK1 | program.id | - | Program |
  | term_id | INT | NOT NULL | - | FK2 | academic_term.id | - | Term |
  | structure_name| VARCHAR(100) | NOT NULL | - | - | - | - | Name |
- **Unique Constraints**: `UK_prog_term` (program_id, term_id)
- **Indexes**: `idx_term` (term_id)
- **Referential Actions**: program_id (RESTRICT), term_id (RESTRICT)
- **Maintained By**: API

### 27. fee_component
- **Purpose**: Individual items in a fee structure.
- **PRD Section**: §6.4, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | INT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | structure_id | INT | NOT NULL | - | FK | fee_structure.id | - | Parent structure |
  | component_name| VARCHAR(50) | NOT NULL | - | - | - | - | E.g. Tuition, Exam |
  | amount | DECIMAL(10,2)| NOT NULL | - | - | - | amount >= 0 | Amount |
  | due_date | DATE | NOT NULL | - | - | - | - | Due date |
- **Unique Constraints**: `UK_struct_comp` (structure_id, component_name)
- **Indexes**: None
- **Referential Actions**: structure_id (CASCADE)
- **Maintained By**: API

### 28. student_fee
- **Purpose**: Dues generated for a student.
- **PRD Section**: §6.4, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | BIGINT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | student_id | BIGINT | NOT NULL | - | FK1 | student.id | - | Student |
  | component_id | INT | NOT NULL | - | FK2 | fee_component.id | - | Component |
  | amount_due | DECIMAL(10,2)| NOT NULL | - | - | - | amount_due >= 0 | Principal |
  | amount_paid | DECIMAL(10,2)| NOT NULL | 0 | - | - | amount_paid >= 0 | Paid |
  | status | ENUM | NOT NULL | 'PENDING' | - | - | IN ('PENDING', 'PARTIAL', 'PAID') | Status |
- **Unique Constraints**: `UK_student_comp` (student_id, component_id)
- **Indexes**: `idx_component` (component_id)
- **Referential Actions**: student_id (RESTRICT), component_id (RESTRICT)
- **Maintained By**: API, Stored Procedure (Payment)

### 29. late_fee_rule
- **Purpose**: Rules for calculating late fees.
- **PRD Section**: §6.4, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | INT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | rule_type | ENUM | NOT NULL | - | - | - | IN ('FLAT', 'PER_DAY') | Type |
  | penalty_amount| DECIMAL(10,2)| NOT NULL | - | - | - | penalty_amount >= 0 | Amount |
  | max_penalty | DECIMAL(10,2)| NULL | - | - | - | max_penalty >= 0 | Max cap |
- **Unique Constraints**: None
- **Indexes**: None
- **Referential Actions**: None
- **Maintained By**: API

### 30. payment
- **Purpose**: Student payments.
- **PRD Section**: §6.4, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | BIGINT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | student_id | BIGINT | NOT NULL | - | FK | student.id | - | Student |
  | amount | DECIMAL(10,2)| NOT NULL | - | - | - | amount > 0 | Paid amount |
  | payment_mode | ENUM | NOT NULL | - | - | - | IN ('CASH', 'ONLINE', 'DD') | Mode |
  | reference_no | VARCHAR(50) | NULL | - | UK1 | - | - | Txn Ref |
  | payment_date | DATETIME | NOT NULL | CURRENT_TIMESTAMP | - | - | - | When |
  | status | ENUM | NOT NULL | 'SUCCESS' | - | - | IN ('SUCCESS', 'FAILED') | Status |
- **Unique Constraints**: `UK_reference` (reference_no)
- **Indexes**: `idx_student` (student_id)
- **Referential Actions**: student_id (RESTRICT)
- **Maintained By**: Stored Procedure

### 31. payment_allocation
- **Purpose**: Maps a payment to specific dues (incl. late fee).
- **PRD Section**: §6.4, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | BIGINT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | payment_id | BIGINT | NOT NULL | - | FK1 | payment.id | - | Payment |
  | student_fee_id| BIGINT | NOT NULL | - | FK2 | student_fee.id | - | Due item |
  | allocated_principal | DECIMAL(10,2)| NOT NULL | 0 | - | - | allocated_principal >= 0 | To principal |
  | allocated_late_fee | DECIMAL(10,2)| NOT NULL | 0 | - | - | allocated_late_fee >= 0 | To late fee |
- **Unique Constraints**: `UK_pay_fee` (payment_id, student_fee_id)
- **Indexes**: `idx_student_fee` (student_fee_id)
- **Referential Actions**: payment_id (CASCADE), student_fee_id (RESTRICT)
- **Maintained By**: Stored Procedure

### 32. receipt
- **Purpose**: Generated receipts.
- **PRD Section**: §6.4, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | BIGINT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | receipt_number| VARCHAR(20) | NOT NULL | - | UK1 | - | REGEXP '^RCP-[0-9]{8}-[0-9]{5}$' | Global ID |
  | payment_id | BIGINT | NOT NULL | - | FK | payment.id | - | Payment |
  | generated_at | DATETIME | NOT NULL | CURRENT_TIMESTAMP | - | - | - | When |
- **Unique Constraints**: `UK_receipt_num` (receipt_number), `UK_payment` (payment_id)
- **Indexes**: None
- **Referential Actions**: payment_id (RESTRICT)
- **Maintained By**: Stored Procedure

### 33. fee_audit_log
- **Purpose**: Audits changes to fee structures.
- **PRD Section**: §6.4, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | BIGINT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | entity_name | VARCHAR(50) | NOT NULL | - | - | - | - | Table name |
  | entity_id | INT | NOT NULL | - | - | - | - | PK of entity |
  | old_value | DECIMAL(10,2)| NULL | - | - | - | - | Previous amt |
  | new_value | DECIMAL(10,2)| NULL | - | - | - | - | New amt |
  | changed_by | VARCHAR(50) | NULL | - | - | - | - | User context |
  | changed_at | DATETIME | NOT NULL | CURRENT_TIMESTAMP | - | - | - | When |
- **Unique Constraints**: None
- **Indexes**: `idx_entity` (entity_name, entity_id)
- **Referential Actions**: None
- **Maintained By**: DB Trigger

### 34. hostel_fee_component_link
- **Purpose**: Allows hostel fees to be managed as fee components.
- **PRD Section**: §4.1
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | INT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | fee_component_id | INT | NOT NULL | - | FK1 | fee_component.id | - | Fee component |
  | hostel_id | INT | NOT NULL | - | FK2 | hostel.id | - | Linked hostel |
- **Unique Constraints**: `UK_comp_hostel` (fee_component_id, hostel_id)
- **Indexes**: `idx_hostel` (hostel_id)
- **Referential Actions**: fee_component_id (CASCADE), hostel_id (CASCADE)
- **Maintained By**: API

## M5: HR, Leave, Payroll

### 35. employee
- **Purpose**: Employee master (faculty and staff).
- **PRD Section**: §6.5, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | BIGINT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | employee_id | VARCHAR(13) | NOT NULL | - | UK1 | - | REGEXP '^EMP-[0-9]{4}-[0-9]{4}$' | Global EMP ID |
  | first_name | VARCHAR(50) | NOT NULL | - | - | - | - | First name |
  | last_name | VARCHAR(50) | NOT NULL | - | - | - | - | Last name |
  | department_id | INT | NOT NULL | - | FK | department.id | - | Department |
  | designation_id| INT | NOT NULL | - | FK | designation.id | - | Designation |
  | joining_date | DATE | NOT NULL | - | - | - | - | Joined |
  | emp_type | ENUM | NOT NULL | - | - | - | IN ('FACULTY', 'STAFF') | Type |
  | status | ENUM | NOT NULL | 'ACTIVE' | - | - | IN ('ACTIVE', 'INACTIVE') | Status |
- **Unique Constraints**: `UK_employee_id` (employee_id)
- **Indexes**: `idx_department` (department_id), `idx_designation` (designation_id)
- **Referential Actions**: department_id (RESTRICT), designation_id (RESTRICT)
- **Maintained By**: API

### 36. designation
- **Purpose**: Job titles and levels.
- **PRD Section**: §6.5, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | INT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | title | VARCHAR(100) | NOT NULL | - | UK1 | - | - | Title |
  | job_level | INT | NOT NULL | - | - | - | job_level > 0 | Level/Band |
- **Unique Constraints**: `UK_title` (title)
- **Indexes**: None
- **Referential Actions**: None
- **Maintained By**: API

### 37. leave_type
- **Purpose**: Leave types (Sick, Casual, etc.).
- **PRD Section**: §6.5, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | INT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | name | VARCHAR(50) | NOT NULL | - | UK1 | - | - | Type name |
  | is_paid | TINYINT(1) | NOT NULL | 1 | - | - | - | Paid flag |
- **Unique Constraints**: `UK_name` (name)
- **Indexes**: None
- **Referential Actions**: None
- **Maintained By**: API

### 38. leave_entitlement
- **Purpose**: Base annual quota per type.
- **PRD Section**: §6.5, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | INT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | leave_type_id | INT | NOT NULL | - | FK1 | leave_type.id | - | Type |
  | emp_type | ENUM | NOT NULL | - | UK1 | - | IN ('FACULTY', 'STAFF') | Employee Type |
  | annual_quota | INT | NOT NULL | - | - | - | annual_quota >= 0 | Days |
  | carry_forward | TINYINT(1) | NOT NULL | 0 | - | - | - | CF flag |
- **Unique Constraints**: `UK_type_emp` (leave_type_id, emp_type)
- **Indexes**: None
- **Referential Actions**: leave_type_id (RESTRICT)
- **Maintained By**: API

### 39. leave_application
- **Purpose**: Workflow for leave requests.
- **PRD Section**: §6.5, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | BIGINT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | employee_id | BIGINT | NOT NULL | - | FK1 | employee.id | - | Employee |
  | leave_type_id | INT | NOT NULL | - | FK2 | leave_type.id | - | Type |
  | start_date | DATE | NOT NULL | - | - | - | - | Start |
  | end_date | DATE | NOT NULL | - | - | - | end_date >= start_date | End |
  | days | DECIMAL(4,1)| NOT NULL | - | - | - | days > 0 | Total days |
  | reason | TEXT | NULL | - | - | - | - | Reason |
  | status | ENUM | NOT NULL | 'PENDING' | - | - | IN ('PENDING', 'APPROVED', 'REJECTED') | Status |
  | decision_by | BIGINT | NULL | - | FK3 | user_account.id | - | Approved by |
  | decision_date | DATETIME | NULL | - | - | - | - | Decision TS |
- **Unique Constraints**: None
- **Indexes**: `idx_employee` (employee_id), `idx_status` (status)
- **Referential Actions**: employee_id (RESTRICT), leave_type_id (RESTRICT), decision_by (RESTRICT)
- **Maintained By**: API

### 40. salary_structure
- **Purpose**: Defines salary earnings/deductions structure for a designation.
- **PRD Section**: §6.5, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | INT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | designation_id| INT | NOT NULL | - | UK1, FK| designation.id | - | Designation |
  | basic_pay | DECIMAL(10,2)| NOT NULL | - | - | - | basic_pay >= 0 | Base amount |
  | allowances | DECIMAL(10,2)| NOT NULL | 0 | - | - | allowances >= 0 | Extra earnings |
  | standard_deductions | DECIMAL(10,2)| NOT NULL | 0 | - | - | standard_deductions >= 0 | Base deductions |
- **Unique Constraints**: `UK_designation` (designation_id)
- **Indexes**: None
- **Referential Actions**: designation_id (RESTRICT)
- **Maintained By**: API

### 41. payroll_run
- **Purpose**: Monthly payroll execution batch.
- **PRD Section**: §6.5, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | INT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | payroll_month | VARCHAR(7) | NOT NULL | - | UK1 | - | REGEXP '^[0-9]{4}-(0[1-9]\|1[0-2])$' | E.g. 2023-10 |
  | run_date | DATETIME | NOT NULL | CURRENT_TIMESTAMP | - | - | - | Run TS |
  | status | ENUM | NOT NULL | 'DRAFT' | - | - | IN ('DRAFT', 'FINALIZED') | Status |
  | run_by | BIGINT | NOT NULL | - | FK | user_account.id | - | Admin user |
- **Unique Constraints**: `UK_month` (payroll_month)
- **Indexes**: None
- **Referential Actions**: run_by (RESTRICT)
- **Maintained By**: Stored Procedure

### 42. payslip
- **Purpose**: Monthly salary slip per employee.
- **PRD Section**: §6.5, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | BIGINT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | run_id | INT | NOT NULL | - | FK1 | payroll_run.id | - | Run |
  | employee_id | BIGINT | NOT NULL | - | FK2 | employee.id | - | Employee |
  | gross_pay | DECIMAL(10,2)| NOT NULL | - | - | - | gross_pay >= 0 | Earnings |
  | total_deductions| DECIMAL(10,2)| NOT NULL | - | - | - | total_deductions >= 0 | Deductions |
  | net_pay | DECIMAL(10,2)| NOT NULL | - | - | - | net_pay >= 0 | Final |
  | leave_days_deducted| DECIMAL(4,1)| NOT NULL | 0 | - | - | leave_days_deducted >= 0 | Unpaid CF |
- **Unique Constraints**: `UK_run_emp` (run_id, employee_id)
- **Indexes**: `idx_employee` (employee_id)
- **Referential Actions**: run_id (CASCADE), employee_id (RESTRICT)
- **Maintained By**: Stored Procedure

### 43. payslip_line
- **Purpose**: Breakdown of payslip earnings/deductions.
- **PRD Section**: §6.5, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | BIGINT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | payslip_id | BIGINT | NOT NULL | - | FK | payslip.id | - | Payslip |
  | component_type| ENUM | NOT NULL | - | - | - | IN ('EARNING', 'DEDUCTION') | Type |
  | description | VARCHAR(100) | NOT NULL | - | - | - | - | E.g. Basic |
  | amount | DECIMAL(10,2)| NOT NULL | - | - | - | amount >= 0 | Amount |
- **Unique Constraints**: None
- **Indexes**: `idx_payslip` (payslip_id)
- **Referential Actions**: payslip_id (CASCADE)
- **Maintained By**: Stored Procedure

## M6: Hostel

### 44. hostel
- **Purpose**: Hostel building records.
- **PRD Section**: §6.6, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | INT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | name | VARCHAR(100) | NOT NULL | - | UK1 | - | - | Name |
  | gender_block | ENUM | NOT NULL | - | - | - | IN ('MALE', 'FEMALE', 'COED') | Type |
  | total_capacity| INT | NOT NULL | 0 | - | - | total_capacity >= 0 | Cached total beds |
- **Unique Constraints**: `UK_name` (name)
- **Indexes**: None
- **Referential Actions**: None
- **Maintained By**: API

### 45. room
- **Purpose**: Rooms within a hostel.
- **PRD Section**: §6.6, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | INT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | hostel_id | INT | NOT NULL | - | FK | hostel.id | - | Hostel |
  | room_number | VARCHAR(20) | NOT NULL | - | UK1 | - | - | Number |
  | bed_capacity | INT | NOT NULL | - | - | - | bed_capacity > 0 | Max beds |
  | available_beds| INT | NOT NULL | - | - | - | available_beds >= 0 AND available_beds <= bed_capacity | Live beds |
- **Unique Constraints**: `UK_hostel_room` (hostel_id, room_number)
- **Indexes**: None
- **Referential Actions**: hostel_id (RESTRICT)
- **Maintained By**: API / DB Trigger (available_beds)
- **Derived Columns**: `available_beds` is maintained by a trigger checking `hostel_allocation`.

### 46. hostel_allocation
- **Purpose**: Student allocation to a room.
- **PRD Section**: §6.6, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | BIGINT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | student_id | BIGINT | NOT NULL | - | FK1 | student.id | - | Student |
  | room_id | INT | NOT NULL | - | FK2 | room.id | - | Room |
  | from_date | DATE | NOT NULL | - | - | - | - | Start |
  | to_date | DATE | NULL | - | - | - | to_date IS NULL OR to_date >= from_date | End |
  | status | ENUM | NOT NULL | 'ACTIVE' | - | - | IN ('ACTIVE', 'VACATED') | Status |
- **Unique Constraints**: `UK_student_active` (student_id) WHERE status = 'ACTIVE' (via Trigger/Unique trick)
- **Indexes**: `idx_room` (room_id)
- **Referential Actions**: student_id (RESTRICT), room_id (RESTRICT)
- **Maintained By**: API / Triggers

### 47. hostel_request
- **Purpose**: Student requests for hostel actions.
- **PRD Section**: §6.6, §11.2
- **Columns**:
  | Name | Data Type | NULL/NOT NULL | Default | Key Role | Referenced Table.Column | CHECK Rule | Description |
  |---|---|---|---|---|---|---|---|
  | id | BIGINT | NOT NULL | AUTO_INCREMENT | PK | - | - | Primary key |
  | student_id | BIGINT | NOT NULL | - | FK1 | student.id | - | Student |
  | request_type | ENUM | NOT NULL | - | - | - | IN ('ALLOCATION', 'ROOM_CHANGE', 'VACATE') | Type |
  | details | TEXT | NULL | - | - | - | - | Extra info |
  | status | ENUM | NOT NULL | 'PENDING' | - | - | IN ('PENDING', 'APPROVED', 'REJECTED') | Status |
  | decision_by | BIGINT | NULL | - | FK2 | user_account.id | - | Reviewer |
  | remark | TEXT | NULL | - | - | - | - | Admin remark |
- **Unique Constraints**: None
- **Indexes**: `idx_student` (student_id), `idx_status` (status)
- **Referential Actions**: student_id (CASCADE), decision_by (RESTRICT)
- **Maintained By**: API
