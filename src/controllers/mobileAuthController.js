const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { generateToken } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/response');

// Register patient
exports.registerPatient = async (req, res) => {
    try {
        const { name, phone, email, password, age, gender, dateOfBirth, address } = req.body;

        // Validate required fields
        if (!name || !phone || !password) {
            return sendError(res, 'Name, phone, and password are required', 400);
        }

        if (password.length < 6) {
            return sendError(res, 'Password must be at least 6 characters', 400);
        }

        // Check if phone or email already exists
        if (email) {
            const [existingEmail] = await pool.execute(
                'SELECT id FROM patients WHERE email = ?',
                [email]
            );
            if (existingEmail.length > 0) {
                return sendError(res, 'Email already registered', 400);
            }
        }

        const [existingPhone] = await pool.execute(
            'SELECT id FROM patients WHERE phone = ?',
            [phone]
        );
        if (existingPhone.length > 0) {
            return sendError(res, 'Phone number already registered', 400);
        }

        const avatar = name.charAt(0);

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert patient
        const [result] = await pool.execute(
            `INSERT INTO patients (name, phone, email, password, age, gender, date_of_birth, 
             address, avatar, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
            [name, phone, email || null, hashedPassword, age || null, gender || null, dateOfBirth || null, address || null, avatar]
        );

        // Generate medical record number
        const medicalRecord = `MR-${result.insertId.toString().padStart(6, '0')}`;
        
        await pool.execute(
            'UPDATE patients SET medical_record = ? WHERE id = ?',
            [medicalRecord, result.insertId]
        );

        // Generate token
        const token = generateToken({
            id: result.insertId,
            phone: phone,
            role: 'patient'
        });

        sendSuccess(res, {
            token,
            patient: {
                id: result.insertId,
                name,
                phone,
                email,
                medicalRecord,
                avatar
            }
        }, 'Patient registered successfully', 201);

    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error registering patient', 500);
    }
};

// Login patient
exports.loginPatient = async (req, res) => {
    try {
        const { phone, password } = req.body;

        if (!phone || !password) {
            return sendError(res, 'Phone number and password are required', 400);
        }

        const [patients] = await pool.execute(
            'SELECT * FROM patients WHERE phone = ?',
            [phone]
        );

        if (patients.length === 0) {
            return sendError(res, 'Patient not found', 401);
        }

        const patient = patients[0];

        if (!patient.password) {
            return sendError(res, 'Password not set for this account. Please reset your password.', 400);
        }

        const isMatch = await bcrypt.compare(password, patient.password);
        if (!isMatch) {
            return sendError(res, 'Invalid credentials', 401);
        }

        if (patient.status !== 'active') {
            return sendError(res, 'Your account is not active. Please contact support.', 403);
        }

        // Generate token
        const token = generateToken({
            id: patient.id,
            phone: patient.phone,
            role: 'patient'
        });

        sendSuccess(res, {
            token,
            patient: {
                id: patient.id,
                name: patient.name,
                phone: patient.phone,
                email: patient.email,
                medicalRecord: patient.medical_record,
                avatar: patient.avatar
            }
        }, 'Login successful');

    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error logging in', 500);
    }
};

// Get patient profile
exports.getProfile = async (req, res) => {
    try {
        const [patients] = await pool.execute(
            'SELECT * FROM patients WHERE id = ?',
            [req.user.id]
        );

        if (patients.length === 0) {
            return sendError(res, 'Patient not found', 404);
        }

        const patient = patients[0];
        const { password, ...safePatient } = patient;

        sendSuccess(res, { patient: safePatient });

    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching profile', 500);
    }
};
