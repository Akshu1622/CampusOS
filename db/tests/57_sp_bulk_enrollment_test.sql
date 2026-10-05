
SELECT 'Testing sp_bulk_enrollment' AS Test;
-- Insert valid enrollment
CALL sp_bulk_enrollment('[{"student_id": 1, "offering_id": 1}]', 'SKIP_INVALID', 0, 1);
SELECT status, message FROM bulk_enrollment_batch_log ORDER BY id DESC LIMIT 1;
