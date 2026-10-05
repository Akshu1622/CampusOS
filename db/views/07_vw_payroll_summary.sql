-- Object: vw_payroll_summary
-- Description: RP-7 Payroll summary by department and month
-- Choice: View
-- Reason: Aggregates across all departments and months. API can easily filter by month.
-- Inputs: None
-- Output columns: payroll_month, department_id, department_name, employee_count, total_gross_pay, total_deductions, total_net_pay
-- Query logic: Joins payroll_run, payslip, employee, department. Groups by payroll_month and department.
-- SQL constructs: JOIN, GROUP BY

CREATE OR REPLACE VIEW vw_payroll_summary AS
SELECT 
    pr.payroll_month,
    d.id AS department_id,
    d.name AS department_name,
    COUNT(ps.id) AS employee_count,
    SUM(ps.gross_pay) AS total_gross_pay,
    SUM(ps.total_deductions) AS total_deductions,
    SUM(ps.net_pay) AS total_net_pay
FROM payroll_run pr
JOIN payslip ps ON pr.id = ps.run_id
JOIN employee e ON ps.employee_id = e.id
JOIN department d ON e.department_id = d.id
GROUP BY pr.payroll_month, d.id, d.name;
