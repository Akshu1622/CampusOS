-- db/programs/functions/02_fn_late_fee_penalty.sql
-- Name: fn_late_fee_penalty
-- Purpose: Calculate late fee penalty for an overdue fee based on a specified rule.
-- Exact Signature: fn_late_fee_penalty(p_rule_id INT, p_due_date DATE, p_as_of_date DATE) RETURNS DECIMAL(10,2)
-- Algorithm:
--   1. Calculate days_late = DATEDIFF(p_as_of_date, p_due_date).
--   2. Apply a grace period of 7 days: if days_late <= 7, return 0.00.
--   3. Fetch the rule_type, penalty_amount, and max_penalty from late_fee_rule for p_rule_id.
--   4. If rule_type = 'FLAT', penalty = penalty_amount.
--   5. If rule_type = 'PER_DAY', penalty = penalty_amount * days_late.
--   6. If max_penalty is NOT NULL and penalty > max_penalty, cap at max_penalty.
--   7. Return penalty rounded to 2 decimal places.
-- Errors Raised: None
-- Transaction/Locking: Reads from committed data, no locks.
-- Idempotency/Edge cases:
--   - p_as_of_date before or on p_due_date returns 0.00.
--   - p_rule_id does not exist returns 0.00.
--   - Grace period exactly 7 days. On day 8, penalty starts calculating for all 8 days (or from day 1 depending on policy? Defined here as from day 1 of overdue, meaning day 8 pays for 8 days).

DELIMITER //

CREATE FUNCTION fn_late_fee_penalty(
    p_rule_id INT,
    p_due_date DATE,
    p_as_of_date DATE
) 
RETURNS DECIMAL(10,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_days_late INT DEFAULT 0;
    DECLARE v_rule_type VARCHAR(20);
    DECLARE v_penalty_amount DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_max_penalty DECIMAL(10,2);
    DECLARE v_penalty DECIMAL(10,2) DEFAULT 0.00;

    SET v_days_late = DATEDIFF(p_as_of_date, p_due_date);

    IF v_days_late <= 7 THEN
        RETURN 0.00;
    END IF;

    SELECT rule_type, penalty_amount, max_penalty
    INTO v_rule_type, v_penalty_amount, v_max_penalty
    FROM late_fee_rule
    WHERE id = p_rule_id;

    IF v_rule_type IS NULL THEN
        RETURN 0.00;
    END IF;

    IF v_rule_type = 'FLAT' THEN
        SET v_penalty = v_penalty_amount;
    ELSEIF v_rule_type = 'PER_DAY' THEN
        SET v_penalty = v_penalty_amount * v_days_late;
    END IF;

    IF v_max_penalty IS NOT NULL AND v_penalty > v_max_penalty THEN
        SET v_penalty = v_max_penalty;
    END IF;

    RETURN ROUND(v_penalty, 2);
END //

DELIMITER ;
