-- Object: sp_fee_collection_summary
-- Description: RP-4 Fee collection summary by program and term, counting defaulters above a specific threshold.
-- Choice: Stored Procedure.
-- Reason: Takes a dynamic parameter X (threshold amount) which cannot be passed to a view.
-- Inputs: p_defaulter_threshold DECIMAL(10,2)
-- Output columns: program_name, term_label, total_due, total_paid, total_balance, defaulters_count
-- Query logic: Joins student_fee, student, fee_component, fee_structure, program, academic_term. Aggregates dues and payments by program and term. Uses HAVING to only show programs with at least one defaulter.
-- SQL constructs: JOIN, GROUP BY, HAVING

DELIMITER //

CREATE PROCEDURE sp_fee_collection_summary(
    IN p_defaulter_threshold DECIMAL(10,2)
)
BEGIN
    SELECT 
        p.name AS program_name,
        at.term_label,
        SUM(sf.amount_due) AS total_due,
        SUM(sf.amount_paid) AS total_paid,
        SUM(sf.amount_due - sf.amount_paid) AS total_balance,
        SUM(CASE WHEN (sf.amount_due - sf.amount_paid) > p_defaulter_threshold THEN 1 ELSE 0 END) AS defaulters_count
    FROM student_fee sf
    JOIN student s ON sf.student_id = s.id
    JOIN fee_component fc ON sf.component_id = fc.id
    JOIN fee_structure fs ON fc.structure_id = fs.id
    JOIN program p ON fs.program_id = p.id
    JOIN academic_term at ON fs.term_id = at.id
    GROUP BY p.id, p.name, at.id, at.term_label
    HAVING defaulters_count > 0
    ORDER BY p.name, at.term_label;
END //

DELIMITER ;
