-- db/schema/06_hostel.sql
-- M6 Hostel Module

-- 1. hostel
CREATE TABLE hostel (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    gender_block ENUM('MALE', 'FEMALE', 'COED') NOT NULL,
    total_capacity INT NOT NULL DEFAULT 0,
    CONSTRAINT PK_hostel PRIMARY KEY (id),
    CONSTRAINT UK_hostel_name UNIQUE (name),
    CONSTRAINT CHK_hostel_capacity CHECK (total_capacity >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Hostel building records (PRD §6.6, §11.2)';

-- 2. room
CREATE TABLE room (
    id INT NOT NULL AUTO_INCREMENT,
    hostel_id INT NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    bed_capacity INT NOT NULL,
    available_beds INT NOT NULL,
    CONSTRAINT PK_room PRIMARY KEY (id),
    CONSTRAINT UK_hostel_room UNIQUE (hostel_id, room_number),
    CONSTRAINT CHK_room_capacity CHECK (bed_capacity > 0),
    CONSTRAINT CHK_room_available CHECK (available_beds >= 0 AND available_beds <= bed_capacity),
    CONSTRAINT FK_room_hostel FOREIGN KEY (hostel_id) REFERENCES hostel(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Rooms within a hostel (PRD §6.6, §11.2)';

-- 3. hostel_allocation
CREATE TABLE hostel_allocation (
    id BIGINT NOT NULL AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    room_id INT NOT NULL,
    from_date DATE NOT NULL,
    to_date DATE NULL,
    status ENUM('ACTIVE', 'VACATED') NOT NULL DEFAULT 'ACTIVE',
    active_unique BIGINT GENERATED ALWAYS AS (IF(status = 'ACTIVE', student_id, NULL)) VIRTUAL,
    CONSTRAINT PK_hostel_allocation PRIMARY KEY (id),
    CONSTRAINT UK_active_allocation UNIQUE (active_unique),
    CONSTRAINT CHK_hostel_alloc_dates CHECK (to_date IS NULL OR to_date >= from_date),
    CONSTRAINT FK_hostel_alloc_student FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE RESTRICT,
    CONSTRAINT FK_hostel_alloc_room FOREIGN KEY (room_id) REFERENCES room(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Student allocation to a room (PRD §6.6, §11.2)';

CREATE INDEX idx_hostel_alloc_room ON hostel_allocation(room_id);

-- 4. hostel_request
CREATE TABLE hostel_request (
    id BIGINT NOT NULL AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    request_type ENUM('ALLOCATION', 'ROOM_CHANGE', 'VACATE') NOT NULL,
    details TEXT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    decision_by BIGINT NULL,
    remark TEXT NULL,
    CONSTRAINT PK_hostel_request PRIMARY KEY (id),
    CONSTRAINT FK_hostel_req_student FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE,
    CONSTRAINT FK_hostel_req_decision FOREIGN KEY (decision_by) REFERENCES user_account(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Student requests for hostel actions (PRD §6.6, §11.2)';

CREATE INDEX idx_hostel_req_student ON hostel_request(student_id);
CREATE INDEX idx_hostel_req_status ON hostel_request(status);
