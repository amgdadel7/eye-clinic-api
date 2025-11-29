# توثيق النشر

يصف هذا المستند كيفية نشر واجهة برمجة تطبيقات عيادة العيون على منصات مختلفة.

## نظرة عامة

يمكن نشر واجهة برمجة تطبيقات عيادة العيون على منصات متعددة بما في ذلك:
- Vercel (Serverless)
- Heroku
- AWS
- DigitalOcean
- خادم VPS/مخصص تقليدي

## المتطلبات الأساسية

قبل النشر، تأكد من وجود:
1. Node.js 20.x أو أحدث
2. قاعدة بيانات MySQL 8.0+
3. متغيرات البيئة المكونة
4. مخطط قاعدة البيانات المستورد
5. التبعيات المثبتة

## متغيرات البيئة

قم بتعيين متغيرات البيئة التالية قبل النشر:

```env
# إعدادات قاعدة البيانات
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=eye_clinic_db
DB_PORT=3306
DB_SSL=false

# إعدادات JWT
JWT_SECRET=your_super_secret_key_min_32_characters
JWT_EXPIRES_IN=7d

# إعدادات الخادم
PORT=5000
NODE_ENV=production

# إعدادات CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## خيارات النشر

### 1. Vercel (Serverless)

يُنصح بـ Vercel للنشر serverless.

#### الإعداد

1. تثبيت Vercel CLI:
```bash
npm install -g vercel
```

2. تسجيل الدخول إلى Vercel:
```bash
vercel login
```

3. النشر:
```bash
vercel
```

4. تعيين متغيرات البيئة في لوحة Vercel:
   - انتقل إلى إعدادات المشروع → متغيرات البيئة
   - أضف جميع متغيرات البيئة المطلوبة

#### التكوين

قم بإنشاء `vercel.json` في جذر المشروع:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    },
    {
      "src": "/health",
      "dest": "/api/health.js"
    }
  ]
}
```

#### قاعدة البيانات

بالنسبة لـ Vercel، استخدم خدمة قاعدة بيانات MySQL المدارة:
- AWS RDS
- PlanetScale
- Railway
- Supabase

### 2. Heroku

#### الإعداد

1. تثبيت Heroku CLI:
```bash
# macOS
brew tap heroku/brew && brew install heroku

# Windows
# تحميل من https://devcenter.heroku.com/articles/heroku-cli
```

2. تسجيل الدخول إلى Heroku:
```bash
heroku login
```

3. إنشاء تطبيق Heroku:
```bash
heroku create eye-clinic-api
```

4. إضافة إضافة MySQL:
```bash
heroku addons:create jawsdb:kitefin
```

5. تعيين متغيرات البيئة:
```bash
heroku config:set JWT_SECRET=your_secret_key
heroku config:set JWT_EXPIRES_IN=7d
heroku config:set NODE_ENV=production
heroku config:set ALLOWED_ORIGINS=https://yourdomain.com
```

6. النشر:
```bash
git push heroku main
```

#### Procfile

قم بإنشاء `Procfile` في جذر المشروع:

```
web: node src/server.js
```

### 3. AWS (EC2 + RDS)

#### إعداد مثيل EC2

1. تشغيل مثيل EC2 (Ubuntu 20.04 LTS)
2. SSH إلى المثيل:
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

3. تثبيت Node.js:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

4. تثبيت PM2:
```bash
sudo npm install -g pm2
```

5. استنساخ المستودع:
```bash
git clone your-repo-url
cd eye-clinic-api
```

6. تثبيت التبعيات:
```bash
npm install --production
```

7. تعيين متغيرات البيئة:
```bash
sudo nano /etc/environment
# أضف متغيرات البيئة
```

8. البدء باستخدام PM2:
```bash
pm2 start src/server.js --name eye-clinic-api
pm2 save
pm2 startup
```

#### إعداد قاعدة بيانات RDS

1. إنشاء مثيل RDS MySQL
2. تكوين مجموعة الأمان للسماح بالوصول إلى EC2
3. تعيين نقطة نهاية قاعدة البيانات في متغيرات البيئة

### 4. DigitalOcean

#### إعداد Droplet

1. إنشاء Droplet (Ubuntu 20.04)
2. SSH إلى Droplet:
```bash
ssh root@your-droplet-ip
```

3. اتبع خطوات إعداد EC2 (الخطوات 3-8)

#### قاعدة البيانات

استخدم قواعد البيانات المدارة من DigitalOcean:
1. إنشاء مجموعة قاعدة بيانات MySQL
2. الحصول على سلسلة الاتصال
3. تحديث متغيرات البيئة

### 5. خادم VPS/مخصص تقليدي

#### الإعداد

1. تثبيت Node.js (راجع خطوة EC2 3)
2. تثبيت MySQL:
```bash
sudo apt update
sudo apt install mysql-server
```

3. إنشاء قاعدة بيانات:
```bash
sudo mysql -u root -p
CREATE DATABASE eye_clinic_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

4. استيراد المخطط:
```bash
mysql -u root -p eye_clinic_db < database/schema.sql
```

5. تثبيت PM2 (راجع خطوة EC2 4)
6. استنساخ وإعداد التطبيق (راجع خطوات EC2 5-8)

## خطوات ما بعد النشر

### 1. هجرة قاعدة البيانات

إذا كان لديك هجرات، قم بتشغيلها:
```bash
python scripts/apply_patient_auth_migration.py \
  --host your_db_host \
  --user your_db_user \
  --password your_db_password \
  --database eye_clinic_db
```

### 2. فحص الصحة

التحقق من تشغيل واجهة برمجة التطبيقات:
```bash
curl https://your-api-domain.com/health
```

الاستجابة المتوقعة:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "Eye Clinic API"
}
```

### 3. توثيق واجهة برمجة التطبيقات

الوصول إلى توثيق Swagger:
```
https://your-api-domain.com/api-docs
```

### 4. اختبار نقاط النهاية

اختبار نقطة نهاية عامة:
```bash
curl https://your-api-domain.com/api/clinics
```

## تكوين SSL/HTTPS

### استخدام Vercel

يتم تكوين HTTPS تلقائيًا بواسطة Vercel.

### استخدام Nginx (الوكيل العكسي)

1. تثبيت Nginx:
```bash
sudo apt install nginx
```

2. تثبيت Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
```

3. تكوين Nginx:
```nginx
server {
    listen 80;
    server_name your-api-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. الحصول على شهادة SSL:
```bash
sudo certbot --nginx -d your-api-domain.com
```

## المراقبة

### مراقبة PM2

```bash
pm2 monit
pm2 logs eye-clinic-api
```

### مراقبة الصحة

إعداد مراقبة فحص الصحة:
- UptimeRobot
- Pingdom
- AWS CloudWatch

## استراتيجية النسخ الاحتياطي

### النسخ الاحتياطي لقاعدة البيانات

1. النسخ الاحتياطي التلقائي:
```bash
# إضافة إلى crontab
0 2 * * * mysqldump -u root -p password eye_clinic_db > /backups/eye_clinic_db_$(date +\%Y\%m\%d).sql
```

2. النسخ الاحتياطي للتخزين السحابي:
```bash
# تحميل إلى S3، Google Cloud Storage، إلخ.
aws s3 cp /backups/eye_clinic_db_$(date +\%Y\%m\%d).sql s3://your-bucket/backups/
```

## التوسع

### التوسع الأفقي

1. **موازن التحميل**: استخدم Nginx أو AWS ELB
2. **مثيلات متعددة**: تشغيل مثيلات واجهة برمجة تطبيقات متعددة
3. **تجمع اتصالات قاعدة البيانات**: ضبط حجم التجمع بناءً على التحميل

### التوسع العمودي

1. **زيادة موارد الخادم**: المزيد من وحدة المعالجة المركزية/الذاكرة
2. **تحسين قاعدة البيانات**: فهارس، تحسين الاستعلامات
3. **التخزين المؤقت**: Redis للبيانات المستخدمة بشكل متكرر

## استكشاف الأخطاء وإصلاحها

### المشاكل الشائعة

1. **أخطاء اتصال قاعدة البيانات**
   - تحقق من بيانات اعتماد قاعدة البيانات
   - تحقق من الوصول إلى الشبكة
   - تحقق من قواعد جدار الحماية

2. **المنفذ مستخدم بالفعل**
   ```bash
   # العثور على العملية التي تستخدم المنفذ 5000
   lsof -i :5000
   # إنهاء العملية
   kill -9 PID
   ```

3. **عدم تحميل متغيرات البيئة**
   - تحقق من وجود ملف `.env`
   - تحقق من صيغة متغير البيئة
   - إعادة تشغيل التطبيق

4. **أخطاء CORS**
   - تحقق من أن `ALLOWED_ORIGINS` يتضمن نطاق الواجهة الأمامية
   - تحقق من تكوين برنامج CORS الوسيط

5. **مشاكل تحديد المعدل**
   - ضبط إعدادات تحديد المعدل عند الحاجة
   - النظر في استخدام Redis لتحديد المعدل الموزع

## تحسين الأداء

### 1. تفعيل ضغط Gzip

```javascript
const compression = require('compression');
app.use(compression());
```

### 2. تجميع اتصالات قاعدة البيانات

```javascript
const pool = mysql.createPool({
    connectionLimit: 20, // زيادة للإنتاج
    // ... تكوين آخر
});
```

### 3. تفعيل التخزين المؤقت

النظر في استخدام Redis لـ:
- تخزين الجلسات
- البيانات المستخدمة بشكل متكرر
- تحديد المعدل

### 4. تحسين الاستعلامات

- استخدام فهارس قاعدة البيانات
- تحسين الاستعلامات البطيئة
- استخدام تخزين نتائج الاستعلام المؤقت

## قائمة فحص الأمان

- [ ] HTTPS مفعل
- [ ] متغيرات البيئة مؤمنة
- [ ] JWT_SECRET قوي (32+ حرفًا)
- [ ] CORS مُكون بشكل صحيح
- [ ] تحديد المعدل مفعل
- [ ] بيانات اعتماد قاعدة البيانات مؤمنة
- [ ] تحديثات الأمان المنتظمة
- [ ] جدار الحماية مُكون
- [ ] النسخ الاحتياطي آلي
- [ ] المراقبة مفعلة

## إجراء التراجع

إذا فشل النشر:

1. **Vercel**: استخدم لوحة التحكم للتراجع إلى النشر السابق
2. **Heroku**: `heroku rollback v123`
3. **PM2**: 
   ```bash
   pm2 restart eye-clinic-api
   # أو الاستعادة من النسخ الاحتياطي
   ```

## الدعم

لمشاكل النشر، تحقق من:
- التوثيق الخاص بالمنصة
- سجلات التطبيق
- سجلات قاعدة البيانات
- اتصال الشبكة

