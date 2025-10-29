# Eye Clinic API Documentation

Complete API documentation for the Eye Clinic Management System.

## Base URL

```
http://localhost:5000/api
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### Register Clinic
**POST** `/api/auth/register-clinic`

Register a new clinic with owner account.

**Request Body:**
```json
{
  "clinicName": "عيادة العيون الذكية",
  "clinicNameEn": "Smart Eye Clinic",
  "clinicLicense": "CLINIC123456",
  "clinicPhone": "+966112345678",
  "clinicEmail": "info@clinic.com",
  "clinicAddress": "شارع الملك فهد، الرياض",
  "clinicAddressEn": "King Fahd Street, Riyadh",
  "clinicSpecialty": "general-ophthalmology",
  "clinicWebsite": "www.clinic.com",
  "ownerName": "د. أحمد محمد",
  "ownerEmail": "admin@clinic.com",
  "ownerPhone": "+966501234567",
  "ownerPassword": "password123",
  "workingHours": {
    "sunday": "8:00 AM - 8:00 PM",
    "monday": "8:00 AM - 8:00 PM"
  },
  "services": ["فحص العيون", "جراحة الساد"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Clinic and owner account created successfully",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": 1,
      "name": "د. أحمد محمد",
      "email": "admin@clinic.com",
      "role": "admin",
      "clinicId": 1
    },
    "clinic": {
      "id": 1,
      "name": "عيادة العيون الذكية",
      "code": "ABC123"
    }
  }
}
```

### Register User
**POST** `/api/auth/register-user`

Register a new doctor or receptionist (requires clinic code).

**Request Body:**
```json
{
  "name": "د. سارة أحمد",
  "email": "sarah@clinic.com",
  "phone": "+966501234568",
  "password": "password123",
  "role": "doctor",
  "clinicCode": "ABC123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "userId": 2,
    "message": "Registration successful. Please wait for admin approval."
  }
}
```

### Login
**POST** `/api/auth/login`

Login for system users (admin, doctor, receptionist).

**Request Body:**
```json
{
  "email": "admin@clinic.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": 1,
      "name": "د. أحمد محمد",
      "email": "admin@clinic.com",
      "role": "admin",
      "clinicId": 1,
      "avatar": "أ"
    },
    "clinic": {
      "id": 1,
      "name": "عيادة العيون الذكية",
      "code": "ABC123"
    }
  }
}
```

### Get Current User
**GET** `/api/auth/me`

Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "user": {
      "id": 1,
      "name": "د. أحمد محمد",
      "email": "admin@clinic.com",
      "role": "admin",
      "clinicId": 1,
      "avatar": "أ"
    },
    "clinic": {
      "id": 1,
      "name": "عيادة العيون الذكية",
      "code": "ABC123"
    }
  }
}
```

---

## Mobile Authentication

### Register Patient
**POST** `/api/mobile/auth/register`

Register a new patient for mobile app.

**Request Body:**
```json
{
  "name": "أحمد محمد",
  "phone": "+966501234567",
  "email": "ahmed@example.com",
  "password": "password123",
  "age": 35,
  "gender": "male",
  "dateOfBirth": "1989-01-01",
  "address": "الرياض، المملكة العربية السعودية"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Patient registered successfully",
  "data": {
    "token": "jwt_token_here",
    "patient": {
      "id": 1,
      "name": "أحمد محمد",
      "phone": "+966501234567",
      "email": "ahmed@example.com",
      "medicalRecord": "MR-000001",
      "avatar": "أ"
    }
  }
}
```

### Login Patient
**POST** `/api/mobile/auth/login`

Login for patients.

**Request Body:**
```json
{
  "phone": "+966501234567",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here",
    "patient": {
      "id": 1,
      "name": "أحمد محمد",
      "phone": "+966501234567",
      "email": "ahmed@example.com",
      "medicalRecord": "MR-000001",
      "avatar": "أ"
    }
  }
}
```

---

## Clinics

### Get All Clinics
**GET** `/api/clinics`

Get list of all active clinics (public endpoint for mobile app).

**Response:**
```json
{
  "success": true,
  "data": {
    "clinics": [
      {
        "id": 1,
        "name": "عيادة العيون الذكية",
        "nameEn": "Smart Eye Clinic",
        "code": "ABC123",
        "phone": "+966112345678",
        "email": "info@clinic.com",
        "address": "شارع الملك فهد",
        "specialty": "general-ophthalmology",
        "status": "active",
        "services": ["فحص العيون", "جراحة الساد"],
        "workingHours": {
          "sunday": "8:00 AM - 8:00 PM",
          "monday": "8:00 AM - 8:00 PM"
        }
      }
    ]
  }
}
```

### Get Clinic by ID
**GET** `/api/clinics/:id`

Get details of a specific clinic.

---

## Patients

### Get All Patients
**GET** `/api/patients`

Get list of all patients (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

### Create Patient
**POST** `/api/patients`

Create a new patient (admin/receptionist only).

**Request Body:**
```json
{
  "name": "أحمد محمد",
  "phone": "+966501234567",
  "email": "ahmed@example.com",
  "age": 35,
  "gender": "male",
  "dateOfBirth": "1989-01-01",
  "address": "الرياض"
}
```

---

## Error Responses

All endpoints return errors in the following format:

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Validation error message"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "You do not have permission to perform this action"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Resource not found"
}
```

**500 Server Error:**
```json
{
  "success": false,
  "message": "Server error message"
}
```

---

## Notes

- All dates should be in ISO format: `YYYY-MM-DD`
- All times should be in format: `HH:MM` (24-hour)
- JWT tokens expire after 7 days by default
- Images for color blindness tests are stored as base64 strings
- Automatic appointment booking finds the first available slot based on doctor's schedule
