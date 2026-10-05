-- Object: vw_attendance_shortage
-- Description: E-04 Attendance shortage list (< 75%)
-- Choice: View
-- Reason: Provides a list of students with attendance shortage, easily filterable by the API.
-- Inputs: None
-- Output columns: student_id, global_student_id, student_name, term_label, course_code, course_title, department_name, program_name, faculty_name, attendance_pct
-- Query logic: Calculates attendance percentage using fn_attendance_pct and filters where it's < 75.
-- SQL constructs: JOIN, UDF

CREATE OR REPLACE VIEW vw_attendance_shortage AS
SELECT 
    s.id AS student_id,
    s.global_student_id,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    at.term_label,
    c.code AS course_code,
    c.title AS course_title,
    d.name AS department_name,
    p.name AS program_name,
    CONCAT(e.first_name, ' ', e.last_name) AS faculty_name,
    fn_attendance_pct(en.student_id, en.offering_id) AS attendance_pct
FROM enrollment en
JOIN student s ON en.student_id = s.id
JOIN course_offering co ON en.offering_id = co.id
JOIN academic_term at ON co.term_id = at.id
JOIN course c ON co.course_id = c.id
JOIN program p ON s.program_id = p.id
JOIN department d ON p.department_id = d.id
JOIN employee e ON co.faculty_id = e.id
WHERE en.status = 'ENROLLED'
AND fn_attendance_pct(en.student_id, en.offering_id) < 75.00;
