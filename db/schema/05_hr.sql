-- db/schema/05_hr.sql
-- M5 HR, Leave, and Payroll Module

-- 1. designation
CREATE TABLE designation (
    id INT NOT NULL AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    job_level INT NOT NULL,
    CONSTRAINT PK_designation PRIMARY KEY (id),
    CONSTRAINT UK_designation_title UNIQUE (title),
    CONSTRAINT CHK_designation_level CHECK (job_level > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Job titles and levels (PRD §6.5, §11.2)';

-- 2. employee
CREATE TABLE employee (
    id BIGINT NOT NULL AUTO_INCREMENT,
    employee_id VARCHAR(13) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    department_id INT NOT NULL,
    designation_id INT NOT NULL,
    joining_date DATE NOT NULL,
    emp_type ENUM('FACULTY', 'STAFF') NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT PK_employee PRIMARY KEY (id),
    CONSTRAINT UK_employee_id UNIQUE (employee_id),
    CONSTRAINT CHK_emp_id_format CHECK (employee_id REGEXP '^EMP-[0-9]{4}-[0-9]{4}$'),
    CONSTRAINT FK_employee_department FOREIGN KEY (department_id) REFERENCES department(id) ON DELETE RESTRICT,
    CONSTRAINT FK_employee_designation FOREIGN KEY (designation_id) REFERENCES designation(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Employee master (PRD §6.5, §11.2)';

CREATE INDEX idx_employee_department ON employee(department_id);
CREATE INDEX idx_employee_designation ON employee(designation_id);

-- 3. leave_type
CREATE TABLE leave_type (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    is_paid TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT PK_leave_type PRIMARY KEY (id),
    CONSTRAINT UK_leave_type_name UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Leave types (PRD §6.5, §11.2)';

-- 4. leave_entitlement
CREATE TABLE leave_entitlement (
    id INT NOT NULL AUTO_INCREMENT,
    leave_type_id INT NOT NULL,
    emp_type ENUM('FACULTY', 'STAFF') NOT NULL,
    annual_quota INT NOT NULL,
    carry_forward TINYINT(1) NOT NULL DEFAULT 0,
    CONSTRAINT PK_leave_entitlement PRIMARY KEY (id),
    CONSTRAINT UK_type_emp UNIQUE (leave_type_id, emp_type),
    CONSTRAINT CHK_leave_quota CHECK (annual_quota >= 0),
    CONSTRAINT FK_leave_ent_type FOREIGN KEY (leave_type_id) REFERENCES leave_type(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Base annual quota per type (PRD §6.5, §11.2)';

-- 5. leave_application
CREATE TABLE leave_application (
    id BIGINT NOT NULL AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    leave_type_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days DECIMAL(4,1) NOT NULL,
    reason TEXT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    decision_by BIGINT NULL,
    decision_date DATETIME NULL,
    CONSTRAINT PK_leave_application PRIMARY KEY (id),
    CONSTRAINT CHK_leave_dates CHECK (end_date >= start_date),
    CONSTRAINT CHK_leave_days CHECK (days > 0),
    CONSTRAINT FK_leave_app_employee FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE RESTRICT,
    CONSTRAINT FK_leave_app_type FOREIGN KEY (leave_type_id) REFERENCES leave_type(id) ON DELETE RESTRICT,
    CONSTRAINT FK_leave_app_decision FOREIGN KEY (decision_by) REFERENCES user_account(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Workflow for leave requests (PRD §6.5, §11.2)';

CREATE INDEX idx_leave_app_employee ON leave_application(employee_id);
CREATE INDEX idx_leave_app_status ON leave_application(status);

-- 6. salary_structure
CREATE TABLE salary_structure (
    id INT NOT NULL AUTO_INCREMENT,
    designation_id INT NOT NULL,
    basic_pay DECIMAL(10,2) NOT NULL,
    allowances DECIMAL(10,2) NOT NULL DEFAULT 0,
    standard_deductions DECIMAL(10,2) NOT NULL DEFAULT 0,
    CONSTRAINT PK_salary_structure PRIMARY KEY (id),
    CONSTRAINT UK_salary_designation UNIQUE (designation_id),
    CONSTRAINT CHK_salary_basic CHECK (basic_pay >= 0),
    CONSTRAINT CHK_salary_allow CHECK (allowances >= 0),
    CONSTRAINT CHK_salary_deduct CHECK (standard_deductions >= 0),
    CONSTRAINT FK_salary_designation FOREIGN KEY (designation_id) REFERENCES designation(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Defines salary earnings/deductions structure (PRD §6.5, §11.2)';

-- 7. payroll_run
CREATE TABLE payroll_run (
    id INT NOT NULL AUTO_INCREMENT,
    payroll_month VARCHAR(7) NOT NULL,
    run_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('DRAFT', 'FINALIZED') NOT NULL DEFAULT 'DRAFT',
    run_by BIGINT NOT NULL,
    finalized_unique VARCHAR(7) GENERATED ALWAYS AS (IF(status = 'FINALIZED', payroll_month, NULL)) VIRTUAL,
    CONSTRAINT PK_payroll_run PRIMARY KEY (id),
    CONSTRAINT UK_payroll_month UNIQUE (payroll_month),
    CONSTRAINT UK_payroll_run_finalized UNIQUE (finalized_unique),
    CONSTRAINT CHK_payroll_month_format CHECK (payroll_month REGEXP '^[0-9]{4}-(0[1-9]|1[0-2])$'),
    CONSTRAINT FK_payroll_run_user FOREIGN KEY (run_by) REFERENCES user_account(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Monthly payroll execution batch (PRD §6.5, §11.2)';

-- 8. payslip
CREATE TABLE payslip (
    id BIGINT NOT NULL AUTO_INCREMENT,
    run_id INT NOT NULL,
    employee_id BIGINT NOT NULL,
    gross_pay DECIMAL(10,2) NOT NULL,
    total_deductions DECIMAL(10,2) NOT NULL,
    net_pay DECIMAL(10,2) NOT NULL,
    leave_days_deducted DECIMAL(4,1) NOT NULL DEFAULT 0,
    CONSTRAINT PK_payslip PRIMARY KEY (id),
    CONSTRAINT UK_payslip_run_emp UNIQUE (run_id, employee_id),
    CONSTRAINT CHK_payslip_gross CHECK (gross_pay >= 0),
    CONSTRAINT CHK_payslip_deduct CHECK (total_deductions >= 0),
    CONSTRAINT CHK_payslip_net CHECK (net_pay >= 0),
    CONSTRAINT CHK_payslip_leave CHECK (leave_days_deducted >= 0),
    CONSTRAINT FK_payslip_run FOREIGN KEY (run_id) REFERENCES payroll_run(id) ON DELETE CASCADE,
    CONSTRAINT FK_payslip_employee FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Monthly salary slip per employee (PRD §6.5, §11.2)';

CREATE INDEX idx_payslip_employee ON payslip(employee_id);

-- 9. payslip_line
CREATE TABLE payslip_line (
    id BIGINT NOT NULL AUTO_INCREMENT,
    payslip_id BIGINT NOT NULL,
    component_type ENUM('EARNING', 'DEDUCTION') NOT NULL,
    description VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    CONSTRAINT PK_payslip_line PRIMARY KEY (id),
    CONSTRAINT CHK_payslip_line_amt CHECK (amount >= 0),
    CONSTRAINT FK_payslip_line_payslip FOREIGN KEY (payslip_id) REFERENCES payslip(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Breakdown of payslip earnings/deductions (PRD §6.5, §11.2)';

CREATE INDEX idx_payslip_line_payslip ON payslip_line(payslip_id);
