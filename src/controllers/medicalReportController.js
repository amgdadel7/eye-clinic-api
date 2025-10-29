const pool = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

exports.getAllReports = async (req, res) => {
    try {
        const clinicId = req.user.clinicId;
        const [reports] = clinicId 
            ? await pool.execute(
                'SELECT r.* FROM medical_reports r JOIN clinics c ON r.clinic_id = c.id WHERE c.id = ? ORDER BY r.date DESC',
                [clinicId]
            )
            : await pool.execute('SELECT * FROM medical_reports ORDER BY date DESC');

        const reportsList = reports.map(r => ({
            ...r,
            recommendations: typeof r.recommendations === 'string' ? JSON.parse(r.recommendations) : r.recommendations,
            vitalSigns: typeof r.vital_signs === 'string' ? JSON.parse(r.vital_signs) : r.vital_signs
        }));

        sendSuccess(res, { reports: reportsList });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching reports', 500);
    }
};

exports.getPatientReports = async (req, res) => {
    try {
        const [reports] = await pool.execute(
            'SELECT * FROM medical_reports WHERE patient_id = ? ORDER BY date DESC',
            [req.params.patientId]
        );

        const reportsList = reports.map(r => ({
            ...r,
            recommendations: typeof r.recommendations === 'string' ? JSON.parse(r.recommendations) : r.recommendations,
            vitalSigns: typeof r.vital_signs === 'string' ? JSON.parse(r.vital_signs) : r.vital_signs
        }));

        sendSuccess(res, { reports: reportsList });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching reports', 500);
    }
};

exports.getReportById = async (req, res) => {
    try {
        const [reports] = await pool.execute(
            'SELECT * FROM medical_reports WHERE id = ?',
            [req.params.id]
        );

        if (reports.length === 0) {
            return sendError(res, 'Report not found', 404);
        }

        const report = reports[0];
        report.recommendations = typeof report.recommendations === 'string' ? JSON.parse(report.recommendations) : report.recommendations;
        report.vitalSigns = typeof report.vital_signs === 'string' ? JSON.parse(report.vital_signs) : report.vital_signs;

        sendSuccess(res, { report });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching report', 500);
    }
};

exports.createReport = async (req, res) => {
    try {
        const { patientId, patientName, doctorId, doctorName, date, reportType, diagnosis, treatment, notes, recommendations, vitalSigns } = req.body;

        if (!patientId || !doctorId || !diagnosis) {
            return sendError(res, 'Required fields: patientId, doctorId, diagnosis', 400);
        }

        const [result] = await pool.execute(
            `INSERT INTO medical_reports (patient_id, patient_name, doctor_id, doctor_name, date, report_type, diagnosis, treatment, notes, recommendations, vital_signs) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [patientId, patientName, doctorId, doctorName, date || new Date().toISOString().split('T')[0], 
             reportType, diagnosis, treatment, notes, 
             JSON.stringify(recommendations || []), 
             JSON.stringify(vitalSigns || {})]
        );

        sendSuccess(res, { reportId: result.insertId }, 'Report created successfully', 201);
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error creating report', 500);
    }
};