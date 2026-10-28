-- db/seed/demo/09_m6_demo_enhancements.sql
-- Demo data for M6 Hostel enhancements

UPDATE student SET gender = 'MALE' WHERE id IN (5, 6, 7, 8, 12);
UPDATE student SET gender = 'FEMALE' WHERE id IN (9, 10, 11, 13);

-- Add sample complaint
INSERT INTO hostel_complaint (student_id, hostel_id, room_id, category, priority, title, description, status)
SELECT 5, 1, 1, 'ELECTRICAL', 'HIGH', 'Ceiling fan regulator sparking', 'The regulator in room 101 emits sparks when turned to speed 3.', 'SUBMITTED'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM hostel_complaint WHERE id = 1);

-- Add sample notice
INSERT INTO hostel_notice (hostel_id, title, content, priority)
SELECT NULL, 'Hostel Maintenance Inspection Schedule', 'Routine electrical and plumbing audits will be conducted between 10:00 and 16:00 this Saturday.', 'IMPORTANT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM hostel_notice WHERE id = 1);
