-- ==========================================================
-- Phase 1: Foundation Tests
-- ==========================================================

-- Test Validations
SELECT 
    IF(fn_is_valid_student_id('STU-2023-000123') = 1, 'PASS: STU valid', 'FAIL: STU valid') AS t1,
    IF(fn_is_valid_student_id('STU-23-000123') = 0, 'PASS: STU invalid', 'FAIL: STU invalid') AS t2,
    IF(fn_is_valid_employee_id('EMP-2023-0012') = 1, 'PASS: EMP valid', 'FAIL: EMP valid') AS t3,
    IF(fn_is_valid_course_code('CS101') = 1, 'PASS: CRS valid', 'FAIL: CRS valid') AS t4,
    IF(fn_is_valid_receipt_number('RCP-20231025-00001') = 1, 'PASS: RCP valid', 'FAIL: RCP valid') AS t5,
    IF(fn_is_valid_term_id('2023-FALL') = 1, 'PASS: TRM valid', 'FAIL: TRM valid') AS t6,
    IF(fn_is_valid_payment_ref('PAY-A1B2C3D4E5F6') = 1, 'PASS: PAY valid', 'FAIL: PAY valid') AS t7,
    IF(fn_is_valid_batch_id('BAT-20231025-0001') = 1, 'PASS: BAT valid', 'FAIL: BAT valid') AS t8,
    IF(fn_is_valid_payroll_month('2023-10') = 1, 'PASS: PRL valid', 'FAIL: PRL valid') AS t9;

-- Test Generators (Sequence)
-- Clean sequences for test
DELETE FROM id_sequences WHERE sequence_name LIKE 'student_2099' OR sequence_name LIKE 'employee_2099';

SELECT IF(fn_generate_student_id('2099') = 'STU-2099-000001', 'PASS: Gen STU 1', 'FAIL: Gen STU 1') AS g1;
SELECT IF(fn_generate_student_id('2099') = 'STU-2099-000002', 'PASS: Gen STU 2', 'FAIL: Gen STU 2') AS g2;
SELECT IF(fn_generate_employee_id('2099') = 'EMP-2099-0001', 'PASS: Gen EMP 1', 'FAIL: Gen EMP 1') AS g3;
SELECT IF(fn_generate_employee_id('2099') = 'EMP-2099-0002', 'PASS: Gen EMP 2', 'FAIL: Gen EMP 2') AS g4;
