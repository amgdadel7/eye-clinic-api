const express = require('express');
const router = express.Router();
const colorTestController = require('../controllers/colorTestController');
const { authenticateToken, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.get('/', colorTestController.getAllTests);
router.get('/:id', colorTestController.getTestById);
router.post('/', authorize('admin', 'doctor'), colorTestController.createTest);
router.put('/:id', authorize('admin', 'doctor'), colorTestController.updateTest);
router.delete('/:id', authorize('admin'), colorTestController.deleteTest);

module.exports = router;
