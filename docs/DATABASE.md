# Database Documentation

This document describes the database schema, tables, and relationships for the Eye Clinic API.

## Overview

The Eye Clinic API uses MySQL 8.0+ database with UTF-8 (utf8mb4) character encoding for full Unicode support. The database follows a relational model with foreign key constraints and indexes for optimal performance.

## Database Setup

### Creating the Database

```sql
CREATE DATABASE eye_clinic_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE eye_clinic_db;
```

### Running the Schema

```bash
mysql -u root -p eye_clinic_db < database/schema.sql
```

### Running Migrations

Migrations are stored in `database/migrations/` directory:

```bash
# Apply patient auth migration
python scripts/apply_patient_auth_migration.py --host localhost --user root --password your_password --database eye_clinic_db
```

## Database Configuration

The database connection is configured in `src/config/database.js`:

```javascript
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'eye_clinic_db',
    port: process.env.DB_PORT || 3306,
    connectionLimit: 10,
    charset: 'utf8mb4'
});
```

## Tables

### 1. `clinics`

Stores clinic information.

**Columns:**
- `id` (INT, Primary Key, Auto Increment)
- `name` (VARCHAR(255), NOT NULL)
- `name_en` (VARCHAR(255), Optional English name)
- `code` (VARCHAR(50), UNIQUE, NOT NULL)
- `license` (VARCHAR(100), NOT NULL)
- `phone` (VARCHAR(20), NOT NULL)
- `email` (VARCHAR(255), NOT NULL)
- `address` (TEXT)
- `address_en` (TEXT, Optional English address)
- `specialty` (VARCHAR(100))
- `owner_id` (INT)
- `status` (ENUM: 'active', 'inactive', 'pending', DEFAULT: 'active')
- `website` (VARCHAR(255))
- `working_hours` (JSON)
- `services` (JSON)
- `services_en` (JSON, Optional English services)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

---

### 2. `users`

Stores system users (admins, doctors, receptionists).

**Columns:**
- `id` (INT, Primary Key, Auto Increment)
- `name` (VARCHAR(255), NOT NULL)
- `email` (VARCHAR(255), UNIQUE, NOT NULL)
- `phone` (VARCHAR(20), NOT NULL)
- `password` (VARCHAR(255), NOT NULL, Hashed with bcrypt)
- `role` (ENUM: 'admin', 'doctor', 'receptionist', NOT NULL)
- `clinic_id` (INT, Foreign Key → clinics.id, NOT NULL)
- `status` (ENUM: 'active', 'pending', 'rejected', 'inactive', DEFAULT: 'pending')
- `avatar` (VARCHAR(10))
- `department` (VARCHAR(100))
- `specialty` (VARCHAR(100))
- `join_date` (DATE)
- `last_login` (TIMESTAMP, NULL)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Indexes:**
- `idx_clinic_id` on `clinic_id`
- `idx_user_role` on `role`

---

### 3. `doctors`

Extended doctor information.

**Columns:**
- `id` (INT, Primary Key, Auto Increment)
- `user_id` (INT, Foreign Key → users.id, UNIQUE, NOT NULL)
- `doctor_id` (VARCHAR(50), UNIQUE, NOT NULL)
- `specialization` (VARCHAR(255), NOT NULL)
- `specialty_id` (VARCHAR(50))
- `clinic_id` (INT, Foreign Key → clinics.id, NOT NULL)
- `experience` (VARCHAR(100))
- `license_number` (VARCHAR(100))
- `patients_count` (INT, DEFAULT: 0)
- `rating` (DECIMAL(3,2), DEFAULT: 0.00)
- `status` (ENUM: 'active', 'inactive', DEFAULT: 'active')
- `join_date` (DATE)
- `working_hours` (JSON)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

---

### 4. `patients`

Stores patient records.

**Columns:**
- `id` (INT, Primary Key, Auto Increment)
- `name` (VARCHAR(255), NOT NULL)
- `phone` (VARCHAR(20), UNIQUE, NOT NULL)
- `email` (VARCHAR(255), UNIQUE)
- `password` (VARCHAR(255), Hashed with bcrypt)
- `age` (INT)
- `gender` (ENUM: 'male', 'female')
- `date_of_birth` (DATE)
- `address` (TEXT)
- `medical_record` (VARCHAR(50))
- `color_deficiency_type` (VARCHAR(50), DEFAULT: 'Normal')
- `last_visit` (DATE)
- `status` (ENUM: 'active', 'inactive', DEFAULT: 'active')
- `avatar` (VARCHAR(10))
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Indexes:**
- `idx_patient_phone` on `phone`

---

### 5. `schedules`

Doctor schedules.

**Columns:**
- `id` (INT, Primary Key, Auto Increment)
- `doctor_id` (INT, Foreign Key → doctors.id, NOT NULL)
- `doctor_name` (VARCHAR(255), NOT NULL)
- `day_of_week` (VARCHAR(20), NOT NULL)
- `start_time` (TIME, NOT NULL)
- `end_time` (TIME, NOT NULL)
- `is_active` (BOOLEAN, DEFAULT: TRUE)
- `max_patients` (INT, DEFAULT: 20)
- `break_start_time` (TIME)
- `break_end_time` (TIME)
- `notes` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

---

### 6. `appointments`

Appointment scheduling.

**Columns:**
- `id` (INT, Primary Key, Auto Increment)
- `patient_id` (INT, Foreign Key → patients.id, NOT NULL)
- `patient_name` (VARCHAR(255), NOT NULL)
- `doctor_id` (INT, Foreign Key → doctors.id, NOT NULL)
- `doctor_name` (VARCHAR(255), NOT NULL)
- `clinic_id` (INT, Foreign Key → clinics.id, NOT NULL)
- `date` (DATE, NOT NULL)
- `time` (TIME, NOT NULL)
- `type` (VARCHAR(100))
- `status` (ENUM: 'confirmed', 'pending', 'completed', 'cancelled', DEFAULT: 'pending')
- `phone` (VARCHAR(20))
- `avatar` (VARCHAR(10))
- `notes` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Indexes:**
- `idx_appointment_date` on `date`
- `idx_appointment_doctor` on `doctor_id`
- `idx_appointment_status` on `status`

---

### 7. `prescriptions`

Medical prescriptions.

**Columns:**
- `id` (INT, Primary Key, Auto Increment)
- `patient_id` (INT, Foreign Key → patients.id, NOT NULL)
- `patient_name` (VARCHAR(255), NOT NULL)
- `doctor_id` (INT, Foreign Key → doctors.id, NOT NULL)
- `doctor_name` (VARCHAR(255), NOT NULL)
- `clinic_id` (INT, Foreign Key → clinics.id, NOT NULL)
- `date` (DATE, NOT NULL)
- `medications` (JSON, NOT NULL)
- `instructions` (TEXT)
- `diagnosis` (TEXT)
- `follow_up_date` (DATE)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Indexes:**
- `idx_prescription_clinic` on `clinic_id`

---

### 8. `medical_reports`

Medical reports.

**Columns:**
- `id` (INT, Primary Key, Auto Increment)
- `patient_id` (INT, Foreign Key → patients.id, NOT NULL)
- `patient_name` (VARCHAR(255), NOT NULL)
- `doctor_id` (INT, Foreign Key → doctors.id, NOT NULL)
- `doctor_name` (VARCHAR(255), NOT NULL)
- `clinic_id` (INT, Foreign Key → clinics.id, NOT NULL)
- `date` (DATE, NOT NULL)
- `report_type` (VARCHAR(100))
- `diagnosis` (TEXT)
- `treatment` (TEXT)
- `notes` (TEXT)
- `recommendations` (JSON)
- `vital_signs` (JSON)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Indexes:**
- `idx_medical_report_clinic` on `clinic_id`

---

### 9. `test_results`

Test results.

**Columns:**
- `id` (INT, Primary Key, Auto Increment)
- `patient_id` (INT, Foreign Key → patients.id, NOT NULL)
- `patient_name` (VARCHAR(255), NOT NULL)
- `doctor_id` (INT, Foreign Key → doctors.id, NOT NULL)
- `doctor_name` (VARCHAR(255), NOT NULL)
- `clinic_id` (INT, Foreign Key → clinics.id, NOT NULL)
- `test_type` (VARCHAR(100), NOT NULL)
- `test_date` (DATE, NOT NULL)
- `result` (TEXT)
- `severity` (VARCHAR(50))
- `status` (VARCHAR(50))
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Indexes:**
- `idx_test_result_clinic` on `clinic_id`

---

### 10. `color_blindness_tests`

Color blindness tests (Ishihara tests).

**Columns:**
- `id` (INT, Primary Key, Auto Increment)
- `test_number` (INT, NOT NULL)
- `test_name` (VARCHAR(255))
- `image_base64` (LONGTEXT, NOT NULL)
- `correct_answer` (VARCHAR(50), NOT NULL)
- `description` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Indexes:**
- `idx_test_number` on `test_number`

---

### 11. `patient_test_answers`

Patient answers to color tests.

**Columns:**
- `id` (INT, Primary Key, Auto Increment)
- `patient_id` (INT, Foreign Key → patients.id, NOT NULL)
- `test_id` (INT, Foreign Key → color_blindness_tests.id, NOT NULL)
- `answer` (VARCHAR(50))
- `is_correct` (BOOLEAN)
- `submitted_at` (TIMESTAMP)

---

### 12. `waiting_room`

Waiting room management.

**Columns:**
- `id` (INT, Primary Key, Auto Increment)
- `patient_id` (INT, Foreign Key → patients.id, NOT NULL)
- `patient_name` (VARCHAR(255), NOT NULL)
- `appointment_id` (INT, Foreign Key → appointments.id, NOT NULL)
- `doctor_id` (INT, Foreign Key → doctors.id, NOT NULL)
- `clinic_id` (INT, Foreign Key → clinics.id, NOT NULL)
- `arrival_time` (DATETIME, NOT NULL)
- `status` (ENUM: 'waiting', 'in-progress', 'completed', 'associated', DEFAULT: 'waiting')
- `priority` (ENUM: 'normal', 'urgent', 'emergency', DEFAULT: 'normal')
- `doctor_name` (VARCHAR(255), NOT NULL)
- `wait_time` (INT, DEFAULT: 0)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Indexes:**
- `idx_waiting_status` on `status`
- `idx_waiting_doctor` on `doctor_id`
- `idx_waiting_clinic` on `clinic_id`

---

### 13. `notifications`

System notifications.

**Columns:**
- `id` (INT, Primary Key, Auto Increment)
- `user_id` (INT, Foreign Key → users.id)
- `title` (VARCHAR(255), NOT NULL)
- `message` (TEXT, NOT NULL)
- `type` (ENUM: 'appointment', 'patient', 'doctor', 'system', 'reminder', 'alert', DEFAULT: 'system')
- `priority` (ENUM: 'low', 'medium', 'high', 'urgent', DEFAULT: 'medium')
- `is_read` (BOOLEAN, DEFAULT: FALSE)
- `action_url` (VARCHAR(255))
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Indexes:**
- `idx_notification_user` on `user_id`
- `idx_notification_read` on `is_read`
- `idx_notification_type` on `type`

---

### 14. `user_settings`

User preferences and settings.

**Columns:**
- `id` (INT, Primary Key, Auto Increment)
- `user_id` (INT, Foreign Key → users.id, UNIQUE, NOT NULL)
- `language` (VARCHAR(10), DEFAULT: 'ar')
- `theme` (ENUM: 'light', 'dark', DEFAULT: 'light')
- `sidebar_collapsed` (BOOLEAN, DEFAULT: FALSE)
- `sound_notifications` (BOOLEAN, DEFAULT: TRUE)
- `email_notifications` (BOOLEAN, DEFAULT: TRUE)
- `sms_notifications` (BOOLEAN, DEFAULT: FALSE)
- `push_notifications` (BOOLEAN, DEFAULT: TRUE)
- `appointment_reminders` (BOOLEAN, DEFAULT: TRUE)
- `new_appointment_alerts` (BOOLEAN, DEFAULT: TRUE)
- `system_alerts` (BOOLEAN, DEFAULT: TRUE)
- `reminder_time_minutes` (INT, DEFAULT: 30)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Relationships

### Foreign Key Relationships

1. **users** → **clinics** (many-to-one)
   - `users.clinic_id` → `clinics.id`

2. **doctors** → **users** (one-to-one)
   - `doctors.user_id` → `users.id`

3. **doctors** → **clinics** (many-to-one)
   - `doctors.clinic_id` → `clinics.id`

4. **schedules** → **doctors** (many-to-one)
   - `schedules.doctor_id` → `doctors.id`

5. **appointments** → **patients** (many-to-one)
   - `appointments.patient_id` → `patients.id`

6. **appointments** → **doctors** (many-to-one)
   - `appointments.doctor_id` → `doctors.id`

7. **appointments** → **clinics** (many-to-one)
   - `appointments.clinic_id` → `clinics.id`

8. **prescriptions** → **patients** (many-to-one)
   - `prescriptions.patient_id` → `patients.id`

9. **prescriptions** → **doctors** (many-to-one)
   - `prescriptions.doctor_id` → `doctors.id`

10. **prescriptions** → **clinics** (many-to-one)
    - `prescriptions.clinic_id` → `clinics.id`

11. **medical_reports** → **patients** (many-to-one)
    - `medical_reports.patient_id` → `patients.id`

12. **medical_reports** → **doctors** (many-to-one)
    - `medical_reports.doctor_id` → `doctors.id`

13. **medical_reports** → **clinics** (many-to-one)
    - `medical_reports.clinic_id` → `clinics.id`

14. **test_results** → **patients** (many-to-one)
    - `test_results.patient_id` → `patients.id`

15. **test_results** → **doctors** (many-to-one)
    - `test_results.doctor_id` → `doctors.id`

16. **test_results** → **clinics** (many-to-one)
    - `test_results.clinic_id` → `clinics.id`

17. **patient_test_answers** → **patients** (many-to-one)
    - `patient_test_answers.patient_id` → `patients.id`

18. **patient_test_answers** → **color_blindness_tests** (many-to-one)
    - `patient_test_answers.test_id` → `color_blindness_tests.id`

19. **waiting_room** → **patients** (many-to-one)
    - `waiting_room.patient_id` → `patients.id`

20. **waiting_room** → **appointments** (many-to-one)
    - `waiting_room.appointment_id` → `appointments.id`

21. **waiting_room** → **doctors** (many-to-one)
    - `waiting_room.doctor_id` → `doctors.id`

22. **waiting_room** → **clinics** (many-to-one)
    - `waiting_room.clinic_id` → `clinics.id`

23. **notifications** → **users** (many-to-one)
    - `notifications.user_id` → `users.id`

24. **user_settings** → **users** (one-to-one)
    - `user_settings.user_id` → `users.id`

## Indexes

Indexes are created on frequently queried columns for optimal performance:

- **users**: `clinic_id`, `role`
- **patients**: `phone`
- **appointments**: `date`, `doctor_id`, `status`
- **waiting_room**: `status`, `doctor_id`, `clinic_id`
- **prescriptions**: `clinic_id`
- **medical_reports**: `clinic_id`
- **test_results**: `clinic_id`
- **color_blindness_tests**: `test_number`
- **notifications**: `user_id`, `is_read`, `type`

## Character Encoding

All tables use UTF-8 (utf8mb4) character encoding to support:
- Arabic characters
- English characters
- Emojis and special characters
- Full Unicode support

## Migrations

### Available Migrations

1. **20241109_add_patient_auth.sql**
   - Adds patient authentication support
   - Adds password field to patients table if not exists

### Running Migrations

```bash
python scripts/apply_patient_auth_migration.py \
  --host localhost \
  --user root \
  --password your_password \
  --database eye_clinic_db
```

## Backup and Restore

### Backup

```bash
mysqldump -u root -p eye_clinic_db > backup.sql
```

### Restore

```bash
mysql -u root -p eye_clinic_db < backup.sql
```

## Performance Optimization

1. **Connection Pooling**: Uses MySQL connection pool (limit: 10)
2. **Indexes**: Created on frequently queried columns
3. **Foreign Keys**: Ensures data integrity
4. **Character Encoding**: UTF-8 (utf8mb4) for optimal storage

## Best Practices

1. Always use parameterized queries to prevent SQL injection
2. Use transactions for related operations
3. Regular database backups
4. Monitor query performance
5. Keep indexes optimized

