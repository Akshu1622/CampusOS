-- Object: sp_run_integrity_checks
-- Description: R-04 Integrity checks procedure returning PASS/WARN/FAIL for various system rules
-- Choice: Stored Procedure
-- Reason: Required to execute multiple validation queries dynamically and return a combined result set.
-- Inputs: None
-- Output columns: module, check_name, status, affected_count, sample_keys
-- Query logic: Creates a temporary table, inserts results from individual check queries, and returns the result set.
-- SQL constructs: Temporary Tables, INSERT INTO SELECT, Aggregation

DELIMITER //

CREATE PROCEDURE sp_run_integrity_checks()
BEGIN
    DROP TEMPORARY TABLE IF EXISTS temp_integrity_results;
    CREATE TEMPORARY TABLE temp_integrity_results (
        module VARCHAR(50),
        check_name VARCHAR(100),
        status VARCHAR(10),
        affected_count INT,
        sample_keys VARCHAR(255)
    );

    -- 1. Enrollments reference existing student and offering (No orphan rows)
    INSERT INTO temp_integrity_results (module, check_name, status, affected_count, sample_keys)
    SELECT 'M2 Academics', 'Orphan Enrollments', 
           CASE WHEN COUNT(*) > 0 THEN 'FAIL' ELSE 'PASS' END,
           COUNT(*),
           SUBSTRING(GROUP_CONCAT(e.id), 1, 200)
    FROM enrollment e
    LEFT JOIN student s ON e.student_id = s.id
    LEFT JOIN course_offering co ON e.offering_id = co.id
    WHERE s.id IS NULL OR co.id IS NULL;

    -- 2. ID-format consistency (Student)
    INSERT INTO temp_integrity_results (module, check_name, status, affected_count, sample_keys)
    SELECT 'M1 Core', 'Student ID Format', 
           CASE WHEN COUNT(*) > 0 THEN 'FAIL' ELSE 'PASS' END,
           COUNT(*),
           SUBSTRING(GROUP_CONCAT(id), 1, 200)
    FROM student
    WHERE global_student_id NOT REGEXP '^STU-[0-9]{4}-[0-9]{6}$';

    -- 3. ID-format consistency (Employee)
    INSERT INTO temp_integrity_results (module, check_name, status, affected_count, sample_keys)
    SELECT 'M5 HR', 'Employee ID Format', 
           CASE WHEN COUNT(*) > 0 THEN 'FAIL' ELSE 'PASS' END,
           COUNT(*),
           SUBSTRING(GROUP_CONCAT(id), 1, 200)
    FROM employee
    WHERE employee_id NOT REGEXP '^EMP-[0-9]{4}-[0-9]{4}$';

    -- 4. ID-format consistency (Receipt)
    INSERT INTO temp_integrity_results (module, check_name, status, affected_count, sample_keys)
    SELECT 'M4 Finance', 'Receipt Number Format', 
           CASE WHEN COUNT(*) > 0 THEN 'FAIL' ELSE 'PASS' END,
           COUNT(*),
           SUBSTRING(GROUP_CONCAT(id), 1, 200)
    FROM receipt
    WHERE receipt_number NOT REGEXP '^RCP-[0-9]{8}-[0-9]{5}$';

    -- 5. ID-format consistency (Course Code)
    INSERT INTO temp_integrity_results (module, check_name, status, affected_count, sample_keys)
    SELECT 'M2 Academics', 'Course Code Format', 
           CASE WHEN COUNT(*) > 0 THEN 'FAIL' ELSE 'PASS' END,
           COUNT(*),
           SUBSTRING(GROUP_CONCAT(id), 1, 200)
    FROM course
    WHERE code NOT REGEXP '^[A-Z]{2,4}[0-9]{3,4}$';

    -- 6. Bed counts match allocations
    INSERT INTO temp_integrity_results (module, check_name, status, affected_count, sample_keys)
    SELECT 'M6 Hostel', 'Bed Count Match', 
           CASE WHEN COUNT(*) > 0 THEN 'FAIL' ELSE 'PASS' END,
           COUNT(*),
           SUBSTRING(GROUP_CONCAT(r.id), 1, 200)
    FROM room r
    LEFT JOIN (
        SELECT room_id, COUNT(*) AS active_allocs
        FROM hostel_allocation
        WHERE status = 'ACTIVE'
        GROUP BY room_id
    ) a ON r.id = a.room_id
    WHERE r.available_beds != (r.bed_capacity - COALESCE(a.active_allocs, 0));

    -- 7. Payments equal allocations
    INSERT INTO temp_integrity_results (module, check_name, status, affected_count, sample_keys)
    SELECT 'M4 Finance', 'Payment Allocations Match', 
           CASE WHEN COUNT(*) > 0 THEN 'FAIL' ELSE 'PASS' END,
           COUNT(*),
           SUBSTRING(GROUP_CONCAT(p.id), 1, 200)
    FROM payment p
    LEFT JOIN (
        SELECT payment_id, SUM(allocated_principal + allocated_late_fee) AS total_alloc
        FROM payment_allocation
        GROUP BY payment_id
    ) pa ON p.id = pa.payment_id
    WHERE p.amount != COALESCE(pa.total_alloc, 0) AND p.status = 'SUCCESS';

    -- 8. One current term
    INSERT INTO temp_integrity_results (module, check_name, status, affected_count, sample_keys)
    SELECT 'M1 Core', 'Current Term Count', 
           CASE WHEN COUNT(*) != 1 THEN 'FAIL' ELSE 'PASS' END,
           COUNT(*),
           SUBSTRING(GROUP_CONCAT(id), 1, 200)
    FROM academic_term
    WHERE is_current = 1;

    -- 9. One finalized payroll per month
    INSERT INTO temp_integrity_results (module, check_name, status, affected_count, sample_keys)
    SELECT 'M5 HR', 'Finalized Payrolls per Month', 
           CASE WHEN COUNT(*) > 0 THEN 'FAIL' ELSE 'PASS' END,
           COUNT(*),
           SUBSTRING(GROUP_CONCAT(payroll_month), 1, 200)
    FROM (
        SELECT payroll_month, COUNT(*) AS finalized_count
        FROM payroll_run
        WHERE status = 'FINALIZED'
        GROUP BY payroll_month
        HAVING finalized_count > 1
    ) sub;

    -- 10. No user without a person record
    INSERT INTO temp_integrity_results (module, check_name, status, affected_count, sample_keys)
    SELECT 'M1 Core', 'Users with Person Record', 
           CASE WHEN COUNT(*) > 0 THEN 'FAIL' ELSE 'PASS' END,
           COUNT(*),
           SUBSTRING(GROUP_CONCAT(id), 1, 200)
    FROM user_account
    WHERE student_id IS NULL AND employee_id IS NULL;

    SELECT module, check_name, status, affected_count, sample_keys
    FROM temp_integrity_results;

    DROP TEMPORARY TABLE temp_integrity_results;
END //

DELIMITER ;
