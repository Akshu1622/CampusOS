-- db/programs/procedures/01_sp_bulk_enrollment.sql
-- Name: sp_bulk_enrollment
-- Purpose: Bulk enroll students from JSON array with policy and dry-run support.
-- Exact Signature: sp_bulk_enrollment(IN p_payload JSON, IN p_policy VARCHAR(20), IN p_dry_run TINYINT(1), IN p_acting_user BIGINT)
-- Algorithm:
--   1. Parse JSON into tmp_bulk_enroll.
--   2. Identify distinct offerings and lock them in order to avoid deadlock (SELECT FOR UPDATE).
--   3. Validate each row: student exists, offering exists, term is current, not duplicate, curriculum mapping valid.
--   4. Check capacity using live count + local loop additions.
--   5. If policy = 'ALL_OR_NOTHING' and any row failed, revert successful rows to 'SKIPPED'.
--   6. If dry_run = 0, insert enrollments and log into bulk_enrollment_batch and bulk_enrollment_batch_log.
--   7. Return totals and per-row results via SELECT.
-- Errors Raised: None (handles errors via result sets and status codes).
-- Transaction/Locking: Starts transaction, locks offerings (FOR UPDATE) in ID order, commits if not dry-run, rollbacks if dry-run.
-- Idempotency/Edge cases:
--   - Empty payload -> Does nothing safely.
--   - Concurrent identical batches -> First locks offerings, second waits. If first fills cap, second fails on cap.
--   - Dry-run -> Always rollbacks transaction but returns result sets.

DELIMITER //

CREATE PROCEDURE sp_bulk_enrollment(
    IN p_payload JSON,
    IN p_policy VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, -- 'ALL_OR_NOTHING' or 'SKIP_INVALID'
    IN p_dry_run TINYINT(1),
    IN p_acting_user BIGINT
)
BEGIN
    DECLARE v_batch_id VARCHAR(17) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_total_processed INT DEFAULT 0;
    DECLARE v_total_success INT DEFAULT 0;
    DECLARE v_total_failed INT DEFAULT 0;
    DECLARE v_any_failed TINYINT(1) DEFAULT 0;
    
    DECLARE v_done TINYINT(1) DEFAULT 0;
    DECLARE v_idx INT;
    DECLARE v_stu BIGINT;
    DECLARE v_off BIGINT;
    
    DECLARE v_stu_exists INT;
    DECLARE v_off_exists INT;
    DECLARE v_term_current INT;
    DECLARE v_dup INT;
    DECLARE v_curr_map INT;
    
    DECLARE v_cap INT;
    DECLARE v_enrolled INT;
    DECLARE v_local_added INT;
    
    DECLARE cur_rows CURSOR FOR SELECT idx, student_id, offering_id FROM tmp_bulk_enroll ORDER BY idx;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

    -- Generate Batch ID
    SET v_batch_id = CONCAT('BAT-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 10000), 4, '0'));

    START TRANSACTION;

    DROP TEMPORARY TABLE IF EXISTS tmp_bulk_enroll;
    CREATE TEMPORARY TABLE tmp_bulk_enroll (
        idx INT AUTO_INCREMENT PRIMARY KEY,
        student_id BIGINT,
        offering_id BIGINT,
        status VARCHAR(20) DEFAULT 'PENDING',
        message VARCHAR(255)
    );

    DROP TEMPORARY TABLE IF EXISTS tmp_off_lock;
    CREATE TEMPORARY TABLE tmp_off_lock (
        offering_id BIGINT PRIMARY KEY,
        capacity INT DEFAULT 0,
        current_enrolled INT DEFAULT 0,
        local_added INT DEFAULT 0
    );

    -- 1. Parse JSON
    INSERT INTO tmp_bulk_enroll (student_id, offering_id)
    SELECT student_id, offering_id
    FROM JSON_TABLE(
        p_payload,
        '$[*]' COLUMNS (
            student_id BIGINT PATH '$.student_id',
            offering_id BIGINT PATH '$.offering_id'
        )
    ) AS jt;

    SET v_total_processed = ROW_COUNT();

    -- 2. Lock Offerings
    INSERT INTO tmp_off_lock (offering_id)
    SELECT DISTINCT offering_id FROM tmp_bulk_enroll WHERE offering_id IS NOT NULL ORDER BY offering_id;

    BEGIN
        DECLARE v_lock_off BIGINT;
        DECLARE v_lock_done TINYINT(1) DEFAULT 0;
        DECLARE cur_locks CURSOR FOR SELECT offering_id FROM tmp_off_lock ORDER BY offering_id;
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_lock_done = 1;
        
        OPEN cur_locks;
        lock_loop: LOOP
            FETCH cur_locks INTO v_lock_off;
            IF v_lock_done THEN LEAVE lock_loop; END IF;
            
            -- Lock row and fetch cap
            SELECT capacity INTO v_cap FROM course_offering WHERE id = v_lock_off FOR UPDATE;
            SELECT COUNT(*) INTO v_enrolled FROM enrollment WHERE offering_id = v_lock_off;
            
            UPDATE tmp_off_lock 
            SET capacity = v_cap, current_enrolled = v_enrolled 
            WHERE offering_id = v_lock_off;
        END LOOP;
        CLOSE cur_locks;
    END;

    -- 3. Validate rows
    OPEN cur_rows;
    row_loop: LOOP
        FETCH cur_rows INTO v_idx, v_stu, v_off;
        IF v_done THEN LEAVE row_loop; END IF;

        -- Existence
        SELECT COUNT(*) INTO v_stu_exists FROM student WHERE id = v_stu;
        IF v_stu_exists = 0 THEN
            UPDATE tmp_bulk_enroll SET status = 'FAILED', message = 'Student not found' WHERE idx = v_idx;
            SET v_any_failed = 1;
            ITERATE row_loop;
        END IF;

        SELECT COUNT(*) INTO v_off_exists FROM course_offering WHERE id = v_off;
        IF v_off_exists = 0 THEN
            UPDATE tmp_bulk_enroll SET status = 'FAILED', message = 'Offering not found' WHERE idx = v_idx;
            SET v_any_failed = 1;
            ITERATE row_loop;
        END IF;

        -- Term Open
        SELECT t.is_current INTO v_term_current 
        FROM course_offering co JOIN academic_term t ON co.term_id = t.id 
        WHERE co.id = v_off;
        
        IF v_term_current = 0 THEN
            UPDATE tmp_bulk_enroll SET status = 'FAILED', message = 'Term is not open' WHERE idx = v_idx;
            SET v_any_failed = 1;
            ITERATE row_loop;
        END IF;

        -- Curriculum mapping
        SELECT COUNT(*) INTO v_curr_map 
        FROM curriculum_mapping cm 
        JOIN student s ON cm.program_id = s.program_id 
        JOIN course_offering co ON co.course_id = cm.course_id 
        WHERE s.id = v_stu AND co.id = v_off;

        IF v_curr_map = 0 THEN
            UPDATE tmp_bulk_enroll SET status = 'FAILED', message = 'Course not in student curriculum' WHERE idx = v_idx;
            SET v_any_failed = 1;
            ITERATE row_loop;
        END IF;

        -- Duplicate
        SELECT COUNT(*) INTO v_dup FROM enrollment WHERE student_id = v_stu AND offering_id = v_off;
        IF v_dup > 0 THEN
            UPDATE tmp_bulk_enroll SET status = 'FAILED', message = 'Duplicate enrollment' WHERE idx = v_idx;
            SET v_any_failed = 1;
            ITERATE row_loop;
        END IF;
        
        -- Local duplicate check (same payload)
        SELECT COUNT(*) INTO v_dup FROM tmp_bulk_enroll WHERE student_id = v_stu AND offering_id = v_off AND status = 'SUCCESS';
        IF v_dup > 0 THEN
            UPDATE tmp_bulk_enroll SET status = 'FAILED', message = 'Duplicate enrollment in batch' WHERE idx = v_idx;
            SET v_any_failed = 1;
            ITERATE row_loop;
        END IF;

        -- Capacity
        SELECT capacity, current_enrolled, local_added INTO v_cap, v_enrolled, v_local_added 
        FROM tmp_off_lock WHERE offering_id = v_off;

        IF (v_cap - v_enrolled - v_local_added) > 0 THEN
            UPDATE tmp_bulk_enroll SET status = 'SUCCESS', message = 'Enrolled' WHERE idx = v_idx;
            UPDATE tmp_off_lock SET local_added = local_added + 1 WHERE offering_id = v_off;
        ELSE
            UPDATE tmp_bulk_enroll SET status = 'FAILED', message = 'Capacity full' WHERE idx = v_idx;
            SET v_any_failed = 1;
        END IF;
    END LOOP;
    CLOSE cur_rows;

    -- 4. Policy Reversion
    IF p_policy = 'ALL_OR_NOTHING' AND v_any_failed = 1 THEN
        UPDATE tmp_bulk_enroll SET status = 'SKIPPED', message = 'Skipped due to ALL_OR_NOTHING policy' WHERE status = 'SUCCESS';
    END IF;

    -- 5. Commit/Execute
    IF p_dry_run = 0 THEN
        -- Insert actual enrollments
        INSERT INTO enrollment (student_id, offering_id, status)
        SELECT student_id, offering_id, 'ENROLLED'
        FROM tmp_bulk_enroll WHERE status = 'SUCCESS';

        -- Log batch
        SELECT COUNT(*) INTO v_total_success FROM tmp_bulk_enroll WHERE status = 'SUCCESS';
        SELECT COUNT(*) INTO v_total_failed FROM tmp_bulk_enroll WHERE status != 'SUCCESS';

        -- We must insert the batch_id and return the generated pk
        INSERT INTO bulk_enrollment_batch (batch_id, run_by, total_processed, total_success, total_failed)
        VALUES (v_batch_id, p_acting_user, v_total_processed, v_total_success, v_total_failed);
        
        SET @inserted_batch_pk = LAST_INSERT_ID();

        INSERT INTO bulk_enrollment_batch_log (batch_id, student_id, offering_id, status, message)
        SELECT @inserted_batch_pk, student_id, offering_id, status, message
        FROM tmp_bulk_enroll;

        COMMIT;
    ELSE
        -- Dry run rollbacks
        ROLLBACK;
    END IF;

    -- 6. Output Results
    SELECT COUNT(*) AS total_processed, 
           SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) AS total_success,
           SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) AS total_failed,
           SUM(CASE WHEN status = 'SKIPPED' THEN 1 ELSE 0 END) AS total_skipped
    FROM tmp_bulk_enroll;

    SELECT student_id, offering_id, status, message 
    FROM tmp_bulk_enroll 
    ORDER BY idx;

    DROP TEMPORARY TABLE IF EXISTS tmp_bulk_enroll;
    DROP TEMPORARY TABLE IF EXISTS tmp_off_lock;

END //

DELIMITER ;
