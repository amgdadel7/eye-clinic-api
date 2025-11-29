# توثيق قاعدة البيانات

يصف هذا المستند مخطط قاعدة البيانات والجداول والعلاقات لواجهة برمجة تطبيقات عيادة العيون.

## نظرة عامة

تستخدم واجهة برمجة تطبيقات عيادة العيون قاعدة بيانات MySQL 8.0+ مع ترميز الأحرف UTF-8 (utf8mb4) لدعم Unicode الكامل. تتبع قاعدة البيانات نموذجًا علائقيًا مع قيود المفاتيح الخارجية والفهارس لأداء مثالي.

## إعداد قاعدة البيانات

### إنشاء قاعدة البيانات

```sql
CREATE DATABASE eye_clinic_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE eye_clinic_db;
```

### تشغيل المخطط

```bash
mysql -u root -p eye_clinic_db < database/schema.sql
```

### تشغيل الهجرات

يتم تخزين الهجرات في دليل `database/migrations/`:

```bash
# تطبيق هجرة مصادقة المريض
python scripts/apply_patient_auth_migration.py --host localhost --user root --password your_password --database eye_clinic_db
```

## تكوين قاعدة البيانات

يتم تكوين اتصال قاعدة البيانات في `src/config/database.js`:

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

## الجداول

### 1. `clinics`

تخزن معلومات العيادة.

**الأعمدة:**
- `id` (INT, Primary Key, Auto Increment)
- `name` (VARCHAR(255), NOT NULL)
- `name_en` (VARCHAR(255), اسم إنجليزي اختياري)
- `code` (VARCHAR(50), UNIQUE, NOT NULL)
- `license` (VARCHAR(100), NOT NULL)
- `phone` (VARCHAR(20), NOT NULL)
- `email` (VARCHAR(255), NOT NULL)
- `address` (TEXT)
- `address_en` (TEXT, عنوان إنجليزي اختياري)
- `specialty` (VARCHAR(100))
- `owner_id` (INT)
- `status` (ENUM: 'active', 'inactive', 'pending', DEFAULT: 'active')
- `website` (VARCHAR(255))
- `working_hours` (JSON)
- `services` (JSON)
- `services_en` (JSON, خدمات إنجليزية اختيارية)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

---

### 2. `users`

تخزن مستخدمي النظام (المديرون، الأطباء، موظفو الاستقبال).

**الأعمدة:**
- `id` (INT, Primary Key, Auto Increment)
- `name` (VARCHAR(255), NOT NULL)
- `email` (VARCHAR(255), UNIQUE, NOT NULL)
- `phone` (VARCHAR(20), NOT NULL)
- `password` (VARCHAR(255), NOT NULL, مشفر باستخدام bcrypt)
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

**الفهارس:**
- `idx_clinic_id` على `clinic_id`
- `idx_user_role` على `role`

---

### 3. `doctors`

معلومات الطبيب الموسعة.

**الأعمدة:**
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

تخزن سجلات المرضى.

**الأعمدة:**
- `id` (INT, Primary Key, Auto Increment)
- `name` (VARCHAR(255), NOT NULL)
- `phone` (VARCHAR(20), UNIQUE, NOT NULL)
- `email` (VARCHAR(255), UNIQUE)
- `password` (VARCHAR(255), مشفر باستخدام bcrypt)
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

**الفهارس:**
- `idx_patient_phone` على `phone`

---

### 5. `schedules`

جداول الأطباء.

**الأعمدة:**
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

جدولة المواعيد.

**الأعمدة:**
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

**الفهارس:**
- `idx_appointment_date` على `date`
- `idx_appointment_doctor` على `doctor_id`
- `idx_appointment_status` على `status`

---

### 7. `prescriptions`

الوصفات الطبية.

**الأعمدة:**
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

**الفهارس:**
- `idx_prescription_clinic` على `clinic_id`

---

### 8. `medical_reports`

التقارير الطبية.

**الأعمدة:**
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

**الفهارس:**
- `idx_medical_report_clinic` على `clinic_id`

---

### 9. `test_results`

نتائج الاختبارات.

**الأعمدة:**
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

**الفهارس:**
- `idx_test_result_clinic` على `clinic_id`

---

### 10. `color_blindness_tests`

اختبارات عمى الألوان (اختبارات إيشيهارا).

**الأعمدة:**
- `id` (INT, Primary Key, Auto Increment)
- `test_number` (INT, NOT NULL)
- `test_name` (VARCHAR(255))
- `image_base64` (LONGTEXT, NOT NULL)
- `correct_answer` (VARCHAR(50), NOT NULL)
- `description` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**الفهارس:**
- `idx_test_number` على `test_number`

---

### 11. `patient_test_answers`

إجابات المرضى على اختبارات الألوان.

**الأعمدة:**
- `id` (INT, Primary Key, Auto Increment)
- `patient_id` (INT, Foreign Key → patients.id, NOT NULL)
- `test_id` (INT, Foreign Key → color_blindness_tests.id, NOT NULL)
- `answer` (VARCHAR(50))
- `is_correct` (BOOLEAN)
- `submitted_at` (TIMESTAMP)

---

### 12. `waiting_room`

إدارة غرفة الانتظار.

**الأعمدة:**
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

**الفهارس:**
- `idx_waiting_status` على `status`
- `idx_waiting_doctor` على `doctor_id`
- `idx_waiting_clinic` على `clinic_id`

---

### 13. `notifications`

إشعارات النظام.

**الأعمدة:**
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

**الفهارس:**
- `idx_notification_user` على `user_id`
- `idx_notification_read` على `is_read`
- `idx_notification_type` على `type`

---

### 14. `user_settings`

تفضيلات المستخدم والإعدادات.

**الأعمدة:**
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

## العلاقات

### علاقات المفاتيح الخارجية

1. **users** → **clinics** (كثير إلى واحد)
   - `users.clinic_id` → `clinics.id`

2. **doctors** → **users** (واحد إلى واحد)
   - `doctors.user_id` → `users.id`

3. **doctors** → **clinics** (كثير إلى واحد)
   - `doctors.clinic_id` → `clinics.id`

4. **schedules** → **doctors** (كثير إلى واحد)
   - `schedules.doctor_id` → `doctors.id`

5. **appointments** → **patients** (كثير إلى واحد)
   - `appointments.patient_id` → `patients.id`

6. **appointments** → **doctors** (كثير إلى واحد)
   - `appointments.doctor_id` → `doctors.id`

7. **appointments** → **clinics** (كثير إلى واحد)
   - `appointments.clinic_id` → `clinics.id`

8. **prescriptions** → **patients** (كثير إلى واحد)
   - `prescriptions.patient_id` → `patients.id`

9. **prescriptions** → **doctors** (كثير إلى واحد)
   - `prescriptions.doctor_id` → `doctors.id`

10. **prescriptions** → **clinics** (كثير إلى واحد)
    - `prescriptions.clinic_id` → `clinics.id`

11. **medical_reports** → **patients** (كثير إلى واحد)
    - `medical_reports.patient_id` → `patients.id`

12. **medical_reports** → **doctors** (كثير إلى واحد)
    - `medical_reports.doctor_id` → `doctors.id`

13. **medical_reports** → **clinics** (كثير إلى واحد)
    - `medical_reports.clinic_id` → `clinics.id`

14. **test_results** → **patients** (كثير إلى واحد)
    - `test_results.patient_id` → `patients.id`

15. **test_results** → **doctors** (كثير إلى واحد)
    - `test_results.doctor_id` → `doctors.id`

16. **test_results** → **clinics** (كثير إلى واحد)
    - `test_results.clinic_id` → `clinics.id`

17. **patient_test_answers** → **patients** (كثير إلى واحد)
    - `patient_test_answers.patient_id` → `patients.id`

18. **patient_test_answers** → **color_blindness_tests** (كثير إلى واحد)
    - `patient_test_answers.test_id` → `color_blindness_tests.id`

19. **waiting_room** → **patients** (كثير إلى واحد)
    - `waiting_room.patient_id` → `patients.id`

20. **waiting_room** → **appointments** (كثير إلى واحد)
    - `waiting_room.appointment_id` → `appointments.id`

21. **waiting_room** → **doctors** (كثير إلى واحد)
    - `waiting_room.doctor_id` → `doctors.id`

22. **waiting_room** → **clinics** (كثير إلى واحد)
    - `waiting_room.clinic_id` → `clinics.id`

23. **notifications** → **users** (كثير إلى واحد)
    - `notifications.user_id` → `users.id`

24. **user_settings** → **users** (واحد إلى واحد)
    - `user_settings.user_id` → `users.id`

## الفهارس

يتم إنشاء فهارس على الأعمدة المستعلام عنها بشكل متكرر لأداء مثالي:

- **users**: `clinic_id`، `role`
- **patients**: `phone`
- **appointments**: `date`، `doctor_id`، `status`
- **waiting_room**: `status`، `doctor_id`، `clinic_id`
- **prescriptions**: `clinic_id`
- **medical_reports**: `clinic_id`
- **test_results**: `clinic_id`
- **color_blindness_tests**: `test_number`
- **notifications**: `user_id`، `is_read`، `type`

## ترميز الأحرف

جميع الجداول تستخدم ترميز الأحرف UTF-8 (utf8mb4) لدعم:
- الأحرف العربية
- الأحرف الإنجليزية
- الرموز التعبيرية والأحرف الخاصة
- دعم Unicode الكامل

## الهجرات

### الهجرات المتاحة

1. **20241109_add_patient_auth.sql**
   - يضيف دعم مصادقة المرضى
   - يضيف حقل كلمة المرور إلى جدول المرضى إن لم يكن موجودًا

### تشغيل الهجرات

```bash
python scripts/apply_patient_auth_migration.py \
  --host localhost \
  --user root \
  --password your_password \
  --database eye_clinic_db
```

## النسخ الاحتياطي والاستعادة

### النسخ الاحتياطي

```bash
mysqldump -u root -p eye_clinic_db > backup.sql
```

### الاستعادة

```bash
mysql -u root -p eye_clinic_db < backup.sql
```

## تحسين الأداء

1. **تجميع الاتصالات**: يستخدم تجميع اتصالات MySQL (الحد: 10)
2. **الفهارس**: تم إنشاؤها على الأعمدة المستعلام عنها بشكل متكرر
3. **المفاتيح الخارجية**: يضمن تكامل البيانات
4. **ترميز الأحرف**: UTF-8 (utf8mb4) للتخزين الأمثل

## أفضل الممارسات

1. استخدم دائمًا استعلامات معلمات لمنع حقن SQL
2. استخدم المعاملات للعمليات ذات الصلة
3. النسخ الاحتياطي المنتظم لقاعدة البيانات
4. مراقبة أداء الاستعلامات
5. الحفاظ على تحسين الفهارس

