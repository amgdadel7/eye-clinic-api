const pool = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

// Get all clinics
exports.getAllClinics = async (req, res) => {
    try {
        const [clinics] = await pool.execute(
            'SELECT id, name, name_en, code, phone, email, address, specialty, status FROM clinics WHERE status = "active"'
        );

        // Parse JSON fields
        const clinicsList = clinics.map(clinic => ({
            ...clinic,
            services: typeof clinic.services === 'string' ? JSON.parse(clinic.services) : (clinic.services || []),
            workingHours: typeof clinic.workingHours === 'string' ? JSON.parse(clinic.workingHours) : (clinic.workingHours || {})
        }));

        sendSuccess(res, { clinics: clinicsList });

    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching clinics', 500);
    }
};

// Get clinic by ID
exports.getClinicById = async (req, res) => {
    try {
        const [clinics] = await pool.execute(
            'SELECT * FROM clinics WHERE id = ?',
            [req.params.id]
        );

        if (clinics.length === 0) {
            return sendError(res, 'Clinic not found', 404);
        }

        const clinic = clinics[0];
        clinic.services = typeof clinic.services === 'string' ? JSON.parse(clinic.services) : (clinic.services || []);
        clinic.workingHours = typeof clinic.workingHours === 'string' ? JSON.parse(clinic.workingHours) : (clinic.workingHours || {});

        sendSuccess(res, { clinic });

    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching clinic', 500);
    }
};

// Get clinic doctors
exports.getClinicDoctors = async (req, res) => {
    try {
        const [doctors] = await pool.execute(
            `SELECT d.*, u.name as user_name, u.avatar, u.phone, u.email 
             FROM doctors d 
             JOIN users u ON d.user_id = u.id 
             WHERE d.clinic_id = ? AND d.status = 'active'`,
            [req.params.id]
        );

        // Parse JSON fields
        const doctorsList = doctors.map(doctor => ({
            ...doctor,
            workingHours: typeof doctor.workingHours === 'string' ? JSON.parse(doctor.workingHours) : (doctor.workingHours || {})
        }));

        sendSuccess(res, { doctors: doctorsList });

    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching doctors', 500);
    }
};

// Get clinic services
exports.getClinicServices = async (req, res) => {
    try {
        const [clinics] = await pool.execute(
            'SELECT services, services_en FROM clinics WHERE id = ?',
            [req.params.id]
        );

        if (clinics.length === 0) {
            return sendError(res, 'Clinic not found', 404);
        }

        const clinic = clinics[0];

        sendSuccess(res, {
            services: typeof clinic.services === 'string' ? JSON.parse(clinic.services) : (clinic.services || []),
            servicesEn: typeof clinic.services_en === 'string' ? JSON.parse(clinic.services_en) : (clinic.services_en || [])
        });

    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching services', 500);
    }
};

// Update clinic
exports.updateClinic = async (req, res) => {
    try {
        const {
            name, nameEn, phone, email, address, addressEn, 
            specialty, website, workingHours, services
        } = req.body;
        const clinicId = req.params.id;

        // Verify user owns or manages this clinic
        if (req.user.clinicId !== parseInt(clinicId) && req.user.role !== 'admin') {
            return sendError(res, 'You do not have permission to update this clinic', 403);
        }

        const updates = [];
        const values = [];

        if (name) { updates.push('name = ?'); values.push(name); }
        if (nameEn) { updates.push('name_en = ?'); values.push(nameEn); }
        if (phone) { updates.push('phone = ?'); values.push(phone); }
        if (email) { updates.push('email = ?'); values.push(email); }
        if (address) { updates.push('address = ?'); values.push(address); }
        if (addressEn) { updates.push('address_en = ?'); values.push(addressEn); }
        if (specialty) { updates.push('specialty = ?'); values.push(specialty); }
        if (website) { updates.push('website = ?'); values.push(website); }
        if (workingHours) { updates.push('working_hours = ?'); values.push(JSON.stringify(workingHours)); }
        if (services) { updates.push('services = ?'); values.push(JSON.stringify(services)); }

        if (updates.length === 0) {
            return sendError(res, 'No fields to update', 400);
        }

        values.push(clinicId);

        await pool.execute(
            `UPDATE clinics SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        sendSuccess(res, null, 'Clinic updated successfully');

    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error updating clinic', 500);
    }
};
