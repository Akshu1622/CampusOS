-- Object: vw_payroll_register
-- Description: H-09 Payroll register (month/department view)
-- Choice: View
-- Reason: Provides detailed employee-level payroll data per month.
-- Inputs: None
-- Output columns: payroll_month, run_status, department_name, employee_id, global_employee_id, employee_name, designation, gross_pay, total_deductions, net_pay, leave_days_deducted
-- Query logic: Joins payslip with payroll_run, employee, department, and designation.
-- SQL constructs: JOIN

CREATE OR REPLACE VIEW vw_payroll_register AS
SELECT 
    pr.payroll_month,
    pr.status AS run_status,
    d.name AS department_name,
    e.id AS employee_id,
    e.employee_id AS global_employee_id,
    CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
    des.title AS designation,
    ps.gross_pay,
    ps.total_deductions,
    ps.net_pay,
    ps.leave_days_deducted
FROM payslip ps
JOIN payroll_run pr ON ps.run_id = pr.id
JOIN employee e ON ps.employee_id = e.id
JOIN department d ON e.department_id = d.id
JOIN designation des ON e.designation_id = des.id;
