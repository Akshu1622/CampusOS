-- Migration 18: Complete overhaul of remaining courses with real engineering subjects
-- Replaces all generic CS021-CS050 and test courses with authentic engineering disciplines

USE university_erp;

UPDATE course SET code = 'EE304', title = 'Power Electronics and Drives', credits = 4, department_id = 3 WHERE id = 21;
UPDATE course SET code = 'EE402', title = 'VLSI Design and Embedded Systems', credits = 4, department_id = 3 WHERE id = 22;
UPDATE course SET code = 'EE403', title = 'Wireless and Mobile Communication', credits = 3, department_id = 3 WHERE id = 23;
UPDATE course SET code = 'EE404', title = 'Internet of Things and Sensor Networks', credits = 3, department_id = 3 WHERE id = 24;
UPDATE course SET code = 'EE305', title = 'Electrical Machines and Transformers', credits = 4, department_id = 3 WHERE id = 25;
UPDATE course SET code = 'ME201', title = 'Engineering Mechanics and Statics', credits = 4, department_id = 2 WHERE id = 26;
UPDATE course SET code = 'ME202', title = 'Thermodynamics and Heat Transfer', credits = 4, department_id = 2 WHERE id = 27;
UPDATE course SET code = 'ME301', title = 'Fluid Mechanics and Machinery', credits = 4, department_id = 2 WHERE id = 28;
UPDATE course SET code = 'ME302', title = 'Manufacturing and Machining Science', credits = 3, department_id = 2 WHERE id = 29;
UPDATE course SET code = 'ME303', title = 'Kinematics and Dynamics of Machines', credits = 4, department_id = 2 WHERE id = 30;
UPDATE course SET code = 'ME401', title = 'Robotics and Industrial Automation', credits = 3, department_id = 2 WHERE id = 31;
UPDATE course SET code = 'ME402', title = 'Automobile Engineering', credits = 3, department_id = 2 WHERE id = 32;
UPDATE course SET code = 'ME403', title = 'Finite Element Analysis (FEA)', credits = 4, department_id = 2 WHERE id = 33;
UPDATE course SET code = 'ME404', title = 'Refrigeration and Air Conditioning', credits = 3, department_id = 2 WHERE id = 34;
UPDATE course SET code = 'CE201', title = 'Strength of Materials', credits = 4, department_id = 4 WHERE id = 35;
UPDATE course SET code = 'CE202', title = 'Structural Analysis and Mechanics', credits = 4, department_id = 4 WHERE id = 36;
UPDATE course SET code = 'CE301', title = 'Concrete Technology and Design', credits = 4, department_id = 4 WHERE id = 37;
UPDATE course SET code = 'CE302', title = 'Geotechnical and Foundation Engineering', credits = 4, department_id = 4 WHERE id = 38;
UPDATE course SET code = 'CE303', title = 'Surveying and Geomatics', credits = 3, department_id = 4 WHERE id = 39;
UPDATE course SET code = 'CE401', title = 'Transportation and Highway Engineering', credits = 3, department_id = 4 WHERE id = 40;
UPDATE course SET code = 'CE402', title = 'Environmental Engineering and Hydrology', credits = 3, department_id = 4 WHERE id = 41;
UPDATE course SET code = 'CE403', title = 'Design of Steel Structures', credits = 4, department_id = 4 WHERE id = 42;
UPDATE course SET code = 'MA101', title = 'Engineering Mathematics I (Calculus)', credits = 4, department_id = 1 WHERE id = 43;
UPDATE course SET code = 'MA102', title = 'Engineering Mathematics II (Linear Algebra)', credits = 4, department_id = 1 WHERE id = 44;
UPDATE course SET code = 'MA201', title = 'Discrete Mathematics and Graph Theory', credits = 3, department_id = 1 WHERE id = 45;
UPDATE course SET code = 'PH101', title = 'Engineering Physics and Quantum Optics', credits = 3, department_id = 3 WHERE id = 46;
UPDATE course SET code = 'CH101', title = 'Engineering Chemistry and Materials', credits = 3, department_id = 2 WHERE id = 47;
UPDATE course SET code = 'HS201', title = 'Engineering Economics and Management', credits = 3, department_id = 5 WHERE id = 48;
UPDATE course SET code = 'HS202', title = 'Professional Ethics and Human Values', credits = 2, department_id = 5 WHERE id = 49;
UPDATE course SET code = 'CS499', title = 'Engineering Capstone Project', credits = 6, department_id = 1 WHERE id = 50;

-- Also update any courses created during testing to authentic elective subjects
UPDATE course SET code = 'CS491', title = 'Cloud Native Architecture and DevOps', credits = 3, department_id = 1 WHERE id = 51;
UPDATE course SET code = 'CS492', title = 'Blockchain and Decentralized Systems', credits = 3, department_id = 1 WHERE id = 52;
UPDATE course SET code = 'CS493', title = 'Natural Language Processing and LLMs', credits = 3, department_id = 1 WHERE id = 53;
UPDATE course SET code = 'CS494', title = 'Computer Vision and Image Processing', credits = 3, department_id = 1 WHERE id = 54;
UPDATE course SET code = 'CS495', title = 'Industrial Internship and Field Work', credits = 4, department_id = 1 WHERE id = 55;
UPDATE course SET code = 'CS496', title = 'Comprehensive Technical Seminar and Viva', credits = 2, department_id = 1 WHERE id = 56;
