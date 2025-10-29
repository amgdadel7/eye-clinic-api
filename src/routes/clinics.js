const express = require('express');
const router = express.Router();
const clinicController = require('../controllers/clinicController');
const { authenticateToken, authorize } = require('../middleware/auth');

// Public routes (for mobile app)
router.get('/', clinicController.getAllClinics);
router.get('/:id', clinicController.getClinicById);
router.get('/:id/doctors', clinicController.getClinicDoctors);
router.get('/:id/services', clinicController.getClinicServices);

// Protected routes (admin only)
router.put('/:id', authenticateToken, authorize('admin'), clinicController.updateClinic);

module.exports = router;
