// Express App (for Vercel serverless and local server)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { errorHandler, notFound } = require('./middleware/errorHandler');
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

// Rate limiting - More lenient for development
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Increased from 100 to 200 requests per window
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

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

// Duplicate health under /api for serverless base path
app.get('/api/health', (req, res) => {
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

// Explicit /api welcome for Vercel function base path
app.get('/api', (req, res) => {
    res.json({
        message: 'Welcome to Eye Clinic API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            api: '/api',
            swagger: '/api-docs'
        }
    });
});

// Routes (mounted with and without /api prefix to support Vercel base path)
app.use('/api/auth', require('./routes/auth'));
app.use('/auth', require('./routes/auth'));

app.use('/api/mobile/auth', require('./routes/mobileAuth'));
app.use('/mobile/auth', require('./routes/mobileAuth'));

app.use('/api/clinics', require('./routes/clinics'));
app.use('/clinics', require('./routes/clinics'));

app.use('/api/patients', require('./routes/patients'));
app.use('/patients', require('./routes/patients'));

app.use('/api/doctors', require('./routes/doctors'));
app.use('/doctors', require('./routes/doctors'));

app.use('/api/appointments', require('./routes/appointments'));
app.use('/appointments', require('./routes/appointments'));

app.use('/api/mobile/appointments', require('./routes/mobileAppointments'));
app.use('/mobile/appointments', require('./routes/mobileAppointments'));

app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/prescriptions', require('./routes/prescriptions'));

app.use('/api/medical-reports', require('./routes/medicalReports'));
app.use('/medical-reports', require('./routes/medicalReports'));

app.use('/api/test-results', require('./routes/testResults'));
app.use('/test-results', require('./routes/testResults'));

app.use('/api/color-tests', require('./routes/colorTests'));
app.use('/color-tests', require('./routes/colorTests'));

app.use('/api/mobile/color-tests', require('./routes/mobileColorTests'));
app.use('/mobile/color-tests', require('./routes/mobileColorTests'));

app.use('/api/waiting-room', require('./routes/waitingRoom'));
app.use('/waiting-room', require('./routes/waitingRoom'));

app.use('/api/users', require('./routes/users'));
app.use('/users', require('./routes/users'));

app.use('/api/analytics', require('./routes/analytics'));
app.use('/analytics', require('./routes/analytics'));

// Reports (daily/monthly aggregates)
app.use('/api/reports', require('./routes/reports'));
app.use('/reports', require('./routes/reports'));

// UI and Settings endpoints
app.use('/api/ui', require('./routes/ui'));
app.use('/ui', require('./routes/ui'));
app.use('/api/settings', require('./routes/settings'));
app.use('/settings', require('./routes/settings'));
app.use('/api/user-settings', require('./routes/userSettings'));
app.use('/user-settings', require('./routes/userSettings'));

app.use('/api/mobile/prescriptions', require('./routes/mobilePrescriptions'));
app.use('/mobile/prescriptions', require('./routes/mobilePrescriptions'));

app.use('/api/mobile/medical-reports', require('./routes/mobileReports'));
app.use('/mobile/medical-reports', require('./routes/mobileReports'));

app.use('/api/mobile/test-results', require('./routes/mobileTestResults'));
app.use('/mobile/test-results', require('./routes/mobileTestResults'));

// Error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;


