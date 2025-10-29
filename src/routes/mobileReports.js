const express = require('express');
const router = express.Router();
const mobileReportController = require('../controllers/mobileReportController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.get('/my-reports', mobileReportController.getMyReports);

module.exports = router;
