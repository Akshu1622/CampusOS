-- Object: vw_faculty_leave_utilisation
-- Description: RP-8 Faculty leave utilisation vs entitlement
-- Choice: View
-- Reason: Evaluates current leave balance dynamically using UDF for all faculties.
-- Inputs: None
-- Output columns: employee_id, first_name, last_name, department_name, leave_type_name, annual_quota, used_leave, available_balance
-- Query logic: Cross joins faculty (employee_type = 'FACULTY') with leave types, calls fn_leave_balance to compute available_balance, and derives used_leave.
-- SQL constructs: JOIN, UDF

CREATE OR REPLACE VIEW vw_faculty_leave_utilisation AS
SELECT 
    e.id AS employee_id,
    e.first_name,
    e.last_name,
    d.name AS department_name,
    lt.name AS leave_type_name,
    le.annual_quota,
    (le.annual_quota - fn_leave_balance(e.id, lt.id, YEAR(CURDATE()))) AS used_leave,
    fn_leave_balance(e.id, lt.id, YEAR(CURDATE())) AS available_balance
FROM employee e
JOIN department d ON e.department_id = d.id
CROSS JOIN leave_type lt
JOIN leave_entitlement le ON lt.id = le.leave_type_id AND le.emp_type = e.emp_type
WHERE e.emp_type = 'FACULTY';
