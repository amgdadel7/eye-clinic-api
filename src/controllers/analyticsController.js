const pool = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

const PERIOD_DURATIONS = {
    day: 0,
    week: 6,
    month: 29,
    quarter: 89,
    year: 364
};

const COLOR_PALETTE = [
    '#10b981',
    '#3b82f6',
    '#6366f1',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#0ea5e9',
    '#14b8a6'
];

const SAR_BASE_RATE = 250;

const toDateOnly = (date) => {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
};

const toDateEnd = (date) => {
    const copy = new Date(date);
    copy.setHours(23, 59, 59, 999);
    return copy;
};

const formatDateOnly = (date) => toDateOnly(date).toISOString().split('T')[0];

const resolvePeriod = (period = 'month') => {
    const normalized = String(period || '').toLowerCase();
    return PERIOD_DURATIONS[normalized] !== undefined ? normalized : 'month';
};

const getPeriodRange = (periodParam) => {
    const period = resolvePeriod(periodParam);
    const daysBack = PERIOD_DURATIONS[period];
    const end = toDateEnd(new Date());
    const start = toDateOnly(new Date());
    start.setDate(end.getDate() - daysBack);

    const rangeLengthDays = daysBack + 1;
    const previousEnd = toDateEnd(new Date(start));
    previousEnd.setDate(previousEnd.getDate() - 1);
    const previousStart = toDateOnly(new Date(previousEnd));
    previousStart.setDate(previousStart.getDate() - (rangeLengthDays - 1));

    let granularity = 'day';
    if (period === 'day') granularity = 'hour';
    if (period === 'quarter' || period === 'year') granularity = 'month';

    return {
        period,
        startDate: formatDateOnly(start),
        endDate: formatDateOnly(end),
        previousStartDate: formatDateOnly(previousStart),
        previousEndDate: formatDateOnly(previousEnd),
        granularity,
        daysInRange: rangeLengthDays
    };
};

const formatNumber = (value) => Number(value || 0).toLocaleString('en-US');
const formatCurrency = (value) => `ر.س ${formatNumber(Math.round(value || 0))}`;

const calculateChange = (current, previous) => {
    const curr = Number(current || 0);
    const prev = Number(previous || 0);

    if (prev === 0) {
        if (curr === 0) {
            return { change: '0%', isPositive: false };
        }
        return { change: '+100%', isPositive: true };
    }

    const diff = curr - prev;
    const percent = Math.round((diff / prev) * 100);
    const sign = percent > 0 ? '+' : '';

    return {
        change: `${sign}${percent}%`,
        isPositive: percent >= 0
    };
};

const buildLabelForDate = (dateStr, period) => {
    const date = new Date(`${dateStr}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) {
        return dateStr;
    }

    const locale = 'ar-SA';

    if (period === 'week' || period === 'month') {
        return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    }

    if (period === 'quarter' || period === 'year') {
        return date.toLocaleDateString(locale, { month: 'short', year: 'numeric' });
    }

    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
};

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

exports.getAnalyticsOverview = async (req, res) => {
    try {
        const clinicId = req.user?.clinicId || null;
        const { period = 'month' } = req.query;
        const {
            startDate,
            endDate,
            previousStartDate,
            previousEndDate,
            granularity,
            daysInRange
        } = getPeriodRange(period);

        const clinicFilter = clinicId ? ' AND clinic_id = ?' : '';
        const clinicFilterOnAppointments = clinicId ? ' AND a.clinic_id = ?' : '';

        const appendClinic = (params = []) => (clinicId ? [...params, clinicId] : params);

        // Current period stats
        const [currentTotalsRows] = await pool.execute(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status IN ('completed', 'confirmed') THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
             FROM appointments
             WHERE date BETWEEN ? AND ?${clinicFilter}`,
            appendClinic([startDate, endDate])
        );

        const currentTotals = {
            total: Number(currentTotalsRows[0]?.total || 0),
            completed: Number(currentTotalsRows[0]?.completed || 0),
            cancelled: Number(currentTotalsRows[0]?.cancelled || 0)
        };

        // Previous period totals for change comparison
        const [previousTotalsRows] = await pool.execute(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status IN ('completed', 'confirmed') THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
             FROM appointments
             WHERE date BETWEEN ? AND ?${clinicFilter}`,
            appendClinic([previousStartDate, previousEndDate])
        );

        const previousTotals = {
            total: Number(previousTotalsRows[0]?.total || 0),
            completed: Number(previousTotalsRows[0]?.completed || 0),
            cancelled: Number(previousTotalsRows[0]?.cancelled || 0)
        };

        // Distinct patients in current and previous periods
        const patientQueryBase = clinicId
            ? `SELECT COUNT(DISTINCT patient_id) as count
               FROM appointments
               WHERE clinic_id = ? AND date BETWEEN ? AND ?`
            : `SELECT COUNT(DISTINCT patient_id) as count
               FROM appointments
               WHERE date BETWEEN ? AND ?`;

        const patientParamsCurrent = clinicId
            ? [clinicId, startDate, endDate]
            : [startDate, endDate];
        const patientParamsPrevious = clinicId
            ? [clinicId, previousStartDate, previousEndDate]
            : [previousStartDate, previousEndDate];

        const [currentPatientsRows] = await pool.execute(patientQueryBase, patientParamsCurrent);
        const [previousPatientsRows] = await pool.execute(patientQueryBase, patientParamsPrevious);

        const currentDistinctPatients = Number(currentPatientsRows[0]?.count || 0);
        const previousDistinctPatients = Number(previousPatientsRows[0]?.count || 0);

        // New patients (first appointment falls within range)
        const newPatientsQuery = clinicId
            ? `SELECT COUNT(*) as total
               FROM (
                    SELECT patient_id, MIN(date) as first_date
                    FROM appointments
                    WHERE clinic_id = ?
                    GROUP BY patient_id
               ) first_appointments
               WHERE first_date BETWEEN ? AND ?`
            : `SELECT COUNT(*) as total
               FROM (
                    SELECT patient_id, MIN(date) as first_date
                    FROM appointments
                    GROUP BY patient_id
               ) first_appointments
               WHERE first_date BETWEEN ? AND ?`;

        const [newPatientsRows] = await pool.execute(
            newPatientsQuery,
            clinicId ? [clinicId, startDate, endDate] : [startDate, endDate]
        );

        const newPatients = Number(newPatientsRows[0]?.total || 0);

        const completionRate = currentTotals.total > 0
            ? Math.round((currentTotals.completed / currentTotals.total) * 100)
            : 0;
        const previousCompletionRate = previousTotals.total > 0
            ? Math.round((previousTotals.completed / previousTotals.total) * 100)
            : 0;

        const estimatedRevenue = currentTotals.completed * SAR_BASE_RATE;
        const previousEstimatedRevenue = previousTotals.completed * SAR_BASE_RATE;

        const statsCards = [
            (() => {
                const changeInfo = calculateChange(currentTotals.total, previousTotals.total);
                return {
                    title: 'إجمالي المواعيد',
                    value: formatNumber(currentTotals.total),
                    change: changeInfo.change,
                    isPositive: changeInfo.isPositive
                };
            })(),
            (() => {
                const changeInfo = calculateChange(currentDistinctPatients, previousDistinctPatients);
                return {
                    title: 'المرضى النشطون',
                    value: formatNumber(currentDistinctPatients),
                    change: changeInfo.change,
                    isPositive: changeInfo.isPositive
                };
            })(),
            (() => {
                const changeInfo = calculateChange(completionRate, previousCompletionRate);
                return {
                    title: 'نسبة إتمام المواعيد',
                    value: `${completionRate}%`,
                    change: changeInfo.change,
                    isPositive: changeInfo.isPositive
                };
            })(),
            (() => {
                const changeInfo = calculateChange(estimatedRevenue, previousEstimatedRevenue);
                return {
                    title: 'الإيرادات التقديرية',
                    value: formatCurrency(estimatedRevenue),
                    change: changeInfo.change,
                    isPositive: changeInfo.isPositive
                };
            })()
        ];

        // Appointments breakdown for charts
        const [appointmentsBreakdownRows] = await pool.execute(
            `SELECT date, status, COUNT(*) as count
             FROM appointments
             WHERE date BETWEEN ? AND ?${clinicFilter}
             GROUP BY date, status
             ORDER BY date`,
            appendClinic([startDate, endDate])
        );

        const appointmentMap = new Map();
        appointmentsBreakdownRows.forEach((row) => {
            const key = row.date;
            if (!appointmentMap.has(key)) {
                appointmentMap.set(key, {
                    date: key,
                    confirmed: 0,
                    completed: 0,
                    cancelled: 0,
                    pending: 0
                });
            }

            const target = appointmentMap.get(key);
            const statusKey = String(row.status || '').toLowerCase();
            const count = Number(row.count || 0);

            if (statusKey === 'confirmed') target.confirmed = count;
            else if (statusKey === 'completed') target.completed = count;
            else if (statusKey === 'cancelled' || statusKey === 'canceled') target.cancelled = count;
            else target.pending += count;
        });

        const appointmentsData = Array.from(appointmentMap.values())
            .sort((a, b) => new Date(`${a.date}T00:00:00Z`) - new Date(`${b.date}T00:00:00Z`))
            .map((entry) => {
                const total = entry.confirmed + entry.completed + entry.cancelled + entry.pending;
                return {
                    name: buildLabelForDate(entry.date, granularity === 'month' ? 'year' : period),
                    appointments: total,
                    completed: entry.completed,
                    cancelled: entry.cancelled
                };
            });

        // Hourly appointments for the most recent day in range
        const [hourlyRows] = await pool.execute(
            `SELECT HOUR(time) as hour, COUNT(*) as total
             FROM appointments
             WHERE date = ?${clinicFilter}
             GROUP BY HOUR(time)
             ORDER BY hour`,
            appendClinic([endDate])
        );

        const hourlyMap = new Map(hourlyRows.map((row) => [Number(row.hour), Number(row.total || 0)]));
        const dailyAppointmentsData = Array.from({ length: 24 }, (_, hour) => {
            const count = hourlyMap.get(hour) || 0;
            const hourLabel = `${String(hour).padStart(2, '0')}:00`;
            return { time: hourLabel, appointments: count };
        }).filter((slot) => slot.appointments > 0 || period === 'day');

        // Doctor performance
        const doctorQuery = clinicId
            ? `SELECT 
                    d.id,
                    COALESCE(u.name, d.specialization, 'طبيب') as name,
                    COALESCE(d.rating, 0) as rating,
                    COUNT(a.id) as appointments,
                    COUNT(DISTINCT a.patient_id) as patients
               FROM doctors d
               LEFT JOIN users u ON u.id = d.user_id
               LEFT JOIN appointments a
                    ON a.doctor_id = d.id
                    AND a.date BETWEEN ? AND ?
                    AND a.clinic_id = ?
               WHERE d.clinic_id = ?
               GROUP BY d.id, name, rating
               ORDER BY appointments DESC
               LIMIT 10`
            : `SELECT 
                    d.id,
                    COALESCE(u.name, d.specialization, 'Doctor') as name,
                    COALESCE(d.rating, 0) as rating,
                    COUNT(a.id) as appointments,
                    COUNT(DISTINCT a.patient_id) as patients
               FROM doctors d
               LEFT JOIN users u ON u.id = d.user_id
               LEFT JOIN appointments a
                    ON a.doctor_id = d.id
                    AND a.date BETWEEN ? AND ?
               GROUP BY d.id, name, rating
               ORDER BY appointments DESC
               LIMIT 10`;

        const doctorParams = clinicId
            ? [startDate, endDate, clinicId, clinicId]
            : [startDate, endDate];

        const [doctorRows] = await pool.execute(doctorQuery, doctorParams);
        const doctorPerformanceData = doctorRows.map((row) => ({
            id: row.id,
            name: row.name,
            appointments: Number(row.appointments || 0),
            patients: Number(row.patients || 0),
            rating: Number(row.rating || 0)
        }));

        // Color blindness / patient color deficiency stats
        const colorStatsQuery = clinicId
            ? `SELECT deficiency, COUNT(*) as total FROM (
                    SELECT DISTINCT p.id,
                           COALESCE(NULLIF(p.color_deficiency_type, ''), 'غير محدد') as deficiency
                    FROM patients p
                    JOIN appointments a ON a.patient_id = p.id
                    WHERE a.clinic_id = ? AND a.date BETWEEN ? AND ?
                ) patient_colors
                GROUP BY deficiency`
            : `SELECT deficiency, COUNT(*) as total FROM (
                    SELECT DISTINCT p.id,
                           COALESCE(NULLIF(p.color_deficiency_type, ''), 'غير محدد') as deficiency
                    FROM patients p
                    JOIN appointments a ON a.patient_id = p.id
                    WHERE a.date BETWEEN ? AND ?
                ) patient_colors
                GROUP BY deficiency`;

        const colorParams = clinicId
            ? [clinicId, startDate, endDate]
            : [startDate, endDate];

        const [colorRows] = await pool.execute(colorStatsQuery, colorParams);
        const colorBlindnessData = colorRows.map((row, index) => ({
            name: row.deficiency,
            value: Number(row.total || 0),
            color: COLOR_PALETTE[index % COLOR_PALETTE.length]
        }));

        // Revenue trend (estimated) - last 6 calendar months
        const revenueEnd = new Date(`${endDate}T00:00:00Z`);
        const revenueStart = toDateOnly(new Date(revenueEnd));
        revenueStart.setMonth(revenueStart.getMonth() - 5);
        revenueStart.setDate(1);

        const revenueStartDate = formatDateOnly(revenueStart);

        const revenueQuery = clinicId
            ? `SELECT DATE_FORMAT(a.date, '%Y-%m') as month,
                      SUM(CASE WHEN a.status IN ('completed','confirmed') THEN 1 ELSE 0 END) as completed,
                      COUNT(*) as total
               FROM appointments a
               WHERE a.date BETWEEN ? AND ?${clinicFilterOnAppointments}
               GROUP BY DATE_FORMAT(a.date, '%Y-%m')
               ORDER BY month`
            : `SELECT DATE_FORMAT(a.date, '%Y-%m') as month,
                      SUM(CASE WHEN a.status IN ('completed','confirmed') THEN 1 ELSE 0 END) as completed,
                      COUNT(*) as total
               FROM appointments a
               WHERE a.date BETWEEN ? AND ?
               GROUP BY DATE_FORMAT(a.date, '%Y-%m')
               ORDER BY month`;

        const revenueParams = clinicId
            ? [revenueStartDate, endDate, clinicId]
            : [revenueStartDate, endDate];

        const [revenueRows] = await pool.execute(revenueQuery, revenueParams);

        const monthlyRevenueData = revenueRows.map((row) => {
            const completedAppointments = Number(row.completed || 0);
            const estimatedMonthlyRevenue = completedAppointments * SAR_BASE_RATE;
            const estimatedExpenses = Math.round(estimatedMonthlyRevenue * 0.6);
            const estimatedProfit = Math.max(estimatedMonthlyRevenue - estimatedExpenses, 0);

            const [year, month] = String(row.month || '').split('-');
            const date = new Date(Number(year), Number(month) - 1);
            const monthLabel = date.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });

            return {
                month: monthLabel,
                revenue: estimatedMonthlyRevenue,
                expenses: estimatedExpenses,
                profit: estimatedProfit
            };
        });

        sendSuccess(res, {
            period: resolvePeriod(period),
            range: {
                startDate,
                endDate,
                previousStartDate,
                previousEndDate,
                daysInRange
            },
            statsCards,
            summary: {
                totalAppointments: currentTotals.total,
                completedAppointments: currentTotals.completed,
                cancelledAppointments: currentTotals.cancelled,
                distinctPatients: currentDistinctPatients,
                newPatients,
                completionRate,
                estimatedRevenue
            },
            appointmentsData,
            dailyAppointmentsData,
            doctorPerformanceData,
            colorBlindnessData,
            monthlyRevenueData
        });
    } catch (error) {
        console.error('Analytics overview error:', error);
        sendError(res, error.message || 'Error fetching analytics overview', 500);
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
                `SELECT a.doctor_id as id, 
                        COALESCE(u.name, a.doctor_name, d.specialization, 'Doctor') as name,
                        COUNT(*) as appointments
                 FROM appointments a 
                 LEFT JOIN doctors d ON d.id = a.doctor_id
                 LEFT JOIN users u ON u.id = d.user_id
                 WHERE a.date = ? AND a.clinic_id = ? ${doctorWhere}
                 GROUP BY a.doctor_id, name`,
                [date, clinicId, ...doctorParams]
            )
            : await pool.execute(
                `SELECT a.doctor_id as id, 
                        COALESCE(u.name, a.doctor_name, d.specialization, 'Doctor') as name,
                        COUNT(*) as appointments
                 FROM appointments a 
                 LEFT JOIN doctors d ON d.id = a.doctor_id
                 LEFT JOIN users u ON u.id = d.user_id
                 WHERE a.date = ? ${doctorWhere}
                 GROUP BY a.doctor_id, name`,
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
                `SELECT a.doctor_id as id, 
                        COALESCE(u.name, a.doctor_name, d.specialization, 'Doctor') as name,
                        COUNT(*) as appointments
                 FROM appointments a 
                 LEFT JOIN doctors d ON d.id = a.doctor_id
                 LEFT JOIN users u ON u.id = d.user_id
                 WHERE a.date LIKE ? AND a.clinic_id = ? ${doctorWhere}
                 GROUP BY a.doctor_id, name`,
                [`${month}%`, clinicId, ...doctorParams]
            )
            : await pool.execute(
                `SELECT a.doctor_id as id, 
                        COALESCE(u.name, a.doctor_name, d.specialization, 'Doctor') as name,
                        COUNT(*) as appointments
                 FROM appointments a 
                 LEFT JOIN doctors d ON d.id = a.doctor_id
                 LEFT JOIN users u ON u.id = d.user_id
                 WHERE a.date LIKE ? ${doctorWhere}
                 GROUP BY a.doctor_id, name`,
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