-- db/schema/00_a_schema_version_fix.sql
-- Add file_name to schema_version to track applied files properly
ALTER TABLE schema_version ADD COLUMN file_name VARCHAR(255) NOT NULL;
