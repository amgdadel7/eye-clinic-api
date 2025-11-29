# دليل التطوير

يوفر هذا المستند إرشادات لتطوير واجهة برمجة تطبيقات عيادة العيون.

## إعداد التطوير

### المتطلبات الأساسية

- Node.js 20.x أو أحدث
- قاعدة بيانات MySQL 8.0+
- npm أو yarn
- Git

### الإعداد الأولي

1. استنساخ المستودع:
```bash
git clone <repository-url>
cd eye-clinic-api
```

2. تثبيت التبعيات:
```bash
npm install
```

3. إنشاء ملف `.env`:
```env
# إعدادات قاعدة البيانات
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=eye_clinic_db
DB_PORT=3306
DB_SSL=false

# إعدادات JWT
JWT_SECRET=your_secret_key_for_development
JWT_EXPIRES_IN=7d

# إعدادات الخادم
PORT=5000
NODE_ENV=development

# إعدادات CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
```

4. إعداد قاعدة البيانات:
```bash
# إنشاء قاعدة البيانات
mysql -u root -p -e "CREATE DATABASE eye_clinic_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# استيراد المخطط
mysql -u root -p eye_clinic_db < database/schema.sql

# (اختياري) استيراد بيانات تجريبية
mysql -u root -p eye_clinic_db < database/sample_data.sql
```

5. تشغيل الخادم:
```bash
# وضع التطوير (مع إعادة التحميل التلقائي)
npm run dev

# وضع الإنتاج
npm start
```

## هيكل المشروع

```
eye-clinic-api/
├── api/                 # نقاط دخول Vercel serverless
├── database/            # مخططات قاعدة البيانات والهجرات
├── scripts/             # البرامج المساعدة
├── src/
│   ├── config/          # ملفات التكوين
│   ├── controllers/     # معالجات الطلبات
│   ├── middleware/      # البرامج الوسيطة المخصصة
│   ├── routes/          # تعريفات مسارات واجهة برمجة التطبيقات
│   ├── utils/           # الدوال المساعدة
│   ├── app.js           # تكوين تطبيق Express
│   └── server.js        # نقطة دخول الخادم
├── package.json
└── README.md
```

## سير عمل التطوير

### 1. إنشاء فرع ميزة

```bash
git checkout -b feature/your-feature-name
```

### 2. إجراء التغييرات

- كتابة الكود وفقًا لمعايير الترميز
- إضافة الاختبارات إن أمكن
- تحديث التوثيق

### 3. اختبار التغييرات

```bash
# بدء الخادم
npm run dev

# اختبار نقاط النهاية باستخدام curl أو Postman أو Swagger UI
curl http://localhost:5000/health
```

### 4. الالتزام بالتغييرات

```bash
git add .
git commit -m "feat: add your feature description"
```

### 5. الدفع وإنشاء طلب السحب

```bash
git push origin feature/your-feature-name
```

## معايير الترميز

### نمط الكود

- استخدم مسافتين للترويس
- استخدم علامات اقتباس مفردة للسلاسل
- استخدم الفواصل المنقوطة
- اتبع تكوين ESLint (إن كان متوفرًا)

### اصطلاحات التسمية

- **الملفات**: camelCase (مثل `userController.js`)
- **المتغيرات**: camelCase (مثل `userId`، `userName`)
- **الثوابت**: UPPER_SNAKE_CASE (مثل `MAX_RETRIES`)
- **الدوال**: camelCase (مثل `getAllUsers`)
- **الطبقات**: PascalCase (مثل `UserController`)

### تنظيم الملفات

- **المتحكمات**: ملف واحد لكل مورد (مثل `userController.js`)
- **المسارات**: ملف واحد لكل مورد (مثل `users.js`)
- **البرامج الوسيطة**: ملفات منفصلة لكل برنامج وسيط
- **الأدوات**: دوال مساعدة مشتركة

### مثال المتحكم

```javascript
const pool = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

const getAllUsers = async (req, res) => {
    try {
        const [users] = await pool.query('SELECT * FROM users');
        sendSuccess(res, users, 'تم استرداد المستخدمين بنجاح');
    } catch (error) {
        console.error('Error:', error);
        sendError(res, error.message, 500);
    }
};

module.exports = {
    getAllUsers
};
```

### مثال المسار

```javascript
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorize } = require('../middleware/auth');

// جميع المسارات تتطلب المصادقة
router.use(authenticateToken);

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', authorize('admin'), userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', authorize('admin'), userController.deleteUser);

module.exports = router;
```

## تطوير واجهة برمجة التطبيقات

### إضافة نقطة نهاية جديدة

1. **إنشاء دالة المتحكم** (`src/controllers/`)
```javascript
const getResource = async (req, res) => {
    try {
        const { id } = req.params;
        const [resource] = await pool.query(
            'SELECT * FROM resources WHERE id = ?',
            [id]
        );
        
        if (resource.length === 0) {
            return sendError(res, 'الموارد غير موجودة', 404);
        }
        
        sendSuccess(res, resource[0], 'تم استرداد الموارد بنجاح');
    } catch (error) {
        sendError(res, error.message, 500);
    }
};
```

2. **إضافة مسار** (`src/routes/`)
```javascript
router.get('/:id', resourceController.getResource);
```

3. **تسجيل المسار** (`src/app.js`)
```javascript
app.use('/api/resources', require('./routes/resources'));
```

4. **إضافة توثيق Swagger** (اختياري)
```javascript
/**
 * @swagger
 * /api/resources/{id}:
 *   get:
 *     summary: الحصول على مورد حسب المعرف
 *     tags: [Resources]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: تم استرداد المورد بنجاح
 */
```

### إضافة المصادقة

```javascript
const { authenticateToken, authorize } = require('../middleware/auth');

// يتطلب المصادقة
router.use(authenticateToken);

// يتطلب دور محدد
router.post('/', authorize('admin'), controller.create);
```

### إضافة التحقق

```javascript
const { body, validationResult } = require('express-validator');

const validateRequest = [
    body('email').isEmail().withMessage('بريد إلكتروني غير صحيح'),
    body('password').isLength({ min: 8 }).withMessage('يجب أن تكون كلمة المرور 8 أحرف على الأقل'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

router.post('/', validateRequest, controller.create);
```

## تطوير قاعدة البيانات

### تشغيل الهجرات

```bash
python scripts/apply_patient_auth_migration.py \
  --host localhost \
  --user root \
  --password your_password \
  --database eye_clinic_db
```

### إنشاء الهجرات

1. إنشاء ملف هجرة في `database/migrations/`
2. تنسيق الاسم: `YYYYMMDD_description.sql`
3. اختبار الهجرة على قاعدة بيانات التطوير
4. توثيق الهجرة في ملف الهجرة

### استعلامات قاعدة البيانات

استخدم دائمًا استعلامات معلمات:
```javascript
// ✅ جيد
const [results] = await pool.query(
    'SELECT * FROM users WHERE email = ?',
    [email]
);

// ❌ سيء (خطر حقن SQL)
const [results] = await pool.query(
    `SELECT * FROM users WHERE email = '${email}'`
);
```

## الاختبار

### الاختبار اليدوي

1. **بدء الخادم**:
```bash
npm run dev
```

2. **اختبار نقاط النهاية**:
- استخدم Swagger UI: `http://localhost:5000/api-docs`
- استخدم curl أو Postman
- استخدم تطبيق الواجهة الأمامية

### اختبار نقاط النهاية

```bash
# فحص الصحة
curl http://localhost:5000/health

# تسجيل الدخول
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# نقطة نهاية محمية
curl http://localhost:5000/api/users \
  -H "Authorization: Bearer <token>"
```

## التصحيح

### تسجيل وحدة التحكم

```javascript
console.log('Debug:', variable);
console.error('Error:', error);
```

### معالجة الأخطاء

استخدم دائمًا كتل try-catch:
```javascript
try {
    // الكود الخاص بك
} catch (error) {
    console.error('Error:', error);
    sendError(res, error.message, 500);
}
```

### تصحيح قاعدة البيانات

تفعيل تسجيل الاستعلامات:
```javascript
pool.on('connection', (connection) => {
    console.log('New connection as id ' + connection.threadId);
});

pool.on('error', (err) => {
    console.error('Database error:', err);
});
```

## متغيرات البيئة

### التطوير

قم بإنشاء ملف `.env` في المجلد الجذر:
```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
```

### تحميل متغيرات البيئة

يتم تحميل متغيرات البيئة باستخدام `dotenv`:
```javascript
require('dotenv').config();
```

## توثيق Swagger

### إضافة تعليقات Swagger

```javascript
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: الحصول على جميع المستخدمين
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: قائمة المستخدمين
 */
```

### عرض التوثيق

الوصول إلى Swagger UI على:
```
http://localhost:5000/api-docs
```

## سير عمل Git

### رسائل الالتزام

اتبع الالتزامات التقليدية:
- `feat`: ميزة جديدة
- `fix`: إصلاح خطأ
- `docs`: تغييرات التوثيق
- `style`: تغييرات نمط الكود
- `refactor`: إعادة هيكلة الكود
- `test`: تغييرات الاختبار
- `chore`: تغييرات أخرى

أمثلة:
```
feat: إضافة مصادقة المستخدم
fix: حل خطأ اتصال قاعدة البيانات
docs: تحديث توثيق واجهة برمجة التطبيقات
```

### تسمية الفروع

- `feature/feature-name` - ميزات جديدة
- `bugfix/bug-name` - إصلاحات الأخطاء
- `hotfix/issue-name` - إصلاحات عاجلة
- `docs/documentation-name` - التوثيق

## أفضل الممارسات

1. **معالجة الأخطاء**: تعامل مع الأخطاء بشكل صحيح دائمًا
2. **التحقق من المدخلات**: تحقق من جميع مدخلات المستخدم
3. **حقن SQL**: استخدم استعلامات معلمات
4. **المصادقة**: احمِ نقاط النهاية الحساسة
5. **التفويض**: تحقق من أذونات المستخدم
6. **إعادة استخدام الكود**: أنشئ دوال قابلة لإعادة الاستخدام
7. **التوثيق**: وثّق الكود الخاص بك
8. **الاختبار**: اختبر التغييرات قبل الالتزام
9. **مراجعة الكود**: راجع الكود قبل الدمج
10. **الأمان**: اتبع أفضل ممارسات الأمان

## المشاكل الشائعة

### المنفذ مستخدم بالفعل

```bash
# العثور على العملية التي تستخدم المنفذ 5000
lsof -i :5000
# إنهاء العملية
kill -9 PID
```

### خطأ اتصال قاعدة البيانات

- تحقق من بيانات اعتماد قاعدة البيانات
- تحقق من تشغيل MySQL
- تحقق من اتصال الشبكة

### وحدة غير موجودة

```bash
# إعادة تثبيت التبعيات
rm -rf node_modules
npm install
```

### أخطاء CORS

- تحقق من أن `ALLOWED_ORIGINS` يتضمن رابط الواجهة الأمامية
- تحقق من تكوين برنامج CORS الوسيط

## الموارد

- [توثيق Express.js](https://expressjs.com/)
- [توثيق MySQL2](https://github.com/sidorares/node-mysql2)
- [توثيق JWT](https://jwt.io/)
- [توثيق Swagger](https://swagger.io/docs/)

## الحصول على المساعدة

- تحقق من التوثيق الموجود
- راجع أمثلة الكود
- اسأل أعضاء الفريق
- ابحث عن مشاكل مشابهة

