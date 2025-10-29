const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authenticateToken, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.get('/', patientController.getAllPatients);
router.get('/:id', patientController.getPatientById);
router.post('/', authorize('admin', 'receptionist'), patientController.createPatient);
router.put('/:id', patientController.updatePatient);
router.delete('/:id', authorize('admin'), patientController.deletePatient);

module.exports = router;
