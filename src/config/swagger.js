/**
 * Swagger Documentation Configuration / تكوين توثيق Swagger
 * 
 * This module configures Swagger/OpenAPI documentation for the Eye Clinic API.
 * Swagger provides interactive API documentation that can be accessed via a web interface.
 * 
 * تكوّن هذه الوحدة توثيق Swagger/OpenAPI لواجهة برمجة تطبيقات عيادة العيون.
 * يوفر Swagger توثيق واجهة برمجة تطبيقات تفاعلي يمكن الوصول إليه عبر واجهة ويب.
 */

// Import Swagger modules / استيراد وحدات Swagger
const swaggerJsdoc = require('swagger-jsdoc');   // Swagger JSDoc parser / محلل Swagger JSDoc
const swaggerUi = require('swagger-ui-express'); // Swagger UI for Express / واجهة Swagger لـ Express

/**
 * Swagger Configuration Options / خيارات تكوين Swagger
 * 
 * Defines OpenAPI specification version, API information, servers, and security schemes.
 * 
 * يحدد إصدار مواصفات OpenAPI ومعلومات واجهة برمجة التطبيقات والخوادم ومخططات الأمان.
 */
const options = {
  definition: {
    openapi: '3.0.0',  // OpenAPI specification version / إصدار مواصفات OpenAPI
    info: {
      title: 'Eye Clinic API',                                                                    // API title / عنوان واجهة برمجة التطبيقات
      version: '1.0.0',                                                                           // API version / إصدار واجهة برمجة التطبيقات
      description: 'REST API documentation for Eye Clinic Management System',                      // API description / وصف واجهة برمجة التطبيقات
      contact: {
        name: 'API Support',  // Support contact / جهة اتصال الدعم
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',        // Development server URL / رابط خادم التطوير
        description: 'Development server',   // Server description / وصف الخادم
      },
      {
        url: '/api',                         // Production server base path / مسار الخادم الأساسي للإنتاج
        description: 'Production server (Vercel)',  // Production server description / وصف خادم الإنتاج
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',          // Authentication type / نوع المصادقة
          scheme: 'bearer',      // Authentication scheme / مخطط المصادقة
          bearerFormat: 'JWT',   // Token format / تنسيق الرمز
        },
      },
    },
    security: [
      {
        bearerAuth: [],  // Default security requirement / متطلب الأمان الافتراضي
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/app.js'],  // Paths to API route files for JSDoc parsing / مسارات ملفات مسار واجهة برمجة التطبيقات لتحليل JSDoc
};

// Generate Swagger specification from JSDoc comments / إنشاء مواصفات Swagger من تعليقات JSDoc
const swaggerSpec = swaggerJsdoc(options);

/**
 * Swagger Setup Function / دالة إعداد Swagger
 * 
 * Sets up Swagger UI and JSON endpoint on the Express application.
 * Provides interactive API documentation interface.
 * 
 * يُعد واجهة Swagger UI ونقطة نهاية JSON على تطبيق Express.
 * يوفر واجهة توثيق واجهة برمجة تطبيقات تفاعلية.
 * 
 * @param {Object} app - Express application instance / مثيل تطبيق Express
 */
const swaggerSetup = (app) => {
  /**
   * Swagger JSON Endpoint / نقطة نهاية Swagger JSON
   * 
   * Returns Swagger specification in JSON format.
   * Accessible at: GET /api-docs.json
   * 
   * يُرجع مواصفات Swagger بتنسيق JSON.
   * متاح على: GET /api-docs.json
   */
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');  // Set content type / تعيين نوع المحتوى
    res.send(swaggerSpec);                              // Send Swagger specification / إرسال مواصفات Swagger
  });

  /**
   * Swagger UI Endpoint / نقطة نهاية Swagger UI
   * 
   * Serves interactive Swagger UI for browsing and testing API endpoints.
   * Accessible at: GET /api-docs
   * 
   * يقدم واجهة Swagger UI التفاعلية لتصفح واختبار نقاط نهاية واجهة برمجة التطبيقات.
   * متاح على: GET /api-docs
   */
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',  // Hide Swagger topbar / إخفاء الشريط العلوي لـ Swagger
    customSiteTitle: 'Eye Clinic API Documentation',     // Custom page title / عنوان الصفحة المخصص
  }));
};

// Export setup function / تصدير دالة الإعداد
module.exports = swaggerSetup;

