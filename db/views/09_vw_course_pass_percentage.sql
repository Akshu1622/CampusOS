-- Object: vw_course_pass_percentage
-- Description: RP-9 Course-wise pass percentage and grade distribution
-- Choice: View
-- Reason: Provides course-level aggregates which can be queried by the API without parameters.
-- Inputs: None
-- Output columns: offering_id, term_label, course_code, course_title, faculty_name, total_results, passed_count, failed_count, pass_pct, grade_a_count, grade_b_count, grade_c_count, grade_f_count
-- Query logic: Joins course_offering, course, term, employee, exam, exam_registration, exam_marks_result. Groups by offering, uses conditional aggregation to count grades and passes (assuming F is fail).
-- SQL constructs: GROUP BY, Conditional Aggregation

CREATE OR REPLACE VIEW vw_course_pass_percentage AS
SELECT 
    co.id AS offering_id,
    at.term_label,
    c.code AS course_code,
    c.title AS course_title,
    CONCAT(e.first_name, ' ', e.last_name) AS faculty_name,
    COUNT(emr.registration_id) AS total_results,
    SUM(CASE WHEN emr.grade != 'F' THEN 1 ELSE 0 END) AS passed_count,
    SUM(CASE WHEN emr.grade = 'F' THEN 1 ELSE 0 END) AS failed_count,
    ROUND((SUM(CASE WHEN emr.grade != 'F' THEN 1 ELSE 0 END) * 100.0) / NULLIF(COUNT(emr.registration_id), 0), 2) AS pass_pct,
    SUM(CASE WHEN emr.grade LIKE 'A%' THEN 1 ELSE 0 END) AS grade_a_count,
    SUM(CASE WHEN emr.grade LIKE 'B%' THEN 1 ELSE 0 END) AS grade_b_count,
    SUM(CASE WHEN emr.grade LIKE 'C%' THEN 1 ELSE 0 END) AS grade_c_count,
    SUM(CASE WHEN emr.grade = 'F' THEN 1 ELSE 0 END) AS grade_f_count
FROM course_offering co
JOIN course c ON co.course_id = c.id
JOIN academic_term at ON co.term_id = at.id
JOIN employee e ON co.faculty_id = e.id
JOIN exam ex ON ex.offering_id = co.id
JOIN exam_registration er ON er.exam_id = ex.id
JOIN exam_marks_result emr ON er.id = emr.registration_id
WHERE er.status = 'REGISTERED' AND emr.is_published = 1
GROUP BY co.id, at.term_label, c.code, c.title, e.first_name, e.last_name;
