# Eye Clinic API

A comprehensive REST API for managing an eye clinic system, including patient management, appointments, prescriptions, medical reports, and color blindness tests.

## Overview

The Eye Clinic API is a Node.js/Express-based backend service that provides endpoints for:
- Clinic and user management
- Patient registration and management
- Appointment scheduling
- Medical prescriptions and reports
- Color blindness testing (Ishihara tests)
- Analytics and reporting
- Mobile application support

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Multi-clinic Support**: Manage multiple clinics with different users
- **Patient Management**: Complete patient profile management
- **Appointment System**: Schedule and manage appointments with availability checking
- **Medical Records**: Prescriptions, medical reports, and test results
- **Color Tests**: Ishihara color blindness test management
- **Mobile API**: Dedicated endpoints for mobile applications
- **Analytics**: Dashboard statistics and reporting
- **Swagger Documentation**: Interactive API documentation

## Technology Stack

- **Runtime**: Node.js 20.x
- **Framework**: Express.js 4.18.2
- **Database**: MySQL 8.0+
- **Authentication**: JWT (jsonwebtoken)
- **Documentation**: Swagger/OpenAPI
- **Validation**: express-validator
- **Security**: bcryptjs, express-rate-limit

## Quick Start

### Prerequisites

- Node.js 20.x or higher
- MySQL 8.0 or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd eye-clinic-api
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env` file in the root directory:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=eye_clinic_db
DB_PORT=3306
DB_SSL=false

# JWT Configuration
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
```

4. Set up the database:
```bash
# Import the schema
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

The API will be available at `http://localhost:5000`

## Documentation

- **API Documentation**: Access Swagger UI at `http://localhost:5000/api-docs`
- **Health Check**: `http://localhost:5000/health`

## Project Structure

```
eye-clinic-api/
├── api/                 # Vercel serverless entry points
├── database/            # Database schemas and migrations
├── scripts/             # Utility scripts
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Custom middleware
│   ├── routes/         # API route definitions
│   ├── utils/          # Utility functions
│   ├── app.js          # Express app configuration
│   └── server.js       # Server entry point
├── package.json
└── README.md
```

## API Endpoints

### Main Endpoints

- `/api/auth` - Authentication (login, register)
- `/api/clinics` - Clinic management
- `/api/patients` - Patient management
- `/api/doctors` - Doctor management
- `/api/appointments` - Appointment scheduling
- `/api/prescriptions` - Prescription management
- `/api/medical-reports` - Medical report management
- `/api/test-results` - Test results management
- `/api/color-tests` - Color blindness tests
- `/api/analytics` - Analytics and statistics
- `/api/mobile/*` - Mobile-specific endpoints

For detailed API documentation, see [API_REFERENCE.md](./docs/API_REFERENCE.md)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database host | `localhost` |
| `DB_USER` | Database user | `root` |
| `DB_PASSWORD` | Database password | - |
| `DB_NAME` | Database name | `eye_clinic_db` |
| `DB_PORT` | Database port | `3306` |
| `DB_SSL` | Enable SSL | `false` |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_EXPIRES_IN` | JWT expiration | `7d` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) | - |

## Development

See [DEVELOPMENT.md](./docs/DEVELOPMENT.md) for detailed development guidelines.

## Deployment

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for deployment instructions.

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS configuration
- Input validation

See [AUTHENTICATION.md](./docs/AUTHENTICATION.md) for security details.

## License

ISC

## Support

For issues and questions, please contact the development team.

