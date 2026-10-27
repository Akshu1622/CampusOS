-- Migration 19: Add email and phone contact fields to employee table
-- Required by M1 PUT /me endpoint for faculty/admin users
-- Phase-12 additive migration (frozen-file rule: no existing schema files were edited)

ALTER TABLE employee
    ADD COLUMN email   VARCHAR(100) NULL COMMENT 'Work email address' AFTER last_name,
    ADD COLUMN phone   VARCHAR(20)  NULL COMMENT 'Contact phone number' AFTER email;

-- Grant the app user update access to these new columns (already covered by existing grants)
-- No additional grants needed — app user has UPDATE privilege on employee table.
