-- db/seed/demo/07_add_hostel_admin_to_demo.sql

INSERT INTO user_account (username, password_hash, status, employee_id)
VALUES ('admin_hostel', '$argon2id$v=19$m=65536,t=3,p=4$rRVizBmDcI5xrhVCiJGSkg$z3sAf/VapY24rAqnIwu1hOcw1xv8mdKU6AoE6x0ZZa4', 'ACTIVE', 1); -- 'password123'

SET @admin_hostel_id = LAST_INSERT_ID();

INSERT INTO role_assignment (user_id, role_id)
SELECT @admin_hostel_id, id FROM role WHERE name = 'Admin';

INSERT INTO admin_permission_set_assignment (user_id, permission_set_id)
SELECT @admin_hostel_id, id FROM permission_set WHERE name = 'Hostel_Admin';
