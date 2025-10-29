const pool = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

exports.getMyPrescriptions = async (req, res) => {
    try {
        const patientId = req.user.id;

        const [prescriptions] = await pool.execute(
            'SELECT * FROM prescriptions WHERE patient_id = ? ORDER BY date DESC',
            [patientId]
        );

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