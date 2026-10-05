-- Object: vw_high_dues_students
-- Description: RP-5 Students whose dues exceed the average dues
-- Choice: View
-- Reason: No parameters required. The average dues is computed dynamically within the view.
-- Inputs: None
-- Output columns: student_id, global_student_id, first_name, last_name, program_name, total_dues, average_dues
-- Query logic: Calculates total dues per student, then compares it against the overall average dues using a subquery in the WHERE clause.
-- SQL constructs: Subquery, JOIN, GROUP BY

CREATE OR REPLACE VIEW vw_high_dues_students AS
WITH student_dues AS (
    SELECT 
        s.id AS student_id,
        s.global_student_id,
        s.first_name,
        s.last_name,
        p.name AS program_name,
        SUM(sf.amount_due - sf.amount_paid) AS total_dues
    FROM student s
    JOIN program p ON s.program_id = p.id
    JOIN student_fee sf ON s.id = sf.student_id
    GROUP BY s.id, s.global_student_id, s.first_name, s.last_name, p.name
)
SELECT 
    sd.student_id,
    sd.global_student_id,
    sd.first_name,
    sd.last_name,
    sd.program_name,
    sd.total_dues,
    (SELECT AVG(total_dues) FROM student_dues) AS average_dues
FROM student_dues sd
WHERE sd.total_dues > (SELECT AVG(total_dues) FROM student_dues);
