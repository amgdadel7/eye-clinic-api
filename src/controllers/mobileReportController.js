const pool = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

exports.getMyReports = async (req, res) => {
    try {
        const patientId = req.user.id;

        const [reports] = await pool.execute(
            'SELECT * FROM medical_reports WHERE patient_id = ? ORDER BY date DESC',
            [patientId]
        );

        // Parse JSON fields
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