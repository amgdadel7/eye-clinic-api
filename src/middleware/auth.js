/**
 * JWT Authentication Middleware / برنامج وسيط مصادقة JWT
 * 
 * This module provides JWT-based authentication and authorization middleware.
 * It handles token verification, generation, and role-based access control.
 * 
 * توفر هذه الوحدة برنامج وسيط مصادقة وتفويض قائم على JWT.
 * تتعامل مع التحقق من الرمز وإنشائه والتحكم في الوصول القائم على الأدوار.
 */

// Import JWT library / استيراد مكتبة JWT
const jwt = require('jsonwebtoken');

/**
 * Token Authentication Middleware / برنامج وسيط مصادقة الرمز
 * 
 * Verifies JWT token from Authorization header and attaches user data to request object.
 * Token format: "Bearer <token>"
 * 
 * يتحقق من رمز JWT من رأس Authorization ويُرفق بيانات المستخدم بكائن الطلب.
 * تنسيق الرمز: "Bearer <token>"
 * 
 * @param {Object} req - Express request object / كائن طلب Express
 * @param {Object} res - Express response object / كائن استجابة Express
 * @param {Function} next - Express next middleware function / دالة البرنامج الوسيط التالي في Express
 * @returns {Object} JSON error response if authentication fails / استجابة JSON خطأ إذا فشلت المصادقة
 */
const authenticateToken = (req, res, next) => {
    // Get Authorization header / الحصول على رأس Authorization
    const authHeader = req.headers['authorization'];
    // Extract token from "Bearer TOKEN" format / استخراج الرمز من تنسيق "Bearer TOKEN"
    const token = authHeader && authHeader.split(' ')[1];

    // If no token provided, return 401 Unauthorized / إذا لم يتم توفير الرمز، أرجع 401 Unauthorized
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token is required'  // Error message / رسالة الخطأ
        });
    }

    // Verify JWT token / التحقق من رمز JWT
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            // Token is invalid or expired / الرمز غير صالح أو منتهي الصلاحية
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
        
        // Attach user data to request object / إرفاق بيانات المستخدم بكائن الطلب
        req.user = user;
        // Continue to next middleware / المتابعة إلى البرنامج الوسيط التالي
        next();
    });
};

/**
 * Generate JWT Token / إنشاء رمز JWT
 * 
 * Creates a JWT token with user payload and signs it with the secret key.
 * Token expiration is configurable via JWT_EXPIRES_IN environment variable (default: 7 days).
 * 
 * ينشئ رمز JWT مع بيانات المستخدم ويُوقعه بالمفتاح السري.
 * انتهاء صلاحية الرمز قابل للتكوين عبر متغير البيئة JWT_EXPIRES_IN (الافتراضي: 7 أيام).
 * 
 * @param {Object} payload - User data to encode in token / بيانات المستخدم لتشفيرها في الرمز
 * @param {number} payload.userId - User ID / معرف المستخدم
 * @param {string} payload.email - User email / بريد المستخدم
 * @param {string} payload.role - User role (admin, doctor, receptionist) / دور المستخدم
 * @param {number} payload.clinicId - Clinic ID / معرف العيادة
 * @returns {string} JWT token / رمز JWT
 */
const generateToken = (payload) => {
    return jwt.sign(
        payload,                                    // Token payload / بيانات الرمز
        process.env.JWT_SECRET,                     // Secret key from environment / المفتاح السري من البيئة
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }  // Token expiration (default: 7 days) / انتهاء صلاحية الرمز (الافتراضي: 7 أيام)
    );
};

/**
 * Role-Based Authorization Middleware / برنامج وسيط التفويض القائم على الأدوار
 * 
 * Checks if authenticated user has required role(s) to access the endpoint.
 * Returns 401 if user is not authenticated.
 * Returns 403 if user role is not in allowed roles list.
 * 
 * يتحقق من أن المستخدم المصادق عليه لديه الدور(الأدوار) المطلوب للوصول إلى نقطة النهاية.
 * يُرجع 401 إذا لم يكن المستخدم مصادقًا عليه.
 * يُرجع 403 إذا لم يكن دور المستخدم في قائمة الأدوار المسموح بها.
 * 
 * @param {...string} allowedRoles - Allowed user roles / أدوار المستخدم المسموح بها
 * @returns {Function} Express middleware function / دالة البرنامج الوسيط Express
 * 
 * @example
 * // Only admin can access / فقط المدير يمكنه الوصول
 * router.post('/', authorize('admin'), controller.create);
 * 
 * @example
 * // Admin or doctor can access / المدير أو الطبيب يمكنهما الوصول
 * router.get('/', authorize('admin', 'doctor'), controller.getAll);
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        // Check if user is authenticated / التحقق من أن المستخدم مصادق عليه
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'  // Authentication required error / خطأ المصادقة المطلوبة
            });
        }

        // Check if user role is in allowed roles / التحقق من أن دور المستخدم في الأدوار المسموح بها
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action'  // Permission denied error / خطأ رفض الإذن
            });
        }

        // User has required role, continue to next middleware / المستخدم لديه الدور المطلوب، متابعة إلى البرنامج الوسيط التالي
        next();
    };
};

// Export authentication and authorization functions / تصدير دوال المصادقة والتفويض
module.exports = {
    authenticateToken,  // Token verification middleware / برنامج التحقق من الرمز الوسيط
    generateToken,      // Token generation function / دالة إنشاء الرمز
    authorize           // Role-based authorization middleware / برنامج التفويض القائم على الأدوار الوسيط
};
