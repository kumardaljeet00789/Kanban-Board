const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['owner', 'editor', 'viewer'],
        default: 'viewer'
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    invitedAt: {
        type: Date,
        default: Date.now
    },
    joinedAt: Date,
    permissions: {
        canEdit: {
            type: Boolean,
            default: function() {
                return this.role === 'owner' || this.role === 'editor';
            }
        },
        canDelete: {
            type: Boolean,
            default: function() {
                return this.role === 'owner';
            }
        },
        canInvite: {
            type: Boolean,
            default: function() {
                return this.role === 'owner' || this.role === 'editor';
            }
        },
        canManageMembers: {
            type: Boolean,
            default: function() {
                return this.role === 'owner';
            }
        }
    }
}, {
    timestamps: true
});

const boardSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [memberSchema],
    visibility: {
        type: String,
        enum: ['private', 'team', 'public'],
        default: 'private'
    },
    settings: {
        allowComments: {
            type: Boolean,
            default: true
        },
        allowAttachments: {
            type: Boolean,
            default: true
        },
        allowLabels: {
            type: Boolean,
            default: true
        },
        allowDueDates: {
            type: Boolean,
            default: true
        },
        allowAssignees: {
            type: Boolean,
            default: true
        },
        defaultListTemplates: {
            type: [String],
            default: ['To Do', 'In Progress', 'Done']
        }
    },
    tags: [{
        name: String,
        color: String
    }],
    isArchived: {
        type: Boolean,
        default: false
    },
    isTemplate: {
        type: Boolean,
        default: false
    },
    templateSource: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Board'
    },
    activity: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        action: {
            type: String,
            enum: ['created', 'updated', 'deleted', 'member_added', 'member_removed', 'list_added', 'list_deleted', 'card_added', 'card_moved', 'card_deleted']
        },
        details: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    statistics: {
        totalLists: {
            type: Number,
            default: 0
        },
        totalCards: {
            type: Number,
            default: 0
        },
        completedCards: {
            type: Number,
            default: 0
        },
        lastActivity: Date
    }
}, {
    timestamps: true
});

// Indexes for better performance
boardSchema.index({ owner: 1 });
boardSchema.index({ 'members.user': 1 });
boardSchema.index({ visibility: 1 });
boardSchema.index({ isArchived: 1 });
boardSchema.index({ isTemplate: 1 });

// Virtual for member count
boardSchema.virtual('memberCount').get(function() {
    return this.members.length + 1; // +1 for owner
});

// Virtual for is public
boardSchema.virtual('isPublic').get(function() {
    return this.visibility === 'public';
});

// Virtual for is team
boardSchema.virtual('isTeam').get(function() {
    return this.visibility === 'team';
});

// Method to check if user has permission
boardSchema.methods.hasPermission = function(userId, permission) {
    if (this.owner.toString() === userId.toString()) {
        return true;
    }
    
    const member = this.members.find(m => m.user.toString() === userId.toString());
    if (!member) return false;
    
    return member.permissions[permission] || false;
};

// Method to add member
boardSchema.methods.addMember = function(userId, role = 'viewer', invitedBy) {
    const existingMember = this.members.find(m => m.user.toString() === userId.toString());
    if (existingMember) {
        existingMember.role = role;
        existingMember.invitedBy = invitedBy;
        existingMember.invitedAt = new Date();
    } else {
        this.members.push({
            user: userId,
            role,
            invitedBy,
            invitedAt: new Date()
        });
    }
    
    this.addActivity(invitedBy || this.owner, 'member_added', `Added member with role: ${role}`);
    return this;
};

// Method to remove member
boardSchema.methods.removeMember = function(userId, removedBy) {
    this.members = this.members.filter(m => m.user.toString() !== userId.toString());
    this.addActivity(removedBy || this.owner, 'member_removed', 'Removed member');
    return this;
};

// Method to add activity
boardSchema.methods.addActivity = function(userId, action, details) {
    this.activity.push({
        user: userId,
        action,
        details,
        timestamp: new Date()
    });
    
    // Keep only last 100 activities
    if (this.activity.length > 100) {
        this.activity = this.activity.slice(-100);
    }
    
    this.statistics.lastActivity = new Date();
    return this;
};

// Method to update statistics
boardSchema.methods.updateStatistics = function() {
    // This will be called when lists/cards are modified
    return this;
};

// Ensure virtual fields are serialized
boardSchema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('Board', boardSchema);
