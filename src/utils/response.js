/**
 * Response Helper Functions / دوال مساعدة الاستجابة
 * 
 * This module provides utility functions for sending consistent JSON responses.
 * These functions ensure all API responses follow a standard format.
 * 
 * توفر هذه الوحدة دوال مساعدة لإرسال استجابات JSON متسقة.
 * تضمن هذه الدوال أن جميع استجابات واجهة برمجة التطبيقات تتبع تنسيقًا قياسيًا.
 */

/**
 * Send Success Response / إرسال استجابة النجاح
 * 
 * Sends a standardized success response with data.
 * Used for successful GET, POST, PUT, DELETE operations.
 * 
 * يُرسل استجابة نجاح موحدة مع البيانات.
 * يُستخدم للعمليات الناجحة GET، POST، PUT، DELETE.
 * 
 * @param {Object} res - Express response object / كائن استجابة Express
 * @param {*} data - Response data (can be object, array, or any value) / بيانات الاستجابة (يمكن أن تكون كائن أو مصفوفة أو أي قيمة)
 * @param {string} message - Success message (default: 'Success') / رسالة النجاح (الافتراضي: 'Success')
 * @param {number} statusCode - HTTP status code (default: 200) / رمز حالة HTTP (الافتراضي: 200)
 * 
 * @example
 * // Send success response with data / إرسال استجابة نجاح مع البيانات
 * sendSuccess(res, { id: 1, name: 'John' }, 'User retrieved successfully', 200);
 * 
 * @example
 * // Send success response with array / إرسال استجابة نجاح مع مصفوفة
 * sendSuccess(res, [{ id: 1 }, { id: 2 }], 'Users retrieved successfully');
 */
const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
    res.status(statusCode).json({
        success: true,    // Request successful / الطلب ناجح
        message,          // Success message / رسالة النجاح
        data              // Response data / بيانات الاستجابة
    });
};

/**
 * Send Error Response / إرسال استجابة الخطأ
 * 
 * Sends a standardized error response.
 * Used for failed operations and error cases.
 * 
 * يُرسل استجابة خطأ موحدة.
 * يُستخدم للعمليات الفاشلة وحالات الخطأ.
 * 
 * @param {Object} res - Express response object / كائن استجابة Express
 * @param {string} message - Error message (default: 'Error') / رسالة الخطأ (الافتراضي: 'Error')
 * @param {number} statusCode - HTTP status code (default: 400) / رمز حالة HTTP (الافتراضي: 400)
 * 
 * @example
 * // Send error response / إرسال استجابة خطأ
 * sendError(res, 'User not found', 404);
 * 
 * @example
 * // Send validation error / إرسال خطأ التحقق
 * sendError(res, 'Invalid email format', 400);
 */
const sendError = (res, message = 'Error', statusCode = 400) => {
    res.status(statusCode).json({
        success: false,  // Request failed / الطلب فشل
        message          // Error message / رسالة الخطأ
    });
};

// Export response helper functions / تصدير دوال مساعدة الاستجابة
module.exports = { sendSuccess, sendError };
