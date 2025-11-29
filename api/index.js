/**
 * Vercel Serverless Entry Point / نقطة دخول Vercel Serverless
 * 
 * This file is the entry point for Vercel serverless deployment.
 * It imports the Express app and exports a handler function compatible
 * with Vercel's serverless runtime.
 * 
 * هذا الملف هو نقطة الدخول للنشر serverless على Vercel.
 * يستورد تطبيق Express ويُصدّر دالة معالج متوافقة مع بيئة تشغيل Vercel serverless.
 */

// Import Express application from src/app.js / استيراد تطبيق Express من src/app.js
const app = require('../src/app');

/**
 * Serverless Handler Function / دالة معالج Serverless
 * 
 * Exports a handler function compatible with Vercel's @vercel/node runtime.
 * This function receives HTTP requests from Vercel and passes them to Express app.
 * 
 * يُصدّر دالة معالج متوافقة مع بيئة تشغيل @vercel/node من Vercel.
 * تتلقى هذه الدالة طلبات HTTP من Vercel وتمررها إلى تطبيق Express.
 * 
 * @param {Object} req - HTTP request object / كائن طلب HTTP
 * @param {Object} res - HTTP response object / كائن استجابة HTTP
 * @returns {Object} Express app response / استجابة تطبيق Express
 */
module.exports = (req, res) => {
    return app(req, res);  // Pass request to Express app / تمرير الطلب إلى تطبيق Express
};


