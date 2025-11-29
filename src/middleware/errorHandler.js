/**
 * Error Handling Middleware / برامج معالجة الأخطاء الوسيطة
 * 
 * This module provides centralized error handling for the API.
 * It catches all errors, formats them appropriately, and returns JSON responses.
 * 
 * توفر هذه الوحدة معالجة مركزية للأخطاء لواجهة برمجة التطبيقات.
 * تلتقط جميع الأخطاء وتُنسقها بشكل مناسب وتُرجع استجابات JSON.
 */

/**
 * Global Error Handler / معالج الأخطاء العام
 * 
 * Catches all errors thrown in the application and formats them into consistent JSON responses.
 * Handles different error types: MySQL errors, validation errors, JWT errors, etc.
 * In development mode, includes stack trace for debugging.
 * 
 * يلتقط جميع الأخطاء التي تُرمى في التطبيق ويُنسقها إلى استجابات JSON متسقة.
 * يتعامل مع أنواع الأخطاء المختلفة: أخطاء MySQL وأخطاء التحقق وأخطاء JWT وغيرها.
 * في وضع التطوير، يتضمن تتبع المكدس للتصحيح.
 * 
 * @param {Error} err - Error object / كائن الخطأ
 * @param {Object} req - Express request object / كائن طلب Express
 * @param {Object} res - Express response object / كائن استجابة Express
 * @param {Function} next - Express next middleware function / دالة البرنامج الوسيط التالي في Express
 */
const errorHandler = (err, req, res, next) => {
    // Log error to console / تسجيل الخطأ في وحدة التحكم
    console.error('Error:', err);

    // Create error object copy / إنشاء نسخة من كائن الخطأ
    let error = { ...err };
    error.message = err.message;

    /**
     * MySQL Duplicate Entry Error / خطأ الإدخال المكرر في MySQL
     * 
     * Handles ER_DUP_ENTRY MySQL error when trying to insert duplicate unique values.
     * Returns 400 Bad Request status.
     * 
     * يتعامل مع خطأ ER_DUP_ENTRY في MySQL عند محاولة إدراج قيم فريدة مكررة.
     * يُرجع حالة 400 Bad Request.
     */
    if (err.code === 'ER_DUP_ENTRY') {
        const message = 'Duplicate entry found';  // Error message / رسالة الخطأ
        error = { message, statusCode: 400 };
    }

    /**
     * MySQL No Data Found Error / خطأ عدم العثور على البيانات في MySQL
     * 
     * Handles ER_NO_DATA MySQL error when no data is found for a query.
     * Returns 404 Not Found status.
     * 
     * يتعامل مع خطأ ER_NO_DATA في MySQL عند عدم العثور على بيانات للاستعلام.
     * يُرجع حالة 404 Not Found.
     */
    if (err.code === 'ER_NO_DATA') {
        const message = 'Resource not found';  // Error message / رسالة الخطأ
        error = { message, statusCode: 404 };
    }

    /**
     * Validation Error / خطأ التحقق
     * 
     * Handles validation errors from express-validator or other validation libraries.
     * Returns 400 Bad Request status with all validation error messages.
     * 
     * يتعامل مع أخطاء التحقق من express-validator أو مكتبات التحقق الأخرى.
     * يُرجع حالة 400 Bad Request مع جميع رسائل أخطاء التحقق.
     */
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message);  // Extract all error messages / استخراج جميع رسائل الخطأ
        error = { message, statusCode: 400 };
    }

    /**
     * JWT Invalid Token Error / خطأ رمز JWT غير صالح
     * 
     * Handles JsonWebTokenError when JWT token is invalid or malformed.
     * Returns 401 Unauthorized status.
     * 
     * يتعامل مع JsonWebTokenError عندما يكون رمز JWT غير صالح أو مشوه.
     * يُرجع حالة 401 Unauthorized.
     */
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';  // Error message / رسالة الخطأ
        error = { message, statusCode: 401 };
    }

    /**
     * JWT Token Expired Error / خطأ انتهاء صلاحية رمز JWT
     * 
     * Handles TokenExpiredError when JWT token has expired.
     * Returns 401 Unauthorized status.
     * 
     * يتعامل مع TokenExpiredError عندما يكون رمز JWT منتهي الصلاحية.
     * يُرجع حالة 401 Unauthorized.
     */
    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';  // Error message / رسالة الخطأ
        error = { message, statusCode: 401 };
    }

    // Send error response / إرسال استجابة الخطأ
    res.status(error.statusCode || 500).json({
        success: false,                                    // Request failed / فشل الطلب
        message: error.message || 'Server Error',        // Error message / رسالة الخطأ
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })  // Include stack trace in development / تضمين تتبع المكدس في التطوير
    });
};

/**
 * 404 Not Found Handler / معالج 404 Not Found
 * 
 * Handles requests to undefined routes.
 * Creates a 404 error and passes it to the error handler middleware.
 * 
 * يتعامل مع الطلبات للمسارات غير المعرفة.
 * ينشئ خطأ 404 ويمرره إلى برنامج معالجة الأخطاء الوسيط.
 * 
 * @param {Object} req - Express request object / كائن طلب Express
 * @param {Object} res - Express response object / كائن استجابة Express
 * @param {Function} next - Express next middleware function / دالة البرنامج الوسيط التالي في Express
 */
const notFound = (req, res, next) => {
    // Create 404 error with route information / إنشاء خطأ 404 مع معلومات المسار
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);  // Set status code / تعيين رمز الحالة
    next(error);      // Pass to error handler / تمرير إلى معالج الأخطاء
};

// Export error handling functions / تصدير دوال معالجة الأخطاء
module.exports = { errorHandler, notFound };
