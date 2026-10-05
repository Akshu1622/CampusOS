-- db/schema/03_attendance_exams.sql
-- M3 Attendance, Exams, and Results Module

-- 1. attendance_session
CREATE TABLE attendance_session (
    id BIGINT NOT NULL AUTO_INCREMENT,
    offering_id BIGINT NOT NULL,
    session_date DATE NOT NULL,
    slot VARCHAR(50) NOT NULL,
    marked_by BIGINT NOT NULL,
    marked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_attendance_session PRIMARY KEY (id),
    CONSTRAINT UK_offering_date_slot UNIQUE (offering_id, session_date, slot),
    CONSTRAINT FK_att_session_offering FOREIGN KEY (offering_id) REFERENCES course_offering(id) ON DELETE RESTRICT,
    CONSTRAINT FK_att_session_user FOREIGN KEY (marked_by) REFERENCES user_account(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Session for which attendance is marked (PRD §6.3, §11.2)';

CREATE INDEX idx_att_marked_by ON attendance_session(marked_by);

-- 2. attendance_record
CREATE TABLE attendance_record (
    session_id BIGINT NOT NULL,
    enrollment_id BIGINT NOT NULL,
    status ENUM('PRESENT', 'ABSENT') NOT NULL DEFAULT 'PRESENT',
    CONSTRAINT PK_attendance_record PRIMARY KEY (session_id, enrollment_id),
    CONSTRAINT FK_att_record_session FOREIGN KEY (session_id) REFERENCES attendance_session(id) ON DELETE CASCADE,
    CONSTRAINT FK_att_record_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollment(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Student attendance per session (PRD §6.3, §11.2)';

CREATE INDEX idx_att_record_enrollment ON attendance_record(enrollment_id);

-- 3. exam
CREATE TABLE exam (
    id BIGINT NOT NULL AUTO_INCREMENT,
    offering_id BIGINT NOT NULL,
    exam_type VARCHAR(50) NOT NULL,
    exam_date DATE NOT NULL,
    max_marks DECIMAL(5,2) NOT NULL,
    reg_start_date DATETIME NOT NULL,
    reg_end_date DATETIME NOT NULL,
    CONSTRAINT PK_exam PRIMARY KEY (id),
    CONSTRAINT UK_offering_type UNIQUE (offering_id, exam_type),
    CONSTRAINT CHK_exam_marks CHECK (max_marks > 0),
    CONSTRAINT CHK_exam_reg_dates CHECK (reg_end_date > reg_start_date),
    CONSTRAINT FK_exam_offering FOREIGN KEY (offering_id) REFERENCES course_offering(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Examination events (PRD §6.3, §11.2)';

-- 4. exam_registration
CREATE TABLE exam_registration (
    id BIGINT NOT NULL AUTO_INCREMENT,
    exam_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    status ENUM('REGISTERED', 'CANCELLED') NOT NULL DEFAULT 'REGISTERED',
    registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_exam_registration PRIMARY KEY (id),
    CONSTRAINT UK_exam_student UNIQUE (exam_id, student_id),
    CONSTRAINT FK_exam_reg_exam FOREIGN KEY (exam_id) REFERENCES exam(id) ON DELETE RESTRICT,
    CONSTRAINT FK_exam_reg_student FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Student registration for an exam (PRD §6.3, §11.2)';

CREATE INDEX idx_exam_reg_student ON exam_registration(student_id);

-- 5. exam_marks_result
CREATE TABLE exam_marks_result (
    registration_id BIGINT NOT NULL,
    marks DECIMAL(5,2) NOT NULL,
    grade VARCHAR(2) NULL,
    grade_points DECIMAL(4,2) NULL,
    is_published TINYINT(1) NOT NULL DEFAULT 0,
    CONSTRAINT PK_exam_marks_result PRIMARY KEY (registration_id),
    CONSTRAINT CHK_marks CHECK (marks >= 0),
    CONSTRAINT CHK_grade_points CHECK (grade_points >= 0),
    CONSTRAINT FK_exam_marks_reg FOREIGN KEY (registration_id) REFERENCES exam_registration(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Marks and grades for an exam registration (PRD §6.3, §11.2)';

-- 6. grade_scale
CREATE TABLE grade_scale (
    id INT NOT NULL AUTO_INCREMENT,
    grade VARCHAR(2) NOT NULL,
    min_marks_pct DECIMAL(5,2) NOT NULL,
    max_marks_pct DECIMAL(5,2) NOT NULL,
    grade_points DECIMAL(4,2) NOT NULL,
    CONSTRAINT PK_grade_scale PRIMARY KEY (id),
    CONSTRAINT UK_grade UNIQUE (grade),
    CONSTRAINT CHK_grade_min CHECK (min_marks_pct >= 0),
    CONSTRAINT CHK_grade_max CHECK (max_marks_pct <= 100),
    CONSTRAINT CHK_grade_points_val CHECK (grade_points >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Grade scale configuration (PRD §6.3, §11.2)';

-- 7. semester_result
CREATE TABLE semester_result (
    id BIGINT NOT NULL AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    term_id INT NOT NULL,
    total_credits INT NOT NULL,
    sgpa DECIMAL(4,2) NOT NULL,
    cgpa DECIMAL(4,2) NOT NULL,
    computed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_semester_result PRIMARY KEY (id),
    CONSTRAINT UK_student_term UNIQUE (student_id, term_id),
    CONSTRAINT CHK_sem_result_credits CHECK (total_credits >= 0),
    CONSTRAINT CHK_sem_result_sgpa CHECK (sgpa >= 0),
    CONSTRAINT CHK_sem_result_cgpa CHECK (cgpa >= 0),
    CONSTRAINT FK_sem_result_student FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE RESTRICT,
    CONSTRAINT FK_sem_result_term FOREIGN KEY (term_id) REFERENCES academic_term(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Computed SGPA/CGPA snapshot per term (PRD §6.3, §11.2)';

CREATE INDEX idx_sem_result_term ON semester_result(term_id);
