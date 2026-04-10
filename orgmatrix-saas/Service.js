const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Deployed', 'Failed', 'Building', 'Suspended', 'Available', 'Successful run'],
    default: 'Deployed'
  },
  type: {
    type: String,
    enum: ['Web Service', 'PostgreSQL', 'Cron Job', 'Static Site', 'Background Worker'],
    required: true
  },
  runtime: {
    type: String,
    default: 'Node'
  },
  region: {
    type: String,
    default: 'Oregon'
  },
  deployedAt: {
    type: Date,
    default: Date.now
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  tenantId: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
