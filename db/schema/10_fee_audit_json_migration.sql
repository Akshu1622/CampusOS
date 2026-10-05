-- db/schema/10_fee_audit_json_migration.sql
ALTER TABLE fee_audit_log MODIFY old_value JSON NULL;
ALTER TABLE fee_audit_log MODIFY new_value JSON NULL;
