const pool = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

exports.getWaitingList = async (req, res) => {
    try {
        const [waitingList] = await pool.execute(
            `SELECT wr.*, a.date, a.time, a.type 
             FROM waiting_room wr 
             JOIN appointments a ON wr.appointment_id = a.id 
             WHERE wr.status IN ('waiting', 'in-progress') 
             ORDER BY wr.arrival_time ASC`
        );

        sendSuccess(res, { waitingList });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching waiting list', 500);
    }
};

exports.checkIn = async (req, res) => {
    try {
        const { appointmentId, arrivalTime, priority } = req.body;

        if (!appointmentId) {
            return sendError(res, 'Appointment ID is required', 400);
        }

        // Get appointment details
        const [appointments] = await pool.execute(
            'SELECT * FROM appointments WHERE id = ?',
            [appointmentId]
        );

        if (appointments.length === 0) {
            return sendError(res, 'Appointment not found', 404);
        }

        const appointment = appointments[0];

        // Check if already checked in
        const [existing] = await pool.execute(
            'SELECT id FROM waiting_room WHERE appointment_id = ? AND status IN ("waiting", "in-progress")',
            [appointmentId]
        );

        if (existing.length > 0) {
            return sendError(res, 'Patient already checked in', 400);
        }

        // Insert into waiting room
        const [result] = await pool.execute(
            `INSERT INTO waiting_room (patient_id, patient_name, appointment_id, arrival_time, status, priority, doctor_name) 
             VALUES (?, ?, ?, ?, 'waiting', ?, ?)`,
            [
                appointment.patient_id,
                appointment.patient_name,
                appointmentId,
                arrivalTime || new Date().toISOString(),
                priority || 'normal',
                appointment.doctor_name
            ]
        );

        sendSuccess(res, { waitingRoomId: result.insertId }, 'Checked in successfully', 201);
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error checking in', 500);
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const waitingRoomId = req.params.id;

        const validStatuses = ['waiting', 'in-progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return sendError(res, 'Invalid status', 400);
        }

        await pool.execute(
            'UPDATE waiting_room SET status = ? WHERE id = ?',
            [status, waitingRoomId]
        );

        sendSuccess(res, null, 'Status updated successfully');
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error updating status', 500);
    }
};

exports.removeFromWaiting = async (req, res) => {
    try {
        const waitingRoomId = req.params.id;

        await pool.execute(
            'DELETE FROM waiting_room WHERE id = ?',
            [waitingRoomId]
        );

        sendSuccess(res, null, 'Removed from waiting room successfully');
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error removing from waiting room', 500);
    }
};