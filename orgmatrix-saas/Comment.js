const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    userName: { 
        type: String, 
        required: true 
    },
    tenantId: { 
        type: String, 
        required: true 
    },
    content: { 
        type: String, 
        required: true,
        trim: true
    },
    targetId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true 
    },
    targetType: { 
        type: String, 
        enum: ['Task', 'Project'], 
        required: true 
    }
}, { timestamps: true });

// Index for fast retrieval of comments for a specific task/project
commentSchema.index({ targetId: 1, targetType: 1 });
commentSchema.index({ tenantId: 1 });

module.exports = mongoose.model('Comment', commentSchema);
