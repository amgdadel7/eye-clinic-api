const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authenticateToken, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.get('/', doctorController.getAllDoctors);
router.get('/:id', doctorController.getDoctorById);
router.post('/', authorize('admin'), doctorController.createDoctor);
router.put('/:id', doctorController.updateDoctor);
router.get('/:id/schedule', doctorController.getDoctorSchedule);
router.put('/:id/schedule', doctorController.updateSchedule);

module.exports = router;
