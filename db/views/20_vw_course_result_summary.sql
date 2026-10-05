-- Object: vw_course_result_summary
-- Description: E-12 Course result summary (pass %, averages)
-- Choice: View
-- Reason: Provides aggregations per offering for the course result summary screen.
-- Inputs: None
-- Output columns: offering_id, term_label, course_code, course_title, total_students, passed, failed, pass_pct, avg_marks, avg_grade_points
-- Query logic: Joins offering, course, term, exam, exam_registration, exam_marks_result. Averages the marks and grade points.
-- SQL constructs: JOIN, GROUP BY, Aggregate functions

CREATE OR REPLACE VIEW vw_course_result_summary AS
SELECT 
    co.id AS offering_id,
    at.term_label,
    c.code AS course_code,
    c.title AS course_title,
    COUNT(emr.registration_id) AS total_students,
    SUM(CASE WHEN emr.grade != 'F' THEN 1 ELSE 0 END) AS passed,
    SUM(CASE WHEN emr.grade = 'F' THEN 1 ELSE 0 END) AS failed,
    ROUND((SUM(CASE WHEN emr.grade != 'F' THEN 1 ELSE 0 END) * 100.0) / NULLIF(COUNT(emr.registration_id), 0), 2) AS pass_pct,
    ROUND(AVG(emr.marks), 2) AS avg_marks,
    ROUND(AVG(emr.grade_points), 2) AS avg_grade_points
FROM course_offering co
JOIN course c ON co.course_id = c.id
JOIN academic_term at ON co.term_id = at.id
JOIN exam ex ON ex.offering_id = co.id
JOIN exam_registration er ON er.exam_id = ex.id
JOIN exam_marks_result emr ON er.id = emr.registration_id
WHERE er.status = 'REGISTERED' AND emr.is_published = 1
GROUP BY co.id, at.term_label, c.code, c.title;
