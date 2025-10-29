# دليل استخدام Postman لاختبار Eye Clinic API

## نظرة عامة
تم إنشاء ملفات Postman Collection شاملة لاختبار جميع endpoints في نظام إدارة عيادة العيون.

## الملفات المتوفرة

### 1. Eye_Clinic_API.postman_collection.json
- يحتوي على جميع endpoints منظمة في مجموعات منطقية
- يتضمن أمثلة بيانات واقعية للاختبار
- يحتوي على متغيرات ديناميكية للـ IDs

### 2. Eye_Clinic_API.postman_environment.json
- متغيرات البيئة للـ API
- URLs و tokens و IDs
- يمكن تحديثها حسب الحاجة

## كيفية الاستخدام

### الخطوة 1: استيراد الملفات
1. افتح Postman
2. اضغط على "Import" في الزاوية العلوية اليسرى
3. اسحب الملفين أو اضغط "Upload Files"
4. اختر كلا الملفين:
   - `Eye_Clinic_API.postman_collection.json`
   - `Eye_Clinic_API.postman_environment.json`

### الخطوة 2: إعداد البيئة
1. في Postman، انتقل إلى "Environments" في الشريط الجانبي
2. اختر "Eye Clinic API Environment"
3. تأكد من أن `base_url` مضبوط على `http://localhost:3000`
4. إذا كان الـ API يعمل على منفذ مختلف، غيّر القيمة

### الخطوة 3: تشغيل الـ API
تأكد من أن الـ API يعمل على الخادم المحلي:
```bash
cd eye-clinic-api
npm start
```

### الخطوة 4: اختبار Authentication
ابدأ بتسجيل عيادة جديدة:

1. **Register Clinic**
   - انتقل إلى "Authentication" > "Register Clinic"
   - اضغط "Send"
   - انسخ الـ token من الاستجابة

2. **تحديث المتغيرات**
   - انتقل إلى Environment
   - ضع الـ token في `admin_token`
   - احفظ التغييرات

### الخطوة 5: اختبار Endpoints أخرى
الآن يمكنك اختبار جميع endpoints الأخرى:

#### Authentication
- Login (System Users)
- Register User (Doctor/Receptionist)
- Get Current User

#### Mobile Authentication
- Register Patient
- Login Patient

#### Clinics
- Get All Clinics
- Get Clinic by ID
- Get Clinic Doctors
- Update Clinic

#### Patients
- Get All Patients
- Create Patient
- Update Patient

#### Doctors
- Get All Doctors
- Create Doctor
- Update Doctor
- Get Doctor Schedule

#### Appointments
- Get All Appointments
- Create Appointment
- Book Appointment (Mobile)

#### Medical Records
- Prescriptions
- Medical Reports
- Test Results

#### Color Blindness Tests
- Get All Tests
- Submit Test Answers (Mobile)

#### Analytics
- Dashboard Statistics
- Patient Statistics
- Revenue Statistics

## نصائح للاختبار

### 1. ترتيب الاختبارات
اختبر endpoints بالترتيب التالي:
1. Health Check
2. Register Clinic
3. Login
4. Create Doctor
5. Register Patient
6. Create Appointment
7. باقي العمليات

### 2. تحديث المتغيرات
بعد كل عملية إنشاء، حدث المتغيرات:
- `clinic_id` بعد تسجيل العيادة
- `doctor_id` بعد إنشاء الطبيب
- `patient_id` بعد تسجيل المريض
- `appointment_id` بعد إنشاء الموعد

### 3. اختبار الأخطاء
اختبر أيضاً حالات الخطأ:
- بيانات غير صحيحة
- tokens منتهية الصلاحية
- صلاحيات غير كافية

### 4. اختبار Mobile Endpoints
لاختبار endpoints المخصصة للموبايل:
1. سجل مريض جديد
2. احصل على patient token
3. ضع الـ token في `patient_token`
4. اختبر Mobile endpoints

## استكشاف الأخطاء

### مشاكل شائعة:

#### 1. Connection Refused
- تأكد من أن الـ API يعمل
- تحقق من المنفذ (3000)
- تحقق من `base_url` في Environment

#### 2. Authentication Failed
- تأكد من صحة الـ token
- تحقق من انتهاء صلاحية الـ token
- تأكد من إرسال الـ token في Header

#### 3. Database Errors
- تأكد من اتصال قاعدة البيانات
- تحقق من صحة البيانات المرسلة
- تأكد من وجود البيانات المطلوبة

#### 4. Validation Errors
- تحقق من صحة البيانات المرسلة
- تأكد من إرسال جميع الحقول المطلوبة
- تحقق من تنسيق البيانات (JSON)

## أمثلة على الاستخدام

### تسجيل عيادة جديدة:
```json
{
    "clinicName": "عيادة العيون المتقدمة",
    "clinicLicense": "EYE2024001",
    "clinicPhone": "+966501234567",
    "clinicEmail": "info@clinic.com",
    "ownerName": "د. أحمد محمد",
    "ownerEmail": "ahmed@clinic.com",
    "ownerPhone": "+966501234567",
    "ownerPassword": "SecurePass123!"
}
```

### تسجيل مريض:
```json
{
    "name": "أحمد علي",
    "phone": "+966501234567",
    "email": "ahmed@patient.com",
    "password": "patient123",
    "age": 30,
    "gender": "male",
    "dateOfBirth": "1990-01-01",
    "address": "الرياض، المملكة العربية السعودية"
}
```

### حجز موعد:
```json
{
    "doctor_id": 1,
    "type": "consultation",
    "notes": "فحص دوري للعين",
    "preferred_date": "2024-12-15"
}
```

## ملاحظات مهمة

1. **الأمان**: لا تشارك الـ tokens في الإنتاج
2. **البيانات**: استخدم بيانات وهمية للاختبار فقط
3. **النسخ الاحتياطي**: احتفظ بنسخة احتياطية من قاعدة البيانات
4. **التحديث**: حدث المتغيرات بعد كل عملية إنشاء
5. **الاختبار**: اختبر جميع السيناريوهات (نجاح وفشل)

## الدعم

إذا واجهت أي مشاكل:
1. تحقق من logs الـ API
2. تأكد من صحة البيانات المرسلة
3. تحقق من اتصال قاعدة البيانات
4. راجع التوثيق في README.md

---

تم إنشاء هذا الدليل لمساعدتك في اختبار API نظام إدارة عيادة العيون بشكل شامل وفعال.

