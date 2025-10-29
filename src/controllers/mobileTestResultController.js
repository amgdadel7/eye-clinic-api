const pool = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

exports.getMyResults = async (req, res) => {
    try {
        const patientId = req.user.id;

        const [results] = await pool.execute(
            'SELECT * FROM test_results WHERE patient_id = ? ORDER BY test_date DESC',
            [patientId]
        );

        sendSuccess(res, { results });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching test results', 500);
    }
};