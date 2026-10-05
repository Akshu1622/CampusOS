
SELECT 'Testing fn_leave_balance' AS Test;
-- Insert a dummy leave entitlement if missing
INSERT IGNORE INTO leave_entitlement (leave_type_id, emp_type, annual_quota, carry_forward) VALUES (1, 'FACULTY', 12, 0);
SELECT fn_leave_balance(1, 1, YEAR(CURDATE())) AS leave_balance_emp_1_type_1;
SELECT fn_leave_balance(999, 1, YEAR(CURDATE())) AS invalid_emp;
