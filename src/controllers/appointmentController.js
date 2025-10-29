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
        const { patientId, patientName, doctorId, doctorName, clinicId, date, time, type, phone, notes, status } = req.body;

        // Require only identifiers; date/time can be auto-assigned
        if (!patientId || !doctorId || !clinicId) {
            return sendError(res, 'Required fields: patientId, doctorId, clinicId', 400);
        }

        // Enforce type from request
        if (typeof type !== 'string' || type.trim().length === 0) {
            return sendError(res, 'Required field: type', 400);
        }
        const finalType = type.trim();

        // Get patient name/phone if not provided
        let finalPatientName = patientName;
        let patientPhoneFromDb = null;
        if (!finalPatientName || !phone) {
            try {
                const [patients] = await pool.execute(
                    'SELECT name, phone FROM patients WHERE id = ?',
                    [patientId]
                );
                if (patients.length > 0) {
                    finalPatientName = finalPatientName || patients[0].name;
                    patientPhoneFromDb = patients[0].phone || null;
                }
            } catch (error) {
                // ignore and fallback
            }
        }

        // Compose final phone (prefer request, else patient's phone from DB)
        const finalPhone = (typeof phone === 'string' && phone.trim().length > 0) ? phone.trim() : patientPhoneFromDb;
        if (!finalPhone) {
            return sendError(res, 'Patient phone is required (provide in request or ensure patient has phone)', 400);
        }

        // Get doctor name if not provided
        let finalDoctorName = doctorName;
        if (!finalDoctorName) {
            try {
                const [doctors] = await pool.execute(
                    'SELECT name FROM doctors WHERE id = ?',
                    [doctorId]
                );
                finalDoctorName = doctors.length > 0 ? doctors[0].name : `Doctor ${doctorId}`;
            } catch (error) {
                finalDoctorName = `Doctor ${doctorId}`;
            }
        }

        let assignedDate = date;
        let assignedTime = time;

        // Auto-assign if date and/or time missing
        if (!assignedDate && !assignedTime) {
            const fromDate = new Date().toISOString().split('T')[0];
            const next = await findNextAvailableSlot(doctorId, clinicId, fromDate, 30);
            if (!next) {
                return sendError(res, 'No available slots in the next 30 days', 400);
            }
            assignedDate = next.date;
            assignedTime = next.time;
        } else if (assignedDate && !assignedTime) {
            const availableSlots = await getAvailableSlots(doctorId, clinicId, assignedDate);
            if (availableSlots.length === 0) {
                return sendError(res, 'No available slots for this date. Please try another date.', 400);
            }
            assignedTime = availableSlots[0];
        } else if (!assignedDate && assignedTime) {
            const fromDate = new Date().toISOString().split('T')[0];
            const next = await findNextAvailableSlot(doctorId, clinicId, fromDate, 30);
            if (!next) {
                return sendError(res, 'No available slots in the next 30 days', 400);
            }
            assignedDate = next.date;
            assignedTime = next.time;
        }

        // Check if slot is available
        const [existing] = await pool.execute(
            'SELECT id FROM appointments WHERE doctor_id = ? AND date = ? AND time = ? AND status != "cancelled"',
            [doctorId, assignedDate, assignedTime]
        );

        if (existing.length > 0) {
            return sendError(res, 'This time slot is already booked', 400);
        }

        // Normalize status to match DB enum: ('confirmed','pending','completed','cancelled')
        const allowedStatuses = new Set(['confirmed', 'pending', 'completed', 'cancelled']);
        let finalStatus = 'pending';
        if (status) {
            const s = String(status).toLowerCase();
            if (s === 'scheduled') finalStatus = 'pending';
            else if (s === 'no-show' || s === 'noshow') finalStatus = 'cancelled';
            else if (allowedStatuses.has(s)) finalStatus = s;
        }
        
        // Debug: Log status values
        console.log('Status debug:', {
            originalStatus: status,
            finalStatus: finalStatus,
            statusLength: finalStatus ? finalStatus.length : 0,
            statusType: typeof finalStatus
        });

        // Prepare parameters and ensure no undefined values
        const params = [
            patientId, 
            finalPatientName, 
            doctorId, 
            finalDoctorName, 
            clinicId, 
            assignedDate, 
            assignedTime, 
            finalType, 
            finalStatus, 
            finalPhone, 
            notes || null
        ];
        
        // Debug: Log parameters to identify undefined values
        console.log('Appointment parameters:', {
            patientId, finalPatientName, doctorId, finalDoctorName, clinicId,
            assignedDate, assignedTime, type: finalType, finalStatus, phone: finalPhone, notes
        });
        console.log('SQL params:', params);
        console.log('Status in params:', params[8], 'Length:', params[8] ? params[8].length : 0);

        // Check for undefined values
        const undefinedIndex = params.findIndex(param => param === undefined);
        if (undefinedIndex !== -1) {
            return sendError(res, `Parameter at index ${undefinedIndex} is undefined`, 400);
        }

        const [result] = await pool.execute(
            `INSERT INTO appointments (patient_id, patient_name, doctor_id, doctor_name, clinic_id, date, time, type, status, phone, notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
            params
        );

        // Map back to readable status for response (same values as DB enum)
        sendSuccess(res, { 
            appointmentId: result.insertId,
            assignedDate,
            assignedTime,
            status: finalStatus,
            type: finalType,
            phone: finalPhone,
            notes: notes || null,
            message: `Appointment created successfully at ${assignedDate} ${assignedTime}`
        }, 'Appointment created successfully', 201);
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

// Get available time slots for a doctor/clinic on a specific date
exports.getAvailableSlots = async (req, res) => {
    try {
        const { doctorId, clinicId, date } = req.query;
        
        if (!doctorId || !clinicId || !date) {
            return sendError(res, 'Required fields: doctorId, clinicId, date', 400);
        }

        const availableSlots = await getAvailableSlots(doctorId, clinicId, date);
        sendSuccess(res, { availableSlots, date, doctorId, clinicId });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching available slots', 500);
    }
};

// Suggest best appointment time based on doctor's schedule
exports.suggestAppointmentTime = async (req, res) => {
    try {
        const { doctorId, clinicId, preferredDate, preferredTime } = req.body;
        
        if (!doctorId || !clinicId) {
            return sendError(res, 'Required fields: doctorId, clinicId', 400);
        }

        const date = preferredDate || new Date().toISOString().split('T')[0];
        const availableSlots = await getAvailableSlots(doctorId, clinicId, date);
        
        if (availableSlots.length === 0) {
            // Try next 7 days
            for (let i = 1; i <= 7; i++) {
                const nextDate = new Date(date);
                nextDate.setDate(nextDate.getDate() + i);
                const nextDateStr = nextDate.toISOString().split('T')[0];
                const nextSlots = await getAvailableSlots(doctorId, clinicId, nextDateStr);
                if (nextSlots.length > 0) {
                    return sendSuccess(res, { 
                        suggestedDate: nextDateStr,
                        availableSlots: nextSlots,
                        message: `No slots available on ${date}. Next available: ${nextDateStr}`
                    });
                }
            }
            return sendError(res, 'No available slots in the next 7 days', 400);
        }

        // If preferred time provided, find closest match
        let suggestedTime = availableSlots[0];
        if (preferredTime) {
            const closest = availableSlots.find(slot => slot >= preferredTime) || 
                          availableSlots[availableSlots.length - 1];
            suggestedTime = closest;
        }

        sendSuccess(res, { 
            suggestedDate: date,
            suggestedTime,
            availableSlots,
            message: 'Appointment time suggested successfully'
        });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error suggesting appointment time', 500);
    }
};

// Helper function to get available time slots
async function getAvailableSlots(doctorId, clinicId, date) {
    // Get doctor's working hours (assuming 9 AM to 5 PM with 30-min slots)
    const workingHours = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
                         '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', 
                         '15:00', '15:30', '16:00', '16:30', '17:00'];
    
    // Get booked appointments for this doctor and date
    const [booked] = await pool.execute(
        'SELECT time FROM appointments WHERE doctor_id = ? AND clinic_id = ? AND date = ? AND status != "cancelled"',
        [doctorId, clinicId, date]
    );
    
    const bookedTimes = booked.map(app => app.time);
    
    // Filter out booked times
    const availableSlots = workingHours.filter(time => !bookedTimes.includes(time));
    
    return availableSlots;
}

// Find next available date/time window scanning ahead up to N days
async function findNextAvailableSlot(doctorId, clinicId, startDate, daysAhead = 30) {
    const start = new Date(startDate);
    for (let i = 0; i <= daysAhead; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const slots = await getAvailableSlots(doctorId, clinicId, dateStr);
        if (slots.length > 0) {
            return { date: dateStr, time: slots[0] };
        }
    }
    return null;
}
