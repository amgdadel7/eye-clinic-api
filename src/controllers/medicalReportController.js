const pool = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

const resolvePatientDetails = async (patientId) => {
    if (patientId === undefined || patientId === null) return null;
    const numericId = Number(patientId);
    if (Number.isNaN(numericId)) return null;

    const [patients] = await pool.execute(
        'SELECT id, name FROM patients WHERE id = ?',
        [numericId]
    );

    return patients[0] || null;
};

const resolveDoctorDetails = async (doctorIdentifier) => {
    if (doctorIdentifier === undefined || doctorIdentifier === null) return null;

    let doctor = null;
    const numericId = Number(doctorIdentifier);

    if (!Number.isNaN(numericId)) {
        const [doctors] = await pool.execute(
            `SELECT d.id, d.doctor_id, d.clinic_id, COALESCE(u.name, '') AS name
             FROM doctors d
             LEFT JOIN users u ON u.id = d.user_id
             WHERE d.id = ?`,
            [numericId]
        );
        if (doctors.length) {
            doctor = doctors[0];
        }
    }

    if (!doctor) {
        const [doctors] = await pool.execute(
            `SELECT d.id, d.doctor_id, d.clinic_id, COALESCE(u.name, '') AS name
             FROM doctors d
             LEFT JOIN users u ON u.id = d.user_id
             WHERE d.doctor_id = ?`,
            [doctorIdentifier]
        );
        doctor = doctors[0] || null;
    }

    return doctor;
};

exports.getAllReports = async (req, res) => {
    try {
        const clinicId = req.user.clinicId;
        const [reports] = clinicId 
            ? await pool.execute(
                'SELECT r.* FROM medical_reports r JOIN doctors d ON r.doctor_id = d.id WHERE d.clinic_id = ? ORDER BY r.date DESC',
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
        const { patientId, patientName, doctorId, doctorName, date, reportType, diagnosis, treatment, notes, recommendations, vitalSigns, clinicId } = req.body;

        if (!patientId || !doctorId || !diagnosis) {
            return sendError(res, 'Required fields: patientId, doctorId, diagnosis', 400);
        }

        const patientDetails = await resolvePatientDetails(patientId);
        if (!patientDetails) {
            return sendError(res, 'Patient not found', 404);
        }

        const doctorDetails = await resolveDoctorDetails(doctorId);
        if (!doctorDetails) {
            return sendError(res, 'Doctor not found', 404);
        }

        const resolvedPatientName = patientName || patientDetails.name || '';
        const resolvedDoctorName = doctorName || doctorDetails.name || '';
        const resolvedClinicId = clinicId || doctorDetails.clinic_id || req.user?.clinicId;

        if (!resolvedClinicId) {
            return sendError(res, 'Clinic ID is required to create a report', 400);
        }

        const normalizedRecommendations = Array.isArray(recommendations) ? recommendations : (recommendations ? [recommendations].flat() : []);
        const normalizedVitalSigns = typeof vitalSigns === 'object' && vitalSigns !== null ? vitalSigns : {};

        const [result] = await pool.execute(
            `INSERT INTO medical_reports (patient_id, patient_name, doctor_id, doctor_name, clinic_id, date, report_type, diagnosis, treatment, notes, recommendations, vital_signs) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [patientDetails.id, resolvedPatientName, doctorDetails.id, resolvedDoctorName, resolvedClinicId,
             date || new Date().toISOString().split('T')[0],
             reportType, diagnosis, treatment, notes,
             JSON.stringify(normalizedRecommendations),
             JSON.stringify(normalizedVitalSigns)]
        );

        sendSuccess(res, { reportId: result.insertId }, 'Report created successfully', 201);
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error creating report', 500);
    }
};

exports.updateReport = async (req, res) => {
    try {
        const {
            patientId,
            patientName,
            doctorId,
            doctorName,
            date,
            reportType,
            diagnosis,
            treatment,
            notes,
            recommendations,
            vitalSigns,
            clinicId
        } = req.body;

        const [existing] = await pool.execute('SELECT id FROM medical_reports WHERE id = ?', [req.params.id]);
        if (existing.length === 0) {
            return sendError(res, 'Report not found', 404);
        }

        const updates = [];
        const values = [];

        const pushUpdate = (column, value, formatter = (val) => val) => {
            if (value !== undefined) {
                updates.push(`${column} = ?`);
                values.push(formatter(value));
            }
        };

        let clinicIdFromDoctor;

        if (patientId !== undefined) {
            const patientDetails = await resolvePatientDetails(patientId);
            if (!patientDetails) {
                return sendError(res, 'Patient not found', 404);
            }
            updates.push('patient_id = ?');
            values.push(patientDetails.id);

            const resolvedPatientName = patientName !== undefined ? patientName : patientDetails.name || '';
            updates.push('patient_name = ?');
            values.push(resolvedPatientName);
        } else if (patientName !== undefined) {
            updates.push('patient_name = ?');
            values.push(patientName);
        }

        if (doctorId !== undefined) {
            const doctorDetails = await resolveDoctorDetails(doctorId);
            if (!doctorDetails) {
                return sendError(res, 'Doctor not found', 404);
            }
            updates.push('doctor_id = ?');
            values.push(doctorDetails.id);

            const resolvedDoctorName = doctorName !== undefined ? doctorName : doctorDetails.name || '';
            updates.push('doctor_name = ?');
            values.push(resolvedDoctorName);

            clinicIdFromDoctor = doctorDetails.clinic_id;
        } else if (doctorName !== undefined) {
            updates.push('doctor_name = ?');
            values.push(doctorName);
        }

        const clinicIdToUse = clinicId !== undefined ? clinicId : clinicIdFromDoctor;
        if (clinicIdToUse !== undefined) {
            updates.push('clinic_id = ?');
            values.push(clinicIdToUse);
        }

        pushUpdate('date', date);
        pushUpdate('report_type', reportType);
        pushUpdate('diagnosis', diagnosis);
        pushUpdate('treatment', treatment);
        pushUpdate('notes', notes);
        if (recommendations !== undefined) {
            updates.push('recommendations = ?');
            const normalizedRecommendations = Array.isArray(recommendations) ? recommendations : (recommendations ? [recommendations].flat() : []);
            values.push(JSON.stringify(normalizedRecommendations));
        }
        if (vitalSigns !== undefined) {
            const normalizedVitalSigns = typeof vitalSigns === 'object' && vitalSigns !== null ? vitalSigns : {};
            updates.push('vital_signs = ?');
            values.push(JSON.stringify(normalizedVitalSigns));
        }

        if (updates.length === 0) {
            return sendError(res, 'No fields to update', 400);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(req.params.id);

        await pool.execute(`UPDATE medical_reports SET ${updates.join(', ')} WHERE id = ?`, values);

        sendSuccess(res, null, 'Report updated successfully');
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error updating report', 500);
    }
};

exports.deleteReport = async (req, res) => {
    try {
        const [existing] = await pool.execute('SELECT id FROM medical_reports WHERE id = ?', [req.params.id]);
        if (existing.length === 0) {
            return sendError(res, 'Report not found', 404);
        }

        await pool.execute('DELETE FROM medical_reports WHERE id = ?', [req.params.id]);
        sendSuccess(res, null, 'Report deleted successfully');
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error deleting report', 500);
    }
};