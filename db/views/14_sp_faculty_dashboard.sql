-- Object: sp_faculty_dashboard
-- Description: C-03 Dashboard aggregates for Faculty
-- Choice: Stored Procedure
-- Reason: Requires a faculty_id parameter to filter data.
-- Inputs: p_faculty_id BIGINT
-- Output columns: assigned_offerings, pending_marks_entry, total_leave_balance, latest_payslip_net
-- Query logic: Selects counts and aggregates filtered by faculty_id.
-- SQL constructs: Scalar Subqueries, UDF inside SUM

DELIMITER //

CREATE PROCEDURE sp_faculty_dashboard(
    IN p_faculty_id BIGINT
)
BEGIN
    SELECT 
        (SELECT COUNT(*) 
         FROM course_offering co 
         JOIN academic_term at ON co.term_id = at.id 
         WHERE co.faculty_id = p_faculty_id AND at.is_current = 1) AS assigned_offerings,
         
        (SELECT COUNT(*) 
         FROM exam_registration er
         JOIN exam ex ON er.exam_id = ex.id
         JOIN course_offering co ON ex.offering_id = co.id
         LEFT JOIN exam_marks_result emr ON er.id = emr.registration_id
         WHERE co.faculty_id = p_faculty_id 
           AND er.status = 'REGISTERED' 
           AND (emr.marks IS NULL OR emr.is_published = 0)) AS pending_marks_entry,
           
        (SELECT COALESCE(SUM(fn_leave_balance(p_faculty_id, lt.id, YEAR(CURDATE()))), 0) 
         FROM leave_type lt
         JOIN leave_entitlement le ON lt.id = le.leave_type_id
         JOIN employee e ON e.id = p_faculty_id AND e.emp_type = le.emp_type) AS total_leave_balance,
         
        (SELECT net_pay 
         FROM payslip ps
         JOIN payroll_run pr ON ps.run_id = pr.id
         WHERE ps.employee_id = p_faculty_id AND pr.status = 'FINALIZED'
         ORDER BY pr.run_date DESC
         LIMIT 1) AS latest_payslip_net;
END //

DELIMITER ;
