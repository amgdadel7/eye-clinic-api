const express = require('express');
const router = express.Router();
const mobileAppointmentController = require('../controllers/mobileAppointmentController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.post('/book', mobileAppointmentController.bookAppointment);
router.get('/my-appointments', mobileAppointmentController.getMyAppointments);
router.get('/available-slots', mobileAppointmentController.getAvailableSlots);
router.put('/:id/cancel', mobileAppointmentController.cancelAppointment);

module.exports = router;
