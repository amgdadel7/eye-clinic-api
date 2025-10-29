const express = require('express');
const router = express.Router();
const mobileAuthController = require('../controllers/mobileAuthController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.post('/register', mobileAuthController.registerPatient);
router.post('/login', mobileAuthController.loginPatient);

// Protected routes
router.get('/profile', authenticateToken, mobileAuthController.getProfile);

module.exports = router;
