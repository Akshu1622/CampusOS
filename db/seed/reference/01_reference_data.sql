-- db/seed/reference/01_reference_data.sql
-- Static lookup data

-- 1. Roles
INSERT INTO role (id, name) VALUES
(1, 'Admin'),
(2, 'Faculty'),
(3, 'Student');

-- 2. Permission Sets
INSERT INTO permission_set (id, name) VALUES
(1, 'Core_Admin'),
(2, 'Academics_Admin'),
(3, 'Exams_Admin'),
(4, 'Finance_Admin'),
(5, 'HR_Admin'),
(6, 'Hostel_Admin'),
(7, 'Super_Admin');

-- 3. Grade Scale
INSERT INTO grade_scale (id, grade, min_marks_pct, max_marks_pct, grade_points) VALUES
(1, 'S', 90.00, 100.00, 10.0),
(2, 'A', 80.00, 89.99, 9.0),
(3, 'B', 70.00, 79.99, 8.0),
(4, 'C', 60.00, 69.99, 7.0),
(5, 'D', 50.00, 59.99, 6.0),
(6, 'E', 40.00, 49.99, 5.0),
(7, 'F', 0.00, 39.99, 0.0);

-- 4. Leave Types
INSERT INTO leave_type (id, name, is_paid) VALUES
(1, 'Casual Leave', 1),
(2, 'Sick Leave', 1),
(3, 'Earned Leave', 1),
(4, 'Leave Without Pay', 0);

-- 5. Designations
INSERT INTO designation (id, title, job_level) VALUES
(1, 'Professor', 5),
(2, 'Associate Professor', 4),
(3, 'Assistant Professor', 3),
(4, 'Registrar', 5),
(5, 'Accountant', 3),
(6, 'Clerk', 1);

-- 6. Leave Entitlements
-- FACULTY
INSERT INTO leave_entitlement (leave_type_id, emp_type, annual_quota, carry_forward) VALUES
(1, 'FACULTY', 12, 0), -- Casual Leave
(2, 'FACULTY', 10, 1), -- Sick Leave
(3, 'FACULTY', 30, 1); -- Earned Leave

-- STAFF
INSERT INTO leave_entitlement (leave_type_id, emp_type, annual_quota, carry_forward) VALUES
(1, 'STAFF', 15, 0),   -- Casual Leave
(2, 'STAFF', 12, 1),   -- Sick Leave
(3, 'STAFF', 30, 1);   -- Earned Leave

-- 7. Salary Structures
INSERT INTO salary_structure (designation_id, basic_pay, allowances, standard_deductions) VALUES
(1, 100000.00, 50000.00, 15000.00), -- Professor
(2, 80000.00, 40000.00, 12000.00),  -- Assoc Prof
(3, 60000.00, 30000.00, 10000.00),  -- Asst Prof
(4, 90000.00, 45000.00, 13000.00),  -- Registrar
(5, 50000.00, 20000.00, 8000.00),   -- Accountant
(6, 25000.00, 10000.00, 4000.00);   -- Clerk

-- 8. Late Fee Rules
INSERT INTO late_fee_rule (id, rule_type, penalty_amount, max_penalty) VALUES
(1, 'FLAT', 500.00, 500.00),
(2, 'PER_DAY', 50.00, 2000.00);
