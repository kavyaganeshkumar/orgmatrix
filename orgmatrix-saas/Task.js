const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Task must belong to a project']
  },
  projectName: {
    type: String,
    default: ''
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedToName: {
    type: String,
    default: 'Unassigned'
  },
  tenantId: {
    type: String,
    required: [true, 'Tenant ID required for isolation']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deadline: {
    type: Date,
    default: null
  },
  // 🚀 Enterprise Evolution Fields
  checklists: [{
    text: { type: String, required: true },
    isCompleted: { type: Boolean, default: false }
  }],
  order: {
    type: Number,
    default: 0
  },
  estimatedHours: {
    type: Number,
    default: 0
  },
  actualHours: {
    type: Number,
    default: 0
  },
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  }
}, { timestamps: true });

taskSchema.index({ tenantId: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ projectId: 1 });

module.exports = mongoose.model('Task', taskSchema);
