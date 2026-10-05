-- db/programs/functions/04_fn_attendance_pct.sql
-- Name: fn_attendance_pct
-- Purpose: Calculate attendance percentage for a student in a specific course offering.
-- Exact Signature: fn_attendance_pct(p_student_id BIGINT, p_offering_id BIGINT) RETURNS DECIMAL(5,2)
-- Algorithm:
--   1. Find the enrollment_id for the given student and offering. If none exists, return 0.00.
--   2. Count total sessions recorded in attendance_session for the offering.
--   3. If total_sessions = 0, return 100.00.
--   4. Count 'PRESENT' records in attendance_record for the enrollment_id.
--   5. Return (present_sessions / total_sessions) * 100.00.
-- Errors Raised: None
-- Transaction/Locking: Reads from committed data.
-- Idempotency/Edge cases:
--   - No sessions held: Returns 100.00. Justification: Students should not be penalized or blocked from exams if the faculty hasn't logged any sessions yet.
--   - Student not enrolled: Returns 0.00.

DELIMITER //

CREATE FUNCTION fn_attendance_pct(
    p_student_id BIGINT,
    p_offering_id BIGINT
) 
RETURNS DECIMAL(5,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_enrollment_id BIGINT;
    DECLARE v_total_sessions INT DEFAULT 0;
    DECLARE v_present_sessions INT DEFAULT 0;

    -- 1. Find enrollment
    SELECT id INTO v_enrollment_id
    FROM enrollment
    WHERE student_id = p_student_id AND offering_id = p_offering_id
    LIMIT 1;

    IF v_enrollment_id IS NULL THEN
        RETURN 0.00;
    END IF;

    -- 2. Count total sessions
    SELECT COUNT(*) INTO v_total_sessions
    FROM attendance_session
    WHERE offering_id = p_offering_id;

    -- 3. No sessions
    IF v_total_sessions = 0 THEN
        RETURN 100.00;
    END IF;

    -- 4. Count present
    SELECT COUNT(*) INTO v_present_sessions
    FROM attendance_record
    WHERE enrollment_id = v_enrollment_id AND status = 'PRESENT';

    -- 5. Calculate percentage
    RETURN ROUND((v_present_sessions / v_total_sessions) * 100.00, 2);
END //

DELIMITER ;
