
SELECT 'Testing sp_fee_payment' AS Test;
-- Seed data: Student 1 has dues. Let's make sure they have a pending due.
INSERT IGNORE INTO student_fee (student_id, component_id, amount_due, amount_paid, status) VALUES (2, 1, 1000.00, 0, 'PENDING');

-- Valid payment
CALL sp_fee_payment(2, NULL, 50.00, 'ONLINE', 'REF123', 1);
SELECT amount_paid, status FROM student_fee WHERE student_id = 2 AND component_id = 1;

DELIMITER //
CREATE PROCEDURE test_fee_overpayment()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 @errno = MYSQL_ERRNO, @msg = MESSAGE_TEXT;
        SELECT CONCAT('Caught error ', @errno, ': ', @msg) AS Error_Message;
    END;
    -- Try to pay 1,000,000
    CALL sp_fee_payment(2, NULL, 1000000.00, 'ONLINE', 'REF999', 1);
END //
DELIMITER ;

CALL test_fee_overpayment();
