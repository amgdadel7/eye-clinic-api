const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { generateToken } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/response');

// Register patient
exports.registerPatient = async (req, res) => {
    try {
        const { name, phone, email, age, gender, dateOfBirth, address } = req.body;

        // Validate required fields
        if (!name || !phone) {
            return sendError(res, 'Name and phone are required', 400);
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

        // Insert patient
        const [result] = await pool.execute(
            `INSERT INTO patients (name, phone, email, age, gender, date_of_birth, 
             address, avatar, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
            [name, phone, email || null, age || null, gender || null, dateOfBirth || null, address || null, avatar]
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
        const { phone } = req.body;

        if (!phone) {
            return sendError(res, 'Phone number is required', 400);
        }

        const [patients] = await pool.execute(
            'SELECT * FROM patients WHERE phone = ?',
            [phone]
        );

        if (patients.length === 0) {
            return sendError(res, 'Patient not found', 401);
        }

        const patient = patients[0];

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

        sendSuccess(res, { patient });

    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching profile', 500);
    }
};
