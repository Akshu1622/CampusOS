-- Object: vw_admin_dashboard
-- Description: C-02 Dashboard aggregates for Admin
-- Choice: View
-- Reason: Aggregates system-wide metrics which do not require parameters.
-- Inputs: None
-- Output columns: total_students, total_faculty, active_enrollments, fees_collected_current, fees_due_current, beds_available, pending_leaves, pending_hostel_requests, students_low_attendance
-- Query logic: Creates a single row with multiple scalar subqueries or cross joins to fetch counts and sums.
-- SQL constructs: Scalar Subqueries, Aggregation

CREATE OR REPLACE VIEW vw_admin_dashboard AS
SELECT 
    (SELECT COUNT(*) FROM student WHERE status = 'ACTIVE') AS total_students,
    (SELECT COUNT(*) FROM employee WHERE emp_type = 'FACULTY' AND status = 'ACTIVE') AS total_faculty,
    (SELECT COUNT(*) FROM enrollment WHERE status = 'ENROLLED') AS active_enrollments,
    
    (SELECT COALESCE(SUM(sf.amount_paid), 0) 
     FROM student_fee sf 
     JOIN fee_component fc ON sf.component_id = fc.id 
     JOIN fee_structure fs ON fc.structure_id = fs.id
     JOIN academic_term at ON fs.term_id = at.id
     WHERE at.is_current = 1) AS fees_collected_current,
     
    (SELECT COALESCE(SUM(sf.amount_due), 0) 
     FROM student_fee sf 
     JOIN fee_component fc ON sf.component_id = fc.id 
     JOIN fee_structure fs ON fc.structure_id = fs.id
     JOIN academic_term at ON fs.term_id = at.id
     WHERE at.is_current = 1) AS fees_due_current,
     
    (SELECT COALESCE(SUM(available_beds), 0) FROM room) AS beds_available,
    
    (SELECT COUNT(*) FROM leave_application WHERE status = 'PENDING') AS pending_leaves,
    
    (SELECT COUNT(*) FROM hostel_request WHERE status = 'PENDING') AS pending_hostel_requests,
    
    (SELECT COUNT(*) 
     FROM enrollment e
     WHERE e.status = 'ENROLLED' AND fn_attendance_pct(e.student_id, e.offering_id) < 75.00) AS students_low_attendance;
