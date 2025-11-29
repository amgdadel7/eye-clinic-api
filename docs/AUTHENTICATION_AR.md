# توثيق المصادقة والأمان

يصف هذا المستند ميزات المصادقة والأمان لواجهة برمجة تطبيقات عيادة العيون.

## نظرة عامة

تستخدم واجهة برمجة تطبيقات عيادة العيون JWT (رموز JSON Web) للمصادقة وتنفذ التحكم في الوصول القائم على الأدوار (RBAC) للتفويض. يتم تشفير كلمات المرور باستخدام bcrypt، وتشمل تدابير الأمان الإضافية تحديد المعدل وتكوين CORS.

## نظام المصادقة

### مصادقة JWT

تستخدم واجهة برمجة التطبيقات رموز JWT للمصادقة عديمة الحالة. يتم إنشاء الرموز عند تسجيل الدخول بنجاح ويجب تضمينها في الطلبات اللاحقة.

**تنسيق الرمز:**
```
Authorization: Bearer <jwt_token>
```

**هيكل الرمز:**
يحتوي payload JWT على:
```json
{
  "userId": 1,
  "email": "user@example.com",
  "role": "doctor",
  "clinicId": 1
}
```

**انتهاء صلاحية الرمز:**
- الافتراضي: 7 أيام (قابل للتكوين عبر `JWT_EXPIRES_IN`)
- التنسيق: `7d`، `24h`، `60m`، إلخ.

### إنشاء الرمز

يتم إنشاء الرموز في برنامج المصادقة الوسيط (`src/middleware/auth.js`):

```javascript
const generateToken = (payload) => {
    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};
```

### التحقق من الرمز

يتم التحقق من الرموز على المسارات المحمية باستخدام برنامج `authenticateToken` الوسيط:

```javascript
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token is required'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
        
        req.user = user;
        next();
    });
};
```

## التفويض (التحكم في الوصول القائم على الأدوار)

### أدوار المستخدمين

تدعم واجهة برمجة التطبيقات ثلاثة أدوار للمستخدمين:

1. **المدير** (`admin`)
   - الوصول الكامل إلى جميع نقاط النهاية
   - يمكنه إدارة العيادات والمستخدمين وجميع الموارد
   - يمكنه الموافقة/رفض تسجيلات المستخدمين

2. **الطبيب** (`doctor`)
   - الوصول إلى سجلات المرضى
   - يمكنه إنشاء/تحديث الوصفات والتقارير الطبية
   - يمكنه إدارة المواعيد
   - يمكنه إنشاء نتائج الاختبارات

3. **موظف الاستقبال** (`receptionist`)
   - وصول محدود لإدارة المرضى
   - يمكنه إدارة المواعيد
   - لا يمكنه الوصول إلى البيانات الطبية الحساسة

### برنامج وسيط التفويض

يتحقق برنامج `authorize` الوسيط من أدوار المستخدمين قبل السماح بالوصول:

```javascript
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action'
            });
        }

        next();
    };
};
```

### مثال الاستخدام

```javascript
// يتطلب المصادقة ودور المدير
router.post('/clinics', authenticateToken, authorize('admin'), clinicController.create);

// يتطلب المصادقة ودور الطبيب أو المدير
router.post('/prescriptions', authenticateToken, authorize('doctor', 'admin'), prescriptionController.create);
```

## أمان كلمات المرور

### تشفير كلمات المرور

يتم تشفير كلمات المرور باستخدام bcryptjs قبل التخزين:

```javascript
const bcrypt = require('bcryptjs');

// تشفير كلمة المرور
const hashedPassword = await bcrypt.hash(password, 10);

// التحقق من كلمة المرور
const isValid = await bcrypt.compare(password, hashedPassword);
```

**تكوين التشفير:**
- جولات الملح: 10
- الخوارزمية: bcrypt

### متطلبات كلمة المرور

بينما لا يتم فرضها على مستوى واجهة برمجة التطبيقات، فإن متطلبات كلمة المرور الموصى بها:
- الحد الأدنى 8 أحرف
- مزيج من الأحرف الكبيرة والصغيرة
- تضمين أرقام
- تضمين أحرف خاصة

## المسارات المحمية

معظم مسارات واجهة برمجة التطبيقات تتطلب المصادقة. يتم تطبيق برنامج المصادقة الوسيط على مستوى المسار:

```javascript
// جميع المسارات في هذا المسار تتطلب المصادقة
router.use(authenticateToken);

router.get('/', controller.getAll);
router.post('/', authorize('admin'), controller.create);
```

## نقاط النهاية العامة

نقاط النهاية التالية عامة (لا تتطلب المصادقة):
- `POST /api/auth/login` - تسجيل دخول المستخدم
- `POST /api/auth/register-clinic` - تسجيل العيادة
- `POST /api/auth/register-user` - تسجيل المستخدم
- `GET /api/clinics` - الحصول على جميع العيادات
- `GET /api/clinics/:id` - الحصول على عيادة حسب المعرف
- `GET /health` - فحص الصحة
- `GET /` - رسالة الترحيب

## مصادقة المحمول

تطبيقات الهاتف المحمول لديها نقاط نهاية مصادقة مخصصة:
- `POST /api/mobile/auth/register` - تسجيل المريض
- `POST /api/mobile/auth/login` - تسجيل دخول المريض (باستخدام رقم الهاتف)
- `GET /api/mobile/auth/profile` - الحصول على ملف المريض (يتطلب المصادقة)

تستخدم مصادقة المحمول نفس نظام JWT المستخدم في مصادقة الويب.

## ميزات الأمان

### 1. تحديد المعدل

طلبات واجهة برمجة التطبيقات محدودة المعدل لمنع إساءة الاستخدام:
- **النافذة**: 15 دقيقة
- **الحد الأقصى للطلبات**: 100 لكل IP (التطوير: 200)
- **مطبق على**: مسارات `/api/*`

```javascript
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api/', limiter);
```

### 2. تكوين CORS

تم تكوين CORS لتقييد المصادر المسموح بها:
- **التطوير**: مصادر localhost مسموح بها دائمًا
- **الإنتاج**: المصادر من متغير البيئة `ALLOWED_ORIGINS`
- **تطبيقات المحمول**: لا يوجد قيد على المصدر (الطلبات بدون رأس المصدر مسموح بها)

```javascript
const getCorsConfig = () => {
    const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
    const allowedOrigins = allowedOriginsEnv.split(',').map(origin => origin.trim());
    
    return {
        origin: function (origin, callback) {
            if (!origin) return callback(null, true); // السماح بتطبيقات المحمول
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true
    };
};
```

### 3. التحقق من المدخلات

يتم التحقق من الطلبات باستخدام express-validator:
- يتحقق من هيكل نص الطلب
- يتحقق من أنواع البيانات
- يتحقق من الحقول المطلوبة
- يمنع حقن SQL وهجمات XSS

### 4. منع حقن SQL

جميع استعلامات قاعدة البيانات تستخدم استعلامات معلمات:

```javascript
// استعلام معلمات آمن
const [results] = await pool.query(
    'SELECT * FROM users WHERE email = ?',
    [email]
);

// لا: ربط السلسلة مباشرة (عرضة لحقن SQL)
```

### 5. معالجة الأخطاء

يتم معالجة الأخطاء بشكل آمن:
- رسائل خطأ عامة في الإنتاج
- رسائل خطأ مفصلة في التطوير
- عدم كشف معلومات حساسة في استجابات الخطأ
- تتبع المكدس فقط في وضع التطوير

### 6. HTTPS

في الإنتاج، يجب أن تستخدم جميع طلبات واجهة برمجة التطبيقات HTTPS:
- يحمي البيانات أثناء النقل
- يمنع هجمات الرجل في الوسط
- مطلوب لنقل الرمز الآمن

## متغيرات البيئة

متغيرات البيئة المتعلقة بالأمان:

| المتغير | الوصف | مطلوب |
|---------|-------|-------|
| `JWT_SECRET` | المفتاح السري لتوقيع JWT | نعم |
| `JWT_EXPIRES_IN` | وقت انتهاء صلاحية الرمز | لا (الافتراضي: `7d`) |
| `ALLOWED_ORIGINS` | قائمة المصادر المسموح بها CORS مفصولة بفواصل | لا |
| `NODE_ENV` | البيئة (التطوير/الإنتاج) | لا (الافتراضي: `development`) |

**مثال ملف `.env`:**
```env
JWT_SECRET=your_super_secret_key_here_min_32_characters
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
NODE_ENV=production
```

## أفضل الممارسات

1. **استخدم JWT_SECRET قوي**
   - الحد الأدنى 32 حرفًا
   - سلسلة عشوائية وغير قابلة للتنبؤ
   - لا تلتزم أبدًا بنظام التحكم في الإصدارات

2. **قم بتدوير الرموز دوريًا**
   - تنفيذ آلية تحديث الرمز
   - رموز وصول قصيرة العمر
   - رموز تحديث طويلة العمر

3. **تحقق من جميع المدخلات**
   - استخدم express-validator
   - تنظيف مدخلات المستخدم
   - التحقق من أنواع البيانات والتنسيقات

4. **استخدم HTTPS في الإنتاج**
   - تشفير جميع الاتصالات
   - حماية البيانات الحساسة
   - منع اعتراض الرمز

5. **راقب محاولات المصادقة**
   - تسجيل محاولات تسجيل الدخول الفاشلة
   - تنفيذ قفل الحساب بعد عدة فشل
   - تنبيه على النشاط المشبوه

6. **تدقيقات الأمان المنتظمة**
   - مراجعة كود المصادقة
   - اختبار الثغرات الأمنية
   - تحديث التبعيات بانتظام

## تدفقات المصادقة الشائعة

### تدفق تطبيق الويب

1. يقدم المستخدم بيانات اعتماد تسجيل الدخول
2. تتحقق واجهة برمجة التطبيقات من بيانات الاعتماد
3. تنشئ واجهة برمجة التطبيقات رمز JWT
4. ترجع واجهة برمجة التطبيقات الرمز إلى العميل
5. يخزن العميل الرمز (localStorage/cookie)
6. يتضمن العميل الرمز في الطلبات اللاحقة
7. تتحقق واجهة برمجة التطبيقات من الرمز في كل طلب

### تدفق تطبيق المحمول

1. يقدم المريض رقم الهاتف/كلمة المرور
2. تتحقق واجهة برمجة التطبيقات من بيانات الاعتماد
3. تنشئ واجهة برمجة التطبيقات رمز JWT
4. ترجع واجهة برمجة التطبيقات الرمز إلى تطبيق المحمول
5. يخزن تطبيق المحمول الرمز بشكل آمن
6. يتضمن تطبيق المحمول الرمز في الطلبات اللاحقة
7. تتحقق واجهة برمجة التطبيقات من الرمز في كل طلب

## استجابات الخطأ

### أخطاء المصادقة

**401 Unauthorized** - لم يتم توفير الرمز:
```json
{
  "success": false,
  "message": "Access token is required"
}
```

**403 Forbidden** - رمز غير صالح أو منتهي الصلاحية:
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

**403 Forbidden** - أذونات غير كافية:
```json
{
  "success": false,
  "message": "You do not have permission to perform this action"
}
```

## قائمة فحص الأمان

- [ ] تم تعيين JWT_SECRET وهو قوي (32+ حرفًا)
- [ ] تم تفعيل HTTPS في الإنتاج
- [ ] تم تكوين CORS بشكل صحيح
- [ ] تم تفعيل تحديد المعدل
- [ ] تم تشفير كلمات المرور باستخدام bcrypt
- [ ] منع حقن SQL (استعلامات معلمات)
- [ ] التحقق من المدخلات على جميع نقاط النهاية
- [ ] لا تكشف رسائل الخطأ معلومات حساسة
- [ ] تم تكوين انتهاء صلاحية الرمز
- [ ] يتم إجراء تدقيقات الأمان بانتظام

## التحسينات المستقبلية

تحسينات الأمان المحتملة:
- المصادقة الثنائية (2FA)
- آلية تحديث الرمز
- قفل الحساب بعد محاولات فاشلة
- إدارة الجلسات
- تكامل OAuth2
- مصادقة مفتاح واجهة برمجة التطبيقات لتكاملات الطرف الثالث

