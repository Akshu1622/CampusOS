-- ==========================================================
-- Phase 1: Foundation Schema and Global Standards
-- ==========================================================

-- 1. Schema Version Table
CREATE TABLE IF NOT EXISTS schema_version (
    version INT NOT NULL PRIMARY KEY,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
) COMMENT 'Tracks applied database migrations';

-- 2. Concurrency-Safe Sequence Table
CREATE TABLE IF NOT EXISTS id_sequences (
    sequence_name VARCHAR(100) NOT NULL PRIMARY KEY,
    next_value BIGINT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT 'Counter table for generating sequence numbers for global IDs';

-- ==========================================================
-- Format Validation Functions (returns 1 if valid, 0 if invalid)
-- ==========================================================

DELIMITER //

DROP FUNCTION IF EXISTS fn_is_valid_student_id//
-- Student ID Validation
CREATE FUNCTION fn_is_valid_student_id(p_id VARCHAR(15)) RETURNS TINYINT(1)
DETERMINISTIC
BEGIN
    RETURN p_id REGEXP '^STU-[0-9]{4}-[0-9]{6}$';
END//

DROP FUNCTION IF EXISTS fn_is_valid_employee_id//
-- Employee ID Validation
CREATE FUNCTION fn_is_valid_employee_id(p_id VARCHAR(13)) RETURNS TINYINT(1)
DETERMINISTIC
BEGIN
    RETURN p_id REGEXP '^EMP-[0-9]{4}-[0-9]{4}$';
END//

DROP FUNCTION IF EXISTS fn_is_valid_course_code//
-- Course Code Validation
CREATE FUNCTION fn_is_valid_course_code(p_code VARCHAR(10)) RETURNS TINYINT(1)
DETERMINISTIC
BEGIN
    RETURN p_code REGEXP '^[A-Z]{2,4}[0-9]{3,4}$';
END//

DROP FUNCTION IF EXISTS fn_is_valid_receipt_number//
-- Receipt Number Validation
CREATE FUNCTION fn_is_valid_receipt_number(p_id VARCHAR(20)) RETURNS TINYINT(1)
DETERMINISTIC
BEGIN
    RETURN p_id REGEXP '^RCP-[0-9]{8}-[0-9]{5}$';
END//

DROP FUNCTION IF EXISTS fn_is_valid_term_id//
-- Academic Term Identifier Validation
CREATE FUNCTION fn_is_valid_term_id(p_id VARCHAR(15)) RETURNS TINYINT(1)
DETERMINISTIC
BEGIN
    RETURN p_id REGEXP '^[0-9]{4}-(FALL|SPRING|SUMMER|WINTER)$';
END//

DROP FUNCTION IF EXISTS fn_is_valid_payment_ref//
-- Payment Reference Validation
CREATE FUNCTION fn_is_valid_payment_ref(p_id VARCHAR(16)) RETURNS TINYINT(1)
DETERMINISTIC
BEGIN
    RETURN p_id REGEXP '^PAY-[A-Z0-9]{12}$';
END//

DROP FUNCTION IF EXISTS fn_is_valid_batch_id//
-- Bulk-Enrollment Batch ID Validation
CREATE FUNCTION fn_is_valid_batch_id(p_id VARCHAR(17)) RETURNS TINYINT(1)
DETERMINISTIC
BEGIN
    RETURN p_id REGEXP '^BAT-[0-9]{8}-[0-9]{4}$';
END//

DROP FUNCTION IF EXISTS fn_is_valid_payroll_month//
-- Payroll Month Key Validation
CREATE FUNCTION fn_is_valid_payroll_month(p_id VARCHAR(7)) RETURNS TINYINT(1)
DETERMINISTIC
BEGIN
    RETURN p_id REGEXP '^[0-9]{4}-(0[1-9]|1[0-2])$';
END//

-- ==========================================================
-- Sequence Generator Functions
-- ==========================================================

DROP FUNCTION IF EXISTS fn_get_next_sequence//
-- Core generic sequence generator
CREATE FUNCTION fn_get_next_sequence(p_seq_name VARCHAR(100)) RETURNS BIGINT
MODIFIES SQL DATA
BEGIN
    DECLARE v_next BIGINT;
    
    INSERT INTO id_sequences (sequence_name, next_value) 
    VALUES (p_seq_name, 1)
    ON DUPLICATE KEY UPDATE next_value = next_value + 1;
    
    SELECT next_value INTO v_next FROM id_sequences WHERE sequence_name = p_seq_name;
    RETURN v_next;
END//

DROP FUNCTION IF EXISTS fn_generate_student_id//
-- Student ID Generator (e.g. STU-2023-000123)
CREATE FUNCTION fn_generate_student_id(p_year VARCHAR(4)) RETURNS VARCHAR(15)
MODIFIES SQL DATA
BEGIN
    DECLARE v_seq BIGINT;
    DECLARE v_seq_name VARCHAR(100);
    SET v_seq_name = CONCAT('student_', p_year);
    SET v_seq = fn_get_next_sequence(v_seq_name);
    RETURN CONCAT('STU-', p_year, '-', LPAD(v_seq, 6, '0'));
END//

DROP FUNCTION IF EXISTS fn_generate_employee_id//
-- Employee ID Generator (e.g. EMP-2023-0012)
CREATE FUNCTION fn_generate_employee_id(p_year VARCHAR(4)) RETURNS VARCHAR(13)
MODIFIES SQL DATA
BEGIN
    DECLARE v_seq BIGINT;
    DECLARE v_seq_name VARCHAR(100);
    SET v_seq_name = CONCAT('employee_', p_year);
    SET v_seq = fn_get_next_sequence(v_seq_name);
    RETURN CONCAT('EMP-', p_year, '-', LPAD(v_seq, 4, '0'));
END//

DROP FUNCTION IF EXISTS fn_generate_receipt_number//
-- Receipt Number Generator (e.g. RCP-20231025-00001)
CREATE FUNCTION fn_generate_receipt_number(p_date VARCHAR(8)) RETURNS VARCHAR(20)
MODIFIES SQL DATA
BEGIN
    DECLARE v_seq BIGINT;
    DECLARE v_seq_name VARCHAR(100);
    SET v_seq_name = CONCAT('receipt_', p_date);
    SET v_seq = fn_get_next_sequence(v_seq_name);
    RETURN CONCAT('RCP-', p_date, '-', LPAD(v_seq, 5, '0'));
END//

DROP FUNCTION IF EXISTS fn_generate_payment_ref//
-- Payment Reference Generator (e.g. PAY-A1B2C3D4E5F6)
-- Generates a pseudo-random 12-char alphanumeric string
CREATE FUNCTION fn_generate_payment_ref() RETURNS VARCHAR(16)
DETERMINISTIC
BEGIN
    RETURN CONCAT('PAY-', UPPER(SUBSTRING(MD5(RAND()), 1, 12)));
END//

DROP FUNCTION IF EXISTS fn_generate_batch_id//
-- Bulk-Enrollment Batch ID Generator (e.g. BAT-20231025-0001)
CREATE FUNCTION fn_generate_batch_id(p_date VARCHAR(8)) RETURNS VARCHAR(17)
MODIFIES SQL DATA
BEGIN
    DECLARE v_seq BIGINT;
    DECLARE v_seq_name VARCHAR(100);
    SET v_seq_name = CONCAT('batch_', p_date);
    SET v_seq = fn_get_next_sequence(v_seq_name);
    RETURN CONCAT('BAT-', p_date, '-', LPAD(v_seq, 4, '0'));
END//

DELIMITER ;
