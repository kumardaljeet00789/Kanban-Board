const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {
        type: String,
        enum: [
            'card_assigned',
            'card_mentioned',
            'card_due_soon',
            'card_overdue',
            'comment_added',
            'member_added',
            'board_invitation',
            'due_date_changed',
            'card_moved',
            'checklist_updated',
            'attachment_added',
            'system'
        ],
        required: true
    },
    title: {
        type: String,
        required: true,
        maxlength: 200
    },
    message: {
        type: String,
        required: true,
        maxlength: 500
    },
    data: {
        board: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Board'
        },
        list: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'List'
        },
        card: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Card'
        },
        comment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment'
        },
        url: String,
        metadata: mongoose.Schema.Types.Mixed
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: Date,
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    expiresAt: Date,
    isEmailSent: {
        type: Boolean,
        default: false
    },
    emailSentAt: Date,
    isPushSent: {
        type: Boolean,
        default: false
    },
    pushSentAt: Date
}, {
    timestamps: true
});

// Indexes for better performance
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ 'data.board': 1 });
notificationSchema.index({ 'data.card': 1 });

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function() {
    const now = new Date();
    const diffMs = now - this.createdAt;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return this.createdAt.toLocaleDateString();
});

// Virtual for is urgent
notificationSchema.virtual('isUrgent').get(function() {
    return this.priority === 'urgent' || this.type === 'card_overdue';
});

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
    this.isRead = true;
    this.readAt = new Date();
    return this;
};

// Method to mark as unread
notificationSchema.methods.markAsUnread = function() {
    this.isRead = false;
    this.readAt = undefined;
    return this;
};

// Method to mark email as sent
notificationSchema.methods.markEmailSent = function() {
    this.isEmailSent = true;
    this.emailSentAt = new Date();
    return this;
};

// Method to mark push as sent
notificationSchema.methods.markPushSent = function() {
    this.isPushSent = true;
    this.pushSentAt = new Date();
    return this;
};

// Static method to create notification
notificationSchema.statics.createNotification = function(data) {
    return this.create(data);
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(userId) {
    return this.countDocuments({
        recipient: userId,
        isRead: false
    });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = function(userId) {
    return this.updateMany(
        { recipient: userId, isRead: false },
        { 
            isRead: true, 
            readAt: new Date() 
        }
    );
};

// Static method to clean old notifications
notificationSchema.statics.cleanOldNotifications = function(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    return this.deleteMany({
        createdAt: { $lt: cutoffDate },
        isRead: true
    });
};

// Ensure virtual fields are serialized
notificationSchema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('Notification', notificationSchema);
