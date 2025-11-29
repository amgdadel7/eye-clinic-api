# Pseudocode - Eye Clinic API
# الكود الزائف - واجهة برمجة تطبيقات عيادة العيون

## 1. Server Initialization (تهيئة الخادم)

```
FUNCTION main()
    LOAD environment variables from .env
    CREATE Express application
    CONFIGURE CORS middleware
    CONFIGURE request logging (morgan)
    CONFIGURE JSON parser (limit: 10MB)
    CONFIGURE URL-encoded parser
    CONFIGURE UTF-8 charset for JSON responses
    CONFIGURE rate limiting (100 requests/15min)
    SETUP Swagger documentation
    MOUNT all route modules
    REGISTER error handlers
    START server on PORT (default: 5000)
END FUNCTION
```

## 2. Database Connection (اتصال قاعدة البيانات)

```
FUNCTION createConnectionPool()
    CREATE MySQL connection pool with:
        - host, user, password, database
        - connectionLimit: 10
        - charset: utf8mb4
    TEST connection
    SET UTF-8 session variables
    RETURN pool
END FUNCTION

FUNCTION getConnection()
    GET connection from pool
    RETURN connection
END FUNCTION
```

## 3. Authentication (المصادقة)

```
FUNCTION registerClinic(clinicData, ownerData)
    BEGIN TRANSACTION
        VALIDATE required fields
        CHECK if email exists
        GENERATE clinic code
        INSERT clinic into database
        HASH owner password with bcrypt
        INSERT owner as admin user
        UPDATE clinic with owner_id
    COMMIT TRANSACTION
    GENERATE JWT token
    RETURN {token, user, clinic}
END FUNCTION

FUNCTION login(email, password)
    FIND user by email
    IF user not found THEN
        RETURN error: "Invalid credentials"
    END IF
    COMPARE password with hashed password
    IF password incorrect THEN
        RETURN error: "Invalid credentials"
    END IF
    GENERATE JWT token
    RETURN {token, user}
END FUNCTION

FUNCTION authenticateToken(request)
    EXTRACT token from Authorization header
    IF token not provided THEN
        RETURN 401 Unauthorized
    END IF
    VERIFY JWT token with secret
    IF token invalid THEN
        RETURN 403 Forbidden
    END IF
    ATTACH user data to request
    CONTINUE to next middleware
END FUNCTION
```

## 4. Clinic Management (إدارة العيادات)

```
FUNCTION getAllClinics()
    QUERY database for all active clinics
    RETURN clinics list
END FUNCTION

FUNCTION getClinicById(clinicId)
    QUERY database for clinic by ID
    IF clinic not found THEN
        RETURN 404 Not Found
    END IF
    RETURN clinic data
END FUNCTION

FUNCTION createClinic(clinicData)
    VALIDATE clinic data
    GENERATE clinic code
    INSERT clinic into database
    RETURN created clinic
END FUNCTION

FUNCTION updateClinic(clinicId, clinicData)
    CHECK if clinic exists
    UPDATE clinic in database
    RETURN updated clinic
END FUNCTION

FUNCTION deleteClinic(clinicId)
    CHECK if clinic exists
    SOFT DELETE clinic (set status = 'inactive')
    RETURN success message
END FUNCTION
```

## 5. User Management (إدارة المستخدمين)

```
FUNCTION getAllUsers(clinicId)
    QUERY database for users in clinic
    FILTER by role if specified
    RETURN users list
END FUNCTION

FUNCTION createUser(userData)
    VALIDATE user data
    CHECK if email exists
    HASH password
    INSERT user into database
    RETURN created user
END FUNCTION

FUNCTION updateUser(userId, userData)
    CHECK if user exists
    IF password provided THEN
        HASH new password
    END IF
    UPDATE user in database
    RETURN updated user
END FUNCTION

FUNCTION deleteUser(userId)
    CHECK if user exists
    SOFT DELETE user
    RETURN success message
END FUNCTION
```

## 6. Patient Management (إدارة المرضى)

```
FUNCTION getAllPatients(clinicId, filters)
    BUILD query with filters (name, phone, status)
    QUERY database for patients
    RETURN patients list with pagination
END FUNCTION

FUNCTION getPatientById(patientId)
    QUERY database for patient by ID
    INCLUDE medical history
    RETURN patient data
END FUNCTION

FUNCTION createPatient(patientData)
    VALIDATE patient data
    CHECK if phone/email exists
    INSERT patient into database
    RETURN created patient
END FUNCTION

FUNCTION updatePatient(patientId, patientData)
    CHECK if patient exists
    UPDATE patient in database
    RETURN updated patient
END FUNCTION
```

## 7. Doctor Management (إدارة الأطباء)

```
FUNCTION getAllDoctors(clinicId)
    QUERY database for doctors in clinic
    INCLUDE schedule information
    RETURN doctors list
END FUNCTION

FUNCTION getDoctorById(doctorId)
    QUERY database for doctor by ID
    INCLUDE appointments count
    RETURN doctor data
END FUNCTION

FUNCTION createDoctor(doctorData)
    VALIDATE doctor data
    CREATE user account for doctor
    INSERT doctor into database
    RETURN created doctor
END FUNCTION

FUNCTION updateDoctorSchedule(doctorId, schedule)
    UPDATE doctor schedule in database
    RETURN updated schedule
END FUNCTION
```

## 8. Appointment Management (إدارة المواعيد)

```
FUNCTION createAppointment(appointmentData)
    VALIDATE appointment data
    CHECK doctor availability
    CHECK patient exists
    CHECK time slot is available
    INSERT appointment into database
    SEND notification to patient
    RETURN created appointment
END FUNCTION

FUNCTION getAllAppointments(clinicId, filters)
    BUILD query with filters (date, doctor, status)
    QUERY database for appointments
    RETURN appointments list
END FUNCTION

FUNCTION updateAppointmentStatus(appointmentId, status)
    CHECK if appointment exists
    UPDATE appointment status
    IF status = 'completed' THEN
        CREATE medical record entry
    END IF
    RETURN updated appointment
END FUNCTION

FUNCTION cancelAppointment(appointmentId, reason)
    CHECK if appointment exists
    UPDATE appointment status to 'cancelled'
    SEND cancellation notification
    RETURN success message
END FUNCTION
```

## 9. Color Test Management (إدارة اختبارات الألوان)

```
FUNCTION submitTestAnswers(token, answers)
    VERIFY authentication token
    VALIDATE answers array
    CALCULATE test score
    DETERMINE color blindness type
    INSERT test results into database
    RETURN test summary
END FUNCTION

FUNCTION getPatientTests(patientId)
    QUERY database for patient's tests
    ORDER BY date DESC
    RETURN tests list
END FUNCTION

FUNCTION getTestById(testId)
    QUERY database for test by ID
    INCLUDE detailed answers
    RETURN test data
END FUNCTION
```

## 10. Prescription Management (إدارة الوصفات)

```
FUNCTION createPrescription(prescriptionData)
    VALIDATE prescription data
    CHECK appointment exists
    INSERT prescription into database
    RETURN created prescription
END FUNCTION

FUNCTION getPatientPrescriptions(patientId)
    QUERY database for patient's prescriptions
    INCLUDE medication details
    RETURN prescriptions list
END FUNCTION

FUNCTION updatePrescription(prescriptionId, data)
    CHECK if prescription exists
    UPDATE prescription in database
    RETURN updated prescription
END FUNCTION
```

## 11. Medical Reports (التقارير الطبية)

```
FUNCTION createMedicalReport(reportData)
    VALIDATE report data
    CHECK appointment exists
    INSERT report into database
    RETURN created report
END FUNCTION

FUNCTION getPatientReports(patientId)
    QUERY database for patient's reports
    ORDER BY date DESC
    RETURN reports list
END FUNCTION

FUNCTION getReportById(reportId)
    QUERY database for report by ID
    RETURN report data
END FUNCTION
```

## 12. Waiting Room (غرفة الانتظار)

```
FUNCTION addToWaitingRoom(patientId, appointmentId)
    CHECK if appointment exists
    INSERT into waiting room
    UPDATE appointment status to 'waiting'
    RETURN waiting room entry
END FUNCTION

FUNCTION getWaitingRoom(clinicId)
    QUERY database for waiting patients
    ORDER BY arrival time
    RETURN waiting list
END FUNCTION

FUNCTION callNextPatient(clinicId, doctorId)
    GET next patient from waiting room
    UPDATE appointment status to 'in_progress'
    REMOVE from waiting room
    RETURN patient data
END FUNCTION
```

## 13. Analytics (التحليلات)

```
FUNCTION getDashboardStats(clinicId, dateRange)
    QUERY database for:
        - Total appointments
        - Completed appointments
        - Pending appointments
        - Total patients
        - Total revenue
    CALCULATE statistics
    RETURN dashboard data
END FUNCTION

FUNCTION getAppointmentsByDate(clinicId, startDate, endDate)
    QUERY database for appointments in date range
    GROUP BY date
    RETURN appointments count per day
END FUNCTION

FUNCTION getRevenueReport(clinicId, period)
    QUERY database for payments in period
    CALCULATE total revenue
    GROUP BY date/doctor
    RETURN revenue report
END FUNCTION
```

## 14. Mobile API Endpoints (نقاط نهاية API للمحمول)

```
FUNCTION mobileLogin(phone, password)
    FIND patient by phone
    VERIFY password
    GENERATE JWT token
    RETURN {token, patient}
END FUNCTION

FUNCTION mobileRegister(patientData)
    VALIDATE patient data
    CHECK if phone exists
    HASH password
    INSERT patient into database
    GENERATE JWT token
    RETURN {token, patient}
END FUNCTION

FUNCTION getMobileAppointments(patientId)
    QUERY database for patient's appointments
    INCLUDE clinic and doctor info
    RETURN appointments list
END FUNCTION

FUNCTION bookMobileAppointment(appointmentData)
    VALIDATE appointment data
    CHECK doctor availability
    CREATE appointment
    SEND confirmation notification
    RETURN appointment
END FUNCTION
```

## 15. Error Handling (معالجة الأخطاء)

```
FUNCTION errorHandler(error, request, response, next)
    LOG error details
    IF error is validation error THEN
        RETURN 400 Bad Request with error details
    ELSE IF error is authentication error THEN
        RETURN 401 Unauthorized
    ELSE IF error is authorization error THEN
        RETURN 403 Forbidden
    ELSE IF error is not found THEN
        RETURN 404 Not Found
    ELSE IF error is database error THEN
        RETURN 500 Internal Server Error
    ELSE
        RETURN 500 with generic error message
    END IF
END FUNCTION

FUNCTION notFound(request, response)
    RETURN 404 with message: "Route not found"
END FUNCTION
```

## 16. Response Helpers (مساعدات الاستجابة)

```
FUNCTION sendSuccess(response, data, message, statusCode)
    RETURN JSON response:
        {
            success: true,
            message: message,
            data: data
        }
    WITH status code (default: 200)
END FUNCTION

FUNCTION sendError(response, message, statusCode)
    RETURN JSON response:
        {
            success: false,
            message: message
        }
    WITH status code (default: 400)
END FUNCTION
```

## 17. Route Structure (هيكل المسارات)

```
ROUTES:
    /health → Health check
    /api/auth → Authentication (register, login)
    /api/mobile/auth → Mobile authentication
    /api/clinics → Clinic CRUD
    /api/users → User management
    /api/patients → Patient management
    /api/doctors → Doctor management
    /api/appointments → Appointment management
    /api/mobile/appointments → Mobile appointments
    /api/prescriptions → Prescription management
    /api/medical-reports → Medical reports
    /api/test-results → Test results
    /api/color-tests → Color test submissions
    /api/mobile/color-tests → Mobile color tests
    /api/waiting-room → Waiting room management
    /api/analytics → Analytics and statistics
    /api/reports → Daily/monthly reports
```

## 18. Middleware Flow (تدفق البرامج الوسيطة)

```
REQUEST FLOW:
    1. CORS middleware
    2. Request logging (morgan)
    3. JSON parser
    4. URL-encoded parser
    5. UTF-8 charset middleware
    6. Rate limiting
    7. Route handler
    8. Error handler (if error occurs)
    9. Response sent
```

---

## Summary (ملخص)

API يتكون من:
1. **التهيئة**: إعداد Express وCORS والبرامج الوسيطة
2. **قاعدة البيانات**: اتصال MySQL مع connection pooling
3. **المصادقة**: JWT tokens للمصادقة والتفويض
4. **CRUD Operations**: عمليات إنشاء وقراءة وتحديث وحذف لجميع الكيانات
5. **المواعيد**: إدارة المواعيد والجدولة
6. **السجلات الطبية**: الوصفات والتقارير ونتائج الاختبارات
7. **التحليلات**: إحصائيات وتقارير
8. **API للمحمول**: نقاط نهاية مخصصة للتطبيقات المحمولة
9. **معالجة الأخطاء**: معالجة شاملة للأخطاء
10. **الأمان**: Rate limiting وCORS وJWT authentication



