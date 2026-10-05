-- 621_integrity_corruption_test.sql
-- Description: Deliberate corruption test to trigger FAILs in sp_run_integrity_checks

SELECT '--- Before Corruption ---' AS Stage;
CALL sp_run_integrity_checks();

-- Corrupt 1: Orphan enrollment (References non-existent student)
-- Disable foreign key checks temporarily to allow the orphan insert
SET FOREIGN_KEY_CHECKS=0;
INSERT INTO enrollment (student_id, offering_id, enrolled_date, status) VALUES (99999, 1, CURDATE(), 'ENROLLED');
SET @corrupted_enrollment_id = LAST_INSERT_ID();
SET FOREIGN_KEY_CHECKS=1;

-- Corrupt 2: Invalid student global ID format
-- Fetch the original ID to restore later
SELECT global_student_id INTO @orig_student_id FROM student WHERE id = 1;
ALTER TABLE student ALTER CHECK CHK_student_global_id_format NOT ENFORCED;
UPDATE student SET global_student_id = 'INVALID-TEST' WHERE id = 1;

-- Corrupt 3: Multiple current terms
-- Assume id 1 is current, let's make id 2 current as well
UPDATE academic_term SET is_current = 1 WHERE id = 2;

SELECT '--- During Corruption (Should show FAILs) ---' AS Stage;
CALL sp_run_integrity_checks();

-- Restore data
DELETE FROM enrollment WHERE id = @corrupted_enrollment_id;
UPDATE student SET global_student_id = @orig_student_id WHERE id = 1;
ALTER TABLE student ALTER CHECK CHK_student_global_id_format ENFORCED;
UPDATE academic_term SET is_current = 0 WHERE id = 2;

SELECT '--- After Restore ---' AS Stage;
CALL sp_run_integrity_checks();
