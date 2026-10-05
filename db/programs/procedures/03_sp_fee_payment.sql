-- db/programs/procedures/03_sp_fee_payment.sql
-- Name: sp_fee_payment
-- Purpose: Process a fee payment, allocate to dues (with late fees), and generate a receipt.
-- Exact Signature: sp_fee_payment(IN p_student_id BIGINT, IN p_due_ids JSON, IN p_amount DECIMAL(10,2), IN p_mode VARCHAR(20), IN p_reference_no VARCHAR(50), IN p_acting_user BIGINT)
-- Algorithm:
--   1. Start transaction.
--   2. Identify target dues (either from JSON array or all pending/partial for the student).
--   3. Lock these dues in student_fee FOR UPDATE.
--   4. Calculate late fee per due using fn_late_fee_penalty(1, due_date, CURDATE()).
--   5. Calculate total_balance (principal + late_fee) per due.
--   6. If specific dues provided and already settled, signal 54002.
--   7. If p_amount > SUM(total_balance), signal 54001.
--   8. Create payment record.
--   9. Iterate target dues (oldest due_date first): allocate to late fee first, then principal. Update student_fee amount_paid and status. Insert payment_allocation. Stop when amount is exhausted.
--   10. Generate receipt and return its details.
-- Errors Raised: 
--   - 54001 PAYMENT_EXCEEDS_BALANCE
--   - 54002 DUE_ALREADY_SETTLED
-- Transaction/Locking: Full transaction. Locks student_fee rows FOR UPDATE to prevent concurrent payments for the same due.
-- Idempotency/Edge cases:
--   - Overpayment rejected to avoid storing credit balance (as per standard ERP rules without wallet system).
--   - Late fees prioritized during allocation.

DELIMITER //

CREATE PROCEDURE sp_fee_payment(
    IN p_student_id BIGINT,
    IN p_due_ids JSON,
    IN p_amount DECIMAL(10,2),
    IN p_mode VARCHAR(20),
    IN p_reference_no VARCHAR(50),
    IN p_acting_user BIGINT
)
BEGIN
    DECLARE v_payment_id BIGINT;
    DECLARE v_receipt_no VARCHAR(20);
    
    DECLARE v_total_balance DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_rem_amount DECIMAL(10,2);
    
    DECLARE v_done TINYINT(1) DEFAULT 0;
    DECLARE v_due_id BIGINT;
    DECLARE v_prin_bal DECIMAL(10,2);
    DECLARE v_late_fee DECIMAL(10,2);
    DECLARE v_due_total DECIMAL(10,2);
    
    DECLARE v_alloc_prin DECIMAL(10,2);
    DECLARE v_alloc_late DECIMAL(10,2);

    DECLARE cur_dues CURSOR FOR SELECT due_id, principal_balance, late_fee, total_balance FROM tmp_payment_dues ORDER BY due_date ASC;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

    START TRANSACTION;

    DROP TEMPORARY TABLE IF EXISTS tmp_payment_dues;
    CREATE TEMPORARY TABLE tmp_payment_dues (
        due_id BIGINT PRIMARY KEY,
        due_date DATE,
        principal_balance DECIMAL(10,2),
        late_fee DECIMAL(10,2),
        total_balance DECIMAL(10,2)
    );

    IF p_due_ids IS NOT NULL AND JSON_LENGTH(p_due_ids) > 0 THEN
        INSERT INTO tmp_payment_dues (due_id, due_date, principal_balance, late_fee, total_balance)
        SELECT sf.id, c.due_date, (sf.amount_due - sf.amount_paid), 
               GREATEST(0, fn_late_fee_penalty(IFNULL((SELECT MIN(id) FROM late_fee_rule), 1), c.due_date, CURDATE()) - IFNULL((SELECT SUM(allocated_late_fee) FROM payment_allocation WHERE student_fee_id = sf.id), 0)),
               (sf.amount_due - sf.amount_paid) + GREATEST(0, fn_late_fee_penalty(IFNULL((SELECT MIN(id) FROM late_fee_rule), 1), c.due_date, CURDATE()) - IFNULL((SELECT SUM(allocated_late_fee) FROM payment_allocation WHERE student_fee_id = sf.id), 0))
        FROM student_fee sf
        JOIN fee_component c ON sf.component_id = c.id
        WHERE sf.student_id = p_student_id 
          AND sf.id IN (SELECT id FROM JSON_TABLE(p_due_ids, '$[*]' COLUMNS (id BIGINT PATH '$')) jt)
        FOR UPDATE;
        
        -- Check if already settled
        IF (SELECT COUNT(*) FROM tmp_payment_dues WHERE total_balance <= 0) > 0 THEN
            SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 54002, MESSAGE_TEXT = 'The fee due is already fully settled.';
        END IF;
    ELSE
        INSERT INTO tmp_payment_dues (due_id, due_date, principal_balance, late_fee, total_balance)
        SELECT sf.id, c.due_date, (sf.amount_due - sf.amount_paid), 
               GREATEST(0, fn_late_fee_penalty(IFNULL((SELECT MIN(id) FROM late_fee_rule), 1), c.due_date, CURDATE()) - IFNULL((SELECT SUM(allocated_late_fee) FROM payment_allocation WHERE student_fee_id = sf.id), 0)),
               (sf.amount_due - sf.amount_paid) + GREATEST(0, fn_late_fee_penalty(IFNULL((SELECT MIN(id) FROM late_fee_rule), 1), c.due_date, CURDATE()) - IFNULL((SELECT SUM(allocated_late_fee) FROM payment_allocation WHERE student_fee_id = sf.id), 0))
        FROM student_fee sf
        JOIN fee_component c ON sf.component_id = c.id
        WHERE sf.student_id = p_student_id AND sf.status != 'PAID'
        FOR UPDATE;
    END IF;

    SELECT IFNULL(SUM(total_balance), 0.00) INTO v_total_balance FROM tmp_payment_dues;

    IF p_amount > v_total_balance THEN
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 54001, MESSAGE_TEXT = 'The payment amount exceeds the outstanding balance.';
    END IF;

    -- Create Payment
    INSERT INTO payment (student_id, amount, payment_mode, reference_no, payment_date, status)
    VALUES (p_student_id, p_amount, p_mode, p_reference_no, CURRENT_TIMESTAMP, 'SUCCESS');
    
    SET v_payment_id = LAST_INSERT_ID();
    SET v_rem_amount = p_amount;

    -- Allocate
    OPEN cur_dues;
    alloc_loop: LOOP
        FETCH cur_dues INTO v_due_id, v_prin_bal, v_late_fee, v_due_total;
        IF v_done OR v_rem_amount <= 0 THEN LEAVE alloc_loop; END IF;

        IF v_rem_amount >= v_due_total THEN
            SET v_alloc_prin = v_prin_bal;
            SET v_alloc_late = v_late_fee;
            SET v_rem_amount = v_rem_amount - v_due_total;
        ELSE
            IF v_rem_amount >= v_late_fee THEN
                SET v_alloc_late = v_late_fee;
                SET v_alloc_prin = v_rem_amount - v_late_fee;
                SET v_rem_amount = 0;
            ELSE
                SET v_alloc_late = v_rem_amount;
                SET v_alloc_prin = 0;
                SET v_rem_amount = 0;
            END IF;
        END IF;

        INSERT INTO payment_allocation (payment_id, student_fee_id, allocated_principal, allocated_late_fee)
        VALUES (v_payment_id, v_due_id, v_alloc_prin, v_alloc_late);

        UPDATE student_fee 
        SET amount_paid = amount_paid + v_alloc_prin,
            status = CASE WHEN (amount_paid + v_alloc_prin) >= amount_due THEN 'PAID' ELSE 'PARTIAL' END
        WHERE id = v_due_id;

    END LOOP;
    CLOSE cur_dues;

    -- Create Receipt
    SET v_receipt_no = CONCAT('RCP-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 100000), 5, '0'));
    INSERT INTO receipt (receipt_number, payment_id, generated_at)
    VALUES (v_receipt_no, v_payment_id, CURRENT_TIMESTAMP);

    COMMIT;

    SELECT r.id AS receipt_id, r.receipt_number, r.generated_at, p.amount, p.payment_mode, p.reference_no
    FROM receipt r
    JOIN payment p ON r.payment_id = p.id
    WHERE p.id = v_payment_id;

    DROP TEMPORARY TABLE IF EXISTS tmp_payment_dues;
END //

DELIMITER ;
