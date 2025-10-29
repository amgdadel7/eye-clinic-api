const express = require('express');
const router = express.Router();
const waitingRoomController = require('../controllers/waitingRoomController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.get('/', waitingRoomController.getWaitingList);
router.post('/check-in', waitingRoomController.checkIn);
router.put('/:id/status', waitingRoomController.updateStatus);
router.delete('/:id', waitingRoomController.removeFromWaiting);

module.exports = router;
