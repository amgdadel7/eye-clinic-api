# Development Guide

This document provides guidelines for developing the Eye Clinic API.

## Development Setup

### Prerequisites

- Node.js 20.x or higher
- MySQL 8.0+ database
- npm or yarn
- Git

### Initial Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd eye-clinic-api
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=eye_clinic_db
DB_PORT=3306
DB_SSL=false

# JWT Configuration
JWT_SECRET=your_secret_key_for_development
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
```

4. Set up the database:
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE eye_clinic_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Import schema
mysql -u root -p eye_clinic_db < database/schema.sql

# (Optional) Import sample data
mysql -u root -p eye_clinic_db < database/sample_data.sql
```

5. Run the server:
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

## Project Structure

```
eye-clinic-api/
├── api/                 # Vercel serverless entry points
├── database/            # Database schemas and migrations
├── scripts/             # Utility scripts
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Custom middleware
│   ├── routes/          # API route definitions
│   ├── utils/           # Utility functions
│   ├── app.js           # Express app configuration
│   └── server.js        # Server entry point
├── package.json
└── README.md
```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Write code following the coding standards
- Add tests if applicable
- Update documentation

### 3. Test Your Changes

```bash
# Start the server
npm run dev

# Test endpoints using curl, Postman, or Swagger UI
curl http://localhost:5000/health
```

### 4. Commit Changes

```bash
git add .
git commit -m "feat: add your feature description"
```

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

## Coding Standards

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Use semicolons
- Follow ESLint configuration (if available)

### Naming Conventions

- **Files**: camelCase (e.g., `userController.js`)
- **Variables**: camelCase (e.g., `userId`, `userName`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)
- **Functions**: camelCase (e.g., `getAllUsers`)
- **Classes**: PascalCase (e.g., `UserController`)

### File Organization

- **Controllers**: One file per resource (e.g., `userController.js`)
- **Routes**: One file per resource (e.g., `users.js`)
- **Middleware**: Separate files for each middleware
- **Utils**: Shared utility functions

### Example Controller

```javascript
const pool = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

const getAllUsers = async (req, res) => {
    try {
        const [users] = await pool.query('SELECT * FROM users');
        sendSuccess(res, users, 'Users retrieved successfully');
    } catch (error) {
        console.error('Error:', error);
        sendError(res, error.message, 500);
    }
};

module.exports = {
    getAllUsers
};
```

### Example Route

```javascript
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', authorize('admin'), userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', authorize('admin'), userController.deleteUser);

module.exports = router;
```

## API Development

### Adding a New Endpoint

1. **Create Controller Function** (`src/controllers/`)
```javascript
const getResource = async (req, res) => {
    try {
        const { id } = req.params;
        const [resource] = await pool.query(
            'SELECT * FROM resources WHERE id = ?',
            [id]
        );
        
        if (resource.length === 0) {
            return sendError(res, 'Resource not found', 404);
        }
        
        sendSuccess(res, resource[0], 'Resource retrieved successfully');
    } catch (error) {
        sendError(res, error.message, 500);
    }
};
```

2. **Add Route** (`src/routes/`)
```javascript
router.get('/:id', resourceController.getResource);
```

3. **Register Route** (`src/app.js`)
```javascript
app.use('/api/resources', require('./routes/resources'));
```

4. **Add Swagger Documentation** (optional)
```javascript
/**
 * @swagger
 * /api/resources/{id}:
 *   get:
 *     summary: Get resource by ID
 *     tags: [Resources]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Resource retrieved successfully
 */
```

### Adding Authentication

```javascript
const { authenticateToken, authorize } = require('../middleware/auth');

// Require authentication
router.use(authenticateToken);

// Require specific role
router.post('/', authorize('admin'), controller.create);
```

### Adding Validation

```javascript
const { body, validationResult } = require('express-validator');

const validateRequest = [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

router.post('/', validateRequest, controller.create);
```

## Database Development

### Running Migrations

```bash
python scripts/apply_patient_auth_migration.py \
  --host localhost \
  --user root \
  --password your_password \
  --database eye_clinic_db
```

### Creating Migrations

1. Create migration file in `database/migrations/`
2. Name format: `YYYYMMDD_description.sql`
3. Test migration on development database
4. Document migration in migration file

### Database Queries

Always use parameterized queries:
```javascript
// ✅ Good
const [results] = await pool.query(
    'SELECT * FROM users WHERE email = ?',
    [email]
);

// ❌ Bad (SQL injection risk)
const [results] = await pool.query(
    `SELECT * FROM users WHERE email = '${email}'`
);
```

## Testing

### Manual Testing

1. **Start the server**:
```bash
npm run dev
```

2. **Test endpoints**:
- Use Swagger UI: `http://localhost:5000/api-docs`
- Use curl or Postman
- Use frontend application

### Testing Endpoints

```bash
# Health check
curl http://localhost:5000/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Protected endpoint
curl http://localhost:5000/api/users \
  -H "Authorization: Bearer <token>"
```

## Debugging

### Console Logging

```javascript
console.log('Debug:', variable);
console.error('Error:', error);
```

### Error Handling

Always use try-catch blocks:
```javascript
try {
    // Your code
} catch (error) {
    console.error('Error:', error);
    sendError(res, error.message, 500);
}
```

### Database Debugging

Enable query logging:
```javascript
pool.on('connection', (connection) => {
    console.log('New connection as id ' + connection.threadId);
});

pool.on('error', (err) => {
    console.error('Database error:', err);
});
```

## Environment Variables

### Development

Create `.env` file in root directory:
```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
```

### Loading Environment Variables

Environment variables are loaded using `dotenv`:
```javascript
require('dotenv').config();
```

## Swagger Documentation

### Adding Swagger Annotations

```javascript
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
```

### Viewing Documentation

Access Swagger UI at:
```
http://localhost:5000/api-docs
```

## Git Workflow

### Commit Messages

Follow conventional commits:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Other changes

Examples:
```
feat: add user authentication
fix: resolve database connection error
docs: update API documentation
```

### Branch Naming

- `feature/feature-name` - New features
- `bugfix/bug-name` - Bug fixes
- `hotfix/issue-name` - Urgent fixes
- `docs/documentation-name` - Documentation

## Best Practices

1. **Error Handling**: Always handle errors properly
2. **Input Validation**: Validate all user inputs
3. **SQL Injection**: Use parameterized queries
4. **Authentication**: Protect sensitive endpoints
5. **Authorization**: Check user permissions
6. **Code Reusability**: Create reusable functions
7. **Documentation**: Document your code
8. **Testing**: Test your changes before committing
9. **Code Review**: Review code before merging
10. **Security**: Follow security best practices

## Common Issues

### Port Already in Use

```bash
# Find process using port 5000
lsof -i :5000
# Kill process
kill -9 PID
```

### Database Connection Error

- Check database credentials
- Verify MySQL is running
- Check network connectivity

### Module Not Found

```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### CORS Errors

- Verify `ALLOWED_ORIGINS` includes your frontend URL
- Check CORS middleware configuration

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [MySQL2 Documentation](https://github.com/sidorares/node-mysql2)
- [JWT Documentation](https://jwt.io/)
- [Swagger Documentation](https://swagger.io/docs/)

## Getting Help

- Check existing documentation
- Review code examples
- Ask team members
- Search for similar issues

