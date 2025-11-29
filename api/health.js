/**
 * Serverless Health Check Endpoint / نقطة نهاية فحص الصحة لـ Serverless
 * 
 * This file provides a health check endpoint specifically for Vercel serverless functions.
 * It returns the API status and timestamp to verify the serverless function is running.
 * 
 * يوفر هذا الملف نقطة نهاية فحص صحة خاصة بدوال Vercel serverless.
 * يُرجع حالة واجهة برمجة التطبيقات والطابع الزمني للتحقق من تشغيل دالة serverless.
 * 
 * @param {Object} req - HTTP request object / كائن طلب HTTP
 * @param {Object} res - HTTP response object / كائن استجابة HTTP
 */
module.exports = (req, res) => {
    // Set response headers / تعيين رؤوس الاستجابة
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    // Send health check response / إرسال استجابة فحص الصحة
    res.status(200).json({
        status: 'OK',                              // API status / حالة واجهة برمجة التطبيقات
        from: 'serverless',                        // Indicates serverless deployment / يشير إلى النشر serverless
        timestamp: new Date().toISOString()        // Current timestamp / الطابع الزمني الحالي
    });
};


