const Notification = require('../models/Notification');

// @desc    Get all notifications for a tenant/user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ 
            tenantId: req.user.tenantId,
            $or: [
                { recipient: req.user._id },
                { recipient: null }
            ]
        }).sort({ createdAt: -1 }).limit(20);
        
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id
// @access  Private
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ message: "Notification not found" });
        
        notification.isRead = true;
        await notification.save();
        
        res.status(200).json({ message: "Marked as read" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper function to create and emit notification
exports.createNotification = async (app, data) => {
    try {
        const notification = await Notification.create(data);
        const io = app.get('io');
        
        if (data.recipient) {
            // Echo to specific user if we had user-specific rooms, 
            // but for now we'll just emit to the tenant room
            io.to(data.tenantId).emit('new-notification', notification);
        } else {
            io.to(data.tenantId).emit('new-notification', notification);
        }
        
        return notification;
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};
