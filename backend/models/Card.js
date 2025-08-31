const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    mentions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: Date,
    reactions: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        emoji: String
    }]
}, {
    timestamps: true
});

const attachmentSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    originalName: String,
    mimeType: String,
    size: Number,
    url: String,
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isImage: {
        type: Boolean,
        default: false
    },
    thumbnailUrl: String
}, {
    timestamps: true
});

const labelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    color: {
        type: String,
        required: true,
        default: '#3b82f6'
    },
    description: String
});

const checklistItemSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        trim: true
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    completedAt: Date
}, {
    timestamps: true
});

const checklistSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    items: [checklistItemSchema],
    progress: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

const cardSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        trim: true,
        maxlength: 2000
    },
    list: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'List',
        required: true
    },
    board: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Board',
        required: true
    },
    position: {
        type: Number,
        required: true
    },
    assignees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    labels: [labelSchema],
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    dueDate: Date,
    dueDateReminder: {
        type: String,
        enum: ['none', '5min', '15min', '1hour', '1day', '1week'],
        default: 'none'
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    completedAt: Date,
    completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    timeEstimate: {
        hours: Number,
        minutes: Number
    },
    timeSpent: {
        hours: {
            type: Number,
            default: 0
        },
        minutes: {
            type: Number,
            default: 0
        }
    },
    attachments: [attachmentSchema],
    comments: [commentSchema],
    checklists: [checklistSchema],
    tags: [String],
    coverImage: String,
    isArchived: {
        type: Boolean,
        default: false
    },
    archivedAt: Date,
    archivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    activity: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        action: {
            type: String,
            enum: ['created', 'updated', 'moved', 'assigned', 'commented', 'attached', 'labeled', 'checklist_updated', 'completed', 'archived']
        },
        details: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    watchers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    dependencies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Card'
    }],
    subtasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Card'
    }],
    parentCard: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Card'
    }
}, {
    timestamps: true
});

// Indexes for better performance
cardSchema.index({ list: 1, position: 1 });
cardSchema.index({ board: 1 });
cardSchema.index({ assignees: 1 });
cardSchema.index({ dueDate: 1 });
cardSchema.index({ isCompleted: 1 });
cardSchema.index({ isArchived: 1 });
cardSchema.index({ 'labels.name': 1 });
cardSchema.index({ tags: 1 });

// Virtual for due status
cardSchema.virtual('dueStatus').get(function() {
    if (!this.dueDate || this.isCompleted) return 'none';
    
    const now = new Date();
    const due = new Date(this.dueDate);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays === 0) return 'due-today';
    if (diffDays <= 1) return 'due-soon';
    return 'due-later';
});

// Virtual for progress
cardSchema.virtual('progress').get(function() {
    if (!this.checklists || this.checklists.length === 0) return 0;
    
    let totalItems = 0;
    let completedItems = 0;
    
    this.checklists.forEach(checklist => {
        totalItems += checklist.items.length;
        completedItems += checklist.items.filter(item => item.isCompleted).length;
    });
    
    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
});

// Virtual for formatted time estimate
cardSchema.virtual('formattedTimeEstimate').get(function() {
    if (!this.timeEstimate) return null;
    
    const { hours, minutes } = this.timeEstimate;
    if (hours && minutes) {
        return `${hours}h ${minutes}m`;
    } else if (hours) {
        return `${hours}h`;
    } else if (minutes) {
        return `${minutes}m`;
    }
    return null;
});

// Virtual for formatted time spent
cardSchema.virtual('formattedTimeSpent').get(function() {
    const { hours, minutes } = this.timeSpent;
    if (hours && minutes) {
        return `${hours}h ${minutes}m`;
    } else if (hours) {
        return `${hours}h`;
    } else if (minutes) {
        return `${minutes}m`;
    }
    return '0m';
});

// Method to add activity
cardSchema.methods.addActivity = function(userId, action, details) {
    this.activity.push({
        user: userId,
        action,
        details,
        timestamp: new Date()
    });
    
    // Keep only last 50 activities
    if (this.activity.length > 50) {
        this.activity = this.activity.slice(-50);
    }
    
    return this;
};

// Method to add comment
cardSchema.methods.addComment = function(userId, text, mentions = []) {
    const comment = {
        user: userId,
        text,
        mentions
    };
    
    this.comments.push(comment);
    this.addActivity(userId, 'commented', 'Added a comment');
    
    return comment;
};

// Method to add attachment
cardSchema.methods.addAttachment = function(attachmentData) {
    this.attachments.push(attachmentData);
    this.addActivity(attachmentData.uploadedBy, 'attached', `Added attachment: ${attachmentData.originalName}`);
    return this;
};

// Method to add label
cardSchema.methods.addLabel = function(labelData) {
    const existingLabel = this.labels.find(l => l.name === labelData.name);
    if (!existingLabel) {
        this.labels.push(labelData);
        this.addActivity(null, 'labeled', `Added label: ${labelData.name}`);
    }
    return this;
};

// Method to remove label
cardSchema.methods.removeLabel = function(labelName) {
    this.labels = this.labels.filter(l => l.name !== labelName);
    this.addActivity(null, 'labeled', `Removed label: ${labelName}`);
    return this;
};

// Method to assign user
cardSchema.methods.assignUser = function(userId, assignedBy) {
    if (!this.assignees.includes(userId)) {
        this.assignees.push(userId);
        this.addActivity(assignedBy, 'assigned', 'User assigned to card');
    }
    return this;
};

// Method to unassign user
cardSchema.methods.unassignUser = function(userId, unassignedBy) {
    this.assignees = this.assignees.filter(id => id.toString() !== userId.toString());
    this.addActivity(unassignedBy, 'assigned', 'User unassigned from card');
    return this;
};

// Method to mark as complete
cardSchema.methods.markComplete = function(userId) {
    this.isCompleted = true;
    this.completedAt = new Date();
    this.completedBy = userId;
    this.addActivity(userId, 'completed', 'Card marked as complete');
    return this;
};

// Method to mark as incomplete
cardSchema.methods.markIncomplete = function(userId) {
    this.isCompleted = false;
    this.completedAt = undefined;
    this.completedBy = undefined;
    this.addActivity(userId, 'completed', 'Card marked as incomplete');
    return this;
};

// Method to archive
cardSchema.methods.archive = function(userId) {
    this.isArchived = true;
    this.archivedAt = new Date();
    this.archivedBy = userId;
    this.addActivity(userId, 'archived', 'Card archived');
    return this;
};

// Method to unarchive
cardSchema.methods.unarchive = function(userId) {
    this.isArchived = false;
    this.archivedAt = undefined;
    this.archivedBy = undefined;
    this.addActivity(userId, 'archived', 'Card unarchived');
    return this;
};

// Pre-save middleware to update progress
cardSchema.pre('save', function(next) {
    if (this.checklists && this.checklists.length > 0) {
        this.checklists.forEach(checklist => {
            const totalItems = checklist.items.length;
            const completedItems = checklist.items.filter(item => item.isCompleted).length;
            checklist.progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
        });
    }
    next();
});

// Ensure virtual fields are serialized
cardSchema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('Card', cardSchema);
