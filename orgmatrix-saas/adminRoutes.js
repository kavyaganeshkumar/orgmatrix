const express = require('express');
const router = express.Router();
const { getAllCompanies, getAllUsers, getDashboardData, getStats } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/companies', protect, authorize('super_admin'), getAllCompanies);
router.get('/users', protect, authorize('super_admin'), getAllUsers);
router.get('/dashboard-data', protect, authorize('super_admin'), getDashboardData);
router.get('/stats', protect, authorize('super_admin'), getStats);

module.exports = router;
