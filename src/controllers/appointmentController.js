const pool = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

exports.getAllAppointments = async (req, res) => {
    try {
        const { status, date, doctorId } = req.query;
        let query = 'SELECT a.*, c.name as clinic_name FROM appointments a JOIN clinics c ON a.clinic_id = c.id WHERE 1=1';
        const params = [];

        if (req.user.clinicId) {
            query += ' AND a.clinic_id = ?';
            params.push(req.user.clinicId);
        }

        if (status) {
            query += ' AND a.status = ?';
            params.push(status);
        }

        if (date) {
            query += ' AND a.date = ?';
            params.push(date);
        }

        if (doctorId) {
            query += ' AND a.doctor_id = ?';
            params.push(doctorId);
        }

        query += ' ORDER BY a.date DESC, a.time DESC';

        const [appointments] = await pool.execute(query, params);
        sendSuccess(res, { appointments });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching appointments', 500);
    }
};

exports.getTodayAppointments = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const query = req.user.clinicId 
            ? 'SELECT * FROM appointments WHERE date = ? AND clinic_id = ?'
            : 'SELECT * FROM appointments WHERE date = ?';

        const params = req.user.clinicId ? [today, req.user.clinicId] : [today];
        const [appointments] = await pool.execute(query, params);

        sendSuccess(res, { appointments });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching today appointments', 500);
    }
};

exports.getDoctorAppointments = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = 'SELECT * FROM appointments WHERE doctor_id = ?';
        const params = [req.params.doctorId];

        if (startDate && endDate) {
            query += ' AND date BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        query += ' ORDER BY date, time';

        const [appointments] = await pool.execute(query, params);
        sendSuccess(res, { appointments });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching doctor appointments', 500);
    }
};

exports.getAppointmentById = async (req, res) => {
    try {
        const [appointments] = await pool.execute(
            'SELECT * FROM appointments WHERE id = ?',
            [req.params.id]
        );

        if (appointments.length === 0) {
            return sendError(res, 'Appointment not found', 404);
        }

        sendSuccess(res, { appointment: appointments[0] });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching appointment', 500);
    }
};

exports.createAppointment = async (req, res) => {
    try {
        const { patientId, patientName, doctorId, doctorName, clinicId, date, time, type, phone, notes } = req.body;

        if (!patientId || !doctorId || !clinicId || !date || !time) {
            return sendError(res, 'Required fields: patientId, doctorId, clinicId, date, time', 400);
        }

        // Check if slot is available
        const [existing] = await pool.execute(
            'SELECT id FROM appointments WHERE doctor_id = ? AND date = ? AND time = ? AND status != "cancelled"',
            [doctorId, date, time]
        );

        if (existing.length > 0) {
            return sendError(res, 'This time slot is already booked', 400);
        }

        const [result] = await pool.execute(
            `INSERT INTO appointments (patient_id, patient_name, doctor_id, doctor_name, clinic_id, date, time, type, status, phone, notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)`,
            [patientId, patientName, doctorId, doctorName, clinicId, date, time, type, phone, notes]
        );

        sendSuccess(res, { appointmentId: result.insertId }, 'Appointment created successfully', 201);
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error creating appointment', 500);
    }
};

exports.updateAppointment = async (req, res) => {
    try {
        const { date, time, type, status, notes } = req.body;
        const updates = [];
        const values = [];

        if (date) { updates.push('date = ?'); values.push(date); }
        if (time) { updates.push('time = ?'); values.push(time); }
        if (type) { updates.push('type = ?'); values.push(type); }
        if (status) { updates.push('status = ?'); values.push(status); }
        if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }

        if (updates.length === 0) {
            return sendError(res, 'No fields to update', 400);
        }

        values.push(req.params.id);
        await pool.execute(`UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`, values);

        sendSuccess(res, null, 'Appointment updated successfully');
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error updating appointment', 500);
    }
};

exports.deleteAppointment = async (req, res) => {
    try {
        await pool.execute('UPDATE appointments SET status = "cancelled" WHERE id = ?', [req.params.id]);
        sendSuccess(res, null, 'Appointment deleted successfully');
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error deleting appointment', 500);
    }
};