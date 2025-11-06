const pool = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

exports.getWaitingList = async (req, res) => {
    try {
        if (req.user && req.user.clinicId) {
            const [waitingList] = await pool.execute(
                `SELECT wr.*, a.date, a.time, a.type 
                 FROM waiting_room wr 
                 JOIN appointments a ON wr.appointment_id = a.id 
                 WHERE wr.status IN ('waiting', 'in-progress', 'associated') 
                   AND wr.clinic_id = ?
                 ORDER BY wr.arrival_time ASC`,
                [req.user.clinicId]
            );
            return sendSuccess(res, { waitingList });
        }

        const [waitingList] = await pool.execute(
            `SELECT wr.*, a.date, a.time, a.type 
             FROM waiting_room wr 
             JOIN appointments a ON wr.appointment_id = a.id 
             WHERE wr.status IN ('waiting', 'in-progress', 'associated') 
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
        // Support both camelCase and snake_case formats
        const appointmentId = req.body.appointmentId || req.body.appointment_id;
        const arrivalTime = req.body.arrivalTime || req.body.arrival_time || req.body.check_in_time;
        const priority = req.body.priority;

        if (!appointmentId) {
            return sendError(res, 'Appointment ID is required', 400);
        }

        // Get appointment details
        const [appointments] = await pool.execute(
            'SELECT * FROM appointments WHERE id = ?',
            [appointmentId]
        );

        if (appointments.length === 0) {
            return sendError(res, `Appointment with ID ${appointmentId} not found`, 404);
        }

        const appointment = appointments[0];

        // Validate required appointment fields
        if (!appointment.patient_id) {
            return sendError(res, 'Appointment is missing patient_id', 400);
        }
        if (!appointment.doctor_id) {
            return sendError(res, 'Appointment is missing doctor_id', 400);
        }
        if (!appointment.clinic_id) {
            return sendError(res, 'Appointment is missing clinic_id', 400);
        }

        // Check if already checked in
        const [existing] = await pool.execute(
            'SELECT id FROM waiting_room WHERE appointment_id = ? AND status IN ("waiting", "in-progress")',
            [appointmentId]
        );

        if (existing.length > 0) {
            return sendError(res, 'Patient already checked in', 400);
        }

        // Validate appointment belongs to user's clinic (if clinic_id is set)
        if (req.user && req.user.clinicId && appointment.clinic_id !== req.user.clinicId) {
            return sendError(res, 'Appointment does not belong to your clinic', 403);
        }

        // Format arrival time - convert to MySQL datetime format (YYYY-MM-DD HH:MM:SS)
        let formattedArrivalTime = null;
        if (arrivalTime) {
            try {
                const dateObj = new Date(arrivalTime);
                if (!isNaN(dateObj.getTime())) {
                    // Convert to MySQL datetime format: YYYY-MM-DD HH:MM:SS
                    const year = dateObj.getFullYear();
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    const hours = String(dateObj.getHours()).padStart(2, '0');
                    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
                    const seconds = String(dateObj.getSeconds()).padStart(2, '0');
                    formattedArrivalTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
                } else {
                    throw new Error('Invalid date');
                }
            } catch (e) {
                console.warn('Invalid arrival time format, using current time:', e.message);
                formattedArrivalTime = null;
            }
        }
        
        // If no valid arrival time provided, use current time
        if (!formattedArrivalTime) {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            formattedArrivalTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }

        // Insert into waiting room with doctor_id and clinic_id
        const [result] = await pool.execute(
            `INSERT INTO waiting_room (patient_id, patient_name, appointment_id, doctor_id, clinic_id, arrival_time, status, priority, doctor_name) 
             VALUES (?, ?, ?, ?, ?, ?, 'waiting', ?, ?)`,
            [
                appointment.patient_id,
                appointment.patient_name,
                appointmentId,
                appointment.doctor_id,
                appointment.clinic_id,
                formattedArrivalTime,
                priority || 'normal',
                appointment.doctor_name
            ]
        );

        // Return the created waiting room entry
        const [newEntry] = await pool.execute(
            `SELECT wr.*, a.date, a.time, a.type 
             FROM waiting_room wr 
             JOIN appointments a ON wr.appointment_id = a.id 
             WHERE wr.id = ?`,
            [result.insertId]
        );

        sendSuccess(res, { 
            waitingRoomId: result.insertId,
            waitingRoom: newEntry[0] || null
        }, 'Checked in successfully', 201);
    } catch (error) {
        console.error('Error checking in patient:', error);
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