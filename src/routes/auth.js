const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.post('/register-clinic', authController.registerClinic);
router.post('/register-user', authController.registerUser);
router.post('/login', authController.login);

// Protected routes
router.get('/me', authenticateToken, authController.getMe);
router.put('/update-profile', authenticateToken, authController.updateProfile);
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;
