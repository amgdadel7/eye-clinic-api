const pool = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

// Book appointment automatically (finds first available slot)
exports.bookAppointment = async (req, res) => {
    try {
        const patientId = req.user.id;
        const { clinicId, doctorId, appointmentType } = req.body;

        if (!clinicId || !doctorId) {
            return sendError(res, 'Clinic ID and Doctor ID are required', 400);
        }

        // Get patient info
        const [patients] = await pool.execute('SELECT * FROM patients WHERE id = ?', [patientId]);
        if (patients.length === 0) {
            return sendError(res, 'Patient not found', 404);
        }
        const patient = patients[0];

        // Get doctor info
        const [doctors] = await pool.execute(
            'SELECT d.*, u.name as doctor_name FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = ?',
            [doctorId]
        );
        if (doctors.length === 0) {
            return sendError(res, 'Doctor not found', 404);
        }
        const doctor = doctors[0];

        // Get doctor's schedule
        const [schedules] = await pool.execute(
            'SELECT * FROM schedules WHERE doctor_id = ? AND is_active = TRUE',
            [doctorId]
        );

        if (schedules.length === 0) {
            return sendError(res, 'Doctor has no available schedule', 400);
        }

        const { preferredDate, preferredTime } = req.body;

        // Optional: respect preferred slot if provided and available
        let appointmentDate = null;
        let appointmentTime = null;

        if (preferredDate && preferredTime) {
            const preferred = new Date(preferredDate);
            const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][preferred.getDay()];
            const daySchedule = schedules.find(s => s.day_of_week === dayOfWeek);

            if (daySchedule) {
                const [startHour, startMin] = daySchedule.start_time.split(':').map(Number);
                const [endHour, endMin] = daySchedule.end_time.split(':').map(Number);
                const [slotHour, slotMin] = preferredTime.split(':').map(Number);

                const slotMinutes = slotHour * 60 + slotMin;
                const startMinutes = startHour * 60 + startMin;
                const endMinutes = endHour * 60 + endMin;

                let withinBreak = false;
                if (daySchedule.break_start_time && daySchedule.break_end_time) {
                    const [breakStartHour, breakStartMin] = daySchedule.break_start_time.split(':').map(Number);
                    const [breakEndHour, breakEndMin] = daySchedule.break_end_time.split(':').map(Number);
                    const breakStartMinutes = breakStartHour * 60 + breakStartMin;
                    const breakEndMinutes = breakEndHour * 60 + breakEndMin;
                    withinBreak = slotMinutes >= breakStartMinutes && slotMinutes < breakEndMinutes;
                }

                if (slotMinutes >= startMinutes && slotMinutes < endMinutes && !withinBreak) {
                    const slotDate = preferred.toISOString().split('T')[0];
                    const [existingPreferred] = await pool.execute(
                        'SELECT id FROM appointments WHERE doctor_id = ? AND date = ? AND time = ? AND status != \"cancelled\"',
                        [doctorId, slotDate, preferredTime]
                    );

                    if (existingPreferred.length === 0) {
                        appointmentDate = slotDate;
                        appointmentTime = preferredTime;
                    }
                }
            }
        }

        // Find first available appointment slot if preferred slot unavailable
        if (!appointmentDate || !appointmentTime) {
            // Start from tomorrow
            const today = new Date();
            today.setDate(today.getDate() + 1);
            today.setHours(0, 0, 0, 0);

            // Check up to 30 days ahead
            for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
                const checkDate = new Date(today);
                checkDate.setDate(today.getDate() + dayOffset);
                
                const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][checkDate.getDay()];
                
                const daySchedule = schedules.find(s => s.day_of_week === dayOfWeek);
                
                if (!daySchedule) continue;

                const [startHour, startMin] = daySchedule.start_time.split(':').map(Number);
                const [endHour, endMin] = daySchedule.end_time.split(':').map(Number);
                
                let breakStart = null, breakEnd = null;
                if (daySchedule.break_start_time && daySchedule.break_end_time) {
                    breakStart = daySchedule.break_start_time.split(':').map(Number);
                    breakEnd = daySchedule.break_end_time.split(':').map(Number);
                }

                for (let hour = startHour; hour < endHour; hour++) {
                    for (let min = 0; min < 60; min += 30) {
                        if (breakStart && breakEnd) {
                            const currentTime = hour * 60 + min;
                            const breakStartTime = breakStart[0] * 60 + breakStart[1];
                            const breakEndTime = breakEnd[0] * 60 + breakEnd[1];
                            if (currentTime >= breakStartTime && currentTime < breakEndTime) {
                                continue;
                            }
                        }

                        const slotTime = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
                        const slotDate = checkDate.toISOString().split('T')[0];

                        const [existing] = await pool.execute(
                            'SELECT id FROM appointments WHERE doctor_id = ? AND date = ? AND time = ? AND status != \"cancelled\"',
                            [doctorId, slotDate, slotTime]
                        );

                        if (existing.length === 0) {
                            appointmentDate = slotDate;
                            appointmentTime = slotTime;
                            break;
                        }
                    }
                    if (appointmentDate) break;
                }
                if (appointmentDate) break;
            }
        }

        if (!appointmentDate) {
            return sendError(res, 'No available appointments for this doctor in the next 30 days', 400);
        }

        // Create appointment
        const [result] = await pool.execute(
            `INSERT INTO appointments (patient_id, patient_name, doctor_id, doctor_name, clinic_id, 
             date, time, type, status, phone, avatar) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)`,
            [
                patientId,
                patient.name,
                doctorId,
                doctor.doctor_name,
                clinicId,
                appointmentDate,
                appointmentTime,
                appointmentType || 'consultation',
                patient.phone,
                patient.avatar
            ]
        );

        sendSuccess(res, {
            appointment: {
                id: result.insertId,
                patientId,
                doctorId,
                clinicId,
                date: appointmentDate,
                time: appointmentTime,
                type: appointmentType || 'consultation',
                status: 'confirmed'
            }
        }, 'Appointment booked successfully', 201);

    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error booking appointment', 500);
    }
};

// Get patient's appointments
exports.getMyAppointments = async (req, res) => {
    try {
        const patientId = req.user.id;

        const [appointments] = await pool.execute(
            `SELECT a.*, c.name as clinic_name FROM appointments a 
             JOIN clinics c ON a.clinic_id = c.id 
             WHERE a.patient_id = ? 
             ORDER BY a.date DESC, a.time DESC`,
            [patientId]
        );

        sendSuccess(res, { appointments });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching appointments', 500);
    }
};

// Get available time slots for a specific date
exports.getAvailableSlots = async (req, res) => {
    try {
        const { doctorId, date } = req.query;

        if (!doctorId || !date) {
            return sendError(res, 'Doctor ID and date are required', 400);
        }

        // Get doctor's schedule for this day
        const targetDate = new Date(date);
        const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][targetDate.getDay()];

        const [schedules] = await pool.execute(
            'SELECT * FROM schedules WHERE doctor_id = ? AND day_of_week = ? AND is_active = TRUE',
            [doctorId, dayOfWeek]
        );

        if (schedules.length === 0) {
            return sendSuccess(res, { slots: [] });
        }

        const schedule = schedules[0];
        const [startHour, startMin] = schedule.start_time.split(':').map(Number);
        const [endHour, endMin] = schedule.end_time.split(':').map(Number);

        // Get existing appointments for this date
        const [appointments] = await pool.execute(
            'SELECT time FROM appointments WHERE doctor_id = ? AND date = ? AND status != "cancelled"',
            [doctorId, date]
        );
        const bookedTimes = new Set(appointments.map(a => a.time));

        // Generate 30-minute slots
        const slots = [];
        for (let hour = startHour; hour < endHour; hour++) {
            for (let min = 0; min < 60; min += 30) {
                const slotTime = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
                slots.push({
                    time: slotTime,
                    available: !bookedTimes.has(slotTime)
                });
            }
        }

        sendSuccess(res, { slots });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching available slots', 500);
    }
};

// Cancel appointment
exports.cancelAppointment = async (req, res) => {
    try {
        const appointmentId = req.params.id;
        const patientId = req.user.id;

        // Verify ownership
        const [appointments] = await pool.execute(
            'SELECT id FROM appointments WHERE id = ? AND patient_id = ?',
            [appointmentId, patientId]
        );

        if (appointments.length === 0) {
            return sendError(res, 'Appointment not found or unauthorized', 404);
        }

        await pool.execute(
            'UPDATE appointments SET status = "cancelled" WHERE id = ?',
            [appointmentId]
        );

        sendSuccess(res, null, 'Appointment cancelled successfully');
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error cancelling appointment', 500);
    }
};