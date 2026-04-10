const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userRole: { type: String },
    tenantId: { type: String },
    action: { type: String, required: true },
    severity: { type: String, enum: ['info', 'warning', 'danger'], default: 'info' },
    resourceId: { type: String },
    resourceType: { type: String },
    details: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
