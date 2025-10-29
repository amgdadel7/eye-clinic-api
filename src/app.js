// Express App (for Vercel serverless and local server)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enforce UTF-8 charset for JSON responses
app.use((req, res, next) => {
    res.set('Content-Type', 'application/json; charset=utf-8');
    next();
});

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);

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
            api: '/api'
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
            api: '/api'
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


