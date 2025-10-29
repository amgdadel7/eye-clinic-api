const express = require('express');
const router = express.Router();
const mobileTestResultController = require('../controllers/mobileTestResultController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.get('/my-results', mobileTestResultController.getMyResults);

module.exports = router;
