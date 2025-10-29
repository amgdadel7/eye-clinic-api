const pool = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

exports.getAllUsers = async (req, res) => {
    try {
        const clinicId = req.user.clinicId;

        const [users] = await pool.execute(
            `SELECT u.*, c.name as clinic_name FROM users u 
             JOIN clinics c ON u.clinic_id = c.id 
             WHERE u.clinic_id = ? 
             ORDER BY u.created_at DESC`,
            [clinicId]
        );

        sendSuccess(res, { users });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching users', 500);
    }
};

exports.getPendingUsers = async (req, res) => {
    try {
        const clinicId = req.user.clinicId;

        const [users] = await pool.execute(
            `SELECT u.* FROM users u 
             WHERE u.clinic_id = ? AND u.status = 'pending' 
             ORDER BY u.created_at DESC`,
            [clinicId]
        );

        sendSuccess(res, { users });
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching pending users', 500);
    }
};

exports.approveUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const clinicId = req.user.clinicId;

        // Verify user belongs to same clinic
        const [users] = await pool.execute(
            'SELECT id, clinic_id FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return sendError(res, 'User not found', 404);
        }

        if (users[0].clinic_id !== clinicId) {
            return sendError(res, 'You do not have permission to approve this user', 403);
        }

        await pool.execute(
            'UPDATE users SET status = "active" WHERE id = ?',
            [userId]
        );

        sendSuccess(res, null, 'User approved successfully');
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error approving user', 500);
    }
};

exports.rejectUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const clinicId = req.user.clinicId;

        // Verify user belongs to same clinic
        const [users] = await pool.execute(
            'SELECT id, clinic_id FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return sendError(res, 'User not found', 404);
        }

        if (users[0].clinic_id !== clinicId) {
            return sendError(res, 'You do not have permission to reject this user', 403);
        }

        await pool.execute(
            'UPDATE users SET status = "rejected" WHERE id = ?',
            [userId]
        );

        sendSuccess(res, null, 'User rejected successfully');
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error rejecting user', 500);
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { name, phone, department, specialty } = req.body;
        const userId = req.params.id;
        const updates = [];
        const values = [];

        if (name) { updates.push('name = ?'); values.push(name); }
        if (phone) { updates.push('phone = ?'); values.push(phone); }
        if (department) { updates.push('department = ?'); values.push(department); }
        if (specialty) { updates.push('specialty = ?'); values.push(specialty); }

        if (updates.length === 0) {
            return sendError(res, 'No fields to update', 400);
        }

        values.push(userId);
        await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

        sendSuccess(res, null, 'User updated successfully');
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error updating user', 500);
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        await pool.execute('UPDATE users SET status = "inactive" WHERE id = ?', [userId]);

        sendSuccess(res, null, 'User deleted successfully');
    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error deleting user', 500);
    }
};