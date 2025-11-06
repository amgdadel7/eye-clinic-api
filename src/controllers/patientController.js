const pool = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

exports.getAllPatients = async (req, res) => {
    try {
        // Patients table doesn't have clinic_id; scope via appointments when clinic context exists
        if (req.user && req.user.clinicId) {
            const [patients] = await pool.execute(
                `SELECT DISTINCT p.*
                 FROM patients p
                 JOIN appointments a ON a.patient_id = p.id
                 WHERE p.status = 'active' AND a.clinic_id = ?
                 ORDER BY p.id DESC`,
                [req.user.clinicId]
            );
            return sendSuccess(res, { patients });
        }

        const [patients] = await pool.execute('SELECT * FROM patients WHERE status = "active"');
        sendSuccess(res, { patients });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching patients', 500);
    }
};

exports.getPatientById = async (req, res) => {
    try {
        const [patients] = await pool.execute('SELECT * FROM patients WHERE id = ?', [req.params.id]);
        if (patients.length === 0) return sendError(res, 'Patient not found', 404);
        sendSuccess(res, { patient: patients[0] });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching patient', 500);
    }
};

exports.createPatient = async (req, res) => {
    try {
        const { name, phone, email, age, gender, dateOfBirth, address } = req.body;
        const avatar = name ? name.charAt(0) : 'P';
        
        // Replace undefined with null for SQL
        const params = [
            name,
            phone,
            email || null,
            age || null,
            gender || null,
            dateOfBirth || null,
            address || null,
            avatar
        ];
        
        const [result] = await pool.execute(
            `INSERT INTO patients (name, phone, email, age, gender, date_of_birth, address, avatar) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            params
        );
        
        const medicalRecord = `MR-${result.insertId.toString().padStart(6, '0')}`;
        await pool.execute('UPDATE patients SET medical_record = ? WHERE id = ?', [medicalRecord, result.insertId]);
        
        sendSuccess(res, { patientId: result.insertId, medicalRecord }, 'Patient created successfully', 201);
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error creating patient', 500);
    }
};

exports.updatePatient = async (req, res) => {
    try {
        const { name, phone, email, age, gender, dateOfBirth, address } = req.body;
        const updates = [], values = [];
        
        if (name) { updates.push('name = ?'); values.push(name); }
        if (phone) { updates.push('phone = ?'); values.push(phone); }
        if (email) { updates.push('email = ?'); values.push(email); }
        if (age) { updates.push('age = ?'); values.push(age); }
        if (gender) { updates.push('gender = ?'); values.push(gender); }
        if (dateOfBirth) { updates.push('date_of_birth = ?'); values.push(dateOfBirth); }
        if (address) { updates.push('address = ?'); values.push(address); }
        
        if (updates.length === 0) return sendError(res, 'No fields to update', 400);
        values.push(req.params.id);
        
        await pool.execute(`UPDATE patients SET ${updates.join(', ')} WHERE id = ?`, values);
        sendSuccess(res, null, 'Patient updated successfully');
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error updating patient', 500);
    }
};

exports.deletePatient = async (req, res) => {
    try {
        await pool.execute('UPDATE patients SET status = "inactive" WHERE id = ?', [req.params.id]);
        sendSuccess(res, null, 'Patient deleted successfully');
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error deleting patient', 500);
    }
};
