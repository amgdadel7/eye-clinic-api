const pool = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

exports.getAllPrescriptions = async (req, res) => {
    try {
        const clinicId = req.user.clinicId;
        const [prescriptions] = clinicId 
            ? await pool.execute(
                'SELECT p.* FROM prescriptions p JOIN doctors d ON p.doctor_id = d.id WHERE d.clinic_id = ? ORDER BY p.date DESC',
                [clinicId]
            )
            : await pool.execute('SELECT * FROM prescriptions ORDER BY date DESC');

        // Parse JSON medications
        const prescriptionsList = prescriptions.map(p => ({
            ...p,
            medications: typeof p.medications === 'string' ? JSON.parse(p.medications) : p.medications
        }));

        sendSuccess(res, { prescriptions: prescriptionsList });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching prescriptions', 500);
    }
};

exports.getPatientPrescriptions = async (req, res) => {
    try {
        const [prescriptions] = await pool.execute(
            'SELECT * FROM prescriptions WHERE patient_id = ? ORDER BY date DESC',
            [req.params.patientId]
        );

        const prescriptionsList = prescriptions.map(p => ({
            ...p,
            medications: typeof p.medications === 'string' ? JSON.parse(p.medications) : p.medications
        }));

        sendSuccess(res, { prescriptions: prescriptionsList });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching prescriptions', 500);
    }
};

exports.getPrescriptionById = async (req, res) => {
    try {
        const [prescriptions] = await pool.execute(
            'SELECT * FROM prescriptions WHERE id = ?',
            [req.params.id]
        );

        if (prescriptions.length === 0) {
            return sendError(res, 'Prescription not found', 404);
        }

        const prescription = prescriptions[0];
        prescription.medications = typeof prescription.medications === 'string' 
            ? JSON.parse(prescription.medications) 
            : prescription.medications;

        sendSuccess(res, { prescription });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching prescription', 500);
    }
};

exports.createPrescription = async (req, res) => {
    try {
        const { patientId, patientName, doctorId, doctorName, date, medications, instructions, diagnosis, followUpDate } = req.body;

        if (!patientId || !doctorId || !medications || !Array.isArray(medications)) {
            return sendError(res, 'Required fields: patientId, doctorId, medications (array)', 400);
        }

        const [result] = await pool.execute(
            `INSERT INTO prescriptions (patient_id, patient_name, doctor_id, doctor_name, date, medications, instructions, diagnosis, follow_up_date) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [patientId, patientName, doctorId, doctorName, date || new Date().toISOString().split('T')[0], 
             JSON.stringify(medications), instructions, diagnosis, followUpDate]
        );

        sendSuccess(res, { prescriptionId: result.insertId }, 'Prescription created successfully', 201);
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error creating prescription', 500);
    }
};