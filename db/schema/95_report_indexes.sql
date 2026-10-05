-- 95_report_indexes.sql
-- Indexes added to support analytical reports and views

-- RP-1, RP-2
CREATE INDEX idx_sr_cgpa ON semester_result (cgpa);

-- RP-4, RP-5, F-09
CREATE INDEX idx_sf_status_amount ON student_fee (status, amount_due, amount_paid);

-- RP-10
CREATE INDEX idx_enrollment_status ON enrollment (status);

-- RP-9, E-12
CREATE INDEX idx_emr_grade ON exam_marks_result (grade, is_published);
