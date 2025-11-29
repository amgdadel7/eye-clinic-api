# Architecture Documentation

This document describes the architecture and structure of the Eye Clinic API.

## System Overview

The Eye Clinic API is a RESTful API built with Node.js and Express.js. It follows a layered architecture pattern with clear separation of concerns:

- **Routes Layer**: Defines API endpoints and HTTP methods
- **Controller Layer**: Handles business logic and request processing
- **Middleware Layer**: Authentication, authorization, and error handling
- **Data Layer**: Database connections and queries

## Project Structure

```
eye-clinic-api/
├── api/                          # Vercel serverless entry points
│   ├── health.js                 # Serverless health check
│   └── index.js                  # Main serverless entry point
├── database/                     # Database files
│   ├── migrations/               # Database migrations
│   │   └── 20241109_add_patient_auth.sql
│   ├── schema.sql                # Database schema
│   ├── sample_data.sql           # Sample data
│   └── utf8mb4_migration.sql     # UTF-8 migration script
├── scripts/                      # Utility scripts
│   └── apply_patient_auth_migration.py
├── src/
│   ├── app.js                    # Express app configuration
│   ├── server.js                 # Server entry point
│   ├── config/                   # Configuration files
│   │   ├── database.js           # Database connection pool
│   │   └── swagger.js            # Swagger documentation setup
│   ├── controllers/              # Request handlers (business logic)
│   │   ├── analyticsController.js
│   │   ├── appointmentController.js
│   │   ├── authController.js
│   │   ├── clinicController.js
│   │   ├── colorTestController.js
│   │   ├── doctorController.js
│   │   ├── medicalReportController.js
│   │   ├── mobileAppointmentController.js
│   │   ├── mobileAuthController.js
│   │   ├── mobileColorTestController.js
│   │   ├── mobilePrescriptionController.js
│   │   ├── mobileReportController.js
│   │   ├── mobileTestResultController.js
│   │   ├── patientController.js
│   │   ├── prescriptionController.js
│   │   ├── settingsController.js
│   │   ├── testResultController.js
│   │   ├── uiController.js
│   │   ├── userController.js
│   │   ├── userSettingsController.js
│   │   └── waitingRoomController.js
│   ├── middleware/               # Custom middleware
│   │   ├── auth.js               # JWT authentication & authorization
│   │   └── errorHandler.js       # Error handling middleware
│   ├── routes/                   # Route definitions
│   │   ├── analytics.js
│   │   ├── appointments.js
│   │   ├── auth.js
│   │   ├── clinics.js
│   │   ├── colorTests.js
│   │   ├── doctors.js
│   │   ├── medicalReports.js
│   │   ├── mobileAppointments.js
│   │   ├── mobileAuth.js
│   │   ├── mobileColorTests.js
│   │   ├── mobilePrescriptions.js
│   │   ├── mobileReports.js
│   │   ├── mobileTestResults.js
│   │   ├── patients.js
│   │   ├── prescriptions.js
│   │   ├── reports.js
│   │   ├── settings.js
│   │   ├── testResults.js
│   │   ├── ui.js
│   │   ├── users.js
│   │   ├── userSettings.js
│   │   └── waitingRoom.js
│   └── utils/                    # Utility functions
│       └── response.js           # Response helper functions
├── package.json
└── README.md
```

## Architecture Layers

### 1. Routes Layer (`src/routes/`)

Routes define the API endpoints and map HTTP methods to controller functions. They also apply middleware for authentication and authorization.

**Example:**
```javascript
const express = require('express');
const router = express.Router();
const controller = require('../controllers/controller');
const { authenticateToken, authorize } = require('../middleware/auth');

router.use(authenticateToken);  // Apply to all routes
router.get('/', controller.getAll);
router.post('/', authorize('admin'), controller.create);
```

### 2. Controller Layer (`src/controllers/`)

Controllers contain the business logic for handling requests. They:
- Validate input data
- Interact with the database
- Process business logic
- Format and return responses

**Example:**
```javascript
const pool = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

const getAllPatients = async (req, res) => {
    try {
        const [patients] = await pool.query('SELECT * FROM patients');
        sendSuccess(res, patients, 'Patients retrieved successfully');
    } catch (error) {
        sendError(res, error.message, 500);
    }
};
```

### 3. Middleware Layer (`src/middleware/`)

Middleware functions process requests before they reach the controllers:

- **Authentication Middleware** (`auth.js`): Verifies JWT tokens
- **Authorization Middleware**: Checks user roles and permissions
- **Error Handling Middleware** (`errorHandler.js`): Catches and formats errors

### 4. Data Layer (`src/config/database.js`)

The database layer uses a connection pool for efficient database connections:

```javascript
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10,
    charset: 'utf8mb4'
});
```

## Request Flow

1. **Client Request** → HTTP request to API endpoint
2. **CORS Middleware** → Validates origin and sets headers
3. **Rate Limiting** → Limits requests per IP
4. **Body Parsing** → Parses JSON/URL-encoded data
5. **Authentication** → Verifies JWT token (if required)
6. **Authorization** → Checks user permissions
7. **Route Handler** → Routes request to appropriate controller
8. **Controller** → Processes business logic
9. **Database Query** → Executes SQL queries
10. **Response** → Returns formatted JSON response
11. **Error Handling** → Catches and formats errors

## Database Architecture

### Connection Pool

The API uses MySQL connection pooling for efficient database connections:
- **Connection Limit**: 10 concurrent connections
- **Queue Limit**: 0 (unlimited queuing)
- **Keep-Alive**: Enabled to maintain connections
- **Charset**: UTF-8 (utf8mb4) for full Unicode support

### Tables

Key tables in the database:
- `clinics` - Clinic information
- `users` - System users (admins, doctors, receptionists)
- `doctors` - Extended doctor information
- `patients` - Patient records
- `appointments` - Appointment scheduling
- `prescriptions` - Medical prescriptions
- `medical_reports` - Medical reports
- `test_results` - Test results
- `color_tests` - Color blindness tests
- `schedules` - Doctor schedules
- `waiting_room` - Waiting room management

## Authentication & Authorization

### JWT Authentication

- Tokens are generated upon login
- Token expiration: 7 days (configurable)
- Token stored in Authorization header as Bearer token

### Role-Based Access Control

Three user roles:
1. **Admin**: Full access to all endpoints
2. **Doctor**: Access to patient records, appointments, prescriptions, reports
3. **Receptionist**: Limited access to patient management and appointments

### Authorization Middleware

```javascript
authorize('admin', 'doctor')  // Allows admin OR doctor
authorize('admin')            // Only admin
```

## API Design Patterns

### RESTful Principles

- **GET**: Retrieve resources
- **POST**: Create resources
- **PUT**: Update resources
- **DELETE**: Remove resources

### Response Format

All responses follow a consistent format:

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error message"
}
```

## Security Features

1. **JWT Authentication**: Secure token-based authentication
2. **Password Hashing**: bcryptjs for password storage
3. **Rate Limiting**: Prevents abuse (100 requests/15 minutes)
4. **CORS Configuration**: Restricts allowed origins
5. **Input Validation**: express-validator for request validation
6. **SQL Injection Prevention**: Parameterized queries via mysql2

## Error Handling

Errors are caught at multiple levels:

1. **Controller Level**: Try-catch blocks in controllers
2. **Middleware Level**: Error handling middleware
3. **Express Level**: 404 handler for unknown routes

Error responses include:
- Status code (400, 401, 403, 404, 500)
- Error message
- Stack trace (development only)

## CORS Configuration

CORS is configured to allow:
- Development: localhost origins always allowed
- Production: Origins from `ALLOWED_ORIGINS` environment variable
- Mobile apps: No origin restriction

## Rate Limiting

- **Window**: 15 minutes
- **Max Requests**: 100 per IP (development: 200)
- Applied to `/api/*` routes

## Swagger Documentation

Interactive API documentation using Swagger UI:
- **Endpoint**: `/api-docs`
- **JSON Spec**: `/api-docs.json`
- **OpenAPI Version**: 3.0.0

## Vercel Serverless Support

The API supports Vercel serverless deployment:
- Entry point: `api/index.js`
- Health check: `api/health.js`
- Routes work with `/api` base path

## Environment Configuration

Configuration via environment variables:
- Database credentials
- JWT secrets
- Server port
- CORS origins
- Environment mode (development/production)

## Dependencies

### Core Dependencies
- `express` - Web framework
- `mysql2` - MySQL driver
- `jsonwebtoken` - JWT implementation
- `bcryptjs` - Password hashing
- `cors` - CORS middleware
- `morgan` - HTTP request logger
- `express-rate-limit` - Rate limiting
- `express-validator` - Input validation
- `dotenv` - Environment variables

### Development Dependencies
- `nodemon` - Auto-reload during development

### Documentation Dependencies
- `swagger-jsdoc` - Swagger documentation generator
- `swagger-ui-express` - Swagger UI interface

## Best Practices

1. **Separation of Concerns**: Clear separation between routes, controllers, and data access
2. **Error Handling**: Comprehensive error handling at all levels
3. **Security**: Authentication and authorization on protected routes
4. **Validation**: Input validation before processing
5. **Documentation**: Swagger annotations for API documentation
6. **Code Organization**: Modular structure with clear file organization
7. **Environment Variables**: Sensitive data stored in environment variables
8. **Connection Pooling**: Efficient database connection management

## Scalability Considerations

- Connection pooling for database efficiency
- Stateless API design (JWT tokens)
- Rate limiting to prevent abuse
- CORS configuration for security
- Modular architecture for easy extension

## Future Enhancements

Potential improvements:
- Redis caching layer
- Message queue for async operations
- File upload service
- Real-time notifications (WebSocket)
- Advanced analytics and reporting
- Multi-tenant support improvements

