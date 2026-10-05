-- db/schema/01_core.sql
-- M1 Core Module

-- 1. department
CREATE TABLE department (
    id INT NOT NULL AUTO_INCREMENT,
    code VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    head_employee_id BIGINT NULL,
    CONSTRAINT PK_department PRIMARY KEY (id),
    CONSTRAINT UK_department_code UNIQUE (code)
    -- fk_dept_head to employee is deferred to 90_deferred_foreign_keys.sql
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Academic and administrative departments (PRD §6.1, §11.2)';

-- 2. program
CREATE TABLE program (
    id INT NOT NULL AUTO_INCREMENT,
    code VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    department_id INT NOT NULL,
    duration_years INT NOT NULL,
    credits_required INT NOT NULL,
    CONSTRAINT PK_program PRIMARY KEY (id),
    CONSTRAINT UK_program_code UNIQUE (code),
    CONSTRAINT CHK_program_duration CHECK (duration_years > 0),
    CONSTRAINT CHK_program_credits CHECK (credits_required > 0),
    CONSTRAINT FK_program_department FOREIGN KEY (department_id) REFERENCES department(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Degree programs (PRD §6.1, §11.2)';

CREATE INDEX idx_program_department ON program(department_id);

-- 3. academic_term
CREATE TABLE academic_term (
    id INT NOT NULL AUTO_INCREMENT,
    term_identifier VARCHAR(15) NOT NULL,
    term_year INT NOT NULL,
    term_label VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current TINYINT(1) NOT NULL DEFAULT 0,
    is_current_unique INT GENERATED ALWAYS AS (IF(is_current = 1, 1, NULL)) VIRTUAL,
    CONSTRAINT PK_academic_term PRIMARY KEY (id),
    CONSTRAINT UK_academic_term_identifier UNIQUE (term_identifier),
    CONSTRAINT UK_academic_term_current UNIQUE (is_current_unique),
    CONSTRAINT CHK_academic_term_identifier_format CHECK (term_identifier REGEXP '^[0-9]{4}-(FALL|SPRING|SUMMER|WINTER)$'),
    CONSTRAINT CHK_academic_term_dates CHECK (end_date > start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Academic terms (semesters) (PRD §6.1, §11.2)';

-- 4. student
CREATE TABLE student (
    id BIGINT NOT NULL AUTO_INCREMENT,
    global_student_id VARCHAR(15) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NULL,
    program_id INT NOT NULL,
    batch_year INT NOT NULL,
    status ENUM('ACTIVE', 'ALUMNI', 'DROPPED') NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT PK_student PRIMARY KEY (id),
    CONSTRAINT UK_student_global_id UNIQUE (global_student_id),
    CONSTRAINT UK_student_email UNIQUE (email),
    CONSTRAINT CHK_student_global_id_format CHECK (global_student_id REGEXP '^STU-[0-9]{4}-[0-9]{6}$'),
    CONSTRAINT FK_student_program FOREIGN KEY (program_id) REFERENCES program(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Student master records (PRD §6.1, §11.2)';

CREATE INDEX idx_student_program ON student(program_id);
CREATE INDEX idx_student_batch ON student(batch_year);

-- 5. role
CREATE TABLE role (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    CONSTRAINT PK_role PRIMARY KEY (id),
    CONSTRAINT UK_role_name UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='RBAC roles (Admin, Faculty, Student) (PRD §3, §10, §11.2)';

-- 6. permission_set
CREATE TABLE permission_set (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    CONSTRAINT PK_permission_set PRIMARY KEY (id),
    CONSTRAINT UK_permission_set_name UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Admin permission scopes (PRD §3, §11.2)';

-- 7. user_account
CREATE TABLE user_account (
    id BIGINT NOT NULL AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE', 'LOCKED') NOT NULL DEFAULT 'ACTIVE',
    last_login DATETIME NULL,
    student_id BIGINT NULL,
    employee_id BIGINT NULL,
    CONSTRAINT PK_user_account PRIMARY KEY (id),
    CONSTRAINT UK_user_account_username UNIQUE (username),
    CONSTRAINT FK_user_account_student FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE RESTRICT
    -- fk_user_employee deferred to 90_deferred_foreign_keys.sql
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Authentication credentials and personal record links (PRD §10, §11.2)';

CREATE INDEX idx_user_account_student ON user_account(student_id);
CREATE INDEX idx_user_account_employee ON user_account(employee_id);

-- 8. role_assignment
CREATE TABLE role_assignment (
    user_id BIGINT NOT NULL,
    role_id INT NOT NULL,
    CONSTRAINT PK_role_assignment PRIMARY KEY (user_id, role_id),
    CONSTRAINT FK_role_assignment_user FOREIGN KEY (user_id) REFERENCES user_account(id) ON DELETE CASCADE,
    CONSTRAINT FK_role_assignment_role FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Maps users to roles (PRD §10, §11.2)';

CREATE INDEX idx_role_assignment_role ON role_assignment(role_id);

-- 9. admin_permission_set_assignment
CREATE TABLE admin_permission_set_assignment (
    user_id BIGINT NOT NULL,
    permission_set_id INT NOT NULL,
    CONSTRAINT PK_admin_perm_set PRIMARY KEY (user_id, permission_set_id),
    CONSTRAINT FK_admin_perm_user FOREIGN KEY (user_id) REFERENCES user_account(id) ON DELETE CASCADE,
    CONSTRAINT FK_admin_perm_set FOREIGN KEY (permission_set_id) REFERENCES permission_set(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Maps admin users to permission sets (PRD §3, §11.2)';

CREATE INDEX idx_admin_perm_set_id ON admin_permission_set_assignment(permission_set_id);

-- 10. refresh_token
CREATE TABLE refresh_token (
    token_hash VARCHAR(255) NOT NULL,
    user_id BIGINT NOT NULL,
    expires_at DATETIME NOT NULL,
    is_revoked TINYINT(1) NOT NULL DEFAULT 0,
    CONSTRAINT PK_refresh_token PRIMARY KEY (token_hash),
    CONSTRAINT FK_refresh_token_user FOREIGN KEY (user_id) REFERENCES user_account(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tracks active and revoked refresh tokens (PRD §10)';

CREATE INDEX idx_refresh_token_user ON refresh_token(user_id);

-- 11. login_attempt
CREATE TABLE login_attempt (
    id BIGINT NOT NULL AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    attempt_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    success TINYINT(1) NOT NULL,
    CONSTRAINT PK_login_attempt PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Limits login attempts (PRD §10)';

CREATE INDEX idx_login_attempt_username_time ON login_attempt(username, attempt_time);

-- 12. general_audit_log
CREATE TABLE general_audit_log (
    id BIGINT NOT NULL AUTO_INCREMENT,
    actor_user_id BIGINT NULL,
    action VARCHAR(50) NOT NULL,
    entity_name VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    before_state JSON NULL,
    after_state JSON NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_general_audit_log PRIMARY KEY (id),
    CONSTRAINT FK_audit_actor FOREIGN KEY (actor_user_id) REFERENCES user_account(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='General system audit log (PRD §6.7, §11.2)';

CREATE INDEX idx_audit_actor ON general_audit_log(actor_user_id);
CREATE INDEX idx_audit_entity ON general_audit_log(entity_name, entity_id);
CREATE INDEX idx_audit_timestamp ON general_audit_log(timestamp);
