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

        // Total patients (patients table has no clinic_id; scope via appointments for a clinic)
        const [totalPatients] = clinicId
            ? await pool.execute(
                `SELECT COUNT(DISTINCT p.id) as count
                 FROM patients p
                 JOIN appointments a ON a.patient_id = p.id
                 WHERE a.clinic_id = ?`,
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
            ? `SELECT COUNT(DISTINCT p.id) as total, p.status
               FROM patients p
               JOIN appointments a ON a.patient_id = p.id
               WHERE a.clinic_id = ?
               GROUP BY p.status`
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

// Daily report aggregation
exports.getDailyReport = async (req, res) => {
    try {
        const clinicId = req.user.clinicId;
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const doctorIdFilter = req.query.doctorId;

        const doctorWhere = doctorIdFilter ? 'AND a.doctor_id = ?' : '';
        const doctorParams = doctorIdFilter ? [doctorIdFilter] : [];

        // Total, completed, cancelled appointments
        const [apps] = clinicId
            ? await pool.execute(
                `SELECT status, COUNT(*) as total FROM appointments a 
                 WHERE a.date = ? AND a.clinic_id = ? ${doctorWhere}
                 GROUP BY status`,
                [date, clinicId, ...doctorParams]
            )
            : await pool.execute(
                `SELECT status, COUNT(*) as total FROM appointments a 
                 WHERE a.date = ? ${doctorWhere}
                 GROUP BY status`,
                [date, ...doctorParams]
            );

        const totals = apps.reduce((acc, r) => { acc[r.status] = r.total; return acc; }, {});

        // Distinct patients seen today
        const [patientsRes] = clinicId
            ? await pool.execute(
                `SELECT COUNT(DISTINCT a.patient_id) as total FROM appointments a 
                 WHERE a.date = ? AND a.clinic_id = ? ${doctorWhere}`,
                [date, clinicId, ...doctorParams]
            )
            : await pool.execute(
                `SELECT COUNT(DISTINCT a.patient_id) as total FROM appointments a 
                 WHERE a.date = ? ${doctorWhere}`,
                [date, ...doctorParams]
            );

        // Per-doctor summary
        const [byDoctor] = clinicId
            ? await pool.execute(
                `SELECT a.doctor_id as id, COALESCE(d.user_name, d.specialization, 'Doctor') as name,
                        COUNT(*) as appointments
                 FROM appointments a 
                 LEFT JOIN doctors d ON d.id = a.doctor_id
                 WHERE a.date = ? AND a.clinic_id = ? ${doctorWhere}
                 GROUP BY a.doctor_id`,
                [date, clinicId, ...doctorParams]
            )
            : await pool.execute(
                `SELECT a.doctor_id as id, COALESCE(d.user_name, d.specialization, 'Doctor') as name,
                        COUNT(*) as appointments
                 FROM appointments a 
                 LEFT JOIN doctors d ON d.id = a.doctor_id
                 WHERE a.date = ? ${doctorWhere}
                 GROUP BY a.doctor_id`,
                [date, ...doctorParams]
            );

        sendSuccess(res, {
            date,
            totalAppointments: Object.values(totals).reduce((a, b) => a + b, 0),
            completedAppointments: totals.completed || totals.confirmed || 0,
            cancelledAppointments: totals.cancelled || 0,
            totalPatients: patientsRes[0]?.total || 0,
            newPatients: 0,
            totalRevenue: 0,
            doctors: byDoctor.map(d => ({ id: d.id, name: d.name, appointments: d.appointments, revenue: 0 })),
            tests: []
        });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching daily report', 500);
    }
};

// Monthly report aggregation
exports.getMonthlyReport = async (req, res) => {
    try {
        const clinicId = req.user.clinicId;
        const month = (req.query.month || new Date().toISOString().slice(0, 7)); // YYYY-MM
        const doctorIdFilter = req.query.doctorId;

        const doctorWhere = doctorIdFilter ? 'AND a.doctor_id = ?' : '';
        const doctorParams = doctorIdFilter ? [doctorIdFilter] : [];

        // Totals by status within month
        const [apps] = clinicId
            ? await pool.execute(
                `SELECT status, COUNT(*) as total FROM appointments a 
                 WHERE a.date LIKE ? AND a.clinic_id = ? ${doctorWhere}
                 GROUP BY status`,
                [`${month}%`, clinicId, ...doctorParams]
            )
            : await pool.execute(
                `SELECT status, COUNT(*) as total FROM appointments a 
                 WHERE a.date LIKE ? ${doctorWhere}
                 GROUP BY status`,
                [`${month}%`, ...doctorParams]
            );

        const totals = apps.reduce((acc, r) => { acc[r.status] = r.total; return acc; }, {});

        // Distinct patients in month
        const [patientsRes] = clinicId
            ? await pool.execute(
                `SELECT COUNT(DISTINCT a.patient_id) as total FROM appointments a 
                 WHERE a.date LIKE ? AND a.clinic_id = ? ${doctorWhere}`,
                [`${month}%`, clinicId, ...doctorParams]
            )
            : await pool.execute(
                `SELECT COUNT(DISTINCT a.patient_id) as total FROM appointments a 
                 WHERE a.date LIKE ? ${doctorWhere}`,
                [`${month}%`, ...doctorParams]
            );

        // Per-doctor summary
        const [byDoctor] = clinicId
            ? await pool.execute(
                `SELECT a.doctor_id as id, COALESCE(d.user_name, d.specialization, 'Doctor') as name,
                        COUNT(*) as appointments
                 FROM appointments a 
                 LEFT JOIN doctors d ON d.id = a.doctor_id
                 WHERE a.date LIKE ? AND a.clinic_id = ? ${doctorWhere}
                 GROUP BY a.doctor_id`,
                [`${month}%`, clinicId, ...doctorParams]
            )
            : await pool.execute(
                `SELECT a.doctor_id as id, COALESCE(d.user_name, d.specialization, 'Doctor') as name,
                        COUNT(*) as appointments
                 FROM appointments a 
                 LEFT JOIN doctors d ON d.id = a.doctor_id
                 WHERE a.date LIKE ? ${doctorWhere}
                 GROUP BY a.doctor_id`,
                [`${month}%`, ...doctorParams]
            );

        // Weekly trend (4 points)
        const [weekly] = clinicId
            ? await pool.execute(
                `SELECT WEEK(a.date, 1) as week, COUNT(*) as appointments
                 FROM appointments a
                 WHERE a.date LIKE ? AND a.clinic_id = ? ${doctorWhere}
                 GROUP BY WEEK(a.date, 1)
                 ORDER BY week`,
                [`${month}%`, clinicId, ...doctorParams]
            )
            : await pool.execute(
                `SELECT WEEK(a.date, 1) as week, COUNT(*) as appointments
                 FROM appointments a
                 WHERE a.date LIKE ? ${doctorWhere}
                 GROUP BY WEEK(a.date, 1)
                 ORDER BY week`,
                [`${month}%`, ...doctorParams]
            );

        sendSuccess(res, {
            month,
            totalAppointments: Object.values(totals).reduce((a, b) => a + b, 0),
            completedAppointments: totals.completed || totals.confirmed || 0,
            cancelledAppointments: totals.cancelled || 0,
            totalPatients: patientsRes[0]?.total || 0,
            newPatients: 0,
            totalRevenue: 0,
            doctors: byDoctor.map(d => ({ id: d.id, name: d.name, appointments: d.appointments, revenue: 0 })),
            weeklyTrend: weekly.map(w => ({ week: w.week, appointments: w.appointments, revenue: 0 }))
        });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching monthly report', 500);
    }
};