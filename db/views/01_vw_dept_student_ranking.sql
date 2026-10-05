-- Object: vw_dept_student_ranking
-- Description: RP-1 Department-wise student ranking by CGPA
-- Inputs: None (Base view)
-- Output columns: department_id, department_name, program_name, student_id, first_name, last_name, cgpa, dept_rank
-- Query logic: Joins student, program, department, semester_result to get the latest CGPA per student. Ranks students within each department by CGPA descending.
-- SQL constructs: JOIN, RANK() OVER PARTITION BY

CREATE OR REPLACE VIEW vw_dept_student_ranking AS
WITH latest_cgpa AS (
    SELECT student_id, MAX(cgpa) as cgpa
    FROM semester_result
    GROUP BY student_id
)
SELECT 
    d.id AS department_id,
    d.name AS department_name,
    p.name AS program_name,
    s.id AS student_id,
    s.first_name,
    s.last_name,
    lc.cgpa,
    RANK() OVER (PARTITION BY d.id ORDER BY lc.cgpa DESC) AS dept_rank
FROM student s
JOIN program p ON s.program_id = p.id
JOIN department d ON p.department_id = d.id
JOIN latest_cgpa lc ON s.id = lc.student_id;
