# API Reference

Complete reference for all API endpoints in the Eye Clinic API.

## Base URL

- Development: `http://localhost:5000/api`
- Production: `https://your-domain.com/api`

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Authentication Endpoints

### POST `/api/auth/register-clinic`
Register a new clinic.

**Request Body:**
```json
{
  "name": "Clinic Name",
  "email": "clinic@example.com",
  "password": "password123",
  "code": "CLINIC001",
  "license": "LIC123",
  "phone": "1234567890",
  "address": "Clinic Address"
}
```

**Response:** `201 Created`

---

### POST `/api/auth/register-user`
Register a new user (admin, doctor, or receptionist).

**Request Body:**
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password123",
  "phone": "1234567890",
  "role": "doctor",
  "clinicId": 1
}
```

**Response:** `201 Created`

---

### POST `/api/auth/login`
Login and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": { ... }
}
```

---

### GET `/api/auth/me`
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`

---

### PUT `/api/auth/update-profile`
Update user profile (requires authentication).

**Response:** `200 OK`

---

## Clinic Endpoints

### GET `/api/clinics`
Get all clinics.

**Response:** `200 OK`

---

### GET `/api/clinics/:id`
Get clinic by ID.

**Response:** `200 OK`

---

### GET `/api/clinics/:id/doctors`
Get all doctors in a clinic.

**Response:** `200 OK`

---

### PUT `/api/clinics/:id`
Update clinic (requires admin authentication).

**Response:** `200 OK`

---

## Patient Endpoints

### GET `/api/patients`
Get all patients (requires authentication).

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page
- `search` - Search term

**Response:** `200 OK`

---

### GET `/api/patients/:id`
Get patient by ID (requires authentication).

**Response:** `200 OK`

---

### POST `/api/patients`
Create new patient (requires admin or receptionist authentication).

**Request Body:**
```json
{
  "name": "Patient Name",
  "phone": "1234567890",
  "email": "patient@example.com",
  "age": 30,
  "gender": "male",
  "dateOfBirth": "1993-01-01",
  "address": "Patient Address"
}
```

**Response:** `201 Created`

---

### PUT `/api/patients/:id`
Update patient (requires authentication).

**Response:** `200 OK`

---

### DELETE `/api/patients/:id`
Delete patient (requires admin authentication).

**Response:** `200 OK`

---

## Doctor Endpoints

### GET `/api/doctors`
Get all doctors.

**Response:** `200 OK`

---

### GET `/api/doctors/:id`
Get doctor by ID.

**Response:** `200 OK`

---

### POST `/api/doctors`
Create new doctor (requires admin authentication).

**Request Body:**
```json
{
  "userId": 1,
  "doctorId": "DOC001",
  "specialization": "Ophthalmology",
  "clinicId": 1,
  "licenseNumber": "LIC123"
}
```

**Response:** `201 Created`

---

### PUT `/api/doctors/:id`
Update doctor.

**Response:** `200 OK`

---

### GET `/api/doctors/:id/schedule`
Get doctor's schedule.

**Response:** `200 OK`

---

### PUT `/api/doctors/:id/schedule`
Update doctor's schedule.

**Response:** `200 OK`

---

### DELETE `/api/doctors/:id`
Delete doctor (requires admin authentication).

**Response:** `200 OK`

---

## Appointment Endpoints

### GET `/api/appointments`
Get all appointments (requires authentication).

**Query Parameters:**
- `date` - Filter by date
- `doctorId` - Filter by doctor
- `status` - Filter by status

**Response:** `200 OK`

---

### GET `/api/appointments/today`
Get today's appointments (requires authentication).

**Response:** `200 OK`

---

### GET `/api/appointments/doctor/:doctorId`
Get appointments for a specific doctor (requires authentication).

**Response:** `200 OK`

---

### GET `/api/appointments/available-slots`
Get available appointment slots (requires authentication).

**Query Parameters:**
- `doctorId` - Doctor ID
- `date` - Date (YYYY-MM-DD)

**Response:** `200 OK`

---

### GET `/api/appointments/:id`
Get appointment by ID (requires authentication).

**Response:** `200 OK`

---

### POST `/api/appointments`
Create new appointment (requires authentication).

**Request Body:**
```json
{
  "patientId": 1,
  "doctorId": 1,
  "appointmentDate": "2024-01-15",
  "appointmentTime": "10:00:00",
  "reason": "Eye examination"
}
```

**Response:** `201 Created`

---

### POST `/api/appointments/suggest-time`
Suggest available appointment time (requires authentication).

**Request Body:**
```json
{
  "doctorId": 1,
  "preferredDate": "2024-01-15"
}
```

**Response:** `200 OK`

---

### PUT `/api/appointments/:id`
Update appointment (requires authentication).

**Response:** `200 OK`

---

### DELETE `/api/appointments/:id`
Delete appointment (requires authentication).

**Response:** `200 OK`

---

## Prescription Endpoints

### GET `/api/prescriptions`
Get all prescriptions (requires authentication).

**Response:** `200 OK`

---

### GET `/api/prescriptions/patient/:patientId`
Get prescriptions for a patient (requires authentication).

**Response:** `200 OK`

---

### GET `/api/prescriptions/:id`
Get prescription by ID (requires authentication).

**Response:** `200 OK`

---

### POST `/api/prescriptions`
Create new prescription (requires doctor or admin authentication).

**Request Body:**
```json
{
  "patientId": 1,
  "doctorId": 1,
  "medications": [
    {
      "name": "Eye Drops",
      "dosage": "2 drops",
      "frequency": "Twice daily"
    }
  ],
  "instructions": "Apply as directed"
}
```

**Response:** `201 Created`

---

### PUT `/api/prescriptions/:id`
Update prescription (requires doctor or admin authentication).

**Response:** `200 OK`

---

### DELETE `/api/prescriptions/:id`
Delete prescription (requires doctor or admin authentication).

**Response:** `200 OK`

---

## Medical Report Endpoints

### GET `/api/medical-reports`
Get all medical reports (requires authentication).

**Response:** `200 OK`

---

### GET `/api/medical-reports/patient/:patientId`
Get medical reports for a patient (requires authentication).

**Response:** `200 OK`

---

### GET `/api/medical-reports/:id`
Get medical report by ID (requires authentication).

**Response:** `200 OK`

---

### POST `/api/medical-reports`
Create new medical report (requires doctor or admin authentication).

**Request Body:**
```json
{
  "patientId": 1,
  "doctorId": 1,
  "reportType": "Examination",
  "findings": "Normal eye examination",
  "diagnosis": "Healthy",
  "recommendations": "Regular checkup"
}
```

**Response:** `201 Created`

---

### PUT `/api/medical-reports/:id`
Update medical report (requires doctor or admin authentication).

**Response:** `200 OK`

---

### DELETE `/api/medical-reports/:id`
Delete medical report (requires doctor or admin authentication).

**Response:** `200 OK`

---

## Test Result Endpoints

### GET `/api/test-results`
Get all test results (requires authentication).

**Response:** `200 OK`

---

### GET `/api/test-results/patient/:patientId`
Get test results for a patient (requires authentication).

**Response:** `200 OK`

---

### GET `/api/test-results/:id`
Get test result by ID (requires authentication).

**Response:** `200 OK`

---

### POST `/api/test-results`
Create new test result (requires doctor or admin authentication).

**Response:** `201 Created`

---

### PUT `/api/test-results/:id`
Update test result (requires doctor or admin authentication).

**Response:** `200 OK`

---

### DELETE `/api/test-results/:id`
Delete test result (requires doctor or admin authentication).

**Response:** `200 OK`

---

## Color Test Endpoints

### GET `/api/color-tests`
Get all color tests (requires authentication).

**Response:** `200 OK`

---

### GET `/api/color-tests/:id`
Get color test by ID (requires authentication).

**Response:** `200 OK`

---

### POST `/api/color-tests`
Create new color test (requires admin or doctor authentication).

**Request Body:**
```json
{
  "testNumber": 1,
  "imageUrl": "path/to/image.png",
  "correctAnswer": "12",
  "questionType": "number"
}
```

**Response:** `201 Created`

---

### PUT `/api/color-tests/:id`
Update color test (requires admin or doctor authentication).

**Response:** `200 OK`

---

### DELETE `/api/color-tests/:id`
Delete color test (requires admin authentication).

**Response:** `200 OK`

---

## Analytics Endpoints

### GET `/api/analytics`
Get analytics overview (requires authentication).

**Response:** `200 OK`

---

### GET `/api/analytics/dashboard`
Get dashboard statistics (requires authentication).

**Response:** `200 OK`

---

### GET `/api/analytics/patients`
Get patient statistics (requires authentication).

**Response:** `200 OK`

---

### GET `/api/analytics/appointments`
Get appointment statistics (requires authentication).

**Response:** `200 OK`

---

### GET `/api/analytics/revenue`
Get revenue statistics (requires admin authentication).

**Response:** `200 OK`

---

## Waiting Room Endpoints

### GET `/api/waiting-room`
Get waiting list (requires authentication).

**Response:** `200 OK`

---

### POST `/api/waiting-room/check-in`
Check in patient to waiting room (requires authentication).

**Request Body:**
```json
{
  "patientId": 1,
  "appointmentId": 1
}
```

**Response:** `201 Created`

---

### PUT `/api/waiting-room/:id/status`
Update waiting room status (requires authentication).

**Request Body:**
```json
{
  "status": "in_progress"
}
```

**Response:** `200 OK`

---

### DELETE `/api/waiting-room/:id`
Remove patient from waiting room (requires authentication).

**Response:** `200 OK`

---

## User Management Endpoints

### GET `/api/users`
Get all users (requires admin authentication).

**Response:** `200 OK`

---

### GET `/api/users/pending`
Get pending users (requires admin authentication).

**Response:** `200 OK`

---

### PUT `/api/users/:id/approve`
Approve user (requires admin authentication).

**Response:** `200 OK`

---

### PUT `/api/users/:id/reject`
Reject user (requires admin authentication).

**Response:** `200 OK`

---

### PUT `/api/users/:id`
Update user.

**Response:** `200 OK`

---

### DELETE `/api/users/:id`
Delete user (requires admin authentication).

**Response:** `200 OK`

---

## Mobile API Endpoints

### POST `/api/mobile/auth/register`
Register patient (mobile).

**Request Body:**
```json
{
  "name": "Patient Name",
  "phone": "1234567890",
  "email": "patient@example.com",
  "password": "password123"
}
```

**Response:** `201 Created`

---

### POST `/api/mobile/auth/login`
Patient login (mobile).

**Request Body:**
```json
{
  "phone": "1234567890",
  "password": "password123"
}
```

**Response:** `200 OK`

---

### GET `/api/mobile/auth/profile`
Get patient profile (requires authentication).

**Response:** `200 OK`

---

### POST `/api/mobile/appointments/book`
Book appointment (mobile, requires authentication).

**Response:** `201 Created`

---

### GET `/api/mobile/appointments/my-appointments`
Get patient's appointments (mobile, requires authentication).

**Response:** `200 OK`

---

### GET `/api/mobile/appointments/available-slots`
Get available slots (mobile, requires authentication).

**Response:** `200 OK`

---

### PUT `/api/mobile/appointments/:id/cancel`
Cancel appointment (mobile, requires authentication).

**Response:** `200 OK`

---

### GET `/api/mobile/color-tests/all`
Get all color tests (mobile, requires authentication).

**Response:** `200 OK`

---

### POST `/api/mobile/color-tests/submit-answers`
Submit color test answers (mobile, requires authentication).

**Request Body:**
```json
{
  "testId": 1,
  "answers": {
    "1": "12",
    "2": "8"
  }
}
```

**Response:** `200 OK`

---

### GET `/api/mobile/color-tests/my-results`
Get patient's test results (mobile, requires authentication).

**Response:** `200 OK`

---

### GET `/api/mobile/prescriptions/my-prescriptions`
Get patient's prescriptions (mobile, requires authentication).

**Response:** `200 OK`

---

### GET `/api/mobile/medical-reports/my-reports`
Get patient's medical reports (mobile, requires authentication).

**Response:** `200 OK`

---

### GET `/api/mobile/test-results/my-results`
Get patient's test results (mobile, requires authentication).

**Response:** `200 OK`

---

## Report Endpoints

### GET `/api/reports/daily`
Get daily report (requires authentication).

**Query Parameters:**
- `date` - Date (YYYY-MM-DD)

**Response:** `200 OK`

---

### GET `/api/reports/monthly`
Get monthly report (requires authentication).

**Query Parameters:**
- `year` - Year
- `month` - Month

**Response:** `200 OK`

---

## UI & Settings Endpoints

### GET `/api/ui/sidebar`
Get sidebar configuration.

**Response:** `200 OK`

---

### GET `/api/ui/header`
Get header profile information.

**Response:** `200 OK`

---

### GET `/api/settings/ui`
Get UI settings.

**Response:** `200 OK`

---

### PUT `/api/settings/ui`
Update UI settings.

**Response:** `200 OK`

---

### GET `/api/user-settings`
Get user settings (requires authentication).

**Response:** `200 OK`

---

### PUT `/api/user-settings`
Update user settings (requires authentication).

**Response:** `200 OK`

---

## Health Check

### GET `/health`
Health check endpoint.

**Response:** `200 OK`
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "Eye Clinic API"
}
```

---

## Rate Limiting

API requests are rate-limited to 100 requests per 15 minutes per IP address.

## Swagger Documentation

Interactive API documentation is available at `/api-docs` when the server is running.

