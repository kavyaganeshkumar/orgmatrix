const express = require('express');
const router = express.Router();
const { getTasks, createTask, updateTaskStatus, updateTask, deleteTask } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

router.get('/',           protect, getTasks);
router.post('/',          protect, createTask);
router.patch('/:id/status', protect, updateTaskStatus);
router.patch('/:id',      protect, updateTask);
router.delete('/:id',     protect, deleteTask);

module.exports = router;
