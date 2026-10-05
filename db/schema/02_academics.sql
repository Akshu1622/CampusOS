-- db/schema/02_academics.sql
-- M2 Academics and Enrollment Module

-- 1. course
CREATE TABLE course (
    id INT NOT NULL AUTO_INCREMENT,
    code VARCHAR(10) NOT NULL,
    title VARCHAR(100) NOT NULL,
    credits INT NOT NULL,
    department_id INT NOT NULL,
    status ENUM('ACTIVE', 'RETIRED') NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT PK_course PRIMARY KEY (id),
    CONSTRAINT UK_course_code UNIQUE (code),
    CONSTRAINT CHK_course_code_format CHECK (code REGEXP '^[A-Z]{2,4}[0-9]{3,4}$'),
    CONSTRAINT CHK_course_credits CHECK (credits >= 0),
    CONSTRAINT FK_course_department FOREIGN KEY (department_id) REFERENCES department(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Course catalog (PRD §6.2, §11.2)';

CREATE INDEX idx_course_department ON course(department_id);

-- 2. curriculum_mapping
CREATE TABLE curriculum_mapping (
    id INT NOT NULL AUTO_INCREMENT,
    program_id INT NOT NULL,
    semester INT NOT NULL,
    course_id INT NOT NULL,
    type ENUM('CORE', 'ELECTIVE') NOT NULL DEFAULT 'CORE',
    CONSTRAINT PK_curriculum_mapping PRIMARY KEY (id),
    CONSTRAINT UK_prog_sem_course UNIQUE (program_id, semester, course_id),
    CONSTRAINT CHK_curr_map_sem CHECK (semester > 0),
    CONSTRAINT FK_curr_map_program FOREIGN KEY (program_id) REFERENCES program(id) ON DELETE RESTRICT,
    CONSTRAINT FK_curr_map_course FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Map courses to program semesters (PRD §6.2, §11.2)';

CREATE INDEX idx_curr_map_course ON curriculum_mapping(course_id);

-- 3. course_offering
CREATE TABLE course_offering (
    id BIGINT NOT NULL AUTO_INCREMENT,
    course_id INT NOT NULL,
    term_id INT NOT NULL,
    faculty_id BIGINT NOT NULL,
    section VARCHAR(10) NOT NULL,
    capacity INT NOT NULL,
    CONSTRAINT PK_course_offering PRIMARY KEY (id),
    CONSTRAINT UK_course_term_sec UNIQUE (course_id, term_id, section),
    CONSTRAINT CHK_offering_capacity CHECK (capacity > 0),
    CONSTRAINT FK_offering_course FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE RESTRICT,
    CONSTRAINT FK_offering_term FOREIGN KEY (term_id) REFERENCES academic_term(id) ON DELETE RESTRICT
    -- fk_offering_faculty deferred to 90_deferred_foreign_keys.sql
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Instance of a course in a term (PRD §6.2, §11.2)';

CREATE INDEX idx_offering_term ON course_offering(term_id);
CREATE INDEX idx_offering_faculty ON course_offering(faculty_id);

-- 4. enrollment
CREATE TABLE enrollment (
    id BIGINT NOT NULL AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    offering_id BIGINT NOT NULL,
    status ENUM('ENROLLED', 'DROPPED', 'WITHDRAWN') NOT NULL DEFAULT 'ENROLLED',
    enrolled_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active_unique VARCHAR(255) GENERATED ALWAYS AS (IF(status = 'ENROLLED', CONCAT(student_id, '-', offering_id), NULL)) VIRTUAL,
    CONSTRAINT PK_enrollment PRIMARY KEY (id),
    CONSTRAINT UK_student_offering UNIQUE (student_id, offering_id),
    CONSTRAINT UK_active_enrollment UNIQUE (active_unique),
    CONSTRAINT FK_enrollment_student FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE RESTRICT,
    CONSTRAINT FK_enrollment_offering FOREIGN KEY (offering_id) REFERENCES course_offering(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Student enrolled in an offering (PRD §6.2, §11.2)';

CREATE INDEX idx_enrollment_offering ON enrollment(offering_id);

-- 5. bulk_enrollment_batch
CREATE TABLE bulk_enrollment_batch (
    id BIGINT NOT NULL AUTO_INCREMENT,
    batch_id VARCHAR(17) NOT NULL,
    run_by BIGINT NOT NULL,
    run_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_processed INT NOT NULL DEFAULT 0,
    total_success INT NOT NULL DEFAULT 0,
    total_failed INT NOT NULL DEFAULT 0,
    CONSTRAINT PK_bulk_enrollment_batch PRIMARY KEY (id),
    CONSTRAINT UK_batch_id UNIQUE (batch_id),
    CONSTRAINT CHK_batch_id_format CHECK (batch_id REGEXP '^BAT-[0-9]{8}-[0-9]{4}$'),
    CONSTRAINT CHK_batch_processed CHECK (total_processed >= 0),
    CONSTRAINT CHK_batch_success CHECK (total_success >= 0),
    CONSTRAINT CHK_batch_failed CHECK (total_failed >= 0),
    CONSTRAINT FK_batch_run_by FOREIGN KEY (run_by) REFERENCES user_account(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Batch tracking for bulk enrollments (PRD §6.2, §11.2)';

CREATE INDEX idx_batch_run_by ON bulk_enrollment_batch(run_by);

-- 6. bulk_enrollment_batch_log
CREATE TABLE bulk_enrollment_batch_log (
    id BIGINT NOT NULL AUTO_INCREMENT,
    batch_id BIGINT NOT NULL,
    student_id BIGINT NULL,
    offering_id BIGINT NULL,
    status ENUM('SUCCESS', 'FAILED', 'SKIPPED') NOT NULL,
    message VARCHAR(255) NULL,
    CONSTRAINT PK_bulk_enrollment_batch_log PRIMARY KEY (id),
    CONSTRAINT FK_batch_log_batch FOREIGN KEY (batch_id) REFERENCES bulk_enrollment_batch(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Row-level outcome for bulk enrollments (PRD §6.2, §11.2)';

CREATE INDEX idx_batch_log_batch ON bulk_enrollment_batch_log(batch_id);
