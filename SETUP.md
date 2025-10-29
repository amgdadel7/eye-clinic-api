# Setup Instructions

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v14 or higher)
- **MySQL** (v8 or higher)
- **npm** or **yarn**

## Step-by-Step Setup

### 1. Navigate to Project Directory

```bash
cd eye-clinic-api
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- express
- mysql2
- jsonwebtoken
- bcryptjs
- and others...

### 3. Configure Environment Variables

Copy the example environment file:

```bash
copy .env.example .env
```

Or on Linux/Mac:

```bash
cp .env.example .env
```

Edit the `.env` file with your settings:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=eye_clinic_db
DB_PORT=3306

JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

ALLOWED_ORIGINS=http://localhost:8080,http://localhost:3000
```

### 4. Create Database

Run the SQL schema to create the database:

**Using MySQL command line:**

```bash
mysql -u root -p < database/schema.sql
```

**Or manually:**

1. Open MySQL command line or MySQL Workbench
2. Connect to your MySQL server
3. Run the contents of `database/schema.sql`

### 5. Start the Server

**Development mode (with auto-reload):**

```bash
npm run dev
```

**Production mode:**

```bash
npm start
```

### 6. Verify Installation

Open your browser or use curl:

```bash
curl http://localhost:5000/health
```

Or visit: `http://localhost:5000/health`

You should see:

```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "Eye Clinic API"
}
```

## Testing the API

### 1. Register a Clinic

```bash
curl -X POST http://localhost:5000/api/auth/register-clinic \
  -H "Content-Type: application/json" \
  -d '{
    "clinicName": "Test Clinic",
    "clinicLicense": "TEST123",
    "clinicPhone": "+966123456789",
    "clinicEmail": "test@clinic.com",
    "ownerName": "Test Owner",
    "ownerEmail": "owner@clinic.com",
    "ownerPhone": "+966987654321",
    "ownerPassword": "test123"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@clinic.com",
    "password": "test123"
  }'
```

Save the token from the response for authenticated requests.

### 3. Make Authenticated Request

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Troubleshooting

### Database Connection Error

If you see a database connection error:

1. Verify MySQL is running
2. Check database credentials in `.env`
3. Ensure database `eye_clinic_db` exists
4. Verify user has proper permissions

### Port Already in Use

If port 5000 is already in use:

1. Change `PORT` in `.env` file
2. Or stop the process using port 5000

### Module Not Found

If you see "Cannot find module" errors:

1. Delete `node_modules` folder
2. Run `npm install` again

## Next Steps

1. Read the API documentation in `API_DOCUMENTATION.md`
2. Explore the available endpoints
3. Start integrating with your frontend application
4. Customize the API based on your needs

## Development Tips

- Use Postman or Insomnia for testing endpoints
- Enable debug mode by setting `NODE_ENV=development` in `.env`
- Check logs in the console for debugging information
- Use `npm run dev` for auto-reload during development

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in `.env`
2. Use a strong `JWT_SECRET`
3. Configure proper CORS origins
4. Set up database backups
5. Use a process manager like PM2
6. Configure HTTPS
7. Set up firewall rules
