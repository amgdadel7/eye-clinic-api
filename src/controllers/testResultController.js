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

exports.getAllTestResults = async (req, res) => {
    try {
        // Scope by clinic using doctors -> clinic_id when available
        let query = `
            SELECT 
                tr.*,
                COALESCE(tr.patient_name, p.name) AS resolved_patient_name,
                COALESCE(tr.doctor_name, u.name) AS resolved_doctor_name,
                p.phone AS resolved_patient_phone,
                p.email AS resolved_patient_email,
                p.date_of_birth AS resolved_patient_birthday,
                d.specialization AS resolved_doctor_specialization
            FROM test_results tr
            LEFT JOIN patients p ON p.id = tr.patient_id
            LEFT JOIN doctors d ON d.id = tr.doctor_id
            LEFT JOIN users u ON u.id = d.user_id
        `;
        const params = [];

        if (req.user && req.user.clinicId) {
            // Restrict to clinic-specific results when user belongs to a clinic
            query += ' WHERE d.clinic_id = ?';
            params.push(req.user.clinicId);
        }

        query += ' ORDER BY tr.test_date DESC, tr.created_at DESC';

        const [rawResults] = await pool.execute(query, params);

        const results = rawResults.map(result => {
            const {
                resolved_patient_name,
                resolved_doctor_name,
                resolved_patient_phone,
                resolved_patient_email,
                resolved_patient_birthday,
                resolved_doctor_specialization,
                ...rest
            } = result;

            return {
                ...rest,
                patient_name: rest.patient_name || resolved_patient_name || '',
                doctor_name: rest.doctor_name || resolved_doctor_name || '',
                patient_phone: rest.patient_phone || resolved_patient_phone || '',
                patient_email: rest.patient_email || resolved_patient_email || '',
                patient_birthday: rest.patient_birthday || resolved_patient_birthday || null,
                doctor_specialization: rest.doctor_specialization || resolved_doctor_specialization || ''
            };
        });

        sendSuccess(res, { results });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching test results', 500);
    }
};

exports.getPatientTestResults = async (req, res) => {
    try {
        let query = `
            SELECT 
                tr.*,
                COALESCE(tr.patient_name, p.name) AS resolved_patient_name,
                COALESCE(tr.doctor_name, u.name) AS resolved_doctor_name,
                p.phone AS resolved_patient_phone,
                p.email AS resolved_patient_email,
                p.date_of_birth AS resolved_patient_birthday,
                d.specialization AS resolved_doctor_specialization
            FROM test_results tr
            LEFT JOIN patients p ON p.id = tr.patient_id
            LEFT JOIN doctors d ON d.id = tr.doctor_id
            LEFT JOIN users u ON u.id = d.user_id
            WHERE tr.patient_id = ?
        `;
        const params = [req.params.patientId];

        if (req.user && req.user.clinicId) {
            query += ' AND d.clinic_id = ?';
            params.push(req.user.clinicId);
        }

        query += ' ORDER BY tr.test_date DESC, tr.created_at DESC';

        const [rawResults] = await pool.execute(query, params);

        const results = rawResults.map(result => {
            const {
                resolved_patient_name,
                resolved_doctor_name,
                resolved_patient_phone,
                resolved_patient_email,
                resolved_patient_birthday,
                resolved_doctor_specialization,
                ...rest
            } = result;

            return {
                ...rest,
                patient_name: rest.patient_name || resolved_patient_name || '',
                doctor_name: rest.doctor_name || resolved_doctor_name || '',
                patient_phone: rest.patient_phone || resolved_patient_phone || '',
                patient_email: rest.patient_email || resolved_patient_email || '',
                patient_birthday: rest.patient_birthday || resolved_patient_birthday || null,
                doctor_specialization: rest.doctor_specialization || resolved_doctor_specialization || ''
            };
        });

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

        const result = results[0];

        if (!result) {
            return sendSuccess(res, { result: null });
        }

        const [enriched] = await pool.execute(
            `SELECT 
                tr.*,
                COALESCE(tr.patient_name, p.name) AS resolved_patient_name,
                COALESCE(tr.doctor_name, u.name) AS resolved_doctor_name,
                p.phone AS resolved_patient_phone,
                p.email AS resolved_patient_email,
                p.date_of_birth AS resolved_patient_birthday,
                d.specialization AS resolved_doctor_specialization
            FROM test_results tr
            LEFT JOIN patients p ON p.id = tr.patient_id
            LEFT JOIN doctors d ON d.id = tr.doctor_id
            LEFT JOIN users u ON u.id = d.user_id
            WHERE tr.id = ?`,
            [req.params.id]
        );

        const enrichedResult = enriched[0] || result;

        const {
            resolved_patient_name,
            resolved_doctor_name,
            resolved_patient_phone,
            resolved_patient_email,
            resolved_patient_birthday,
            resolved_doctor_specialization,
            ...rest
        } = enrichedResult || {};

        const normalized = {
            ...rest,
            patient_name: rest?.patient_name || resolved_patient_name || '',
            doctor_name: rest?.doctor_name || resolved_doctor_name || '',
            patient_phone: rest?.patient_phone || resolved_patient_phone || '',
            patient_email: rest?.patient_email || resolved_patient_email || '',
            patient_birthday: rest?.patient_birthday || resolved_patient_birthday || null,
            doctor_specialization: rest?.doctor_specialization || resolved_doctor_specialization || ''
        };

        sendSuccess(res, { result: normalized });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching test result', 500);
    }
};

exports.createTestResult = async (req, res) => {
    try {
        const { patientId, patientName, doctorId, doctorName, testType, testDate, result, severity, status, clinicId } = req.body;

        if (!patientId || !doctorId || !testType || !testDate || !result) {
            return sendError(res, 'Required fields: patientId, doctorId, testType, testDate, result', 400);
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
            return sendError(res, 'Clinic ID is required to create a test result', 400);
        }

        const [resultInsert] = await pool.execute(
            `INSERT INTO test_results (patient_id, patient_name, doctor_id, doctor_name, clinic_id, test_type, test_date, result, severity, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [patientDetails.id, resolvedPatientName, doctorDetails.id, resolvedDoctorName, resolvedClinicId,
             testType, testDate, result, severity, status]
        );

        sendSuccess(res, { resultId: resultInsert.insertId }, 'Test result created successfully', 201);
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error creating test result', 500);
    }
};

exports.updateTestResult = async (req, res) => {
    try {
        const {
            patientId,
            patientName,
            doctorId,
            doctorName,
            clinicId,
            testType,
            testDate,
            result,
            severity,
            status
        } = req.body;

        const [existing] = await pool.execute('SELECT id FROM test_results WHERE id = ?', [req.params.id]);
        if (existing.length === 0) {
            return sendError(res, 'Test result not found', 404);
        }

        const updates = [];
        const values = [];

        const pushUpdate = (column, value) => {
            if (value !== undefined) {
                updates.push(`${column} = ?`);
                values.push(value);
            }
        };

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

        let clinicIdFromDoctor;
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

        pushUpdate('test_type', testType);
        pushUpdate('test_date', testDate);
        pushUpdate('result', result);
        pushUpdate('severity', severity);
        pushUpdate('status', status);

        if (updates.length === 0) {
            return sendError(res, 'No fields to update', 400);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(req.params.id);

        await pool.execute(`UPDATE test_results SET ${updates.join(', ')} WHERE id = ?`, values);

        sendSuccess(res, null, 'Test result updated successfully');
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error updating test result', 500);
    }
};

exports.deleteTestResult = async (req, res) => {
    try {
        const [existing] = await pool.execute('SELECT id FROM test_results WHERE id = ?', [req.params.id]);
        if (existing.length === 0) {
            return sendError(res, 'Test result not found', 404);
        }

        await pool.execute('DELETE FROM test_results WHERE id = ?', [req.params.id]);
        sendSuccess(res, null, 'Test result deleted successfully');
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error deleting test result', 500);
    }
};