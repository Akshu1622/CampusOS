-- db/programs/functions/03_fn_leave_balance.sql
-- Name: fn_leave_balance
-- Purpose: Calculate remaining leave balance for an employee for a specific leave type and year.
-- Exact Signature: fn_leave_balance(p_employee_id BIGINT, p_leave_type_id INT, p_year INT) RETURNS DECIMAL(5,1)
-- Algorithm:
--   1. Determine employee's emp_type (FACULTY or STAFF).
--   2. Lookup annual_quota and carry_forward flag from leave_entitlement.
--   3. Sum approved leave days (status='APPROVED') for the given year (based on start_date).
--   4. If carry_forward = 1, sum approved leave days for the previous year (year - 1). The carried amount is (annual_quota - previous_year_taken), minimum 0.
--   5. Calculate Balance = annual_quota + carried_amount - current_year_taken.
--   6. Pending leaves do not reduce balance (only APPROVED are subtracted). Half-days are naturally handled via the DECIMAL days column. Weekends are assumed excluded from the 'days' count before insertion.
-- Errors Raised: None
-- Transaction/Locking: Reads from committed data, no locks.
-- Idempotency/Edge cases:
--   - Employee or entitlement not found -> returns 0.0.
--   - No leaves taken -> taken = 0.
--   - Carry forward can at most double the quota.

DELIMITER //

CREATE FUNCTION fn_leave_balance(
    p_employee_id BIGINT,
    p_leave_type_id INT,
    p_year INT
) 
RETURNS DECIMAL(5,1)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_emp_type VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_quota INT DEFAULT 0;
    DECLARE v_cf_flag TINYINT(1) DEFAULT 0;
    
    DECLARE v_taken_curr DECIMAL(5,1) DEFAULT 0.0;
    DECLARE v_taken_prev DECIMAL(5,1) DEFAULT 0.0;
    DECLARE v_carried DECIMAL(5,1) DEFAULT 0.0;
    DECLARE v_balance DECIMAL(5,1) DEFAULT 0.0;

    -- 1. Get employee type
    SELECT emp_type INTO v_emp_type
    FROM employee
    WHERE id = p_employee_id;

    IF v_emp_type IS NULL THEN
        RETURN 0.0;
    END IF;

    -- 2. Get entitlement
    SELECT annual_quota, carry_forward
    INTO v_quota, v_cf_flag
    FROM leave_entitlement
    WHERE leave_type_id = p_leave_type_id AND emp_type = v_emp_type;

    -- 3. Get taken current year
    SELECT IFNULL(SUM(days), 0.0)
    INTO v_taken_curr
    FROM leave_application
    WHERE employee_id = p_employee_id 
      AND leave_type_id = p_leave_type_id 
      AND status = 'APPROVED'
      AND YEAR(start_date) = p_year;

    -- 4. Get taken previous year and calculate carry forward
    IF v_cf_flag = 1 THEN
        SELECT IFNULL(SUM(days), 0.0)
        INTO v_taken_prev
        FROM leave_application
        WHERE employee_id = p_employee_id 
          AND leave_type_id = p_leave_type_id 
          AND status = 'APPROVED'
          AND YEAR(start_date) = p_year - 1;

        SET v_carried = v_quota - v_taken_prev;
        IF v_carried < 0.0 THEN
            SET v_carried = 0.0;
        END IF;
    END IF;

    -- 5. Final balance
    SET v_balance = v_quota + v_carried - v_taken_curr;
    
    RETURN v_balance;
END //

DELIMITER ;
