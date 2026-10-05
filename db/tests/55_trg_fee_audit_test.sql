
SELECT 'Testing trg_fee_audit' AS Test;
SET @acting_user_id = 99;
UPDATE fee_structure SET structure_name = 'Audit Test Structure' WHERE id = 1;
SELECT entity_name, entity_id, old_value, new_value, changed_by FROM fee_audit_log WHERE entity_name = 'fee_structure' ORDER BY id DESC LIMIT 1;
