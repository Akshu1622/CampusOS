-- Object: vw_exam_blocked_students
-- Description: RP-10 Exam registration blocked / ineligible list (due to attendance < 75%)
-- Choice: View
-- Reason: Identifies all enrollments where attendance is below threshold.
-- Inputs: None
-- Output columns: student_id, global_student_id, student_name, term_label, course_code, course_title, attendance_pct
-- Query logic: Cross checks attendance using fn_attendance_pct against the 75% threshold.
-- SQL constructs: JOIN, UDF

CREATE OR REPLACE VIEW vw_exam_blocked_students AS
SELECT 
    s.id AS student_id,
    s.global_student_id,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    at.term_label,
    c.code AS course_code,
    c.title AS course_title,
    fn_attendance_pct(e.student_id, e.offering_id) AS attendance_pct
FROM enrollment e
JOIN student s ON e.student_id = s.id
JOIN course_offering co ON e.offering_id = co.id
JOIN academic_term at ON co.term_id = at.id
JOIN course c ON co.course_id = c.id
WHERE e.status = 'ENROLLED'
AND fn_attendance_pct(e.student_id, e.offering_id) < 75.00;
