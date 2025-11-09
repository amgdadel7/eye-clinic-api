const express = require('express');
const router = express.Router();
const testResultController = require('../controllers/testResultController');
const { authenticateToken, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.get('/', testResultController.getAllTestResults);
router.get('/patient/:patientId', testResultController.getPatientTestResults);
router.get('/:id', testResultController.getTestResultById);
router.post('/', authorize('doctor', 'admin'), testResultController.createTestResult);
router.put('/:id', authorize('doctor', 'admin'), testResultController.updateTestResult);
router.delete('/:id', authorize('doctor', 'admin'), testResultController.deleteTestResult);

module.exports = router;
