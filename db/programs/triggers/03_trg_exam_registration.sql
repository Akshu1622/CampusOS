-- db/programs/triggers/03_trg_exam_registration.sql
-- Name: trg_exam_registration_bi
-- Purpose: Validate exam registration before insert (attendance, enrollment, window, duplicate).
-- Exact Signature: BEFORE INSERT ON exam_registration
-- Algorithm:
--   1. Check if registration already exists for this exam and student. If so, signal 53006.
--   2. Fetch offering_id, reg_start_date, reg_end_date from exam.
--   3. Check if current time is within reg_start_date and reg_end_date. If not, signal 53002.
--   4. Check if student is actively enrolled (status = 'ENROLLED') in the course offering. If not, signal 53005.
--   5. Calculate attendance using fn_attendance_pct. If < 75.00, signal 53001 with actual percentage.
-- Errors Raised: 
--   - 53006 EXAM_DUPLICATE_REGISTRATION
--   - 53002 EXAM_REGISTRATION_CLOSED
--   - 53005 EXAM_STUDENT_NOT_ENROLLED
--   - 53001 ATTENDANCE_BELOW_THRESHOLD
-- Transaction/Locking: Reads from committed data, no extra locks.
-- Idempotency/Edge cases:
--   - Same student registers multiple times concurrently: DB unique constraint is backup.
--   - No sessions held -> fn_attendance_pct returns 100.00, allowing registration.

DELIMITER //

CREATE TRIGGER trg_exam_registration_bi
BEFORE INSERT ON exam_registration
FOR EACH ROW
BEGIN
    DECLARE v_dup_count INT DEFAULT 0;
    DECLARE v_offering_id BIGINT;
    DECLARE v_reg_start_date DATETIME;
    DECLARE v_reg_end_date DATETIME;
    DECLARE v_enrolled_count INT DEFAULT 0;
    DECLARE v_attendance_pct DECIMAL(5,2);
    DECLARE v_msg VARCHAR(255);

    -- 1. Check duplicate
    SELECT COUNT(*) INTO v_dup_count 
    FROM exam_registration 
    WHERE exam_id = NEW.exam_id AND student_id = NEW.student_id;
    
    IF v_dup_count > 0 THEN
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 53006, MESSAGE_TEXT = 'The student is already registered for this exam.';
    END IF;

    -- 2. Fetch exam info
    SELECT offering_id, reg_start_date, reg_end_date 
    INTO v_offering_id, v_reg_start_date, v_reg_end_date
    FROM exam 
    WHERE id = NEW.exam_id;

    -- 3. Check registration window
    IF CURRENT_TIMESTAMP() < v_reg_start_date OR CURRENT_TIMESTAMP() > v_reg_end_date THEN
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 53002, MESSAGE_TEXT = 'The exam registration window is closed.';
    END IF;

    -- 4. Check enrollment
    SELECT COUNT(*) INTO v_enrolled_count
    FROM enrollment
    WHERE student_id = NEW.student_id AND offering_id = v_offering_id AND status = 'ENROLLED';

    IF v_enrolled_count = 0 THEN
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 53005, MESSAGE_TEXT = 'The student is not actively enrolled in the course offering.';
    END IF;

    -- 5. Check attendance
    SET v_attendance_pct = fn_attendance_pct(NEW.student_id, v_offering_id);
    
    IF v_attendance_pct < 75.00 THEN
        SET v_msg = CONCAT('Registration blocked: attendance ', CAST(v_attendance_pct AS CHAR), '% is below 75%');
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 53001, MESSAGE_TEXT = v_msg;
    END IF;

END //

DELIMITER ;
