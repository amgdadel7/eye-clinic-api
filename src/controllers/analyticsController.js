const pool = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

exports.getDashboardStats = async (req, res) => {
    try {
        const clinicId = req.user.clinicId;
        const today = new Date().toISOString().split('T')[0];

        // Today's appointments
        const [todayApps] = clinicId 
            ? await pool.execute(
                'SELECT COUNT(*) as count FROM appointments WHERE date = ? AND clinic_id = ?',
                [today, clinicId]
            )
            : await pool.execute(
                'SELECT COUNT(*) as count FROM appointments WHERE date = ?',
                [today]
            );

        // Total patients
        const [totalPatients] = clinicId
            ? await pool.execute(
                'SELECT COUNT(*) as count FROM patients WHERE clinic_id = ?',
                [clinicId]
            )
            : await pool.execute('SELECT COUNT(*) as count FROM patients');

        // Active appointments
        const [activeApps] = clinicId
            ? await pool.execute(
                `SELECT COUNT(*) as count FROM appointments WHERE status IN ('confirmed', 'pending') AND clinic_id = ?`,
                [clinicId]
            )
            : await pool.execute(
                `SELECT COUNT(*) as count FROM appointments WHERE status IN ('confirmed', 'pending')`
            );

        // Doctors count
        const [doctorsCount] = clinicId
            ? await pool.execute(
                'SELECT COUNT(*) as count FROM doctors WHERE clinic_id = ? AND status = "active"',
                [clinicId]
            )
            : await pool.execute('SELECT COUNT(*) as count FROM doctors WHERE status = "active"');

        sendSuccess(res, {
            todayAppointments: todayApps[0].count,
            totalPatients: totalPatients[0].count,
            activeAppointments: activeApps[0].count,
            activeDoctors: doctorsCount[0].count
        });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching dashboard stats', 500);
    }
};

exports.getPatientStats = async (req, res) => {
    try {
        const clinicId = req.user.clinicId;
        const query = clinicId
            ? 'SELECT COUNT(*) as total, status FROM patients WHERE clinic_id = ? GROUP BY status'
            : 'SELECT COUNT(*) as total, status FROM patients GROUP BY status';

        const [stats] = clinicId 
            ? await pool.execute(query, [clinicId])
            : await pool.execute(query);

        sendSuccess(res, { stats });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching patient stats', 500);
    }
};

exports.getAppointmentStats = async (req, res) => {
    try {
        const clinicId = req.user.clinicId;
        const query = clinicId
            ? 'SELECT COUNT(*) as total, status FROM appointments WHERE clinic_id = ? GROUP BY status'
            : 'SELECT COUNT(*) as total, status FROM appointments GROUP BY status';

        const [stats] = clinicId 
            ? await pool.execute(query, [clinicId])
            : await pool.execute(query);

        sendSuccess(res, { stats });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching appointment stats', 500);
    }
};

exports.getRevenueStats = async (req, res) => {
    try {
        // This would typically calculate from payment records
        // For now, return placeholder data
        sendSuccess(res, {
            todayRevenue: 0,
            weekRevenue: 0,
            monthRevenue: 0,
            yearRevenue: 0
        });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching revenue stats', 500);
    }
};