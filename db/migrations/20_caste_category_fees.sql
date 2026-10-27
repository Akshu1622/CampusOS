-- db/migrations/20_caste_category_fees.sql
-- Phase-12 additive migration: Add caste/category support to student and fee_component tables
-- Allows castewise (General, OBC, SC, ST, EWS) fee structures, assignments, dues, ledger, and defaulter tracking

-- 1. Add caste_category to student table
ALTER TABLE student
    ADD COLUMN caste_category ENUM('GENERAL', 'OBC', 'SC', 'ST', 'EWS') NOT NULL DEFAULT 'GENERAL' 
    AFTER batch_year;

CREATE INDEX idx_student_caste_category ON student(caste_category);

-- 2. Add caste_category to fee_component table (ALL means applies to everyone, or specific category)
ALTER TABLE fee_component
    ADD COLUMN caste_category ENUM('ALL', 'GENERAL', 'OBC', 'SC', 'ST', 'EWS') NOT NULL DEFAULT 'ALL' 
    AFTER due_date;

CREATE INDEX idx_fee_comp_caste ON fee_component(caste_category);

-- 3. Replace UK_struct_comp to allow same component name with different caste categories
-- (e.g., 'Tuition Fee' for GENERAL vs 'Tuition Fee' for SC/ST)
ALTER TABLE fee_component
    DROP INDEX UK_struct_comp,
    ADD CONSTRAINT UK_struct_comp_caste UNIQUE (structure_id, component_name, caste_category);
