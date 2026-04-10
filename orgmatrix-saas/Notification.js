const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  tenantId: { type: String, required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional: null means system-wide for tenant
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['project', 'task', 'system', 'billing'], default: 'system' },
  isRead: { type: Boolean, default: false },
  link: { type: String } // Optional link to redirect
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
