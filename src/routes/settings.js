const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const settingsController = require('../controllers/settingsController');

router.use(authenticateToken);

router.get('/ui', settingsController.getUISettings);
router.put('/ui', settingsController.updateUISettings);

module.exports = router;



