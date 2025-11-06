const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const userSettingsController = require('../controllers/userSettingsController');

// All routes require authentication
router.use(authenticateToken);

router.get('/', userSettingsController.getUserSettings);
router.put('/', userSettingsController.updateUserSettings);
router.post('/', userSettingsController.updateUserSettings); // Allow POST for compatibility

module.exports = router;

