const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getServices, createService } = require('../controllers/serviceController');

router.get('/', protect, getServices);
router.post('/', protect, createService);

module.exports = router;
