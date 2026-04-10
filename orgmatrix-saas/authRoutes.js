const express = require('express');
const router = express.Router();
const { register, login, updateProfile, getTenantUsers, addTeamMember } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const checkLimit = require('../middleware/checkLimit');

router.post('/register', register);
router.post('/login', login);
router.put('/profile', protect, updateProfile);
router.get('/users', protect, getTenantUsers);
router.post('/add-member', protect, checkLimit('users'), addTeamMember);

module.exports = router;
