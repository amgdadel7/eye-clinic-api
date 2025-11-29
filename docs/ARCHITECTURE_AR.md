# توثيق البنية المعمارية

يصف هذا المستند البنية المعمارية والهيكل لواجهة برمجة تطبيقات عيادة العيون.

## نظرة عامة على النظام

واجهة برمجة تطبيقات عيادة العيون هي واجهة برمجة تطبيقات RESTful مبنية باستخدام Node.js و Express.js. تتبع نمط بنية طبقات مع فصل واضح للمخاوف:

- **طبقة المسارات**: تحدد نقاط نهاية واجهة برمجة التطبيقات وطرق HTTP
- **طبقة المتحكمات**: تتعامل مع منطق الأعمال ومعالجة الطلبات
- **طبقة البرامج الوسيطة**: المصادقة والتفويض ومعالجة الأخطاء
- **طبقة البيانات**: اتصالات قاعدة البيانات والاستعلامات

## هيكل المشروع

```
eye-clinic-api/
├── api/                          # نقاط دخول Vercel serverless
│   ├── health.js                 # فحص الصحة serverless
│   └── index.js                  # نقطة دخول serverless الرئيسية
├── database/                     # ملفات قاعدة البيانات
│   ├── migrations/               # هجرات قاعدة البيانات
│   │   └── 20241109_add_patient_auth.sql
│   ├── schema.sql                # مخطط قاعدة البيانات
│   ├── sample_data.sql           # بيانات تجريبية
│   └── utf8mb4_migration.sql     # سكريبت هجرة UTF-8
├── scripts/                      # البرامج المساعدة
│   └── apply_patient_auth_migration.py
├── src/
│   ├── app.js                    # تكوين تطبيق Express
│   ├── server.js                 # نقطة دخول الخادم
│   ├── config/                   # ملفات التكوين
│   │   ├── database.js           # مجموعة اتصالات قاعدة البيانات
│   │   └── swagger.js            # إعداد توثيق Swagger
│   ├── controllers/              # معالجات الطلبات (منطق الأعمال)
│   │   ├── analyticsController.js
│   │   ├── appointmentController.js
│   │   ├── authController.js
│   │   ├── clinicController.js
│   │   ├── colorTestController.js
│   │   ├── doctorController.js
│   │   ├── medicalReportController.js
│   │   ├── mobileAppointmentController.js
│   │   ├── mobileAuthController.js
│   │   ├── mobileColorTestController.js
│   │   ├── mobilePrescriptionController.js
│   │   ├── mobileReportController.js
│   │   ├── mobileTestResultController.js
│   │   ├── patientController.js
│   │   ├── prescriptionController.js
│   │   ├── settingsController.js
│   │   ├── testResultController.js
│   │   ├── uiController.js
│   │   ├── userController.js
│   │   ├── userSettingsController.js
│   │   └── waitingRoomController.js
│   ├── middleware/               # البرامج الوسيطة المخصصة
│   │   ├── auth.js               # مصادقة و تفويض JWT
│   │   └── errorHandler.js       # برنامج وسيط معالجة الأخطاء
│   ├── routes/                   # تعريفات المسارات
│   │   ├── analytics.js
│   │   ├── appointments.js
│   │   ├── auth.js
│   │   ├── clinics.js
│   │   ├── colorTests.js
│   │   ├── doctors.js
│   │   ├── medicalReports.js
│   │   ├── mobileAppointments.js
│   │   ├── mobileAuth.js
│   │   ├── mobileColorTests.js
│   │   ├── mobilePrescriptions.js
│   │   ├── mobileReports.js
│   │   ├── mobileTestResults.js
│   │   ├── patients.js
│   │   ├── prescriptions.js
│   │   ├── reports.js
│   │   ├── settings.js
│   │   ├── testResults.js
│   │   ├── ui.js
│   │   ├── users.js
│   │   ├── userSettings.js
│   │   └── waitingRoom.js
│   └── utils/                    # الدوال المساعدة
│       └── response.js           # دوال مساعدة الاستجابة
├── package.json
└── README.md
```

## طبقات البنية المعمارية

### 1. طبقة المسارات (`src/routes/`)

تحدد المسارات نقاط نهاية واجهة برمجة التطبيقات وتربط طرق HTTP بوظائف المتحكمات. كما تطبق البرامج الوسيطة للمصادقة والتفويض.

**مثال:**
```javascript
const express = require('express');
const router = express.Router();
const controller = require('../controllers/controller');
const { authenticateToken, authorize } = require('../middleware/auth');

router.use(authenticateToken);  // تطبيق على جميع المسارات
router.get('/', controller.getAll);
router.post('/', authorize('admin'), controller.create);
```

### 2. طبقة المتحكمات (`src/controllers/`)

تحتوي المتحكمات على منطق الأعمال لمعالجة الطلبات. تقوم بـ:
- التحقق من بيانات الإدخال
- التفاعل مع قاعدة البيانات
- معالجة منطق الأعمال
- تنسيق وإرجاع الاستجابات

**مثال:**
```javascript
const pool = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

const getAllPatients = async (req, res) => {
    try {
        const [patients] = await pool.query('SELECT * FROM patients');
        sendSuccess(res, patients, 'تم استرداد المرضى بنجاح');
    } catch (error) {
        sendError(res, error.message, 500);
    }
};
```

### 3. طبقة البرامج الوسيطة (`src/middleware/`)

تقوم دوال البرامج الوسيطة بمعالجة الطلبات قبل وصولها إلى المتحكمات:

- **برنامج وسيط المصادقة** (`auth.js`): يتحقق من رموز JWT
- **برنامج وسيط التفويض**: يتحقق من أدوار المستخدمين والأذونات
- **برنامج وسيط معالجة الأخطاء** (`errorHandler.js`): يلتقط ويُنسق الأخطاء

### 4. طبقة البيانات (`src/config/database.js`)

تستخدم طبقة قاعدة البيانات مجموعة اتصالات لإدارة اتصالات قاعدة البيانات بكفاءة:

```javascript
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10,
    charset: 'utf8mb4'
});
```

## تدفق الطلب

1. **طلب العميل** → طلب HTTP إلى نقطة نهاية واجهة برمجة التطبيقات
2. **برنامج وسيط CORS** → يتحقق من المصدر ويضبط الرؤوس
3. **تحديد المعدل** → يحد من الطلبات لكل IP
4. **تحليل الجسم** → يحلل بيانات JSON/المشفرة في URL
5. **المصادقة** → يتحقق من رمز JWT (إن لزم الأمر)
6. **التفويض** → يتحقق من أذونات المستخدم
7. **معالج المسار** → يوجه الطلب إلى المتحكم المناسب
8. **المتحكم** → يعالج منطق الأعمال
9. **استعلام قاعدة البيانات** → ينفذ استعلامات SQL
10. **الاستجابة** → يُرجع استجابة JSON منسقة
11. **معالجة الأخطاء** → يلتقط ويُنسق الأخطاء

## بنية قاعدة البيانات

### مجموعة الاتصالات

تستخدم واجهة برمجة التطبيقات تجميع اتصالات MySQL لإدارة اتصالات قاعدة البيانات بكفاءة:
- **حد الاتصال**: 10 اتصالات متزامنة
- **حد قائمة الانتظار**: 0 (قائمة انتظار غير محدودة)
- **Keep-Alive**: مفعل للحفاظ على الاتصالات
- **مجموعة الأحرف**: UTF-8 (utf8mb4) لدعم Unicode الكامل

### الجداول

الجداول الرئيسية في قاعدة البيانات:
- `clinics` - معلومات العيادة
- `users` - مستخدمو النظام (المديرون، الأطباء، موظفو الاستقبال)
- `doctors` - معلومات الطبيب الموسعة
- `patients` - سجلات المرضى
- `appointments` - جدولة المواعيد
- `prescriptions` - الوصفات الطبية
- `medical_reports` - التقارير الطبية
- `test_results` - نتائج الاختبارات
- `color_tests` - اختبارات عمى الألوان
- `schedules` - جداول الأطباء
- `waiting_room` - إدارة غرفة الانتظار

## المصادقة والتفويض

### مصادقة JWT

- يتم إنشاء الرموز عند تسجيل الدخول
- انتهاء صلاحية الرمز: 7 أيام (قابل للتكوين)
- يتم تخزين الرمز في رأس Authorization كرمز Bearer

### التحكم في الوصول القائم على الأدوار

ثلاثة أدوار للمستخدمين:
1. **المدير**: الوصول الكامل إلى جميع نقاط النهاية
2. **الطبيب**: الوصول إلى سجلات المرضى والمواعيد والوصفات والتقارير
3. **موظف الاستقبال**: وصول محدود لإدارة المرضى والمواعيد

### برنامج وسيط التفويض

```javascript
authorize('admin', 'doctor')  // يسمح للمدير أو الطبيب
authorize('admin')            // المدير فقط
```

## أنماط تصميم واجهة برمجة التطبيقات

### مبادئ RESTful

- **GET**: استرداد الموارد
- **POST**: إنشاء الموارد
- **PUT**: تحديث الموارد
- **DELETE**: إزالة الموارد

### تنسيق الاستجابة

جميع الاستجابات تتبع تنسيقًا ثابتًا:

**النجاح:**
```json
{
  "success": true,
  "message": "تمت العملية بنجاح",
  "data": { ... }
}
```

**الخطأ:**
```json
{
  "success": false,
  "message": "رسالة الخطأ"
}
```

## ميزات الأمان

1. **مصادقة JWT**: مصادقة آمنة قائمة على الرموز
2. **تشفير كلمات المرور**: bcryptjs لتخزين كلمات المرور
3. **تحديد المعدل**: يمنع إساءة الاستخدام (100 طلب/15 دقيقة)
4. **تكوين CORS**: يحد من المصادر المسموح بها
5. **التحقق من المدخلات**: express-validator للتحقق من الطلبات
6. **منع حقن SQL**: استعلامات معلمات عبر mysql2

## معالجة الأخطاء

يتم التقاط الأخطاء على مستويات متعددة:

1. **مستوى المتحكم**: كتل try-catch في المتحكمات
2. **مستوى البرنامج الوسيط**: برنامج وسيط معالجة الأخطاء
3. **مستوى Express**: معالج 404 للمسارات غير المعروفة

تتضمن استجابات الخطأ:
- رمز الحالة (400، 401، 403، 404، 500)
- رسالة الخطأ
- تتبع المكدس (التطوير فقط)

## تكوين CORS

تم تكوين CORS للسماح بـ:
- التطوير: مصادر localhost مسموح بها دائمًا
- الإنتاج: المصادر من متغير البيئة `ALLOWED_ORIGINS`
- تطبيقات المحمول: لا يوجد قيد على المصدر

## تحديد المعدل

- **النافذة**: 15 دقيقة
- **الحد الأقصى للطلبات**: 100 لكل IP (التطوير: 200)
- مطبق على مسارات `/api/*`

## توثيق Swagger

توثيق تفاعلي لواجهة برمجة التطبيقات باستخدام Swagger UI:
- **نقطة النهاية**: `/api-docs`
- **مواصفات JSON**: `/api-docs.json`
- **إصدار OpenAPI**: 3.0.0

## دعم Vercel Serverless

تدعم واجهة برمجة التطبيقات نشر Vercel serverless:
- نقطة الدخول: `api/index.js`
- فحص الصحة: `api/health.js`
- تعمل المسارات مع مسار الأساس `/api`

## تكوين البيئة

التكوين عبر متغيرات البيئة:
- بيانات اعتماد قاعدة البيانات
- أسرار JWT
- منفذ الخادم
- مصادر CORS
- وضع البيئة (التطوير/الإنتاج)

## التبعيات

### التبعيات الأساسية
- `express` - إطار الويب
- `mysql2` - برنامج تشغيل MySQL
- `jsonwebtoken` - تنفيذ JWT
- `bcryptjs` - تشفير كلمات المرور
- `cors` - برنامج وسيط CORS
- `morgan` - مسجل طلبات HTTP
- `express-rate-limit` - تحديد المعدل
- `express-validator` - التحقق من المدخلات
- `dotenv` - متغيرات البيئة

### تبعيات التطوير
- `nodemon` - إعادة التحميل التلقائي أثناء التطوير

### تبعيات التوثيق
- `swagger-jsdoc` - مولد توثيق Swagger
- `swagger-ui-express` - واجهة Swagger UI

## أفضل الممارسات

1. **فصل المخاوف**: فصل واضح بين المسارات والمتحكمات والوصول إلى البيانات
2. **معالجة الأخطاء**: معالجة شاملة للأخطاء على جميع المستويات
3. **الأمان**: المصادقة والتفويض على المسارات المحمية
4. **التحقق**: التحقق من المدخلات قبل المعالجة
5. **التوثيق**: تعليقات Swagger لتوثيق واجهة برمجة التطبيقات
6. **تنظيم الكود**: هيكل معياري مع تنظيم ملفات واضح
7. **متغيرات البيئة**: تخزين البيانات الحساسة في متغيرات البيئة
8. **تجميع الاتصالات**: إدارة فعالة لاتصالات قاعدة البيانات

## اعتبارات القابلية للتوسع

- تجميع الاتصالات لكفاءة قاعدة البيانات
- تصميم واجهة برمجة تطبيقات عديم الحالة (رموز JWT)
- تحديد المعدل لمنع إساءة الاستخدام
- تكوين CORS للأمان
- بنية معيارية للتوسع السهل

## التحسينات المستقبلية

التحسينات المحتملة:
- طبقة تخزين مؤقت Redis
- قائمة انتظار الرسائل للعمليات غير المتزامنة
- خدمة تحميل الملفات
- الإشعارات في الوقت الفعلي (WebSocket)
- تحليلات وتقارير متقدمة
- تحسينات دعم متعدد المستأجرين

