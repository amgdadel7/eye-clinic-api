const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { generateToken } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/response');

// Register clinic with owner
exports.registerClinic = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const { 
                clinicName, clinicNameEn, clinicLicense, clinicPhone, clinicEmail, 
                clinicAddress, clinicAddressEn, clinicSpecialty, clinicWebsite,
                ownerName, ownerEmail, ownerPhone, ownerPassword, workingHours, services 
            } = req.body;

            // Validate required fields
            if (!clinicName || !clinicLicense || !clinicPhone || !clinicEmail || 
                !ownerName || !ownerEmail || !ownerPhone || !ownerPassword) {
                return sendError(res, 'All required fields must be filled', 400);
            }

            // Check if email already exists
            const [existingUser] = await connection.execute(
                'SELECT id FROM users WHERE email = ?',
                [ownerEmail]
            );
            if (existingUser.length > 0) {
                return sendError(res, 'Email already exists', 400);
            }

            // Generate clinic code
            const clinicCode = generateClinicCode();

            // Insert clinic
            const [clinicResult] = await connection.execute(
                `INSERT INTO clinics (name, name_en, code, license, phone, email, address, 
                 address_en, specialty, website, working_hours, services, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
                [clinicName, clinicNameEn || clinicName, clinicCode, clinicLicense, 
                 clinicPhone, clinicEmail, clinicAddress || null, clinicAddressEn || null, clinicSpecialty || null,
                 clinicWebsite || null, workingHours ? JSON.stringify(workingHours) : null, services ? JSON.stringify(services) : null]
            );

            const clinicId = clinicResult.insertId;

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(ownerPassword, salt);

            // Get first letter for avatar
            const avatar = ownerName.charAt(0);

            // Insert owner user
            const [userResult] = await connection.execute(
                `INSERT INTO users (name, email, phone, password, role, clinic_id, 
                 avatar, status) VALUES (?, ?, ?, ?, 'admin', ?, ?, 'active')`,
                [ownerName, ownerEmail, ownerPhone, hashedPassword, clinicId, avatar]
            );

            // Update clinic owner_id
            await connection.execute(
                'UPDATE clinics SET owner_id = ? WHERE id = ?',
                [userResult.insertId, clinicId]
            );

            await connection.commit();

            // Generate token
            const token = generateToken({
                id: userResult.insertId,
                email: ownerEmail,
                role: 'admin',
                clinicId: clinicId
            });

            sendSuccess(res, {
                token,
                user: {
                    id: userResult.insertId,
                    name: ownerName,
                    email: ownerEmail,
                    role: 'admin',
                    clinicId: clinicId
                },
                clinic: {
                    id: clinicId,
                    name: clinicName,
                    code: clinicCode
                }
            }, 'Clinic and owner account created successfully', 201);

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error creating clinic', 500);
    }
};

// Register user (doctor/receptionist)
exports.registerUser = async (req, res) => {
    try {
        const { name, email, phone, password, role, clinicCode } = req.body;

        // Validate
        if (!name || !email || !phone || !password || !role || !clinicCode) {
            return sendError(res, 'All fields are required', 400);
        }

        if (!['doctor', 'receptionist'].includes(role)) {
            return sendError(res, 'Invalid role', 400);
        }

        const connection = await pool.getConnection();

        // Find clinic by code
        const [clinics] = await connection.execute(
            'SELECT id FROM clinics WHERE code = ?',
            [clinicCode]
        );

        if (clinics.length === 0) {
            connection.release();
            return sendError(res, 'Invalid clinic code', 400);
        }

        const clinicId = clinics[0].id;

        // Check if email exists
        const [existingUsers] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            connection.release();
            return sendError(res, 'Email already exists', 400);
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const avatar = name.charAt(0);

        // Insert user
        const [result] = await connection.execute(
            `INSERT INTO users (name, email, phone, password, role, clinic_id, avatar, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [name, email, phone, hashedPassword, role, clinicId, avatar]
        );

        connection.release();

        sendSuccess(res, {
            userId: result.insertId,
            message: 'Registration successful. Please wait for admin approval.'
        }, 'Registration successful', 201);

    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error registering user', 500);
    }
};

// Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return sendError(res, 'Email and password are required', 400);
        }

        const [users] = await pool.execute(
            `SELECT u.*, c.name as clinic_name, c.code as clinic_code 
             FROM users u 
             JOIN clinics c ON u.clinic_id = c.id 
             WHERE u.email = ?`,
            [email]
        );

        if (users.length === 0) {
            return sendError(res, 'Invalid credentials', 401);
        }

        const user = users[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return sendError(res, 'Invalid credentials', 401);
        }

        // Check status
        if (user.status === 'pending') {
            return sendError(res, 'Your account is pending approval', 403);
        }

        if (user.status === 'rejected') {
            return sendError(res, 'Your account has been rejected', 403);
        }

        // Update last login
        await pool.execute(
            'UPDATE users SET last_login = NOW() WHERE id = ?',
            [user.id]
        );

        // Generate token
        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
            clinicId: user.clinic_id
        });

        sendSuccess(res, {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                clinicId: user.clinic_id,
                avatar: user.avatar
            },
            clinic: {
                id: user.clinic_id,
                name: user.clinic_name,
                code: user.clinic_code
            }
        }, 'Login successful');

    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error logging in', 500);
    }
};

// Get current user
exports.getMe = async (req, res) => {
    try {
        const [users] = await pool.execute(
            `SELECT u.*, c.name as clinic_name, c.code as clinic_code 
             FROM users u 
             JOIN clinics c ON u.clinic_id = c.id 
             WHERE u.id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return sendError(res, 'User not found', 404);
        }

        const user = users[0];

        sendSuccess(res, {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                clinicId: user.clinic_id,
                avatar: user.avatar,
                department: user.department,
                specialty: user.specialty
            },
            clinic: {
                id: user.clinic_id,
                name: user.clinic_name,
                code: user.clinic_code
            }
        });

    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error fetching user', 500);
    }
};

// Update profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, department, specialty } = req.body;
        const userId = req.user.id;

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

        await pool.execute(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        sendSuccess(res, null, 'Profile updated successfully');

    } catch (error) {
        console.error(error);
        sendError(res, error.message || 'Error updating profile', 500);
    }
};

// Logout
exports.logout = (req, res) => {
    sendSuccess(res, null, 'Logged out successfully');
};

// Helper function
function generateClinicCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
