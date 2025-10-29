const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.get('/', authorize('admin'), userController.getAllUsers);
router.get('/pending', authorize('admin'), userController.getPendingUsers);
router.put('/:id/approve', authorize('admin'), userController.approveUser);
router.put('/:id/reject', authorize('admin'), userController.rejectUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', authorize('admin'), userController.deleteUser);

module.exports = router;
