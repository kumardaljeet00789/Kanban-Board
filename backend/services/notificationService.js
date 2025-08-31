const Notification = require('../models/Notification');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// Email transporter configuration
const createTransporter = () => {
    return nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

// Create notification
const createNotification = async (notificationData) => {
    try {
        const notification = new Notification(notificationData);
        await notification.save();
        
        // Send email notification if enabled
        if (notificationData.recipient && notificationData.priority !== 'low') {
            await sendEmailNotification(notification);
        }
        
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

// Get user notifications
const getUserNotifications = async (userId, page = 1, limit = 20, unreadOnly = false) => {
    try {
        const query = { recipient: userId };
        if (unreadOnly) {
            query.isRead = false;
        }
        
        const skip = (page - 1) * limit;
        
        const notifications = await Notification.find(query)
            .populate('sender', 'username profile.firstName profile.lastName profile.avatar')
            .populate('data.board', 'title')
            .populate('data.list', 'title')
            .populate('data.card', 'title')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const total = await Notification.countDocuments(query);
        
        return {
            notifications,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error('Error getting user notifications:', error);
        throw error;
    }
};

// Mark notification as read
const markAsRead = async (notificationId, userId) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, recipient: userId },
            { isRead: true, readAt: new Date() },
            { new: true }
        );
        
        if (!notification) {
            throw new Error('Notification not found or access denied');
        }
        
        return notification;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};

// Mark all notifications as read
const markAllAsRead = async (userId) => {
    try {
        const result = await Notification.updateMany(
            { recipient: userId, isRead: false },
            { isRead: true, readAt: new Date() }
        );
        
        return { message: `${result.modifiedCount} notifications marked as read` };
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
};

// Delete notification
const deleteNotification = async (notificationId, userId) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: notificationId,
            recipient: userId
        });
        
        if (!notification) {
            throw new Error('Notification not found or access denied');
        }
        
        return { message: 'Notification deleted successfully' };
    } catch (error) {
        console.error('Error deleting notification:', error);
        throw error;
    }
};

// Get unread count
const getUnreadCount = async (userId) => {
    try {
        return await Notification.countDocuments({
            recipient: userId,
            isRead: false
        });
    } catch (error) {
        console.error('Error getting unread count:', error);
        throw error;
    }
};

// Send email notification
const sendEmailNotification = async (notification) => {
    try {
        const recipient = await User.findById(notification.recipient);
        if (!recipient || !recipient.preferences?.notifications?.email) {
            return;
        }
        
        const transporter = createTransporter();
        
        const emailContent = generateEmailContent(notification);
        
        const mailOptions = {
            from: process.env.SMTP_FROM || 'noreply@kanbanapp.com',
            to: recipient.email,
            subject: emailContent.subject,
            html: emailContent.html
        };
        
        await transporter.sendMail(mailOptions);
        
        // Mark email as sent
        notification.isEmailSent = true;
        notification.emailSentAt = new Date();
        await notification.save();
        
    } catch (error) {
        console.error('Error sending email notification:', error);
    }
};

// Generate email content
const generateEmailContent = (notification) => {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    let subject = '';
    let actionText = '';
    let actionUrl = '';
    
    switch (notification.type) {
        case 'card_assigned':
            subject = 'New Card Assignment';
            actionText = 'View Card';
            actionUrl = `${baseUrl}/board/${notification.data.board}/card/${notification.data.card}`;
            break;
        case 'card_mentioned':
            subject = 'You were mentioned in a comment';
            actionText = 'View Comment';
            actionUrl = `${baseUrl}/board/${notification.data.board}/card/${notification.data.card}`;
            break;
        case 'card_due_soon':
            subject = 'Card Due Soon';
            actionText = 'View Card';
            actionUrl = `${baseUrl}/board/${notification.data.board}/card/${notification.data.card}`;
            break;
        case 'card_overdue':
            subject = 'Card is Overdue!';
            actionText = 'View Card';
            actionUrl = `${baseUrl}/board/${notification.data.board}/card/${notification.data.card}`;
            break;
        case 'comment_added':
            subject = 'New Comment Added';
            actionText = 'View Comment';
            actionUrl = `${baseUrl}/board/${notification.data.board}/card/${notification.data.card}`;
            break;
        case 'member_added':
            subject = 'You were added to a board';
            actionText = 'View Board';
            actionUrl = `${baseUrl}/board/${notification.data.board}`;
            break;
        case 'board_invitation':
            subject = 'Board Invitation';
            actionText = 'View Board';
            actionUrl = `${baseUrl}/board/${notification.data.board}`;
            break;
        default:
            subject = 'New Notification';
            actionText = 'View Details';
            actionUrl = baseUrl;
    }
    
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #2563eb; margin: 0;">${subject}</h2>
            </div>
            
            <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <p style="margin: 0 0 20px 0; color: #64748b; font-size: 16px;">
                    ${notification.message}
                </p>
                
                <a href="${actionUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                    ${actionText}
                </a>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 14px;">
                <p>You can manage your notification preferences in your account settings.</p>
            </div>
        </div>
    `;
    
    return { subject, html };
};

// Create system notifications
const createSystemNotification = async (recipients, title, message, data = {}) => {
    try {
        const notifications = [];
        
        for (const recipientId of recipients) {
            const notification = new Notification({
                recipient: recipientId,
                type: 'system',
                title,
                message,
                data,
                priority: 'medium'
            });
            
            notifications.push(notification);
        }
        
        await Notification.insertMany(notifications);
        return notifications;
    } catch (error) {
        console.error('Error creating system notifications:', error);
        throw error;
    }
};

// Create card assignment notification
const createCardAssignmentNotification = async (cardId, assigneeId, assignedBy, boardId, listId) => {
    try {
        const notification = await createNotification({
            recipient: assigneeId,
            sender: assignedBy,
            type: 'card_assigned',
            title: 'New Card Assignment',
            message: 'You have been assigned to a new card',
            data: {
                board: boardId,
                list: listId,
                card: cardId
            },
            priority: 'medium'
        });
        
        return notification;
    } catch (error) {
        console.error('Error creating card assignment notification:', error);
        throw error;
    }
};

// Create mention notification
const createMentionNotification = async (cardId, mentionedUserId, mentionedBy, boardId, listId, commentId) => {
    try {
        const notification = await createNotification({
            recipient: mentionedUserId,
            sender: mentionedBy,
            type: 'card_mentioned',
            title: 'You were mentioned',
            message: 'Someone mentioned you in a comment',
            data: {
                board: boardId,
                list: listId,
                card: cardId,
                comment: commentId
            },
            priority: 'medium'
        });
        
        return notification;
    } catch (error) {
        console.error('Error creating mention notification:', error);
        throw error;
    }
};

// Create due date notification
const createDueDateNotification = async (cardId, assigneeId, boardId, listId, dueDate, isOverdue = false) => {
    try {
        const notification = await createNotification({
            recipient: assigneeId,
            type: isOverdue ? 'card_overdue' : 'card_due_soon',
            title: isOverdue ? 'Card is Overdue!' : 'Card Due Soon',
            message: isOverdue 
                ? 'A card assigned to you is overdue'
                : 'A card assigned to you is due soon',
            data: {
                board: boardId,
                list: listId,
                card: cardId
            },
            priority: isOverdue ? 'urgent' : 'high'
        });
        
        return notification;
    } catch (error) {
        console.error('Error creating due date notification:', error);
        throw error;
    }
};

// Clean old notifications
const cleanOldNotifications = async (daysOld = 30) => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        
        const result = await Notification.deleteMany({
            createdAt: { $lt: cutoffDate },
            isRead: true
        });
        
        return { message: `${result.deletedCount} old notifications cleaned up` };
    } catch (error) {
        console.error('Error cleaning old notifications:', error);
        throw error;
    }
};

// Bulk create notifications
const bulkCreateNotifications = async (notificationsData) => {
    try {
        const notifications = await Notification.insertMany(notificationsData);
        return notifications;
    } catch (error) {
        console.error('Error bulk creating notifications:', error);
        throw error;
    }
};

module.exports = {
    createNotification,
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount,
    sendEmailNotification,
    createSystemNotification,
    createCardAssignmentNotification,
    createMentionNotification,
    createDueDateNotification,
    cleanOldNotifications,
    bulkCreateNotifications
};
