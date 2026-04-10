const express = require('express');
const router = express.Router();
const { getPlans, createSubscription, handleWebhook, updateTheme, getBillingUsage } = require('../controllers/billingController');
const { protect } = require('../middleware/authMiddleware');

router.get('/plans', protect, getPlans);
router.get('/usage', protect, getBillingUsage);
router.post('/subscribe', protect, createSubscription);
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);
router.put('/theme', protect, updateTheme);

module.exports = router;
