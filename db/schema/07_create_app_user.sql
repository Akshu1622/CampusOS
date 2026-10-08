-- Additive migration to create app and migrator users before 08_grants_fix.sql
CREATE USER IF NOT EXISTS 'app'@'%' IDENTIFIED BY 'apppass123';
CREATE USER IF NOT EXISTS 'migrator'@'%' IDENTIFIED BY 'migratorpass123';
FLUSH PRIVILEGES;
