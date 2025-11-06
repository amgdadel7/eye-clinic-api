const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

// All report routes require authentication
router.use(authenticateToken);

// Daily and monthly reports
router.get('/daily', analyticsController.getDailyReport);
router.get('/monthly', analyticsController.getMonthlyReport);

module.exports = router;



