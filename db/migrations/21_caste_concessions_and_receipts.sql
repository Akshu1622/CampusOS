-- db/migrations/21_caste_concessions_and_receipts.sql
-- Add concession_percent to fee_component table for caste-based fee concessions
-- Allows specifying fee concessions (e.g. 100% or 50% for SC/ST, 25% for OBC, 50% for EWS)

ALTER TABLE fee_component
    ADD COLUMN concession_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00
    AFTER caste_category;
