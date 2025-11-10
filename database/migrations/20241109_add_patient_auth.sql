-- Migration: Add patient authentication support
-- Date: 2024-11-09

-- Add password column if missing
SET @col_exists := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'patients'
      AND column_name = 'password'
);
SET @ddl := IF(
    @col_exists = 0,
    'ALTER TABLE patients ADD COLUMN password VARCHAR(255) NULL AFTER email;',
    'SELECT 1;'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure phone uniqueness
SET @idx_phone := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'patients'
      AND index_name = 'uq_patients_phone'
);
SET @ddl := IF(
    @idx_phone = 0,
    'ALTER TABLE patients ADD UNIQUE KEY uq_patients_phone (phone);',
    'SELECT 1;'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure email uniqueness (allows multiple NULLs by MySQL rules)
SET @idx_email := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'patients'
      AND index_name = 'uq_patients_email'
);
SET @ddl := IF(
    @idx_email = 0,
    'ALTER TABLE patients ADD UNIQUE KEY uq_patients_email (email);',
    'SELECT 1;'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Backfill default hashed password for existing patients (Patient@123)
UPDATE patients
SET password = '$2a$10$jijxENZT8Qn9e.0EZcjmYO789.YS8pQMVVGQARvZGWApZFaFNKbTi'
WHERE password IS NULL OR password = '';
