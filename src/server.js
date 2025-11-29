/**
 * Server Entry Point / نقطة دخول الخادم
 * 
 * This file is the main entry point for the Eye Clinic API server.
 * It initializes Express, configures middleware, and sets up routes.
 * 
 * هذا الملف هو نقطة الدخول الرئيسية لخادم واجهة برمجة تطبيقات عيادة العيون.
 * يقوم بتهيئة Express وتكوين البرامج الوسيطة وإعداد المسارات.
 */

// Load environment variables from .env file / تحميل متغيرات البيئة من ملف .env
require('dotenv').config();

// Import required modules / استيراد الوحدات المطلوبة
const express = require('express');              // Web framework / إطار الويب
const cors = require('cors');                    // Cross-Origin Resource Sharing / مشاركة الموارد بين المصادر المختلفة
const morgan = require('morgan');                // HTTP request logger / مسجل طلبات HTTP
const rateLimit = require('express-rate-limit'); // Rate limiting middleware / برنامج تحديد المعدل الوسيط
const { errorHandler, notFound } = require('./middleware/errorHandler'); // Error handling / معالجة الأخطاء
const { sendError } = require('./utils/response');                       // Response helpers / دوال مساعدة الاستجابة
const swaggerSetup = require('./config/swagger');                        // Swagger documentation setup / إعداد توثيق Swagger

// Create Express application instance / إنشاء مثيل تطبيق Express
const app = express();

/**
 * CORS Configuration Function / دالة تكوين CORS
 * 
 * Configures Cross-Origin Resource Sharing (CORS) middleware to allow/restrict requests from specific origins.
 * In development, allows localhost origins for Swagger UI access.
 * In production, restricts to origins specified in ALLOWED_ORIGINS environment variable.
 * 
 * يكوّن برنامج CORS الوسيط للسماح/تقييد الطلبات من مصادر محددة.
 * في التطوير، يسمح بمصادر localhost للوصول إلى Swagger UI.
 * في الإنتاج، يقيّد بالمصادر المحددة في متغير البيئة ALLOWED_ORIGINS.
 * 
 * @returns {Object} CORS configuration object / كائن تكوين CORS
 */
const getCorsConfig = () => {
    // Get allowed origins from environment variable / الحصول على المصادر المسموح بها من متغير البيئة
    const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
    // Check if running in development mode / التحقق من تشغيل الوضع التطوير
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    // If no ALLOWED_ORIGINS is set, allow all origins (development only) / إذا لم يتم تعيين ALLOWED_ORIGINS، اسمح بجميع المصادر (التطوير فقط)
    if (!allowedOriginsEnv) {
        return {
            origin: '*',                                                      // Allow all origins / السماح بجميع المصادر
            credentials: false,                                               // Don't send credentials / عدم إرسال بيانات الاعتماد
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],  // Allowed HTTP methods / طرق HTTP المسموح بها
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'], // Allowed headers / الرؤوس المسموح بها
            exposedHeaders: ['Content-Type', 'Authorization'],               // Exposed headers / الرؤوس المعروضة
            optionsSuccessStatus: 200                                         // Status for OPTIONS requests / حالة طلبات OPTIONS
        };
    }
    
    // Split comma-separated origins and trim whitespace / تقسيم المصادر المفصولة بفواصل وتقليم المسافات البيضاء
    const allowedOrigins = allowedOriginsEnv.split(',').map(origin => origin.trim());
    
    return {
        origin: function (origin, callback) {
            // Allow requests with no origin (mobile apps, curl, Postman) / السماح بالطلبات بدون مصدر (تطبيقات المحمول، curl، Postman)
            if (!origin) return callback(null, true);
            
            // In development, always allow localhost origins for Swagger UI / في التطوير، اسمح دائمًا بمصادر localhost لـ Swagger UI
            if (isDevelopment && (
                origin.startsWith('http://localhost') || 
                origin.startsWith('http://127.0.0.1')
            )) {
                return callback(null, true);
            }
            
            // Check if origin is in allowed list / التحقق من وجود المصدر في القائمة المسموح بها
            if (allowedOrigins.includes(origin)) {
                callback(null, true);  // Allow request / السماح بالطلب
            } else {
                callback(new Error('Not allowed by CORS')); // Reject request / رفض الطلب
            }
        },
        credentials: true,                                                  // Allow cookies/auth headers / السماح بـ cookies/رؤوس المصادقة
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],    // Allowed HTTP methods / طرق HTTP المسموح بها
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'], // Allowed headers / الرؤوس المسموح بها
        exposedHeaders: ['Content-Type', 'Authorization'],                // Exposed headers / الرؤوس المعروضة
        optionsSuccessStatus: 200                                          // Status for OPTIONS requests / حالة طلبات OPTIONS
    };
};

// Apply CORS middleware / تطبيق برنامج CORS الوسيط
app.use(cors(getCorsConfig()));

// HTTP request logging middleware (logs requests to console) / برنامج تسجيل طلبات HTTP (يسجل الطلبات في وحدة التحكم)
app.use(morgan('dev'));

// Parse JSON request bodies (max 10MB) / تحليل أجسام طلبات JSON (الحد الأقصى 10MB)
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded request bodies (max 10MB) / تحليل أجسام الطلبات المشفرة في URL (الحد الأقصى 10MB)
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * UTF-8 Charset Middleware / برنامج وسيط مجموعة أحرف UTF-8
 * 
 * Enforces UTF-8 charset for all JSON responses to support Arabic and other Unicode characters.
 * This ensures proper character encoding without affecting HTML/CSS (e.g., Swagger UI).
 * 
 * يفرض مجموعة أحرف UTF-8 لجميع استجابات JSON لدعم الأحرف العربية وغيرها من أحرف Unicode.
 * يضمن هذا ترميز الأحرف الصحيح دون التأثير على HTML/CSS (مثل Swagger UI).
 */
app.use((req, res, next) => {
    // Store original json method / تخزين طريقة json الأصلية
    const originalJson = res.json.bind(res);
    
    // Override json method to always set UTF-8 charset / تجاوز طريقة json لتعيين مجموعة أحرف UTF-8 دائمًا
    res.json = (body) => {
        res.set('Content-Type', 'application/json; charset=utf-8');
        return originalJson(body);
    };
    next();
});

// Handle favicon requests silently (prevents 404 logs) / معالجة طلبات favicon بصمت (يمنع سجلات 404)
app.get('/favicon.ico', (req, res) => res.status(204).end());

/**
 * Rate Limiting Middleware / برنامج تحديد المعدل الوسيط
 * 
 * Limits the number of requests per IP address to prevent abuse and DDoS attacks.
 * Configuration: 100 requests per 15 minutes per IP address.
 * 
 * يحد من عدد الطلبات لكل عنوان IP لمنع إساءة الاستخدام وهجمات DDoS.
 * التكوين: 100 طلب لكل 15 دقيقة لكل عنوان IP.
 */
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // Time window: 15 minutes / نافذة الوقت: 15 دقيقة
    max: 100                    // Max requests per window / الحد الأقصى للطلبات لكل نافذة
});
app.use('/api/', limiter);      // Apply to all /api/* routes / تطبيق على جميع مسارات /api/*

// Setup Swagger API documentation / إعداد توثيق واجهة برمجة التطبيقات Swagger
swaggerSetup(app);

/**
 * Health Check Endpoint / نقطة نهاية فحص الصحة
 * 
 * Returns API status and timestamp. Used for monitoring and uptime checks.
 * Accessible at: GET /health
 * 
 * يُرجع حالة واجهة برمجة التطبيقات والطابع الزمني. يُستخدم للمراقبة والتحقق من وقت التشغيل.
 * متاح على: GET /health
 */
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',                                           // API status / حالة واجهة برمجة التطبيقات
        timestamp: new Date().toISOString(),                    // Current timestamp / الطابع الزمني الحالي
        service: 'Eye Clinic API'                              // Service name / اسم الخدمة
    });
});

/**
 * Welcome/Home Route / مسار الترحيب/الصفحة الرئيسية
 * 
 * Returns API information and available endpoints.
 * Accessible at: GET /
 * 
 * يُرجع معلومات واجهة برمجة التطبيقات ونقاط النهاية المتاحة.
 * متاح على: GET /
 */
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Eye Clinic API',                  // Welcome message / رسالة الترحيب
        version: '1.0.0',                                      // API version / إصدار واجهة برمجة التطبيقات
        endpoints: {
            health: '/health',                                  // Health check endpoint / نقطة نهاية فحص الصحة
            api: '/api',                                        // API base path / مسار واجهة برمجة التطبيقات الأساسي
            swagger: '/api-docs'                                // Swagger documentation / توثيق Swagger
        }
    });
});

/**
 * API Routes / مسارات واجهة برمجة التطبيقات
 * 
 * Mounts all route modules to their respective paths.
 * Each route module handles a specific resource or feature.
 * 
 * يربط جميع وحدات المسارات بمساراتها المقابلة.
 * كل وحدة مسار تتعامل مع مورد أو ميزة محددة.
 */

// Authentication routes / مسارات المصادقة
app.use('/api/auth', require('./routes/auth'));                       // Web authentication / مصادقة الويب
app.use('/api/mobile/auth', require('./routes/mobileAuth'));          // Mobile authentication / مصادقة المحمول

// Clinic and user management routes / مسارات إدارة العيادات والمستخدمين
app.use('/api/clinics', require('./routes/clinics'));                 // Clinic CRUD operations / عمليات CRUD للعيادات
app.use('/api/users', require('./routes/users'));                     // User management / إدارة المستخدمين

// Patient routes / مسارات المرضى
app.use('/api/patients', require('./routes/patients'));               // Patient management / إدارة المرضى

// Doctor routes / مسارات الأطباء
app.use('/api/doctors', require('./routes/doctors'));                 // Doctor management / إدارة الأطباء

// Appointment routes / مسارات المواعيد
app.use('/api/appointments', require('./routes/appointments'));       // Web appointments / مواعيد الويب
app.use('/api/mobile/appointments', require('./routes/mobileAppointments')); // Mobile appointments / مواعيد المحمول

// Medical records routes / مسارات السجلات الطبية
app.use('/api/prescriptions', require('./routes/prescriptions'));     // Prescriptions / الوصفات
app.use('/api/medical-reports', require('./routes/medicalReports'));  // Medical reports / التقارير الطبية
app.use('/api/test-results', require('./routes/testResults'));        // Test results / نتائج الاختبارات

// Mobile medical records routes / مسارات السجلات الطبية للمحمول
app.use('/api/mobile/prescriptions', require('./routes/mobilePrescriptions'));     // Mobile prescriptions / وصفات المحمول
app.use('/api/mobile/medical-reports', require('./routes/mobileReports'));         // Mobile reports / تقارير المحمول
app.use('/api/mobile/test-results', require('./routes/mobileTestResults'));        // Mobile test results / نتائج اختبارات المحمول

// Color test routes / مسارات اختبارات الألوان
app.use('/api/color-tests', require('./routes/colorTests'));          // Color blindness tests / اختبارات عمى الألوان
app.use('/api/mobile/color-tests', require('./routes/mobileColorTests')); // Mobile color tests / اختبارات ألوان المحمول

// Waiting room routes / مسارات غرفة الانتظار
app.use('/api/waiting-room', require('./routes/waitingRoom'));        // Waiting room management / إدارة غرفة الانتظار

// Analytics and reports routes / مسارات التحليلات والتقارير
app.use('/api/analytics', require('./routes/analytics'));             // Analytics and statistics / التحليلات والإحصائيات
app.use('/api/reports', require('./routes/reports'));                 // Daily/monthly reports / التقارير اليومية/الشهرية

/**
 * Error Handling Middleware / برامج معالجة الأخطاء الوسيطة
 * 
 * These middleware must be registered AFTER all routes.
 * notFound: Handles 404 errors for undefined routes.
 * errorHandler: Handles all other errors and formats error responses.
 * 
 * يجب تسجيل هذه البرامج الوسيطة بعد جميع المسارات.
 * notFound: يتعامل مع أخطاء 404 للمسارات غير المعرفة.
 * errorHandler: يتعامل مع جميع الأخطاء الأخرى ويُنسق استجابات الأخطاء.
 */
app.use(notFound);        // 404 handler / معالج 404
app.use(errorHandler);    // General error handler / معالج الأخطاء العام

/**
 * Start Server / بدء الخادم
 * 
 * Starts the Express server on the configured port (default: 5000).
 * Logs server information including port, health check URL, and Swagger docs URL.
 * 
 * يبدأ خادم Express على المنفذ المكون (الافتراضي: 5000).
 * يسجل معلومات الخادم بما في ذلك المنفذ ورابط فحص الصحة ورابط توثيق Swagger.
 */
const PORT = process.env.PORT || 5000;  // Get port from environment or use default / الحصول على المنفذ من البيئة أو استخدام الافتراضي
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);                                    // Server started / تم بدء الخادم
    console.log(`📍 Health check: http://localhost:${PORT}/health`);                    // Health check URL / رابط فحص الصحة
    console.log(`📚 Swagger docs: http://localhost:${PORT}/api-docs`);                  // Swagger documentation URL / رابط توثيق Swagger
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);            // Current environment / البيئة الحالية
});
