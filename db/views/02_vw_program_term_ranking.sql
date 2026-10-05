-- Object: vw_program_term_ranking
-- Description: RP-2 Students ranking per program per term (Base view for Top N)
-- Choice: Base view. The API will query this view with WHERE program_id = ? AND term_id = ? AND prog_term_rank <= N
-- Reason: A view is more flexible and can be easily filtered without maintaining a stored procedure API contract for simple filtering.
-- Inputs: None (Base view)
-- Output columns: program_id, program_name, term_id, term_year, term_label, student_id, first_name, last_name, cgpa, prog_term_rank
-- Query logic: Joins semester_result with student and program. Uses RANK() partitioned by program and term ordered by CGPA descending.
-- SQL constructs: Window function RANK(), PARTITION BY, JOIN

CREATE OR REPLACE VIEW vw_program_term_ranking AS
SELECT 
    p.id AS program_id,
    p.name AS program_name,
    at.id AS term_id,
    at.term_year,
    at.term_label,
    s.id AS student_id,
    s.first_name,
    s.last_name,
    sr.cgpa,
    RANK() OVER (PARTITION BY p.id, at.id ORDER BY sr.cgpa DESC) AS prog_term_rank
FROM semester_result sr
JOIN student s ON sr.student_id = s.id
JOIN program p ON s.program_id = p.id
JOIN academic_term at ON sr.term_id = at.id;
