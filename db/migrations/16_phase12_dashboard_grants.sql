-- Additive SQL script to grant access to the `app` user for new tables
-- required by the complex dashboard views and queries in Phase 12.

GRANT SELECT ON university_erp.payment_allocation TO 'app'@'%';
GRANT SELECT ON university_erp.student_fee TO 'app'@'%';
GRANT SELECT ON university_erp.fee_component TO 'app'@'%';
GRANT SELECT ON university_erp.fee_structure TO 'app'@'%';
GRANT SELECT ON university_erp.academic_term TO 'app'@'%';
GRANT SELECT ON university_erp.student TO 'app'@'%';
GRANT SELECT ON university_erp.program TO 'app'@'%';
GRANT SELECT ON university_erp.department TO 'app'@'%';
GRANT SELECT ON university_erp.enrollment TO 'app'@'%';
GRANT SELECT ON university_erp.attendance_session TO 'app'@'%';
GRANT SELECT ON university_erp.course_offering TO 'app'@'%';
GRANT SELECT ON university_erp.course TO 'app'@'%';
GRANT SELECT ON university_erp.exam_marks_result TO 'app'@'%';
GRANT SELECT ON university_erp.exam_registration TO 'app'@'%';
GRANT SELECT ON university_erp.exam TO 'app'@'%';
GRANT SELECT ON university_erp.semester_result TO 'app'@'%';

FLUSH PRIVILEGES;
