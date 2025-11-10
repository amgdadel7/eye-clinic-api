# Eye Clinic Management System API

REST API for Eye Clinic Management System built with Node.js, Express, and MySQL.

## Features

- **Authentication & Authorization**: JWT-based authentication for different user roles
- **User Management**: Admin, Doctor, Receptionist, and Patient management
- **Appointment Booking**: Smart automatic appointment scheduling
- **Patient Management**: Complete patient records and medical history
- **Doctor Management**: Doctor profiles, schedules, and availability
- **Prescriptions**: Digital prescription management
- **Medical Reports**: Comprehensive medical report generation
- **Test Results**: Test result tracking and management
- **Color Blindness Tests**: Specialized tests with image support (base64)
- **Waiting Room**: Real-time waiting room management
- **Analytics**: Dashboard statistics and reporting

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **File Upload**: multer
- **Security**: CORS, Rate Limiting

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MySQL (v8 or higher)
- npm or yarn

### Setup

1. Clone the repository or navigate to the project directory:
```bash
cd eye-clinic-api
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=eye_clinic_db
DB_PORT=3306

JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

ALLOWED_ORIGINS=http://localhost:8080,http://localhost:3000
```

4. Create the database:
```bash
mysql -u root -p < database/schema.sql
```

5. Start the server:

Development mode (with nodemon):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication

#### Clinic Registration
- `POST /api/auth/register-clinic` - Register new clinic and owner

#### User Registration
- `POST /api/auth/register-user` - Register user (doctor/receptionist)

#### Login
- `POST /api/auth/login` - Login for system users
- `POST /api/mobile/auth/login` - Login for patients

#### Mobile Patient Registration
- `POST /api/mobile/auth/register` - Register new patient

### Clinics

- `GET /api/clinics` - Get all clinics
- `GET /api/clinics/:id` - Get clinic by ID
- `GET /api/clinics/:id/doctors` - Get clinic doctors
- `GET /api/clinics/:id/services` - Get clinic services
- `PUT /api/clinics/:id` - Update clinic (admin only)

### Patients

- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create patient (admin/receptionist)
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient (admin only)

### Doctors

- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor by ID
- `POST /api/doctors` - Create doctor (admin only)
- `PUT /api/doctors/:id` - Update doctor
- `GET /api/doctors/:id/schedule` - Get doctor schedule
- `PUT /api/doctors/:id/schedule` - Update doctor schedule

### Appointments

#### System Users
- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/today` - Get today's appointments
- `GET /api/appointments/doctor/:doctorId` - Get doctor appointments
- `GET /api/appointments/:id` - Get appointment by ID
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

#### Mobile (Patients)
- `POST /api/mobile/appointments/book` - Book appointment (automatic scheduling)
- `GET /api/mobile/appointments/my-appointments` - Get my appointments
- `GET /api/mobile/appointments/available-slots` - Get available time slots
- `PUT /api/mobile/appointments/:id/cancel` - Cancel appointment

### Prescriptions

- `GET /api/prescriptions` - Get all prescriptions
- `GET /api/prescriptions/:id` - Get prescription by ID
- `POST /api/prescriptions` - Create prescription (doctor only)
- `GET /api/prescriptions/patient/:patientId` - Get patient prescriptions
- `GET /api/mobile/prescriptions/my-prescriptions` - Get my prescriptions (mobile)

### Medical Reports

- `GET /api/medical-reports` - Get all reports
- `GET /api/medical-reports/:id` - Get report by ID
- `POST /api/medical-reports` - Create report (doctor only)
- `GET /api/medical-reports/patient/:patientId` - Get patient reports
- `GET /api/mobile/medical-reports/my-reports` - Get my reports (mobile)

### Test Results

- `GET /api/test-results` - Get all test results
- `GET /api/test-results/:id` - Get test result by ID
- `POST /api/test-results` - Create test result
- `GET /api/test-results/patient/:patientId` - Get patient test results
- `GET /api/mobile/test-results/my-results` - Get my test results (mobile)

### Color Blindness Tests

- `GET /api/color-tests` - Get all tests
- `GET /api/color-tests/:id` - Get test by ID
- `POST /api/color-tests` - Create test (admin/doctor only)
- `PUT /api/color-tests/:id` - Update test (admin/doctor only)
- `DELETE /api/color-tests/:id` - Delete test (admin only)

#### Mobile (Patients)
- `GET /api/mobile/color-tests/all` - Get all tests with images (base64)
- `POST /api/mobile/color-tests/submit-answers` - Submit test answers
- `GET /api/mobile/color-tests/my-results` - Get my test results

### Waiting Room

- `GET /api/waiting-room` - Get waiting list
- `POST /api/waiting-room/check-in` - Check-in patient
- `PUT /api/waiting-room/:id/status` - Update patient status
- `DELETE /api/waiting-room/:id` - Remove from waiting room

### Users Management

- `GET /api/users` - Get all users (admin only)
- `GET /api/users/pending` - Get pending users (admin only)
- `PUT /api/users/:id/approve` - Approve user (admin only)
- `PUT /api/users/:id/reject` - Reject user (admin only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)

### Analytics

- `GET /api/analytics/dashboard` - Get dashboard statistics
- `GET /api/analytics/patients` - Get patient statistics
- `GET /api/analytics/appointments` - Get appointment statistics
- `GET /api/analytics/revenue` - Get revenue statistics (admin only)

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Success message",
  "data": {}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message"
}
```

## User Roles & Permissions

### Admin
- Full access to all features
- Clinic management
- User management and approval
- Analytics and reporting

### Doctor
- Patient management
- Appointment management
- Prescription creation
- Medical report creation
- Test result management

### Receptionist
- Patient management
- Appointment management
- Check-in and waiting room management
- Schedule viewing

### Patient (Mobile App)
- View appointments
- Book appointments
- View prescriptions
- View medical reports
- View test results
- Take color blindness tests

#### Seeded Patient Accounts (Mobile Only)
| Name | Phone | Password |
| --- | --- | --- |
| عبدالله محمد الأحمد | +966501234001 | Patient@123 |
| فاطمة عبدالرحمن السعد | +966501234002 | Patient@123 |
| محمد خالد المطيري | +966501234003 | Patient@123 |
| نورا سعد الغامدي | +966501234004 | Patient@123 |
| سعد عبدالله القحطاني | +966501234005 | Patient@123 |

> **ملاحظة:** يتم تقييد حسابات المرضى على تطبيق الهاتف المحمول فقط. محاولات تسجيل الدخول عبر لوحة التحكم الإدارية (`/api/auth/login`) يتم رفضها برسالة توجيه لاستخدام التطبيق المحمول.

## Database Schema

The database includes the following main tables:

- `clinics` - Clinic information
- `users` - System users (admins, doctors, receptionists)
- `patients` - Patient information
- `doctors` - Doctor details and profiles
- `appointments` - Appointment scheduling
- `schedules` - Doctor schedules
- `prescriptions` - Medical prescriptions
- `medical_reports` - Medical reports
- `test_results` - Test results
- `color_blindness_tests` - Color blindness tests with images
- `patient_test_answers` - Patient test responses
- `waiting_room` - Waiting room management

## Special Features

### Automatic Appointment Booking

The mobile API includes automatic appointment booking that:
- Finds the first available slot based on doctor's schedule
- Considers existing appointments
- Accounts for break times
- Returns the confirmed date and time

### Color Blindness Tests

Special support for color blindness testing:
- Images stored as base64 in database
- Each test includes image, number, and correct answer
- Patients can view tests and submit answers
- Results are automatically calculated and stored

## Development

### Project Structure

```
eye-clinic-api/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Middleware functions
│   ├── models/          # Database models (if used)
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── server.js        # Entry point
├── database/
│   └── schema.sql       # Database schema
├── uploads/             # Uploaded files
├── .env                 # Environment variables
├── package.json
└── README.md
```

## License

ISC

## Support

For support, please contact the development team.
