-- db/programs/functions/01_fn_student_cgpa.sql
-- Name: fn_student_cgpa
-- Purpose: Calculate credit-weighted CGPA for a student from published results and the grade scale.
-- Exact Signature: fn_student_cgpa(p_student_id BIGINT) RETURNS DECIMAL(4,2)
-- Algorithm: 
--   1. Find all exam registrations for the student where the result is published.
--   2. Join with exam, course_offering, and course to get course credits and max_marks.
--   3. Exclude zero-credit courses.
--   4. Calculate percentage = (marks / max_marks) * 100 and join with grade_scale to get grade_points.
--   5. Handle repeated courses by taking only the most recent published exam attempt (ordered by exam_date DESC, exam_id DESC using ROW_NUMBER).
--   6. Sum (grade_points * credits) / Sum(credits).
--   7. Return 0.00 if the student has no results or no credits.
-- Errors Raised: None
-- Transaction/Locking: Reads from committed data, no locks held explicitly.
-- Idempotency/Edge cases: 
--   - No results -> returns 0.00
--   - All zero-credit courses -> returns 0.00 (NULLIF avoids division by zero)
--   - Repeated courses -> strictly takes the most recent exam.
--   - Unpublished results -> completely ignored.

DELIMITER //

CREATE FUNCTION fn_student_cgpa(p_student_id BIGINT) 
RETURNS DECIMAL(4,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_cgpa DECIMAL(4,2) DEFAULT 0.00;

    WITH RankedResults AS (
        SELECT 
            c.credits,
            gs.grade_points,
            ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY e.exam_date DESC, e.id DESC) as rn
        FROM exam_registration er
        JOIN exam e ON er.exam_id = e.id
        JOIN course_offering co ON e.offering_id = co.id
        JOIN course c ON co.course_id = c.id
        JOIN exam_marks_result emr ON er.id = emr.registration_id
        JOIN grade_scale gs ON (emr.marks / e.max_marks * 100) BETWEEN gs.min_marks_pct AND gs.max_marks_pct
        WHERE er.student_id = p_student_id
          AND emr.is_published = 1
          AND c.credits > 0
    )
    SELECT IFNULL(SUM(grade_points * credits) / NULLIF(SUM(credits), 0), 0.00)
    INTO v_cgpa
    FROM RankedResults
    WHERE rn = 1;

    RETURN v_cgpa;
END //

DELIMITER ;
