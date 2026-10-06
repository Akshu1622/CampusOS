-- db/seed/demo/06_add_hr_admin_to_core.sql

INSERT INTO user_account (username, password_hash, status)
VALUES ('admin_hr', '$argon2id$v=19$m=65536,t=3,p=4$rRVizBmDcI5xrhVCiJGSkg$z3sAf/VapY24rAqnIwu1hOcw1xv8mdKU6AoE6x0ZZa4', 'ACTIVE'); -- 'password123'

SET @admin_hr_id = LAST_INSERT_ID();

INSERT INTO role_assignment (user_id, role_id)
SELECT @admin_hr_id, id FROM role WHERE name = 'Admin';

INSERT INTO admin_permission_set_assignment (user_id, permission_set_id)
SELECT @admin_hr_id, id FROM permission_set WHERE name = 'HR_Admin';
