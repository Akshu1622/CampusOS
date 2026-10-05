-- Object: vw_fee_defaulters
-- Description: F-09 Fee defaulters list
-- Choice: View
-- Reason: Provides a list of students with outstanding dues past the due date.
-- Inputs: None
-- Output columns: student_id, global_student_id, student_name, program_name, component_name, term_label, due_date, amount_due, amount_paid, late_fee, total_balance
-- Query logic: Filters student_fee records where status != 'PAID' and due_date < NOW(). Calculates late fee using fn_late_fee_penalty.
-- SQL constructs: JOIN, UDF

CREATE OR REPLACE VIEW vw_fee_defaulters AS
SELECT 
    s.id AS student_id,
    s.global_student_id,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    p.name AS program_name,
    fc.component_name,
    at.term_label,
    fc.due_date,
    sf.amount_due,
    sf.amount_paid,
    fn_late_fee_penalty(1, fc.due_date, CURDATE()) AS late_fee,
    (sf.amount_due - sf.amount_paid + fn_late_fee_penalty(1, fc.due_date, CURDATE())) AS total_balance
FROM student_fee sf
JOIN student s ON sf.student_id = s.id
JOIN program p ON s.program_id = p.id
JOIN fee_component fc ON sf.component_id = fc.id
JOIN fee_structure fs ON fc.structure_id = fs.id
JOIN academic_term at ON fs.term_id = at.id
WHERE sf.status != 'PAID' 
AND fc.due_date < CURDATE();
