const Comment = require('../models/Comment');
const logActivity = require('../utils/logger');

const getComments = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { targetId, targetType } = req.query;

        if (!targetId || !targetType) {
            return res.status(400).json({ message: 'TargetId and TargetType are required' });
        }

        const comments = await Comment.find({ 
            tenantId, 
            targetId, 
            targetType 
        }).sort({ createdAt: 1 });

        res.status(200).json(comments);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching comments', error: err.message });
    }
};

const createComment = async (req, res) => {
    try {
        const { id: userId, tenantId, userName, name } = req.user;
        const { targetId, targetType, content } = req.body;

        if (!targetId || !targetType || !content) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const comment = await Comment.create({
            userId,
            userName: name || userName || 'Unknown User',
            tenantId,
            content,
            targetId,
            targetType
        });

        await logActivity(req, {
            action: `Added Comment to ${targetType}`,
            severity: 'info',
            resourceId: comment._id,
            resourceType: 'Comment',
            details: { targetId, targetType }
        });

        res.status(201).json(comment);
    } catch (err) {
        res.status(400).json({ message: 'Failed to create comment', error: err.message });
    }
};

const deleteComment = async (req, res) => {
    try {
        const { id: userId, role, tenantId } = req.user;
        const comment = await Comment.findOne({ _id: req.params.id, tenantId });

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Only author or admin can delete
        if (String(comment.userId) !== String(userId) && !['admin', 'super_admin'].includes(role)) {
            return res.status(403).json({ message: 'Permission denied' });
        }

        await Comment.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Comment deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete comment', error: err.message });
    }
};

module.exports = { getComments, createComment, deleteComment };
