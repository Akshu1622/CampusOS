-- =====================================================================
-- schema_assumed.sql  -  MINIMAL ASSUMED DDL for University ERP (MySQL 8)
-- Only needed if you do not yet have your own DDL. If you do, skip this
-- file and align the column lists in seed_erp.py (see COLS section).
-- Triggers / procedures / UDFs are deliberately NOT here: load them AFTER
-- the seed (the seed pre-computes bed counts, audit rows, etc.).
-- =====================================================================
DROP DATABASE IF EXISTS university_erp;
CREATE DATABASE university_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE university_erp;

-- ---------------- M1 Core ----------------
CREATE TABLE roles (
  role_id TINYINT PRIMARY KEY, role_name VARCHAR(20) NOT NULL UNIQUE
) ENGINE=InnoDB;
CREATE TABLE permission_sets (
  permission_set_id TINYINT PRIMARY KEY, name VARCHAR(40) NOT NULL UNIQUE
) ENGINE=InnoDB;
CREATE TABLE departments (
  department_id INT PRIMARY KEY, dept_code VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL, head_employee_id VARCHAR(10) NULL
) ENGINE=InnoDB;
CREATE TABLE programs (
  program_id INT PRIMARY KEY, department_id INT NOT NULL, program_code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL, degree_level VARCHAR(10) NOT NULL,
  duration_years TINYINT NOT NULL CHECK (duration_years > 0),
  total_credits SMALLINT NOT NULL CHECK (total_credits > 0),
  FOREIGN KEY (department_id) REFERENCES departments(department_id)
) ENGINE=InnoDB;
CREATE TABLE academic_terms (
  term_id INT PRIMARY KEY, term_code VARCHAR(20) NOT NULL UNIQUE, academic_year VARCHAR(9) NOT NULL,
  term_label ENUM('ODD','EVEN') NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT 0, CHECK (end_date > start_date)
) ENGINE=InnoDB;
CREATE TABLE designations (
  designation_id INT PRIMARY KEY, title VARCHAR(60) NOT NULL UNIQUE, level_no TINYINT NOT NULL
) ENGINE=InnoDB;
CREATE TABLE employees (
  employee_id VARCHAR(10) PRIMARY KEY, full_name VARCHAR(100) NOT NULL, gender ENUM('M','F','O') NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE, phone VARCHAR(15), department_id INT NOT NULL, designation_id INT NOT NULL,
  emp_type ENUM('FACULTY','STAFF') NOT NULL, joining_date DATE NOT NULL,
  status ENUM('ACTIVE','ON_LEAVE','RESIGNED') NOT NULL DEFAULT 'ACTIVE',
  FOREIGN KEY (department_id) REFERENCES departments(department_id),
  FOREIGN KEY (designation_id) REFERENCES designations(designation_id)
) ENGINE=InnoDB;
ALTER TABLE departments ADD CONSTRAINT fk_dept_head FOREIGN KEY (head_employee_id) REFERENCES employees(employee_id);
CREATE TABLE students (
  student_id VARCHAR(14) PRIMARY KEY, full_name VARCHAR(100) NOT NULL, gender ENUM('M','F','O') NOT NULL,
  dob DATE NOT NULL, email VARCHAR(120) NOT NULL UNIQUE, phone VARCHAR(15), city VARCHAR(60), state VARCHAR(60),
  program_id INT NOT NULL, batch_year SMALLINT NOT NULL, current_semester TINYINT NOT NULL,
  status ENUM('ACTIVE','DETAINED','DROPPED','GRADUATED') NOT NULL DEFAULT 'ACTIVE', admission_date DATE NOT NULL,
  FOREIGN KEY (program_id) REFERENCES programs(program_id)
) ENGINE=InnoDB;
CREATE TABLE users (
  user_id INT PRIMARY KEY, username VARCHAR(40) NOT NULL UNIQUE, email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL, role_id TINYINT NOT NULL,
  student_id VARCHAR(14) NULL UNIQUE, employee_id VARCHAR(10) NULL UNIQUE,
  status ENUM('ACTIVE','INACTIVE','LOCKED') NOT NULL DEFAULT 'ACTIVE', failed_attempts TINYINT NOT NULL DEFAULT 0,
  last_login DATETIME NULL, created_at DATETIME NOT NULL,
  FOREIGN KEY (role_id) REFERENCES roles(role_id),
  FOREIGN KEY (student_id) REFERENCES students(student_id),
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
) ENGINE=InnoDB;
CREATE TABLE user_permission_sets (
  user_id INT NOT NULL, permission_set_id TINYINT NOT NULL, PRIMARY KEY (user_id, permission_set_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id), FOREIGN KEY (permission_set_id) REFERENCES permission_sets(permission_set_id)
) ENGINE=InnoDB;
CREATE TABLE audit_log (
  audit_id INT PRIMARY KEY, actor_user_id INT NULL, action VARCHAR(40) NOT NULL, entity VARCHAR(40) NOT NULL,
  entity_id VARCHAR(40) NULL, old_value TEXT NULL, new_value TEXT NULL, created_at DATETIME NOT NULL,
  FOREIGN KEY (actor_user_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- ---------------- M2 Academics ----------------
CREATE TABLE courses (
  course_id INT PRIMARY KEY, course_code VARCHAR(12) NOT NULL UNIQUE, title VARCHAR(120) NOT NULL,
  credits TINYINT NOT NULL CHECK (credits > 0), department_id INT NOT NULL,
  course_type ENUM('THEORY','LAB','ELECTIVE') NOT NULL, is_active BOOLEAN NOT NULL DEFAULT 1,
  FOREIGN KEY (department_id) REFERENCES departments(department_id)
) ENGINE=InnoDB;
CREATE TABLE curriculum_mapping (
  curriculum_id INT PRIMARY KEY, program_id INT NOT NULL, semester TINYINT NOT NULL, course_id INT NOT NULL,
  category ENUM('CORE','ELECTIVE') NOT NULL, UNIQUE (program_id, course_id),
  FOREIGN KEY (program_id) REFERENCES programs(program_id), FOREIGN KEY (course_id) REFERENCES courses(course_id)
) ENGINE=InnoDB;
CREATE TABLE course_offerings (
  offering_id INT PRIMARY KEY, term_id INT NOT NULL, course_id INT NOT NULL, faculty_id VARCHAR(10) NOT NULL,
  section CHAR(1) NOT NULL, capacity SMALLINT NOT NULL CHECK (capacity > 0),
  UNIQUE (term_id, course_id, section),
  FOREIGN KEY (term_id) REFERENCES academic_terms(term_id), FOREIGN KEY (course_id) REFERENCES courses(course_id),
  FOREIGN KEY (faculty_id) REFERENCES employees(employee_id)
) ENGINE=InnoDB;
CREATE TABLE enrollments (
  enrollment_id INT PRIMARY KEY, student_id VARCHAR(14) NOT NULL, offering_id INT NOT NULL,
  status ENUM('ENROLLED','WITHDRAWN','COMPLETED') NOT NULL, enrolled_on DATE NOT NULL,
  withdrawn_on DATE NULL, withdrawal_reason VARCHAR(120) NULL, UNIQUE (student_id, offering_id),
  FOREIGN KEY (student_id) REFERENCES students(student_id), FOREIGN KEY (offering_id) REFERENCES course_offerings(offering_id)
) ENGINE=InnoDB;
CREATE TABLE bulk_enrollment_batches (
  batch_id INT PRIMARY KEY, run_by_user_id INT NOT NULL, program_id INT NOT NULL, term_id INT NOT NULL,
  semester TINYINT NOT NULL, source_format ENUM('UI','CSV','JSON','XML') NOT NULL,
  total_rows INT NOT NULL, enrolled_count INT NOT NULL, skipped_count INT NOT NULL, failed_count INT NOT NULL,
  run_at DATETIME NOT NULL,
  FOREIGN KEY (run_by_user_id) REFERENCES users(user_id), FOREIGN KEY (program_id) REFERENCES programs(program_id),
  FOREIGN KEY (term_id) REFERENCES academic_terms(term_id)
) ENGINE=InnoDB;
CREATE TABLE bulk_enrollment_rejects (
  reject_id INT PRIMARY KEY, batch_id INT NOT NULL, row_no INT NOT NULL, student_id VARCHAR(14) NULL,
  offering_id INT NULL, reason VARCHAR(160) NOT NULL, FOREIGN KEY (batch_id) REFERENCES bulk_enrollment_batches(batch_id)
) ENGINE=InnoDB;

-- ---------------- M3 Attendance / Exams / Results ----------------
CREATE TABLE grade_scale (
  grade VARCHAR(3) PRIMARY KEY, min_marks DECIMAL(5,2) NOT NULL, max_marks DECIMAL(5,2) NOT NULL, grade_points TINYINT NOT NULL
) ENGINE=InnoDB;
CREATE TABLE attendance_sessions (
  session_id INT PRIMARY KEY, offering_id INT NOT NULL, session_date DATE NOT NULL, slot CHAR(2) NOT NULL,
  marked_by VARCHAR(10) NOT NULL, UNIQUE (offering_id, session_date, slot),
  FOREIGN KEY (offering_id) REFERENCES course_offerings(offering_id), FOREIGN KEY (marked_by) REFERENCES employees(employee_id)
) ENGINE=InnoDB;
CREATE TABLE attendance_records (
  session_id INT NOT NULL, enrollment_id INT NOT NULL, status ENUM('P','A') NOT NULL,
  PRIMARY KEY (session_id, enrollment_id),
  FOREIGN KEY (session_id) REFERENCES attendance_sessions(session_id), FOREIGN KEY (enrollment_id) REFERENCES enrollments(enrollment_id)
) ENGINE=InnoDB;
CREATE TABLE exams (
  exam_id INT PRIMARY KEY, offering_id INT NOT NULL, exam_type ENUM('MID_SEM','END_SEM') NOT NULL,
  exam_date DATE NOT NULL, max_marks SMALLINT NOT NULL, reg_open DATE NOT NULL, reg_close DATE NOT NULL,
  UNIQUE (offering_id, exam_type), FOREIGN KEY (offering_id) REFERENCES course_offerings(offering_id)
) ENGINE=InnoDB;
CREATE TABLE exam_registrations (
  registration_id INT PRIMARY KEY, exam_id INT NOT NULL, enrollment_id INT NOT NULL,
  status ENUM('REGISTERED','CANCELLED') NOT NULL, registered_at DATETIME NOT NULL,
  UNIQUE (exam_id, enrollment_id),
  FOREIGN KEY (exam_id) REFERENCES exams(exam_id), FOREIGN KEY (enrollment_id) REFERENCES enrollments(enrollment_id)
) ENGINE=InnoDB;
CREATE TABLE exam_registration_attempts (
  attempt_id INT PRIMARY KEY, exam_id INT NOT NULL, enrollment_id INT NOT NULL,
  outcome ENUM('REGISTERED','BLOCKED') NOT NULL, attendance_pct DECIMAL(5,2) NOT NULL,
  reason VARCHAR(160) NULL, attempted_at DATETIME NOT NULL,
  FOREIGN KEY (exam_id) REFERENCES exams(exam_id), FOREIGN KEY (enrollment_id) REFERENCES enrollments(enrollment_id)
) ENGINE=InnoDB;
CREATE TABLE exam_marks (
  registration_id INT PRIMARY KEY, marks_obtained DECIMAL(5,2) NOT NULL CHECK (marks_obtained >= 0),
  grade VARCHAR(3) NULL, grade_points TINYINT NULL, is_published BOOLEAN NOT NULL DEFAULT 0,
  entered_by VARCHAR(10) NOT NULL, entered_at DATETIME NOT NULL, published_at DATETIME NULL,
  FOREIGN KEY (registration_id) REFERENCES exam_registrations(registration_id),
  FOREIGN KEY (entered_by) REFERENCES employees(employee_id)
) ENGINE=InnoDB;
CREATE TABLE semester_results (
  result_id INT PRIMARY KEY, student_id VARCHAR(14) NOT NULL, term_id INT NOT NULL,
  credits_registered SMALLINT NOT NULL, credits_earned SMALLINT NOT NULL,
  sgpa DECIMAL(4,2) NOT NULL, cgpa DECIMAL(4,2) NOT NULL, published_at DATETIME NOT NULL,
  UNIQUE (student_id, term_id),
  FOREIGN KEY (student_id) REFERENCES students(student_id), FOREIGN KEY (term_id) REFERENCES academic_terms(term_id)
) ENGINE=InnoDB;

-- ---------------- M4 Finance ----------------
CREATE TABLE fee_structures (
  structure_id INT PRIMARY KEY, program_id INT NOT NULL, term_id INT NOT NULL,
  component ENUM('TUITION','EXAM','DEVELOPMENT','HOSTEL') NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0), due_date DATE NOT NULL,
  UNIQUE (program_id, term_id, component),
  FOREIGN KEY (program_id) REFERENCES programs(program_id), FOREIGN KEY (term_id) REFERENCES academic_terms(term_id)
) ENGINE=InnoDB;
CREATE TABLE late_fee_rules (
  rule_id INT PRIMARY KEY, rule_name VARCHAR(60) NOT NULL, penalty_type ENUM('PER_DAY','FLAT') NOT NULL,
  rate DECIMAL(10,2) NOT NULL, grace_days SMALLINT NOT NULL, max_penalty DECIMAL(10,2) NOT NULL,
  effective_from DATE NOT NULL, is_active BOOLEAN NOT NULL
) ENGINE=InnoDB;
CREATE TABLE student_fees (
  fee_id INT PRIMARY KEY, student_id VARCHAR(14) NOT NULL, structure_id INT NOT NULL,
  amount_due DECIMAL(10,2) NOT NULL, amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  status ENUM('UNPAID','PARTIAL','PAID') NOT NULL, due_date DATE NOT NULL,
  UNIQUE (student_id, structure_id), CHECK (amount_paid >= 0 AND amount_paid <= amount_due),
  FOREIGN KEY (student_id) REFERENCES students(student_id), FOREIGN KEY (structure_id) REFERENCES fee_structures(structure_id)
) ENGINE=InnoDB;
CREATE TABLE payments (
  payment_id INT PRIMARY KEY, student_id VARCHAR(14) NOT NULL, amount DECIMAL(10,2) NOT NULL,
  late_fee DECIMAL(10,2) NOT NULL DEFAULT 0, mode ENUM('CASH','ONLINE','DD') NOT NULL,
  status ENUM('SUCCESS','FAILED','PENDING') NOT NULL, paid_at DATETIME NOT NULL, reference_no VARCHAR(30) NOT NULL,
  recorded_by_user_id INT NULL,
  FOREIGN KEY (student_id) REFERENCES students(student_id), FOREIGN KEY (recorded_by_user_id) REFERENCES users(user_id)
) ENGINE=InnoDB;
CREATE TABLE payment_allocations (
  allocation_id INT PRIMARY KEY, payment_id INT NOT NULL, fee_id INT NOT NULL, amount_applied DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (payment_id) REFERENCES payments(payment_id), FOREIGN KEY (fee_id) REFERENCES student_fees(fee_id)
) ENGINE=InnoDB;
CREATE TABLE receipts (
  receipt_id INT PRIMARY KEY, receipt_no VARCHAR(20) NOT NULL UNIQUE, payment_id INT NOT NULL UNIQUE,
  issued_at DATETIME NOT NULL, total_amount DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (payment_id) REFERENCES payments(payment_id)
) ENGINE=InnoDB;
CREATE TABLE fee_audit_log (
  audit_id INT PRIMARY KEY, structure_id INT NULL, field_name VARCHAR(30) NOT NULL,
  old_value VARCHAR(60) NULL, new_value VARCHAR(60) NULL, action ENUM('INSERT','UPDATE','DELETE') NOT NULL,
  changed_by_user_id INT NOT NULL, changed_at DATETIME NOT NULL,
  FOREIGN KEY (changed_by_user_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- ---------------- M5 HR ----------------
CREATE TABLE leave_types (
  leave_type_id INT PRIMARY KEY, code VARCHAR(5) NOT NULL UNIQUE, name VARCHAR(40) NOT NULL,
  annual_quota DECIMAL(4,1) NOT NULL, carry_forward_max DECIMAL(4,1) NOT NULL, is_paid BOOLEAN NOT NULL
) ENGINE=InnoDB;
CREATE TABLE leave_entitlements (
  employee_id VARCHAR(10) NOT NULL, leave_type_id INT NOT NULL, leave_year SMALLINT NOT NULL, quota DECIMAL(4,1) NOT NULL,
  PRIMARY KEY (employee_id, leave_type_id, leave_year),
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id), FOREIGN KEY (leave_type_id) REFERENCES leave_types(leave_type_id)
) ENGINE=InnoDB;
CREATE TABLE leave_applications (
  leave_id INT PRIMARY KEY, employee_id VARCHAR(10) NOT NULL, leave_type_id INT NOT NULL,
  from_date DATE NOT NULL, to_date DATE NOT NULL, days DECIMAL(4,1) NOT NULL, reason VARCHAR(160),
  status ENUM('PENDING','APPROVED','REJECTED','CANCELLED') NOT NULL, applied_at DATETIME NOT NULL,
  decided_by_user_id INT NULL, decided_at DATETIME NULL, remark VARCHAR(120) NULL, CHECK (to_date >= from_date),
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id), FOREIGN KEY (leave_type_id) REFERENCES leave_types(leave_type_id),
  FOREIGN KEY (decided_by_user_id) REFERENCES users(user_id)
) ENGINE=InnoDB;
CREATE TABLE salary_structures (
  structure_id INT PRIMARY KEY, designation_id INT NOT NULL UNIQUE, basic DECIMAL(10,2) NOT NULL,
  hra_pct DECIMAL(5,2) NOT NULL, da_pct DECIMAL(5,2) NOT NULL, pf_pct DECIMAL(5,2) NOT NULL, professional_tax DECIMAL(8,2) NOT NULL,
  FOREIGN KEY (designation_id) REFERENCES designations(designation_id)
) ENGINE=InnoDB;
CREATE TABLE payroll_runs (
  run_id INT PRIMARY KEY, pay_year SMALLINT NOT NULL, pay_month TINYINT NOT NULL,
  status ENUM('DRAFT','FINALIZED') NOT NULL, run_at DATETIME NOT NULL, finalized_at DATETIME NULL, run_by_user_id INT NOT NULL,
  UNIQUE (pay_year, pay_month), FOREIGN KEY (run_by_user_id) REFERENCES users(user_id)
) ENGINE=InnoDB;
CREATE TABLE payslips (
  payslip_id INT PRIMARY KEY, run_id INT NOT NULL, employee_id VARCHAR(10) NOT NULL,
  basic DECIMAL(10,2) NOT NULL, hra DECIMAL(10,2) NOT NULL, da DECIMAL(10,2) NOT NULL, gross DECIMAL(10,2) NOT NULL,
  pf DECIMAL(10,2) NOT NULL, professional_tax DECIMAL(8,2) NOT NULL, unpaid_leave_days DECIMAL(4,1) NOT NULL,
  leave_deduction DECIMAL(10,2) NOT NULL, total_deductions DECIMAL(10,2) NOT NULL, net_pay DECIMAL(10,2) NOT NULL,
  UNIQUE (run_id, employee_id),
  FOREIGN KEY (run_id) REFERENCES payroll_runs(run_id), FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
) ENGINE=InnoDB;

-- ---------------- M6 Hostel ----------------
CREATE TABLE hostels (
  hostel_id INT PRIMARY KEY, name VARCHAR(60) NOT NULL UNIQUE, hostel_type ENUM('BOYS','GIRLS') NOT NULL,
  total_capacity SMALLINT NOT NULL, warden_employee_id VARCHAR(10) NULL,
  FOREIGN KEY (warden_employee_id) REFERENCES employees(employee_id)
) ENGINE=InnoDB;
CREATE TABLE rooms (
  room_id INT PRIMARY KEY, hostel_id INT NOT NULL, room_no VARCHAR(10) NOT NULL, floor_no TINYINT NOT NULL,
  bed_capacity TINYINT NOT NULL, available_beds TINYINT NOT NULL,
  UNIQUE (hostel_id, room_no), CHECK (available_beds >= 0 AND available_beds <= bed_capacity),
  FOREIGN KEY (hostel_id) REFERENCES hostels(hostel_id)
) ENGINE=InnoDB;
CREATE TABLE hostel_allocations (
  allocation_id INT PRIMARY KEY, student_id VARCHAR(14) NOT NULL, room_id INT NOT NULL,
  from_date DATE NOT NULL, to_date DATE NULL, status ENUM('ACTIVE','VACATED') NOT NULL,
  FOREIGN KEY (student_id) REFERENCES students(student_id), FOREIGN KEY (room_id) REFERENCES rooms(room_id)
) ENGINE=InnoDB;
CREATE TABLE hostel_requests (
  request_id INT PRIMARY KEY, student_id VARCHAR(14) NOT NULL, request_type ENUM('ALLOCATION','ROOM_CHANGE','VACATE') NOT NULL,
  details VARCHAR(200), status ENUM('PENDING','APPROVED','REJECTED') NOT NULL, requested_at DATETIME NOT NULL,
  decided_by_user_id INT NULL, decided_at DATETIME NULL, remark VARCHAR(120) NULL,
  FOREIGN KEY (student_id) REFERENCES students(student_id), FOREIGN KEY (decided_by_user_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- helpful indexes for reports / lookups
CREATE INDEX ix_enr_offering ON enrollments(offering_id);
CREATE INDEX ix_att_enr ON attendance_records(enrollment_id);
CREATE INDEX ix_fees_student ON student_fees(student_id);
CREATE INDEX ix_pay_student ON payments(student_id);
CREATE INDEX ix_alloc_student ON hostel_allocations(student_id, status);
