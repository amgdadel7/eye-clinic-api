const pool = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

const parseMedications = (medications) => {
    if (!medications) return [];
    if (Array.isArray(medications)) return medications;
    if (typeof medications === 'object') return medications;
    try {
        const parsed = JSON.parse(medications);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
};

const computePrescriptionStatus = (rawStatus, followUpDate) => {
    if (rawStatus) {
        return rawStatus.toString().trim().toLowerCase();
    }
    if (!followUpDate) {
        return 'active';
    }
    const followUp = new Date(followUpDate);
    if (Number.isNaN(followUp.getTime())) {
        return 'active';
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    followUp.setHours(0, 0, 0, 0);
    if (followUp < today) {
        return 'completed';
    }
    if (followUp > today) {
        return 'pending';
    }
    return 'active';
};

const normalizePrescriptionRecord = (record = {}) => {
    const {
        resolved_patient_name,
        resolved_patient_phone,
        resolved_patient_email,
        resolved_patient_birthday,
        resolved_doctor_name,
        resolved_doctor_phone,
        resolved_doctor_email,
        resolved_doctor_specialization,
        ...rest
    } = record;

    const medications = parseMedications(rest.medications);
    const status = computePrescriptionStatus(rest.status, rest.follow_up_date);

    return {
        ...rest,
        patient_name: rest.patient_name || resolved_patient_name || '',
        patient_phone: rest.patient_phone || resolved_patient_phone || '',
        patient_email: rest.patient_email || resolved_patient_email || '',
        patient_birthday: rest.patient_birthday || resolved_patient_birthday || null,
        doctor_name: rest.doctor_name || resolved_doctor_name || '',
        doctor_phone: rest.doctor_phone || resolved_doctor_phone || '',
        doctor_email: rest.doctor_email || resolved_doctor_email || '',
        doctor_specialization: rest.doctor_specialization || resolved_doctor_specialization || '',
        medications,
        status,
        status_display: status.charAt(0).toUpperCase() + status.slice(1)
    };
};

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

exports.getAllPrescriptions = async (req, res) => {
    try {
        const clinicId = req.user.clinicId;
        let query = `
            SELECT 
                pr.*,
                COALESCE(pr.patient_name, pa.name) AS resolved_patient_name,
                pa.phone AS resolved_patient_phone,
                pa.email AS resolved_patient_email,
                pa.date_of_birth AS resolved_patient_birthday,
                COALESCE(pr.doctor_name, u.name) AS resolved_doctor_name,
                u.phone AS resolved_doctor_phone,
                u.email AS resolved_doctor_email,
                d.specialization AS resolved_doctor_specialization
            FROM prescriptions pr
            LEFT JOIN patients pa ON pa.id = pr.patient_id
            LEFT JOIN doctors d ON d.id = pr.doctor_id
            LEFT JOIN users u ON u.id = d.user_id
        `;
        const params = [];

        if (clinicId) {
            query += ' WHERE d.clinic_id = ?';
            params.push(clinicId);
        }

        query += ' ORDER BY pr.date DESC, pr.created_at DESC';

        const [prescriptions] = await pool.execute(query, params);

        const prescriptionsList = prescriptions.map(normalizePrescriptionRecord);

        sendSuccess(res, { prescriptions: prescriptionsList });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching prescriptions', 500);
    }
};

exports.getPatientPrescriptions = async (req, res) => {
    try {
        let query = `
            SELECT 
                pr.*,
                COALESCE(pr.patient_name, pa.name) AS resolved_patient_name,
                pa.phone AS resolved_patient_phone,
                pa.email AS resolved_patient_email,
                pa.date_of_birth AS resolved_patient_birthday,
                COALESCE(pr.doctor_name, u.name) AS resolved_doctor_name,
                u.phone AS resolved_doctor_phone,
                u.email AS resolved_doctor_email,
                d.specialization AS resolved_doctor_specialization
            FROM prescriptions pr
            LEFT JOIN patients pa ON pa.id = pr.patient_id
            LEFT JOIN doctors d ON d.id = pr.doctor_id
            LEFT JOIN users u ON u.id = d.user_id
            WHERE pr.patient_id = ?
        `;
        const params = [req.params.patientId];

        if (req.user && req.user.clinicId) {
            query += ' AND d.clinic_id = ?';
            params.push(req.user.clinicId);
        }

        query += ' ORDER BY pr.date DESC, pr.created_at DESC';

        const [prescriptions] = await pool.execute(query, params);

        const prescriptionsList = prescriptions.map(normalizePrescriptionRecord);

        sendSuccess(res, { prescriptions: prescriptionsList });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching prescriptions', 500);
    }
};

exports.getPrescriptionById = async (req, res) => {
    try {
        const [prescriptions] = await pool.execute(
            `SELECT 
                pr.*,
                COALESCE(pr.patient_name, pa.name) AS resolved_patient_name,
                pa.phone AS resolved_patient_phone,
                pa.email AS resolved_patient_email,
                pa.date_of_birth AS resolved_patient_birthday,
                COALESCE(pr.doctor_name, u.name) AS resolved_doctor_name,
                u.phone AS resolved_doctor_phone,
                u.email AS resolved_doctor_email,
                d.specialization AS resolved_doctor_specialization
            FROM prescriptions pr
            LEFT JOIN patients pa ON pa.id = pr.patient_id
            LEFT JOIN doctors d ON d.id = pr.doctor_id
            LEFT JOIN users u ON u.id = d.user_id
            WHERE pr.id = ?`,
            [req.params.id]
        );

        if (prescriptions.length === 0) {
            return sendError(res, 'Prescription not found', 404);
        }

        const prescription = normalizePrescriptionRecord(prescriptions[0]);

        sendSuccess(res, { prescription });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching prescription', 500);
    }
};

exports.createPrescription = async (req, res) => {
    try {
        const { patientId, patientName, doctorId, doctorName, date, medications, instructions, diagnosis, followUpDate, clinicId } = req.body;

        if (!patientId || !doctorId || !medications || !Array.isArray(medications)) {
            return sendError(res, 'Required fields: patientId, doctorId, medications (array)', 400);
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
            return sendError(res, 'Clinic ID is required to create a prescription', 400);
        }

        const normalizedMedications = parseMedications(medications);

        const [result] = await pool.execute(
            `INSERT INTO prescriptions (patient_id, patient_name, doctor_id, doctor_name, clinic_id, date, medications, instructions, diagnosis, follow_up_date) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [patientDetails.id, resolvedPatientName, doctorDetails.id, resolvedDoctorName, resolvedClinicId,
             date || new Date().toISOString().split('T')[0],
             JSON.stringify(normalizedMedications), instructions, diagnosis, followUpDate]
        );

        sendSuccess(res, { prescriptionId: result.insertId }, 'Prescription created successfully', 201);
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error creating prescription', 500);
    }
};

exports.updatePrescription = async (req, res) => {
    try {
        const {
            patientId,
            patientName,
            doctorId,
            doctorName,
            date,
            medications,
            instructions,
            diagnosis,
            followUpDate,
            status,
            clinicId
        } = req.body;

        const [existing] = await pool.execute('SELECT id FROM prescriptions WHERE id = ?', [req.params.id]);
        if (existing.length === 0) {
            return sendError(res, 'Prescription not found', 404);
        }

        const updates = [];
        const values = [];

        const pushUpdate = (column, value, formatter = (val) => val) => {
            if (value !== undefined) {
                updates.push(`${column} = ?`);
                values.push(formatter(value));
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

        pushUpdate('date', date);
        if (medications !== undefined) {
            const normalizedMedications = parseMedications(medications);
            updates.push('medications = ?');
            values.push(JSON.stringify(normalizedMedications));
        }
        pushUpdate('instructions', instructions);
        pushUpdate('diagnosis', diagnosis);
        pushUpdate('follow_up_date', followUpDate);
        pushUpdate('status', status);

        if (updates.length === 0) {
            return sendError(res, 'No fields to update', 400);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(req.params.id);

        await pool.execute(`UPDATE prescriptions SET ${updates.join(', ')} WHERE id = ?`, values);

        sendSuccess(res, null, 'Prescription updated successfully');
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error updating prescription', 500);
    }
};

exports.deletePrescription = async (req, res) => {
    try {
        const [existing] = await pool.execute('SELECT id FROM prescriptions WHERE id = ?', [req.params.id]);
        if (existing.length === 0) {
            return sendError(res, 'Prescription not found', 404);
        }

        await pool.execute('DELETE FROM prescriptions WHERE id = ?', [req.params.id]);
        sendSuccess(res, null, 'Prescription deleted successfully');
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error deleting prescription', 500);
    }
};