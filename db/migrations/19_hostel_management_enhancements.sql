-- db/migrations/19_hostel_management_enhancements.sql
-- Module 6: Hostel Management Enhancements & Integrity Extension

-- 1. Student Gender and Hostel Eligibility Extension
-- Stored procedure to safely add columns if they don't already exist
DROP PROCEDURE IF EXISTS sp_migrate_m6_columns;
DELIMITER //
CREATE PROCEDURE sp_migrate_m6_columns()
BEGIN
    -- Check student.gender
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'student' AND COLUMN_NAME = 'gender'
    ) THEN
        ALTER TABLE student ADD COLUMN gender ENUM('MALE', 'FEMALE', 'OTHER') NULL;
    END IF;

    -- Check student.is_hostel_eligible
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'student' AND COLUMN_NAME = 'is_hostel_eligible'
    ) THEN
        ALTER TABLE student ADD COLUMN is_hostel_eligible BOOLEAN NOT NULL DEFAULT TRUE;
    END IF;

    -- Check hostel_allocation.bed_number
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hostel_allocation' AND COLUMN_NAME = 'bed_number'
    ) THEN
        ALTER TABLE hostel_allocation ADD COLUMN bed_number VARCHAR(10) NULL;
    END IF;

    -- Check hostel_allocation.allocated_by
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hostel_allocation' AND COLUMN_NAME = 'allocated_by'
    ) THEN
        ALTER TABLE hostel_allocation ADD COLUMN allocated_by BIGINT NULL;
    END IF;

    -- Check hostel_allocation.created_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hostel_allocation' AND COLUMN_NAME = 'created_at'
    ) THEN
        ALTER TABLE hostel_allocation ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Check hostel_request.preferred_hostel_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hostel_request' AND COLUMN_NAME = 'preferred_hostel_id'
    ) THEN
        ALTER TABLE hostel_request ADD COLUMN preferred_hostel_id INT NULL;
    END IF;

    -- Check hostel_request.preferred_room_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hostel_request' AND COLUMN_NAME = 'preferred_room_id'
    ) THEN
        ALTER TABLE hostel_request ADD COLUMN preferred_room_id INT NULL;
    END IF;

    -- Check hostel_request.created_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hostel_request' AND COLUMN_NAME = 'created_at'
    ) THEN
        ALTER TABLE hostel_request ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Check hostel_request.updated_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hostel_request' AND COLUMN_NAME = 'updated_at'
    ) THEN
        ALTER TABLE hostel_request ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
    END IF;
END //
DELIMITER ;

CALL sp_migrate_m6_columns();
DROP PROCEDURE IF EXISTS sp_migrate_m6_columns;

-- 4. Hostel Complaints / Maintenance Table
CREATE TABLE IF NOT EXISTS hostel_complaint (
    id BIGINT NOT NULL AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    hostel_id INT NOT NULL,
    room_id INT NULL,
    category ENUM('ELECTRICAL', 'PLUMBING', 'CARPENTRY', 'CLEANING', 'INTERNET', 'OTHER') NOT NULL,
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY') NOT NULL DEFAULT 'MEDIUM',
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'SUBMITTED',
    assigned_to VARCHAR(100) NULL,
    resolution_notes TEXT NULL,
    resolved_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT PK_hostel_complaint PRIMARY KEY (id),
    CONSTRAINT FK_complaint_student FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE,
    CONSTRAINT FK_complaint_hostel FOREIGN KEY (hostel_id) REFERENCES hostel(id) ON DELETE CASCADE,
    CONSTRAINT FK_complaint_room FOREIGN KEY (room_id) REFERENCES room(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Hostel maintenance and student complaints';

-- 5. Hostel Room Inspection / Digital Handover Table
CREATE TABLE IF NOT EXISTS hostel_inspection (
    id BIGINT NOT NULL AUTO_INCREMENT,
    room_id INT NOT NULL,
    student_id BIGINT NULL,
    inspection_type ENUM('MOVE_IN', 'MOVE_OUT', 'ROUTINE', 'MAINTENANCE') NOT NULL,
    cleanliness_rating INT NOT NULL DEFAULT 5,
    fixtures_condition ENUM('EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED') NOT NULL DEFAULT 'GOOD',
    inventory_checked BOOLEAN NOT NULL DEFAULT TRUE,
    remarks TEXT NULL,
    inspector_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_hostel_inspection PRIMARY KEY (id),
    CONSTRAINT FK_inspection_room FOREIGN KEY (room_id) REFERENCES room(id) ON DELETE CASCADE,
    CONSTRAINT FK_inspection_student FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Room inspections and handover condition audit';

-- 6. Hostel Notices Table
CREATE TABLE IF NOT EXISTS hostel_notice (
    id INT NOT NULL AUTO_INCREMENT,
    hostel_id INT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    priority ENUM('NORMAL', 'IMPORTANT', 'URGENT') NOT NULL DEFAULT 'NORMAL',
    published_by BIGINT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_hostel_notice PRIMARY KEY (id),
    CONSTRAINT FK_notice_hostel FOREIGN KEY (hostel_id) REFERENCES hostel(id) ON DELETE CASCADE,
    CONSTRAINT FK_notice_publisher FOREIGN KEY (published_by) REFERENCES user_account(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Hostel notices and bulletins';

-- 7. Hostel Leave / Outpass Table
CREATE TABLE IF NOT EXISTS hostel_outpass (
    id BIGINT NOT NULL AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    from_datetime DATETIME NOT NULL,
    to_datetime DATETIME NOT NULL,
    destination VARCHAR(200) NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    decision_by BIGINT NULL,
    decision_remark TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_hostel_outpass PRIMARY KEY (id),
    CONSTRAINT FK_outpass_student FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE,
    CONSTRAINT FK_outpass_decision FOREIGN KEY (decision_by) REFERENCES user_account(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Hostel day and night outpass requests';

-- 8. Null-Safe Hostel Occupancy View
CREATE OR REPLACE VIEW vw_hostel_occupancy AS
SELECT
    h.id AS hostel_id,
    h.name AS hostel_name,
    h.gender_block,
    COALESCE(SUM(r.bed_capacity), 0) AS total_capacity,
    COALESCE(SUM(r.bed_capacity - r.available_beds), 0) AS occupied_beds,
    COALESCE(SUM(r.available_beds), 0) AS available_beds,
    ROUND((COALESCE(SUM(r.bed_capacity - r.available_beds), 0) * 100.0) / NULLIF(COALESCE(SUM(r.bed_capacity), 0), 0), 2) AS occupancy_pct
FROM hostel h
LEFT JOIN room r ON h.id = r.hostel_id
GROUP BY h.id, h.name, h.gender_block;

-- 9. Grants for app user
GRANT SELECT, INSERT, UPDATE, DELETE ON university_erp.hostel_complaint TO 'app'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON university_erp.hostel_inspection TO 'app'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON university_erp.hostel_notice TO 'app'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON university_erp.hostel_outpass TO 'app'@'%';
GRANT SELECT ON university_erp.vw_hostel_occupancy TO 'app'@'%';
FLUSH PRIVILEGES;
