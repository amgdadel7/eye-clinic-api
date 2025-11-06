const pool = require('../config/database');
const { sendSuccess } = require('../utils/response');

// Simple role-based sidebar config
exports.getSidebar = async (req, res) => {
    const role = req.user?.role || 'user';

    const baseItems = [
        { label: 'التقارير الطبية', path: '/reports/medical', icon: 'fa-file-medical' },
        { label: 'الروشتات', path: '/prescriptions', icon: 'fa-prescription' },
        { label: 'غرفة الانتظار', path: '/waiting-room', icon: 'fa-hourglass-half' },
        {
            label: 'التقارير والتحليلات', icon: 'fa-chart-bar', children: [
                { label: 'تحليلات متقدمة', path: '/reports/analytics', icon: 'fa-chart-line' },
                { label: 'تقارير يومية', path: '/reports/daily', icon: 'fa-calendar-day' },
                { label: 'تقارير شهرية', path: '/reports/monthly', icon: 'fa-calendar-alt' }
            ]
        },
        { label: 'الإشعارات', path: '/notifications', icon: 'fa-bell' },
        { label: 'الإعدادات', path: '/settings', icon: 'fa-cog' }
    ];

    // Example: extra items for admin
    const adminItems = [
        { label: 'إدارة المستخدمين', path: '/settings/users', icon: 'fa-users-cog' }
    ];

    const items = role === 'admin' ? [...baseItems, ...adminItems] : baseItems;
    return sendSuccess(res, { items });
};

exports.getHeaderProfile = async (req, res) => {
    try {
        const user = req.user || {};
        const clinicId = user.clinicId;
        
        let clinic = null;
        if (clinicId) {
            try {
                const [clinics] = await pool.execute(
                    'SELECT id, name, name_en, description, description_en FROM clinics WHERE id = ?',
                    [clinicId]
                );
                if (clinics.length > 0) {
                    clinic = clinics[0];
                }
            } catch (error) {
                console.error('Error fetching clinic:', error);
            }
        }
        
        // Get user's email from database
        let userEmail = user.email || null;
        if (user.id && !userEmail) {
            try {
                const [users] = await pool.execute(
                    'SELECT email FROM users WHERE id = ?',
                    [user.id]
                );
                if (users.length > 0) {
                    userEmail = users[0].email;
                }
            } catch (error) {
                console.error('Error fetching user email:', error);
            }
        }
        
        // Get user's full name
        let userName = user.name || user.username || 'مستخدم';
        if (user.id) {
            try {
                const [users] = await pool.execute(
                    'SELECT name, username FROM users WHERE id = ?',
                    [user.id]
                );
                if (users.length > 0) {
                    userName = users[0].name || users[0].username || userName;
                }
            } catch (error) {
                console.error('Error fetching user name:', error);
            }
        }
        
        // Get role display name
        const roleDisplayNames = {
            'admin': 'مدير العيادة',
            'doctor': 'طبيب',
            'receptionist': 'موظف استقبال',
            'user': 'مستخدم'
        };
        
        const roleDisplayName = roleDisplayNames[user.role] || user.role || 'مستخدم';
        
        // Get first letter for avatar
        const firstLetter = userName ? userName.charAt(0).toUpperCase() : 'A';
        
        return sendSuccess(res, {
            user: {
                name: userName,
                role: user.role || 'user',
                roleDisplayName: roleDisplayName,
                email: userEmail || 'admin@clinic.com',
                avatar: user.avatar || null,
                firstLetter: firstLetter,
                isOnline: true // You can make this dynamic based on user activity
            },
            clinic: clinic ? {
                id: clinic.id,
                name: clinic.name || 'عيادة العيون',
                nameEn: clinic.name_en || 'Eye Clinic',
                description: clinic.description || 'نظام إدارة ذكي',
                descriptionEn: clinic.description_en || 'Smart Management System'
            } : {
                name: 'عيادة العيون',
                nameEn: 'Eye Clinic',
                description: 'نظام إدارة ذكي',
                descriptionEn: 'Smart Management System'
            }
        });
    } catch (error) {
        console.error('Error in getHeaderProfile:', error);
        // Return default values on error
        return sendSuccess(res, {
            user: {
                name: req.user?.name || 'مستخدم',
                role: req.user?.role || 'user',
                roleDisplayName: 'مستخدم',
                email: req.user?.email || 'admin@clinic.com',
                avatar: null,
                firstLetter: (req.user?.name || 'A').charAt(0).toUpperCase(),
                isOnline: true
            },
            clinic: {
                name: 'عيادة العيون',
                nameEn: 'Eye Clinic',
                description: 'نظام إدارة ذكي',
                descriptionEn: 'Smart Management System'
            }
        });
    }
};


