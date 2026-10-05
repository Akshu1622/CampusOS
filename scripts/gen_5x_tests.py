import os

tests = {
    "50_fn_student_cgpa_test.sql": """
SELECT 'Testing fn_student_cgpa' AS Test;
SELECT fn_student_cgpa(1) AS cgpa_student_1;
SELECT fn_student_cgpa(9999) AS cgpa_no_results;
""",

    "51_fn_late_fee_penalty_test.sql": """
SELECT 'Testing fn_late_fee_penalty' AS Test;
-- Rule 1: FLAT 500, Rule 2: PER_DAY 50 max 1000. 
-- Seed data might not have rule 2. Let's insert rules.
INSERT IGNORE INTO late_fee_rule (id, rule_type, penalty_amount, max_penalty) VALUES (1, 'FLAT', 500.00, NULL);
INSERT IGNORE INTO late_fee_rule (id, rule_type, penalty_amount, max_penalty) VALUES (2, 'PER_DAY', 50.00, 1000.00);

SELECT fn_late_fee_penalty(1, '2023-10-01', '2023-10-05') AS penalty_grace;
SELECT fn_late_fee_penalty(1, '2023-10-01', '2023-10-11') AS penalty_flat;
SELECT fn_late_fee_penalty(2, '2023-10-01', '2023-10-11') AS penalty_per_day;
SELECT fn_late_fee_penalty(999, '2023-10-01', '2023-10-11') AS penalty_invalid_rule;
""",

    "52_fn_leave_balance_test.sql": """
SELECT 'Testing fn_leave_balance' AS Test;
-- Insert a dummy leave entitlement if missing
INSERT IGNORE INTO leave_entitlement (leave_type_id, emp_type, annual_quota, carry_forward) VALUES (1, 'FACULTY', 12, 0);
SELECT fn_leave_balance(1, 1, YEAR(CURDATE())) AS leave_balance_emp_1_type_1;
SELECT fn_leave_balance(999, 1, YEAR(CURDATE())) AS invalid_emp;
""",

    "53_fn_attendance_pct_test.sql": """
SELECT 'Testing fn_attendance_pct' AS Test;
SELECT fn_attendance_pct(1, 1) AS att_pct_stu_1_off_1;
SELECT fn_attendance_pct(999, 1) AS att_pct_not_enrolled;
""",

    "54_trg_hostel_allocation_test.sql": """
SELECT 'Testing trg_hostel_allocation' AS Test;

-- Ensure beds available
UPDATE room SET available_beds = bed_capacity WHERE id = 1;
SELECT available_beds FROM room WHERE id = 1;

-- Success: Insert
INSERT INTO hostel_allocation (student_id, room_id, from_date, status) VALUES (50, 1, CURDATE(), 'ACTIVE');
SELECT available_beds AS beds_after_insert FROM room WHERE id = 1;

DELIMITER //
CREATE PROCEDURE test_alloc_duplicate()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 @errno = MYSQL_ERRNO, @msg = MESSAGE_TEXT;
        SELECT CONCAT('Caught error ', @errno, ': ', @msg) AS Error_Message;
    END;
    -- Try to insert again for same student
    INSERT INTO hostel_allocation (student_id, room_id, from_date, status) VALUES (50, 2, CURDATE(), 'ACTIVE');
END //
DELIMITER ;

CALL test_alloc_duplicate();

-- Success: Update Room
UPDATE hostel_allocation SET room_id = 2 WHERE student_id = 50 AND status = 'ACTIVE';
SELECT available_beds AS beds_room_1_after_change FROM room WHERE id = 1;
SELECT available_beds AS beds_room_2_after_change FROM room WHERE id = 2;

-- Success: Vacate
UPDATE hostel_allocation SET status = 'VACATED' WHERE student_id = 50 AND status = 'ACTIVE';
SELECT available_beds AS beds_room_2_after_vacate FROM room WHERE id = 2;
""",

    "55_trg_fee_audit_test.sql": """
SELECT 'Testing trg_fee_audit' AS Test;
SET @acting_user_id = 99;
UPDATE fee_structure SET structure_name = 'Audit Test Structure' WHERE id = 1;
SELECT entity_name, entity_id, old_value, new_value, changed_by FROM fee_audit_log WHERE entity_name = 'fee_structure' ORDER BY id DESC LIMIT 1;
""",

    "56_trg_exam_registration_test.sql": """
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
""",

    "57_sp_bulk_enrollment_test.sql": """
SELECT 'Testing sp_bulk_enrollment' AS Test;
-- Insert valid enrollment
CALL sp_bulk_enrollment('[{"student_id": 1, "offering_id": 1}]', 'SKIP_INVALID', 0, 1);
SELECT status, message FROM bulk_enrollment_batch_log ORDER BY id DESC LIMIT 1;
""",

    "58_sp_monthly_payroll_test.sql": """
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
""",

    "59_sp_fee_payment_test.sql": """
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
"""
}

import os
os.makedirs('db/tests', exist_ok=True)
for name, content in tests.items():
    with open(f"db/tests/{name}", "w") as f:
        f.write(content)
