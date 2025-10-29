const express = require('express');
const router = express.Router();
const mobilePrescriptionController = require('../controllers/mobilePrescriptionController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.get('/my-prescriptions', mobilePrescriptionController.getMyPrescriptions);

module.exports = router;
