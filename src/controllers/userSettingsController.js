const pool = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Get user settings
 */
exports.getUserSettings = async (req, res) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return sendError(res, 'User ID is required', 400);
        }

        const [settings] = await pool.execute(
            'SELECT * FROM user_settings WHERE user_id = ?',
            [userId]
        );

        if (settings.length === 0) {
            // Return default settings if not found
            const defaultSettings = {
                user_id: userId,
                language: 'ar',
                theme: 'light',
                sidebar_collapsed: false,
                sound_notifications: true,
                email_notifications: true,
                sms_notifications: false,
                push_notifications: true,
                appointment_reminders: true,
                new_appointment_alerts: true,
                system_alerts: true,
                reminder_time_minutes: 30
            };
            return sendSuccess(res, { settings: defaultSettings });
        }

        sendSuccess(res, { settings: settings[0] });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching user settings', 500);
    }
};

/**
 * Update or create user settings
 */
exports.updateUserSettings = async (req, res) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return sendError(res, 'User ID is required', 400);
        }

        const {
            language,
            theme,
            sidebar_collapsed,
            sound_notifications,
            email_notifications,
            sms_notifications,
            push_notifications,
            appointment_reminders,
            new_appointment_alerts,
            system_alerts,
            reminder_time_minutes
        } = req.body;

        // Check if settings exist
        const [existing] = await pool.execute(
            'SELECT id FROM user_settings WHERE user_id = ?',
            [userId]
        );

        if (existing.length > 0) {
            // Update existing settings
            await pool.execute(
                `UPDATE user_settings SET 
                    language = COALESCE(?, language),
                    theme = COALESCE(?, theme),
                    sidebar_collapsed = COALESCE(?, sidebar_collapsed),
                    sound_notifications = COALESCE(?, sound_notifications),
                    email_notifications = COALESCE(?, email_notifications),
                    sms_notifications = COALESCE(?, sms_notifications),
                    push_notifications = COALESCE(?, push_notifications),
                    appointment_reminders = COALESCE(?, appointment_reminders),
                    new_appointment_alerts = COALESCE(?, new_appointment_alerts),
                    system_alerts = COALESCE(?, system_alerts),
                    reminder_time_minutes = COALESCE(?, reminder_time_minutes),
                    updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = ?`,
                [
                    language,
                    theme,
                    sidebar_collapsed,
                    sound_notifications,
                    email_notifications,
                    sms_notifications,
                    push_notifications,
                    appointment_reminders,
                    new_appointment_alerts,
                    system_alerts,
                    reminder_time_minutes,
                    userId
                ]
            );
        } else {
            // Create new settings
            await pool.execute(
                `INSERT INTO user_settings (
                    user_id, language, theme, sidebar_collapsed,
                    sound_notifications, email_notifications, sms_notifications,
                    push_notifications, appointment_reminders, new_appointment_alerts,
                    system_alerts, reminder_time_minutes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    language || 'ar',
                    theme || 'light',
                    sidebar_collapsed !== undefined ? sidebar_collapsed : false,
                    sound_notifications !== undefined ? sound_notifications : true,
                    email_notifications !== undefined ? email_notifications : true,
                    sms_notifications !== undefined ? sms_notifications : false,
                    push_notifications !== undefined ? push_notifications : true,
                    appointment_reminders !== undefined ? appointment_reminders : true,
                    new_appointment_alerts !== undefined ? new_appointment_alerts : true,
                    system_alerts !== undefined ? system_alerts : true,
                    reminder_time_minutes || 30
                ]
            );
        }

        // Fetch updated settings
        const [updated] = await pool.execute(
            'SELECT * FROM user_settings WHERE user_id = ?',
            [userId]
        );

        sendSuccess(res, { settings: updated[0] }, 'Settings updated successfully');
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error updating user settings', 500);
    }
};

