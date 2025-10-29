-- تشغيل البيانات الافتراضية لخمس عيادات
-- تأكد من أن قاعدة البيانات موجودة أولاً

-- إنشاء قاعدة البيانات إذا لم تكن موجودة
CREATE DATABASE IF NOT EXISTS eye_clinic_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE eye_clinic_db;

-- تشغيل ملف البيانات الافتراضية
SOURCE database/sample_data.sql;

