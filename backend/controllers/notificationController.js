const { validationResult } = require('express-validator');
const {
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount
} = require('../services/notificationService');

// Get user notifications
const getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 20, unreadOnly = false } = req.query;

        const result = await getUserNotifications(
            userId,
            parseInt(page),
            parseInt(limit),
            unreadOnly === 'true'
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get notifications'
        });
    }
};

// Mark notification as read
const markNotificationAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        const { notificationId } = req.params;

        const notification = await markAsRead(notificationId, userId);

        res.status(200).json({
            success: true,
            message: 'Notification marked as read',
            data: notification
        });
    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to mark notification as read'
        });
    }
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.user._id;

        const result = await markAllAsRead(userId);

        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Mark all notifications as read error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to mark all notifications as read'
        });
    }
};

// Delete notification
const deleteNotificationById = async (req, res) => {
    try {
        const userId = req.user._id;
        const { notificationId } = req.params;

        const result = await deleteNotification(notificationId, userId);

        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to delete notification'
        });
    }
};

// Get unread count
const getUnreadNotificationCount = async (req, res) => {
    try {
        const userId = req.user._id;

        const count = await getUnreadCount(userId);

        res.status(200).json({
            success: true,
            data: { unreadCount: count }
        });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get unread count'
        });
    }
};

// Get notification statistics
const getNotificationStats = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get total notifications
        const { notifications } = await getUserNotifications(userId, 1, 1000);

        // Calculate statistics
        const total = notifications.length;
        const unread = notifications.filter(n => !n.isRead).length;
        const urgent = notifications.filter(n => n.priority === 'urgent').length;
        const high = notifications.filter(n => n.priority === 'high').length;
        const medium = notifications.filter(n => n.priority === 'medium').length;
        const low = notifications.filter(n => n.priority === 'low').length;

        // Group by type
        const byType = notifications.reduce((acc, notification) => {
            acc[notification.type] = (acc[notification.type] || 0) + 1;
            return acc;
        }, {});

        // Recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recent = notifications.filter(n => new Date(n.createdAt) > sevenDaysAgo).length;

        res.status(200).json({
            success: true,
            data: {
                total,
                unread,
                byPriority: { urgent, high, medium, low },
                byType,
                recent
            }
        });
    } catch (error) {
        console.error('Get notification stats error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get notification statistics'
        });
    }
};

// Update notification preferences
const updateNotificationPreferences = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const userId = req.user._id;
        const { preferences } = req.body;

        // This would typically update user preferences in the User model
        // For now, we'll just return a success message
        res.status(200).json({
            success: true,
            message: 'Notification preferences updated successfully'
        });
    } catch (error) {
        console.error('Update notification preferences error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to update notification preferences'
        });
    }
};

module.exports = {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotificationById,
    getUnreadNotificationCount,
    getNotificationStats,
    updateNotificationPreferences
};
