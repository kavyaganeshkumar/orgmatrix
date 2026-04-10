const mongoose = require('mongoose');

// 4. ✅ MODEL VALIDATION (PROJECTS)
const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is absolutely required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'archived'],
    default: 'pending'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  handlerName: {
    type: String,
    default: 'Unassigned'
  },
  tenantId: {
    type: String, // String representation of tenant ID for isolation
    required: [true, 'Tenant ID is required for multi-tenant isolation']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Project must belong to a specific user id']
  },
  description: {
    type: String,
    trim: true
  },
  budget: {
    type: Number,
    required: [true, 'Project budget is required'],
    default: 0
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline date is required']
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  clientName: {
    type: String,
    default: 'Internal'
  }
}, { timestamps: true });

// Add index for fast multi-tenant filtering
projectSchema.index({ tenantId: 1 });

module.exports = mongoose.model('Project', projectSchema);
