// Server Entry Point
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { sendError } = require('./utils/response');

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
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

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
            api: '/api'
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
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
