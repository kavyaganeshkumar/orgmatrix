const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String },
    fileSize: { type: Number },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    tenantId: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

documentSchema.index({ tenantId: 1, projectId: 1 });

module.exports = mongoose.model('ProjectDocument', documentSchema);
