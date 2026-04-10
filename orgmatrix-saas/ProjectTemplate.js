const mongoose = require('mongoose');

const projectTemplateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    tenantId: { type: String, required: true }, // Templates can be per-tenant
    isGlobal: { type: Boolean, default: false }, // Some templates might be system-wide
    tasks: [{
        title: { type: String, required: true },
        description: { type: String },
        priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
        estimatedHours: { type: Number, default: 0 }
    }]
}, { timestamps: true });

module.exports = mongoose.model('ProjectTemplate', projectTemplateSchema);
