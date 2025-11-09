const express = require('express');
const router = express.Router();
const medicalReportController = require('../controllers/medicalReportController');
const { authenticateToken, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.get('/', medicalReportController.getAllReports);
router.get('/patient/:patientId', medicalReportController.getPatientReports);
router.get('/:id', medicalReportController.getReportById);
router.post('/', authorize('doctor', 'admin'), medicalReportController.createReport);
router.put('/:id', authorize('doctor', 'admin'), medicalReportController.updateReport);
router.delete('/:id', authorize('doctor', 'admin'), medicalReportController.deleteReport);

module.exports = router;
