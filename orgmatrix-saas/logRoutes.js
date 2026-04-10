const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/authMiddleware');

const { getLogs, exportLogs } = require('../controllers/logController');

// @desc    Getrecent activity for the current tenant
// @route   GET /api/logs
router.get('/', protect, getLogs);

// @desc    Export logs as CSV
// @route   GET /api/logs/export
router.get('/export', protect, exportLogs);

module.exports = router;
