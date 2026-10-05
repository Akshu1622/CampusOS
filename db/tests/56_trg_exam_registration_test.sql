
SELECT 'Testing trg_exam_registration' AS Test;

-- Make an exam available
UPDATE exam SET reg_start_date = '2020-01-01', reg_end_date = '2030-01-01' WHERE id = 1;

DELIMITER //
CREATE PROCEDURE test_exam_reg_not_enrolled()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 @errno = MYSQL_ERRNO, @msg = MESSAGE_TEXT;
        SELECT CONCAT('Caught error ', @errno, ': ', @msg) AS Error_Message;
    END;
    INSERT INTO exam_registration (exam_id, student_id, status) VALUES (1, 9999, 'REGISTERED');
END //
DELIMITER ;

CALL test_exam_reg_not_enrolled();

DELIMITER //
CREATE PROCEDURE test_exam_reg_closed()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 @errno = MYSQL_ERRNO, @msg = MESSAGE_TEXT;
        SELECT CONCAT('Caught error ', @errno, ': ', @msg) AS Error_Message;
    END;
    -- Update exam window to past
    UPDATE exam SET reg_start_date = '2020-01-01', reg_end_date = '2020-12-31' WHERE id = 2;
    INSERT INTO exam_registration (exam_id, student_id, status) VALUES (2, 1, 'REGISTERED');
END //
DELIMITER ;

CALL test_exam_reg_closed();
