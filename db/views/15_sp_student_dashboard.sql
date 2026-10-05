-- Object: sp_student_dashboard
-- Description: C-04 Dashboard aggregates for Student
-- Choice: Stored Procedure
-- Reason: Requires a student_id parameter to filter data.
-- Inputs: p_student_id BIGINT
-- Output columns: total_enrolled_courses, low_attendance_courses, current_cgpa, total_outstanding_dues, hostel_status, pending_exams
-- Query logic: Selects counts and aggregates filtered by student_id.
-- SQL constructs: Scalar Subqueries, UDF

DELIMITER //

CREATE PROCEDURE sp_student_dashboard(
    IN p_student_id BIGINT
)
BEGIN
    SELECT 
        (SELECT COUNT(*) 
         FROM enrollment e 
         JOIN course_offering co ON e.offering_id = co.id 
         JOIN academic_term at ON co.term_id = at.id 
         WHERE e.student_id = p_student_id AND e.status = 'ENROLLED' AND at.is_current = 1) AS total_enrolled_courses,
         
        (SELECT COUNT(*) 
         FROM enrollment e 
         JOIN course_offering co ON e.offering_id = co.id 
         JOIN academic_term at ON co.term_id = at.id 
         WHERE e.student_id = p_student_id AND e.status = 'ENROLLED' AND at.is_current = 1 AND fn_attendance_pct(e.student_id, e.offering_id) < 75.00) AS low_attendance_courses,
           
        fn_student_cgpa(p_student_id) AS current_cgpa,
         
        (SELECT COALESCE(SUM(sf.amount_due - sf.amount_paid + fn_late_fee_penalty(1, fc.due_date, CURDATE())), 0) 
         FROM student_fee sf
         JOIN fee_component fc ON sf.component_id = fc.id
         WHERE sf.student_id = p_student_id AND sf.status != 'PAID') AS total_outstanding_dues,
         
        (SELECT status 
         FROM hostel_allocation 
         WHERE student_id = p_student_id AND status = 'ACTIVE' 
         LIMIT 1) AS hostel_status,
         
        (SELECT COUNT(*) 
         FROM exam ex
         JOIN course_offering co ON ex.offering_id = co.id
         JOIN academic_term at ON co.term_id = at.id
         JOIN enrollment e ON e.offering_id = co.id
         LEFT JOIN exam_registration er ON er.exam_id = ex.id AND er.student_id = p_student_id
         WHERE e.student_id = p_student_id 
           AND e.status = 'ENROLLED' 
           AND at.is_current = 1
           AND er.id IS NULL
           AND NOW() BETWEEN ex.reg_start_date AND ex.reg_end_date) AS pending_exams;
END //

DELIMITER ;
