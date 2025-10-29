// Server Entry Point
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { sendError } = require('./utils/response');
const swaggerSetup = require('./config/swagger');

const app = express();

// Middleware - CORS Configuration
const getCorsConfig = () => {
    const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    if (!allowedOriginsEnv) {
        // No ALLOWED_ORIGINS set - allow all origins
        return {
            origin: '*',
            credentials: false,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
            exposedHeaders: ['Content-Type', 'Authorization'],
            optionsSuccessStatus: 200
        };
    }
    
    const allowedOrigins = allowedOriginsEnv.split(',').map(origin => origin.trim());
    
    return {
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            
            // In development, always allow localhost origins for Swagger UI
            if (isDevelopment && (
                origin.startsWith('http://localhost') || 
                origin.startsWith('http://127.0.0.1')
            )) {
                return callback(null, true);
            }
            
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        exposedHeaders: ['Content-Type', 'Authorization'],
        optionsSuccessStatus: 200
    };
};

app.use(cors(getCorsConfig()));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enforce UTF-8 charset for JSON responses
// Ensure JSON responses use UTF-8 without affecting HTML/CSS (e.g., Swagger UI)
app.use((req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        res.set('Content-Type', 'application/json; charset=utf-8');
        return originalJson(body);
    };
    next();
});

// Quiet missing favicon in logs
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Swagger Documentation
swaggerSetup(app);

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Eye Clinic API'
    });
});

// Welcome route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Eye Clinic API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            api: '/api',
            swagger: '/api-docs'
        }
    });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/mobile/auth', require('./routes/mobileAuth'));
app.use('/api/clinics', require('./routes/clinics'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/mobile/appointments', require('./routes/mobileAppointments'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/medical-reports', require('./routes/medicalReports'));
app.use('/api/test-results', require('./routes/testResults'));
app.use('/api/color-tests', require('./routes/colorTests'));
app.use('/api/mobile/color-tests', require('./routes/mobileColorTests'));
app.use('/api/waiting-room', require('./routes/waitingRoom'));
app.use('/api/users', require('./routes/users'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/mobile/prescriptions', require('./routes/mobilePrescriptions'));
app.use('/api/mobile/medical-reports', require('./routes/mobileReports'));
app.use('/api/mobile/test-results', require('./routes/mobileTestResults'));

// Error handlers
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 Swagger docs: http://localhost:${PORT}/api-docs`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
