const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.get('/', analyticsController.getAnalyticsOverview);
router.get('/dashboard', analyticsController.getDashboardStats);
router.get('/patients', analyticsController.getPatientStats);
router.get('/appointments', analyticsController.getAppointmentStats);
router.get('/revenue', authorize('admin'), analyticsController.getRevenueStats);

module.exports = router;
