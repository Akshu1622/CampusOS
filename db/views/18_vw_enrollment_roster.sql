-- Object: vw_enrollment_roster
-- Description: A-08 Enrollment roster / My teaching view
-- Choice: View
-- Reason: Provides student enrollment details per offering.
-- Inputs: None
-- Output columns: offering_id, faculty_id, course_code, course_title, term_label, section, student_id, global_student_id, student_name, enrollment_date, status
-- Query logic: Joins enrollment with course_offering, course, term, student, program.
-- SQL constructs: JOIN

CREATE OR REPLACE VIEW vw_enrollment_roster AS
SELECT 
    co.id AS offering_id,
    co.faculty_id,
    c.code AS course_code,
    c.title AS course_title,
    at.term_label,
    co.section,
    s.id AS student_id,
    s.global_student_id,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    p.name AS program_name,
    e.enrolled_date AS enrollment_date,
    e.status
FROM enrollment e
JOIN student s ON e.student_id = s.id
JOIN program p ON s.program_id = p.id
JOIN course_offering co ON e.offering_id = co.id
JOIN course c ON co.course_id = c.id
JOIN academic_term at ON co.term_id = at.id;
