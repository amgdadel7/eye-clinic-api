const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const { authenticateToken, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.get('/', prescriptionController.getAllPrescriptions);
router.get('/patient/:patientId', prescriptionController.getPatientPrescriptions);
router.get('/:id', prescriptionController.getPrescriptionById);
router.post('/', authorize('doctor'), prescriptionController.createPrescription);

module.exports = router;
