const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotificationById,
    getUnreadNotificationCount,
    getNotificationStats,
    updateNotificationPreferences
} = require('../controllers/notificationController');

// Get user notifications
router.get('/', auth, getNotifications);

// Mark notification as read
router.patch('/:notificationId/read', auth, markNotificationAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', auth, markAllNotificationsAsRead);

// Delete notification
router.delete('/:notificationId', auth, deleteNotificationById);

// Get unread count
router.get('/unread-count', auth, getUnreadNotificationCount);

// Get notification statistics
router.get('/stats', auth, getNotificationStats);

// Update notification preferences
router.patch('/preferences', auth, [
    body('preferences.email').optional().isBoolean(),
    body('preferences.push').optional().isBoolean(),
    body('preferences.inApp').optional().isBoolean()
], updateNotificationPreferences);

module.exports = router;
