-- db/programs/procedures/02_sp_monthly_payroll.sql
-- Name: sp_monthly_payroll
-- Purpose: Generate or recompute draft payslips for a month, or finalize the payroll run.
-- Exact Signature: sp_monthly_payroll(IN p_payroll_month VARCHAR(7), IN p_mode VARCHAR(20), IN p_acting_user BIGINT)
-- Algorithm:
--   DRAFT MODE:
--     1. Check if payroll_run exists. If FINALIZED, signal 55003.
--     2. If exists, delete existing payslips (cascades to lines). If not, create DRAFT run.
--     3. Loop over all ACTIVE employees.
--     4. Fetch salary_structure via designation.
--     5. Unpaid leave deduction: Sum of approved days where leave_type.is_paid = 0 for the given month. Deduction = (basic_pay / 30) * unpaid_days.
--     6. net = (basic_pay + allowances) - (standard_deductions + unpaid_deduction).
--     7. Insert payslip and 4 payslip_line rows.
--   FINALIZE MODE:
--     1. Check if payroll_run exists and is DRAFT. If FINALIZED, signal 55003.
--     2. Update status to 'FINALIZED'.
-- Errors Raised: 55003 PAYROLL_ALREADY_FINALIZED
-- Transaction/Locking: Full transaction. DRAFT mode locks the run row (if exists) FOR UPDATE to prevent concurrent drafts/finalizes.
-- Idempotency/Edge cases:
--   - DRAFT can be run multiple times safely (deletes old draft data).
--   - Employee missing salary structure is skipped.
--   - Unpaid deduction logic uses a standard 30-day denominator.

DELIMITER //

CREATE PROCEDURE sp_monthly_payroll(
    IN p_payroll_month VARCHAR(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_mode VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, -- 'DRAFT' or 'FINALIZE'
    IN p_acting_user BIGINT
)
BEGIN
    DECLARE v_run_id INT;
    DECLARE v_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    
    DECLARE v_done TINYINT(1) DEFAULT 0;
    DECLARE v_emp_id BIGINT;
    DECLARE v_desig_id INT;
    
    DECLARE v_basic DECIMAL(10,2);
    DECLARE v_allow DECIMAL(10,2);
    DECLARE v_deduct DECIMAL(10,2);
    
    DECLARE v_unpaid_days DECIMAL(4,1);
    DECLARE v_unpaid_deduct DECIMAL(10,2);
    
    DECLARE v_gross DECIMAL(10,2);
    DECLARE v_total_deduct DECIMAL(10,2);
    DECLARE v_net DECIMAL(10,2);
    
    DECLARE v_payslip_id BIGINT;

    DECLARE cur_emp CURSOR FOR SELECT id, designation_id FROM employee WHERE status = 'ACTIVE';
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

    START TRANSACTION;

    -- Check existing run
    SELECT id, status INTO v_run_id, v_status 
    FROM payroll_run 
    WHERE payroll_month = p_payroll_month 
    FOR UPDATE;

    IF v_status = 'FINALIZED' THEN
        SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 55003, MESSAGE_TEXT = 'The payroll month is already finalized and cannot be modified.';
    END IF;

    IF p_mode = 'FINALIZE' THEN
        IF v_run_id IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot finalize before running draft.';
        END IF;
        
        UPDATE payroll_run 
        SET status = 'FINALIZED', run_by = p_acting_user, run_date = CURRENT_TIMESTAMP 
        WHERE id = v_run_id;
        
    ELSEIF p_mode = 'DRAFT' THEN
        IF v_run_id IS NOT NULL THEN
            DELETE FROM payslip WHERE run_id = v_run_id;
        ELSE
            INSERT INTO payroll_run (payroll_month, run_date, status, run_by)
            VALUES (p_payroll_month, CURRENT_TIMESTAMP, 'DRAFT', p_acting_user);
            SET v_run_id = LAST_INSERT_ID();
        END IF;

        OPEN cur_emp;
        emp_loop: LOOP
            FETCH cur_emp INTO v_emp_id, v_desig_id;
            IF v_done THEN LEAVE emp_loop; END IF;
            
            -- Fetch salary struct
            SET v_basic = NULL;
            SELECT basic_pay, allowances, standard_deductions 
            INTO v_basic, v_allow, v_deduct
            FROM salary_structure 
            WHERE designation_id = v_desig_id;
            
            IF v_basic IS NULL THEN
                ITERATE emp_loop;
            END IF;
            
            -- Unpaid leave
            SELECT IFNULL(SUM(la.days), 0.0) INTO v_unpaid_days
            FROM leave_application la
            JOIN leave_type lt ON la.leave_type_id = lt.id
            WHERE la.employee_id = v_emp_id
              AND la.status = 'APPROVED'
              AND lt.is_paid = 0
              AND DATE_FORMAT(la.start_date, '%Y-%m') = p_payroll_month;
              
            SET v_unpaid_deduct = ROUND((v_basic / 30.0) * v_unpaid_days, 2);
            
            SET v_gross = v_basic + v_allow;
            SET v_total_deduct = v_deduct + v_unpaid_deduct;
            SET v_net = v_gross - v_total_deduct;
            
            INSERT INTO payslip (run_id, employee_id, gross_pay, total_deductions, net_pay, leave_days_deducted)
            VALUES (v_run_id, v_emp_id, v_gross, v_total_deduct, v_net, v_unpaid_days);
            
            SET v_payslip_id = LAST_INSERT_ID();
            
            -- Payslip Lines
            INSERT INTO payslip_line (payslip_id, component_type, description, amount) VALUES (v_payslip_id, 'EARNING', 'Basic Pay', v_basic);
            IF v_allow > 0 THEN
                INSERT INTO payslip_line (payslip_id, component_type, description, amount) VALUES (v_payslip_id, 'EARNING', 'Allowances', v_allow);
            END IF;
            IF v_deduct > 0 THEN
                INSERT INTO payslip_line (payslip_id, component_type, description, amount) VALUES (v_payslip_id, 'DEDUCTION', 'Standard Deductions', v_deduct);
            END IF;
            IF v_unpaid_deduct > 0 THEN
                INSERT INTO payslip_line (payslip_id, component_type, description, amount) VALUES (v_payslip_id, 'DEDUCTION', 'Unpaid Leave Deduction', v_unpaid_deduct);
            END IF;
            
        END LOOP;
        CLOSE cur_emp;
    END IF;

    COMMIT;
END //

DELIMITER ;
