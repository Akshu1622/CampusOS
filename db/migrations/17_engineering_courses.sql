-- Migration 17: Replace generic course names with real engineering subjects
-- Phase: additive migration (updates existing rows with real engineering curriculum)

USE university_erp;

UPDATE course SET code = 'CS301', title = 'Database and Management System', credits = 4, department_id = 1 WHERE id = 1;
UPDATE course SET code = 'EE401', title = 'Digital Signal Processing', credits = 4, department_id = 3 WHERE id = 2;
UPDATE course SET code = 'EE302', title = 'Embedded Processing', credits = 4, department_id = 3 WHERE id = 3;
UPDATE course SET code = 'CS302', title = 'Computer Networks', credits = 4, department_id = 1 WHERE id = 4;
UPDATE course SET code = 'CS201', title = 'Data Structures and Algorithms', credits = 4, department_id = 1 WHERE id = 5;
UPDATE course SET code = 'CS303', title = 'Operating Systems', credits = 4, department_id = 1 WHERE id = 6;
UPDATE course SET code = 'CS304', title = 'Theory of Computation', credits = 3, department_id = 1 WHERE id = 7;
UPDATE course SET code = 'CS305', title = 'Software Engineering', credits = 3, department_id = 1 WHERE id = 8;
UPDATE course SET code = 'EE301', title = 'Microprocessors and Microcontrollers', credits = 4, department_id = 3 WHERE id = 9;
UPDATE course SET code = 'CS202', title = 'Computer Organization and Architecture', credits = 4, department_id = 1 WHERE id = 10;
UPDATE course SET code = 'CS401', title = 'Artificial Intelligence and Machine Learning', credits = 4, department_id = 1 WHERE id = 11;
UPDATE course SET code = 'CS402', title = 'Cryptography and Network Security', credits = 3, department_id = 1 WHERE id = 12;
UPDATE course SET code = 'CS403', title = 'Compiler Design', credits = 4, department_id = 1 WHERE id = 13;
UPDATE course SET code = 'CS404', title = 'Cloud Computing and Distributed Systems', credits = 3, department_id = 1 WHERE id = 14;
UPDATE course SET code = 'CS203', title = 'Object Oriented Programming', credits = 3, department_id = 1 WHERE id = 15;
UPDATE course SET code = 'CS306', title = 'Design and Analysis of Algorithms', credits = 4, department_id = 1 WHERE id = 16;
UPDATE course SET code = 'CS405', title = 'Web Technologies and Frameworks', credits = 3, department_id = 1 WHERE id = 17;
UPDATE course SET code = 'EE201', title = 'Digital Electronics and Logic Design', credits = 4, department_id = 3 WHERE id = 18;
UPDATE course SET code = 'EE202', title = 'Signals and Systems', credits = 4, department_id = 3 WHERE id = 19;
UPDATE course SET code = 'EE303', title = 'Control Systems Engineering', credits = 4, department_id = 3 WHERE id = 20;
