
SELECT 'Testing sp_monthly_payroll' AS Test;
CALL sp_monthly_payroll('2023-11', 'DRAFT', 1);
SELECT status FROM payroll_run WHERE payroll_month = '2023-11';
CALL sp_monthly_payroll('2023-11', 'FINALIZE', 1);
SELECT status FROM payroll_run WHERE payroll_month = '2023-11';

DELIMITER //
CREATE PROCEDURE test_payroll_finalized()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 @errno = MYSQL_ERRNO, @msg = MESSAGE_TEXT;
        SELECT CONCAT('Caught error ', @errno, ': ', @msg) AS Error_Message;
    END;
    CALL sp_monthly_payroll('2023-11', 'DRAFT', 1);
END //
DELIMITER ;

CALL test_payroll_finalized();
