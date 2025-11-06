const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const uiController = require('../controllers/uiController');

router.use(authenticateToken);

router.get('/sidebar', uiController.getSidebar);
router.get('/header', uiController.getHeaderProfile);

module.exports = router;



