const pool = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

exports.getAllDoctors = async (req, res) => {
    try {
        const query = req.user.clinicId 
            ? 'SELECT d.*, u.name as user_name, u.avatar, u.phone, u.email FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.clinic_id = ?'
            : 'SELECT d.*, u.name as user_name, u.avatar, u.phone, u.email FROM doctors d JOIN users u ON d.user_id = u.id';
        
        const [doctors] = req.user.clinicId 
            ? await pool.execute(query, [req.user.clinicId])
            : await pool.execute(query);
        
        // Parse JSON fields
        const doctorsList = doctors.map(doctor => ({
            ...doctor,
            workingHours: typeof doctor.working_hours === 'string' 
                ? JSON.parse(doctor.working_hours) 
                : (doctor.working_hours || {})
        }));
        
        sendSuccess(res, { doctors: doctorsList });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching doctors', 500);
    }
};

exports.getDoctorById = async (req, res) => {
    try {
        const [doctors] = await pool.execute(
            'SELECT d.*, u.name as user_name, u.avatar, u.phone, u.email FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = ?',
            [req.params.id]
        );
        
        if (doctors.length === 0) {
            return sendError(res, 'Doctor not found', 404);
        }
        
        const doctor = doctors[0];
        doctor.workingHours = typeof doctor.working_hours === 'string' 
            ? JSON.parse(doctor.working_hours) 
            : (doctor.working_hours || {});
        
        sendSuccess(res, { doctor });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching doctor', 500);
    }
};

exports.createDoctor = async (req, res) => {
    try {
        const { userId, doctorId, specialization, specialtyId, experience, licenseNumber, joinDate } = req.body;
        const clinicId = req.user.clinicId;

        if (!userId || !doctorId || !specialization) {
            return sendError(res, 'Required fields: userId, doctorId, specialization', 400);
        }

        const [result] = await pool.execute(
            `INSERT INTO doctors (user_id, doctor_id, specialization, specialty_id, clinic_id, experience, license_number, join_date) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, doctorId, specialization, specialtyId, clinicId, experience, licenseNumber, joinDate]
        );

        sendSuccess(res, { doctorId: result.insertId }, 'Doctor created successfully', 201);
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error creating doctor', 500);
    }
};

exports.updateDoctor = async (req, res) => {
    try {
        const { specialization, specialtyId, experience, licenseNumber, status } = req.body;
        const updates = [];
        const values = [];

        if (specialization) { updates.push('specialization = ?'); values.push(specialization); }
        if (specialtyId) { updates.push('specialty_id = ?'); values.push(specialtyId); }
        if (experience) { updates.push('experience = ?'); values.push(experience); }
        if (licenseNumber) { updates.push('license_number = ?'); values.push(licenseNumber); }
        if (status) { updates.push('status = ?'); values.push(status); }

        if (updates.length === 0) {
            return sendError(res, 'No fields to update', 400);
        }

        values.push(req.params.id);
        await pool.execute(`UPDATE doctors SET ${updates.join(', ')} WHERE id = ?`, values);

        sendSuccess(res, null, 'Doctor updated successfully');
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error updating doctor', 500);
    }
};

exports.getDoctorSchedule = async (req, res) => {
    try {
        const [schedules] = await pool.execute(
            'SELECT * FROM schedules WHERE doctor_id = ? ORDER BY day_of_week',
            [req.params.id]
        );

        sendSuccess(res, { schedules });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching schedule', 500);
    }
};

exports.updateSchedule = async (req, res) => {
    try {
        const { schedules } = req.body;

        if (!Array.isArray(schedules)) {
            return sendError(res, 'Schedules must be an array', 400);
        }

        // Delete existing schedules
        await pool.execute('DELETE FROM schedules WHERE doctor_id = ?', [req.params.id]);

        // Insert new schedules
        for (const schedule of schedules) {
            await pool.execute(
                `INSERT INTO schedules (doctor_id, doctor_name, day_of_week, start_time, end_time, is_active, max_patients, break_start_time, break_end_time, notes) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    req.params.id,
                    schedule.doctorName,
                    schedule.dayOfWeek,
                    schedule.startTime,
                    schedule.endTime,
                    schedule.isActive !== false,
                    schedule.maxPatients || 20,
                    schedule.breakStartTime,
                    schedule.breakEndTime,
                    schedule.notes
                ]
            );
        }

        sendSuccess(res, null, 'Schedule updated successfully');
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error updating schedule', 500);
    }
};