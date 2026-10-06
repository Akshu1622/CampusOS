INSERT IGNORE INTO admin_permission_set_assignment (user_id, permission_set_id)
VALUES (1, (SELECT id FROM permission_set WHERE name = 'Finance_Admin'));
