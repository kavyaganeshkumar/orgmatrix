const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    companyName: { type: String },
    role: { type: String, enum: ['super_admin', 'admin', 'project_manager', 'team_lead', 'developer', 'viewer', 'hr_manager', 'support_analyst'], default: 'developer' },
    tenantId: { type: String, required: true },
    addedByTeamLead: { type: Boolean, default: false },
    lastActive: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
