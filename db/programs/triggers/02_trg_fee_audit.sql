-- db/programs/triggers/02_trg_fee_audit.sql
-- Name: trg_fee_audit_... (various)
-- Purpose: Log insert, update and delete of fee structures, components and student fees into fee_audit_log.
-- Exact Signature: AFTER INSERT, AFTER UPDATE, AFTER DELETE on fee_structure, fee_component, student_fee
-- Algorithm:
--   1. Get acting user from @acting_user_id. If NULL, default to 'SYSTEM'.
--   2. Build JSON for old_value (on UPDATE/DELETE) and new_value (on INSERT/UPDATE).
--   3. Insert into fee_audit_log.
-- Errors Raised: None
-- Transaction/Locking: Runs within the triggering transaction.
-- Idempotency/Edge cases:
--   - Session variable @acting_user_id might not be set by background jobs, defaults safely.
--   - JSON correctly formats nulls if column is null.

DELIMITER //

-- --------------------------------------------------------
-- fee_structure
-- --------------------------------------------------------
CREATE TRIGGER trg_fee_structure_ai
AFTER INSERT ON fee_structure
FOR EACH ROW
BEGIN
    DECLARE v_user VARCHAR(50);
    SET v_user = IFNULL(@acting_user_id, 'SYSTEM');
    INSERT INTO fee_audit_log (entity_name, entity_id, old_value, new_value, changed_by)
    VALUES ('fee_structure', NEW.id, NULL, JSON_OBJECT('program_id', NEW.program_id, 'term_id', NEW.term_id, 'structure_name', NEW.structure_name), v_user);
END //

CREATE TRIGGER trg_fee_structure_au
AFTER UPDATE ON fee_structure
FOR EACH ROW
BEGIN
    DECLARE v_user VARCHAR(50);
    SET v_user = IFNULL(@acting_user_id, 'SYSTEM');
    INSERT INTO fee_audit_log (entity_name, entity_id, old_value, new_value, changed_by)
    VALUES ('fee_structure', NEW.id, 
            JSON_OBJECT('program_id', OLD.program_id, 'term_id', OLD.term_id, 'structure_name', OLD.structure_name), 
            JSON_OBJECT('program_id', NEW.program_id, 'term_id', NEW.term_id, 'structure_name', NEW.structure_name), 
            v_user);
END //

CREATE TRIGGER trg_fee_structure_ad
AFTER DELETE ON fee_structure
FOR EACH ROW
BEGIN
    DECLARE v_user VARCHAR(50);
    SET v_user = IFNULL(@acting_user_id, 'SYSTEM');
    INSERT INTO fee_audit_log (entity_name, entity_id, old_value, new_value, changed_by)
    VALUES ('fee_structure', OLD.id, JSON_OBJECT('program_id', OLD.program_id, 'term_id', OLD.term_id, 'structure_name', OLD.structure_name), NULL, v_user);
END //

-- --------------------------------------------------------
-- fee_component
-- --------------------------------------------------------
CREATE TRIGGER trg_fee_component_ai
AFTER INSERT ON fee_component
FOR EACH ROW
BEGIN
    DECLARE v_user VARCHAR(50);
    SET v_user = IFNULL(@acting_user_id, 'SYSTEM');
    INSERT INTO fee_audit_log (entity_name, entity_id, old_value, new_value, changed_by)
    VALUES ('fee_component', NEW.id, NULL, JSON_OBJECT('structure_id', NEW.structure_id, 'component_name', NEW.component_name, 'amount', NEW.amount, 'due_date', NEW.due_date), v_user);
END //

CREATE TRIGGER trg_fee_component_au
AFTER UPDATE ON fee_component
FOR EACH ROW
BEGIN
    DECLARE v_user VARCHAR(50);
    SET v_user = IFNULL(@acting_user_id, 'SYSTEM');
    INSERT INTO fee_audit_log (entity_name, entity_id, old_value, new_value, changed_by)
    VALUES ('fee_component', NEW.id, 
            JSON_OBJECT('structure_id', OLD.structure_id, 'component_name', OLD.component_name, 'amount', OLD.amount, 'due_date', OLD.due_date), 
            JSON_OBJECT('structure_id', NEW.structure_id, 'component_name', NEW.component_name, 'amount', NEW.amount, 'due_date', NEW.due_date), 
            v_user);
END //

CREATE TRIGGER trg_fee_component_ad
AFTER DELETE ON fee_component
FOR EACH ROW
BEGIN
    DECLARE v_user VARCHAR(50);
    SET v_user = IFNULL(@acting_user_id, 'SYSTEM');
    INSERT INTO fee_audit_log (entity_name, entity_id, old_value, new_value, changed_by)
    VALUES ('fee_component', OLD.id, JSON_OBJECT('structure_id', OLD.structure_id, 'component_name', OLD.component_name, 'amount', OLD.amount, 'due_date', OLD.due_date), NULL, v_user);
END //

-- --------------------------------------------------------
-- student_fee
-- --------------------------------------------------------
CREATE TRIGGER trg_student_fee_ai
AFTER INSERT ON student_fee
FOR EACH ROW
BEGIN
    DECLARE v_user VARCHAR(50);
    SET v_user = IFNULL(@acting_user_id, 'SYSTEM');
    INSERT INTO fee_audit_log (entity_name, entity_id, old_value, new_value, changed_by)
    VALUES ('student_fee', NEW.id, NULL, JSON_OBJECT('student_id', NEW.student_id, 'component_id', NEW.component_id, 'amount_due', NEW.amount_due, 'amount_paid', NEW.amount_paid, 'status', NEW.status), v_user);
END //

CREATE TRIGGER trg_student_fee_au
AFTER UPDATE ON student_fee
FOR EACH ROW
BEGIN
    DECLARE v_user VARCHAR(50);
    SET v_user = IFNULL(@acting_user_id, 'SYSTEM');
    INSERT INTO fee_audit_log (entity_name, entity_id, old_value, new_value, changed_by)
    VALUES ('student_fee', NEW.id, 
            JSON_OBJECT('student_id', OLD.student_id, 'component_id', OLD.component_id, 'amount_due', OLD.amount_due, 'amount_paid', OLD.amount_paid, 'status', OLD.status), 
            JSON_OBJECT('student_id', NEW.student_id, 'component_id', NEW.component_id, 'amount_due', NEW.amount_due, 'amount_paid', NEW.amount_paid, 'status', NEW.status), 
            v_user);
END //

CREATE TRIGGER trg_student_fee_ad
AFTER DELETE ON student_fee
FOR EACH ROW
BEGIN
    DECLARE v_user VARCHAR(50);
    SET v_user = IFNULL(@acting_user_id, 'SYSTEM');
    INSERT INTO fee_audit_log (entity_name, entity_id, old_value, new_value, changed_by)
    VALUES ('student_fee', OLD.id, JSON_OBJECT('student_id', OLD.student_id, 'component_id', OLD.component_id, 'amount_due', OLD.amount_due, 'amount_paid', OLD.amount_paid, 'status', OLD.status), NULL, v_user);
END //

DELIMITER ;
