const express = require('express');
const router = express.Router();
const mobileColorTestController = require('../controllers/mobileColorTestController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.get('/all', mobileColorTestController.getAllTests);
router.get('/preview/:testType', mobileColorTestController.getTestTypePreview);
router.post('/submit-answers', mobileColorTestController.submitAnswers);
router.get('/my-results', mobileColorTestController.getMyResults);

module.exports = router;
