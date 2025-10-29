-- UTF-8/utf8mb4 migration script for MySQL 8
-- Run with: mysql -u root -p < eye-clinic-api/database/utf8mb4_migration.sql

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = utf8mb4_unicode_ci;
SET character_set_client = utf8mb4;
SET character_set_results = utf8mb4;
SET character_set_connection = utf8mb4;

-- Adjust the database name if different
ALTER DATABASE eye_clinic_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE eye_clinic_db;

-- Convert all existing tables to utf8mb4/utf8mb4_unicode_ci
-- Note: Safe in dev; for prod, review per-table before running.
SET @sql = NULL;
SELECT GROUP_CONCAT(CONCAT('ALTER TABLE `', TABLE_NAME, '` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci') SEPARATOR '; ')
INTO @sql
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE';

SET @sql = CONCAT(@sql, ';');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure textual columns default collation (optional explicit per-column change example)
-- Example: ALTER TABLE patients MODIFY name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Verify
SHOW VARIABLES LIKE 'character_set_%';
SHOW VARIABLES LIKE 'collation_%';

