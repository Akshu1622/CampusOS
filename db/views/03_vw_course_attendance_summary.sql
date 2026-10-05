-- Object: vw_course_attendance_summary
-- Description: RP-3 Courses average attendance summary
-- Choice: Base view. API can filter by WHERE avg_attendance_pct < Threshold.
-- Reason: Provides reusable base view for course attendance metrics.
-- Inputs: None (Base view)
-- Output columns: offering_id, course_code, course_title, term_label, faculty_name, total_enrollments, total_sessions, avg_attendance_pct
-- Query logic: Joins offering, course, term, employee. Subquery or CTE aggregates attendance_record to compute the percentage of PRESENT records across all enrollments for that offering. Grouped by offering.
-- SQL constructs: JOIN, GROUP BY, HAVING (API layer), aggregation

CREATE OR REPLACE VIEW vw_course_attendance_summary AS
WITH offering_attendance AS (
    SELECT 
        ar.enrollment_id,
        s.offering_id,
        COUNT(*) AS total_sessions,
        SUM(CASE WHEN ar.status = 'PRESENT' THEN 1 ELSE 0 END) AS present_sessions
    FROM attendance_record ar
    JOIN attendance_session s ON ar.session_id = s.id
    GROUP BY ar.enrollment_id, s.offering_id
),
offering_aggregates AS (
    SELECT 
        offering_id,
        COUNT(enrollment_id) AS total_enrollments,
        MAX(total_sessions) AS total_sessions_held,
        AVG(CASE WHEN total_sessions > 0 THEN (present_sessions * 100.0 / total_sessions) ELSE 0 END) AS avg_attendance_pct
    FROM offering_attendance
    GROUP BY offering_id
)
SELECT 
    co.id AS offering_id,
    c.code AS course_code,
    c.title AS course_title,
    at.term_label,
    CONCAT(e.first_name, ' ', e.last_name) AS faculty_name,
    oa.total_enrollments,
    oa.total_sessions_held AS total_sessions,
    ROUND(oa.avg_attendance_pct, 2) AS avg_attendance_pct
FROM course_offering co
JOIN course c ON co.course_id = c.id
JOIN academic_term at ON co.term_id = at.id
JOIN employee e ON co.faculty_id = e.id
LEFT JOIN offering_aggregates oa ON co.id = oa.offering_id;
