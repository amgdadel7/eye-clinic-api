-- Eye Clinic Database Schema
-- Created for Eye Clinic Management System API


-- CREATE DATABASE eye_clinic_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE eye_clinic_db;

-- Clinics Table
CREATE TABLE clinics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    code VARCHAR(50) UNIQUE NOT NULL,
    license VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT,
    address_en TEXT,
    specialty VARCHAR(100),
    owner_id INT,
    status ENUM('active', 'inactive', 'pending') DEFAULT 'active',
    website VARCHAR(255),
    working_hours JSON,
    services JSON,
    services_en JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Users Table (Admins, Doctors, Receptionists)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'doctor', 'receptionist') NOT NULL,
    clinic_id INT NOT NULL,
    status ENUM('active', 'pending', 'rejected', 'inactive') DEFAULT 'pending',
    avatar VARCHAR(10),
    department VARCHAR(100),
    specialty VARCHAR(100),
    join_date DATE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

-- Doctors Table (Extended doctor information)
CREATE TABLE doctors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    doctor_id VARCHAR(50) UNIQUE NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    specialty_id VARCHAR(50),
    clinic_id INT NOT NULL,
    experience VARCHAR(100),
    license_number VARCHAR(100),
    patients_count INT DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    status ENUM('active', 'inactive') DEFAULT 'active',
    join_date DATE,
    working_hours JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

-- Patients Table
CREATE TABLE patients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    age INT,
    gender ENUM('male', 'female'),
    date_of_birth DATE,
    address TEXT,
    medical_record VARCHAR(50),
    color_deficiency_type VARCHAR(50) DEFAULT 'Normal',
    last_visit DATE,
    status ENUM('active', 'inactive') DEFAULT 'active',
    avatar VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Schedules Table
CREATE TABLE schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    doctor_id INT NOT NULL,
    doctor_name VARCHAR(255) NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    max_patients INT DEFAULT 20,
    break_start_time TIME,
    break_end_time TIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- Appointments Table
CREATE TABLE appointments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    doctor_id INT NOT NULL,
    doctor_name VARCHAR(255) NOT NULL,
    clinic_id INT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    type VARCHAR(100),
    status ENUM('confirmed', 'pending', 'completed', 'cancelled') DEFAULT 'pending',
    phone VARCHAR(20),
    avatar VARCHAR(10),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

-- Prescriptions Table
CREATE TABLE prescriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    doctor_id INT NOT NULL,
    doctor_name VARCHAR(255) NOT NULL,
    clinic_id INT NOT NULL,
    date DATE NOT NULL,
    medications JSON NOT NULL,
    instructions TEXT,
    diagnosis TEXT,
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

-- Medical Reports Table
CREATE TABLE medical_reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    doctor_id INT NOT NULL,
    doctor_name VARCHAR(255) NOT NULL,
    clinic_id INT NOT NULL,
    date DATE NOT NULL,
    report_type VARCHAR(100),
    diagnosis TEXT,
    treatment TEXT,
    notes TEXT,
    recommendations JSON,
    vital_signs JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

-- Test Results Table
CREATE TABLE test_results (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    doctor_id INT NOT NULL,
    doctor_name VARCHAR(255) NOT NULL,
    clinic_id INT NOT NULL,
    test_type VARCHAR(100) NOT NULL,
    test_date DATE NOT NULL,
    result TEXT,
    severity VARCHAR(50),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

-- Color Blindness Tests Table
CREATE TABLE color_blindness_tests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    test_number INT NOT NULL,
    test_name VARCHAR(255),
    image_base64 LONGTEXT NOT NULL,
    correct_answer VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Patient Test Answers Table
CREATE TABLE patient_test_answers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    test_id INT NOT NULL,
    answer VARCHAR(50),
    is_correct BOOLEAN,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (test_id) REFERENCES color_blindness_tests(id) ON DELETE CASCADE
);

-- Waiting Room Table
CREATE TABLE waiting_room (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    appointment_id INT NOT NULL,
    doctor_id INT NOT NULL,
    clinic_id INT NOT NULL,
    arrival_time DATETIME NOT NULL,
    status ENUM('waiting', 'in-progress', 'completed', 'associated') DEFAULT 'waiting',
    priority ENUM('normal', 'urgent', 'emergency') DEFAULT 'normal',
    doctor_name VARCHAR(255) NOT NULL,
    wait_time INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

-- Notifications Table
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('appointment', 'patient', 'doctor', 'system', 'reminder', 'alert') DEFAULT 'system',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User Settings Table
CREATE TABLE user_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    language VARCHAR(10) DEFAULT 'ar',
    theme ENUM('light', 'dark') DEFAULT 'light',
    sidebar_collapsed BOOLEAN DEFAULT FALSE,
    sound_notifications BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    push_notifications BOOLEAN DEFAULT TRUE,
    appointment_reminders BOOLEAN DEFAULT TRUE,
    new_appointment_alerts BOOLEAN DEFAULT TRUE,
    system_alerts BOOLEAN DEFAULT TRUE,
    reminder_time_minutes INT DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX idx_clinic_id ON users(clinic_id);
CREATE INDEX idx_user_role ON users(role);
CREATE INDEX idx_patient_phone ON patients(phone);
CREATE INDEX idx_appointment_date ON appointments(date);
CREATE INDEX idx_appointment_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointment_status ON appointments(status);
CREATE INDEX idx_waiting_status ON waiting_room(status);
CREATE INDEX idx_waiting_doctor ON waiting_room(doctor_id);
CREATE INDEX idx_waiting_clinic ON waiting_room(clinic_id);
CREATE INDEX idx_prescription_clinic ON prescriptions(clinic_id);
CREATE INDEX idx_medical_report_clinic ON medical_reports(clinic_id);
CREATE INDEX idx_test_result_clinic ON test_results(clinic_id);
CREATE INDEX idx_test_number ON color_blindness_tests(test_number);
CREATE INDEX idx_notification_user ON notifications(user_id);
CREATE INDEX idx_notification_read ON notifications(is_read);
CREATE INDEX idx_notification_type ON notifications(type);
