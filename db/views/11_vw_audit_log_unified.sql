-- Object: vw_audit_log_unified
-- Description: R-03 Unified audit-log view combining general audit log and fee audit log
-- Choice: View
-- Reason: Provides a single interface for all audit logs.
-- Inputs: None
-- Output columns: source, log_id, entity_name, entity_id, action, before_state, after_state, actor, timestamp
-- Query logic: UNION ALL between general_audit_log and fee_audit_log, mapping columns to a common set.
-- SQL constructs: UNION ALL

CREATE OR REPLACE VIEW vw_audit_log_unified AS
SELECT 
    CAST('GENERAL' AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS source,
    gal.id AS log_id,
    CAST(gal.entity_name AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS entity_name,
    CAST(gal.entity_id AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS entity_id,
    CAST(gal.action AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS action,
    CAST(gal.before_state AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS before_state,
    CAST(gal.after_state AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS after_state,
    CAST(COALESCE(u.username, CAST(gal.actor_user_id AS CHAR)) AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS actor,
    gal.timestamp
FROM general_audit_log gal
LEFT JOIN user_account u ON gal.actor_user_id = u.id

UNION ALL

SELECT 
    CAST('FEE' AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS source,
    fal.id AS log_id,
    CAST(fal.entity_name AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS entity_name,
    CAST(fal.entity_id AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS entity_id,
    CAST('UPDATE' AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS action,
    CAST(fal.old_value AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS before_state,
    CAST(fal.new_value AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS after_state,
    CAST(fal.changed_by AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS actor,
    fal.changed_at AS timestamp
FROM fee_audit_log fal;
