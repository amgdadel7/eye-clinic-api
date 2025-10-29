const express = require('express');
const router = express.Router();
const testResultController = require('../controllers/testResultController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.get('/', testResultController.getAllTestResults);
router.get('/patient/:patientId', testResultController.getPatientTestResults);
router.get('/:id', testResultController.getTestResultById);
router.post('/', testResultController.createTestResult);

module.exports = router;
