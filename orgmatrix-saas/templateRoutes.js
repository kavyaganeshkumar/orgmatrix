const express = require('express');
const router = express.Router();
const { getTemplates, createTemplate, applyTemplate } = require('../controllers/templateController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getTemplates);
router.post('/', protect, createTemplate);
router.post('/apply', protect, applyTemplate);

module.exports = router;
