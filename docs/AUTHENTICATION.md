# Authentication & Security Documentation

This document describes the authentication and security features of the Eye Clinic API.

## Overview

The Eye Clinic API uses JWT (JSON Web Tokens) for authentication and implements role-based access control (RBAC) for authorization. Passwords are hashed using bcrypt, and additional security measures include rate limiting and CORS configuration.

## Authentication System

### JWT Authentication

The API uses JWT tokens for stateless authentication. Tokens are generated upon successful login and must be included in subsequent requests.

**Token Format:**
```
Authorization: Bearer <jwt_token>
```

**Token Structure:**
The JWT payload contains:
```json
{
  "userId": 1,
  "email": "user@example.com",
  "role": "doctor",
  "clinicId": 1
}
```

**Token Expiration:**
- Default: 7 days (configurable via `JWT_EXPIRES_IN`)
- Format: `7d`, `24h`, `60m`, etc.

### Token Generation

Tokens are generated in the authentication middleware (`src/middleware/auth.js`):

```javascript
const generateToken = (payload) => {
    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};
```

### Token Verification

Tokens are verified on protected routes using the `authenticateToken` middleware:

```javascript
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token is required'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
        
        req.user = user;
        next();
    });
};
```

## Authorization (Role-Based Access Control)

### User Roles

The API supports three user roles:

1. **Admin** (`admin`)
   - Full access to all endpoints
   - Can manage clinics, users, and all resources
   - Can approve/reject user registrations

2. **Doctor** (`doctor`)
   - Access to patient records
   - Can create/update prescriptions and medical reports
   - Can manage appointments
   - Can create test results

3. **Receptionist** (`receptionist`)
   - Limited access to patient management
   - Can manage appointments
   - Cannot access sensitive medical data

### Authorization Middleware

The `authorize` middleware checks user roles before allowing access:

```javascript
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action'
            });
        }

        next();
    };
};
```

### Usage Example

```javascript
// Require authentication and admin role
router.post('/clinics', authenticateToken, authorize('admin'), clinicController.create);

// Require authentication and either doctor or admin role
router.post('/prescriptions', authenticateToken, authorize('doctor', 'admin'), prescriptionController.create);
```

## Password Security

### Password Hashing

Passwords are hashed using bcryptjs before storage:

```javascript
const bcrypt = require('bcryptjs');

// Hash password
const hashedPassword = await bcrypt.hash(password, 10);

// Verify password
const isValid = await bcrypt.compare(password, hashedPassword);
```

**Hashing Configuration:**
- Salt rounds: 10
- Algorithm: bcrypt

### Password Requirements

While not enforced at the API level, recommended password requirements:
- Minimum 8 characters
- Mix of uppercase and lowercase letters
- Include numbers
- Include special characters

## Protected Routes

Most API routes require authentication. The authentication middleware is applied at the route level:

```javascript
// All routes in this router require authentication
router.use(authenticateToken);

router.get('/', controller.getAll);
router.post('/', authorize('admin'), controller.create);
```

## Public Endpoints

The following endpoints are public (no authentication required):
- `POST /api/auth/login` - User login
- `POST /api/auth/register-clinic` - Clinic registration
- `POST /api/auth/register-user` - User registration
- `GET /api/clinics` - Get all clinics
- `GET /api/clinics/:id` - Get clinic by ID
- `GET /health` - Health check
- `GET /` - Welcome message

## Mobile Authentication

Mobile apps have dedicated authentication endpoints:
- `POST /api/mobile/auth/register` - Patient registration
- `POST /api/mobile/auth/login` - Patient login (using phone number)
- `GET /api/mobile/auth/profile` - Get patient profile (requires authentication)

Mobile authentication uses the same JWT system as web authentication.

## Security Features

### 1. Rate Limiting

API requests are rate-limited to prevent abuse:
- **Window**: 15 minutes
- **Max Requests**: 100 per IP (development: 200)
- **Applied to**: `/api/*` routes

```javascript
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api/', limiter);
```

### 2. CORS Configuration

CORS is configured to restrict allowed origins:
- **Development**: localhost origins always allowed
- **Production**: Origins from `ALLOWED_ORIGINS` environment variable
- **Mobile Apps**: No origin restriction (requests without origin header allowed)

```javascript
const getCorsConfig = () => {
    const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
    const allowedOrigins = allowedOriginsEnv.split(',').map(origin => origin.trim());
    
    return {
        origin: function (origin, callback) {
            if (!origin) return callback(null, true); // Allow mobile apps
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true
    };
};
```

### 3. Input Validation

Request validation is performed using express-validator:
- Validates request body structure
- Validates data types
- Validates required fields
- Prevents SQL injection and XSS attacks

### 4. SQL Injection Prevention

All database queries use parameterized queries:

```javascript
// Safe parameterized query
const [results] = await pool.query(
    'SELECT * FROM users WHERE email = ?',
    [email]
);

// NOT: Direct string concatenation (vulnerable to SQL injection)
```

### 5. Error Handling

Errors are handled securely:
- Generic error messages in production
- Detailed error messages in development
- No sensitive information exposed in error responses
- Stack traces only in development mode

### 6. HTTPS

In production, all API requests should use HTTPS:
- Protects data in transit
- Prevents man-in-the-middle attacks
- Required for secure token transmission

## Environment Variables

Security-related environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `JWT_SECRET` | Secret key for JWT signing | Yes |
| `JWT_EXPIRES_IN` | Token expiration time | No (default: `7d`) |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins | No |
| `NODE_ENV` | Environment (development/production) | No (default: `development`) |

**Example `.env` file:**
```env
JWT_SECRET=your_super_secret_key_here_min_32_characters
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
NODE_ENV=production
```

## Best Practices

1. **Use Strong JWT Secret**
   - Minimum 32 characters
   - Random, unpredictable string
   - Never commit to version control

2. **Rotate Tokens Periodically**
   - Implement token refresh mechanism
   - Short-lived access tokens
   - Long-lived refresh tokens

3. **Validate All Inputs**
   - Use express-validator
   - Sanitize user inputs
   - Validate data types and formats

4. **Use HTTPS in Production**
   - Encrypt all communications
   - Protect sensitive data
   - Prevent token interception

5. **Monitor Authentication Attempts**
   - Log failed login attempts
   - Implement account lockout after multiple failures
   - Alert on suspicious activity

6. **Regular Security Audits**
   - Review authentication code
   - Test for vulnerabilities
   - Update dependencies regularly

## Common Authentication Flows

### Web Application Flow

1. User submits login credentials
2. API validates credentials
3. API generates JWT token
4. API returns token to client
5. Client stores token (localStorage/cookie)
6. Client includes token in subsequent requests
7. API validates token on each request

### Mobile Application Flow

1. Patient submits phone/password
2. API validates credentials
3. API generates JWT token
4. API returns token to mobile app
5. Mobile app stores token securely
6. Mobile app includes token in subsequent requests
7. API validates token on each request

## Error Responses

### Authentication Errors

**401 Unauthorized** - No token provided:
```json
{
  "success": false,
  "message": "Access token is required"
}
```

**403 Forbidden** - Invalid or expired token:
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

**403 Forbidden** - Insufficient permissions:
```json
{
  "success": false,
  "message": "You do not have permission to perform this action"
}
```

## Security Checklist

- [ ] JWT_SECRET is set and strong (32+ characters)
- [ ] HTTPS is enabled in production
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Passwords are hashed with bcrypt
- [ ] SQL injection prevention (parameterized queries)
- [ ] Input validation on all endpoints
- [ ] Error messages don't expose sensitive information
- [ ] Token expiration is configured
- [ ] Regular security audits performed

## Future Enhancements

Potential security improvements:
- Two-factor authentication (2FA)
- Token refresh mechanism
- Account lockout after failed attempts
- Session management
- OAuth2 integration
- API key authentication for third-party integrations

