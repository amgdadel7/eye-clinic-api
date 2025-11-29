/**
 * Database Configuration / تكوين قاعدة البيانات
 * 
 * This module configures and manages the MySQL database connection pool.
 * It uses connection pooling for efficient database connection management.
 * Supports UTF-8 (utf8mb4) encoding for full Unicode character support.
 * 
 * تكوّن هذه الوحدة وتدير مجموعة اتصالات قاعدة بيانات MySQL.
 * تستخدم تجميع الاتصالات لإدارة اتصالات قاعدة البيانات بكفاءة.
 * تدعم ترميز UTF-8 (utf8mb4) لدعم كامل لأحرف Unicode.
 */

// Import MySQL2 promise-based module / استيراد وحدة MySQL2 المستندة إلى Promise
const mysql = require('mysql2/promise');

/**
 * Create Connection Pool / إنشاء مجموعة الاتصالات
 * 
 * Creates a connection pool for managing database connections efficiently.
 * Connection pooling allows multiple concurrent database operations without
 * creating new connections for each request.
 * 
 * ينشئ مجموعة اتصالات لإدارة اتصالات قاعدة البيانات بكفاءة.
 * يسمح تجميع الاتصالات بعمليات قاعدة بيانات متزامنة متعددة دون
 * إنشاء اتصالات جديدة لكل طلب.
 */
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',         // Database host / مضيف قاعدة البيانات
    user: process.env.DB_USER || 'root',              // Database user / مستخدم قاعدة البيانات
    password: process.env.DB_PASSWORD || '',          // Database password / كلمة مرور قاعدة البيانات
    database: process.env.DB_NAME || 'eye_clinic_db', // Database name / اسم قاعدة البيانات
    port: process.env.DB_PORT || 3306,                // Database port / منفذ قاعدة البيانات
    waitForConnections: true,                         // Wait for available connection if pool is full / انتظر الاتصال المتاح إذا كانت المجموعة ممتلئة
    connectionLimit: 10,                              // Maximum number of connections in pool / الحد الأقصى لعدد الاتصالات في المجموعة
    queueLimit: 0,                                    // Unlimited queuing of connection requests / قائمة انتظار غير محدودة لطلبات الاتصال
    enableKeepAlive: true,                            // Enable keep-alive to maintain connections / تفعيل keep-alive للحفاظ على الاتصالات
    keepAliveInitialDelay: 0,                         // Initial delay before keep-alive starts / التأخير الأولي قبل بدء keep-alive
    charset: 'utf8mb4',                               // Character encoding for Unicode support / ترميز الأحرف لدعم Unicode
    // SSL configuration for secure connections (required by some hosting providers) / تكوين SSL للاتصالات الآمنة (مطلوب من قبل بعض مقدمي الاستضافة)
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});

/**
 * Test Database Connection / اختبار اتصال قاعدة البيانات
 * 
 * Tests the database connection and sets UTF-8 session variables.
 * Logs success or error messages to console.
 * 
 * يختبر اتصال قاعدة البيانات ويُعين متغيرات جلسة UTF-8.
 * يسجل رسائل النجاح أو الخطأ في وحدة التحكم.
 */
pool.getConnection()
    .then(async (connection) => {
        try {
            // Set UTF-8 encoding for session / تعيين ترميز UTF-8 للجلسة
            await connection.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");      // Set client character set / تعيين مجموعة أحرف العميل
            await connection.query("SET collation_connection = utf8mb4_unicode_ci");     // Set connection collation / تعيين الترتيب المقارن للاتصال
            await connection.query("SET character_set_client = utf8mb4");                // Set client character set / تعيين مجموعة أحرف العميل
            await connection.query("SET character_set_results = utf8mb4");               // Set results character set / تعيين مجموعة أحرف النتائج
            await connection.query("SET character_set_connection = utf8mb4");            // Set connection character set / تعيين مجموعة أحرف الاتصال
            
            // Log successful connection / تسجيل الاتصال الناجح
            console.log('✅ Database connected successfully with utf8mb4 session');
        } finally {
            // Always release connection back to pool / إطلاق الاتصال دائمًا مرة أخرى إلى المجموعة
            connection.release();
        }
    })
    .catch(err => {
        // Log connection error / تسجيل خطأ الاتصال
        console.error('❌ Database connection error:', err.message);
    });

// Export pool for use in other modules / تصدير المجموعة للاستخدام في الوحدات الأخرى
module.exports = pool;
