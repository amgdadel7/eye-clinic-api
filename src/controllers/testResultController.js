const pool = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

exports.getAllTestResults = async (req, res) => {
    try {
        // Scope by clinic using doctors -> clinic_id when available
        if (req.user && req.user.clinicId) {
            const [results] = await pool.execute(
                `SELECT tr.*
                 FROM test_results tr
                 JOIN doctors d ON d.id = tr.doctor_id
                 WHERE d.clinic_id = ?
                 ORDER BY tr.test_date DESC`,
                [req.user.clinicId]
            );
            return sendSuccess(res, { results });
        }

        const [results] = await pool.execute(
            'SELECT * FROM test_results ORDER BY test_date DESC'
        );

        sendSuccess(res, { results });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching test results', 500);
    }
};

exports.getPatientTestResults = async (req, res) => {
    try {
        if (req.user && req.user.clinicId) {
            const [results] = await pool.execute(
                `SELECT tr.*
                 FROM test_results tr
                 JOIN doctors d ON d.id = tr.doctor_id
                 WHERE tr.patient_id = ? AND d.clinic_id = ?
                 ORDER BY tr.test_date DESC`,
                [req.params.patientId, req.user.clinicId]
            );
            return sendSuccess(res, { results });
        }

        const [results] = await pool.execute(
            'SELECT * FROM test_results WHERE patient_id = ? ORDER BY test_date DESC',
            [req.params.patientId]
        );

        sendSuccess(res, { results });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching test results', 500);
    }
};

exports.getTestResultById = async (req, res) => {
    try {
        const [results] = await pool.execute(
            'SELECT * FROM test_results WHERE id = ?',
            [req.params.id]
        );

        if (results.length === 0) {
            return sendError(res, 'Test result not found', 404);
        }

        sendSuccess(res, { result: results[0] });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching test result', 500);
    }
};

exports.createTestResult = async (req, res) => {
    try {
        const { patientId, patientName, doctorId, doctorName, testType, testDate, result, severity, status } = req.body;

        if (!patientId || !doctorId || !testType || !testDate || !result) {
            return sendError(res, 'Required fields: patientId, doctorId, testType, testDate, result', 400);
        }

        const [resultInsert] = await pool.execute(
            `INSERT INTO test_results (patient_id, patient_name, doctor_id, doctor_name, test_type, test_date, result, severity, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [patientId, patientName, doctorId, doctorName, testType, testDate, result, severity, status]
        );

        sendSuccess(res, { resultId: resultInsert.insertId }, 'Test result created successfully', 201);
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error creating test result', 500);
    }
};