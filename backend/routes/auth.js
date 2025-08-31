const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const {
    register,
    login,
    socialLogin,
    getProfile,
    updateProfile,
    changePassword,
    requestPasswordReset,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
    refreshToken,
    deleteAccount,
    logout
} = require('../controllers/authController');

// User registration
router.post('/register', [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('username').isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters'),
    body('firstName').optional().isLength({ min: 1, max: 50 }).withMessage('First name must be between 1 and 50 characters'),
    body('lastName').optional().isLength({ min: 1, max: 50 }).withMessage('Last name must be between 1 and 50 characters'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
], register);

// User login
router.post('/login', [
    body('email').notEmpty().withMessage('Email is required'),
    body('password').notEmpty().withMessage('Password is required')
], login);

// Social login
router.post('/social-login', [
    body('provider').isIn(['google', 'github', 'linkedin']).withMessage('Invalid provider'),
    body('profile').isObject().withMessage('Profile is required')
], socialLogin);

// Get current user (protected) - alias for /profile
router.get('/me', auth, getProfile);

// Get user profile (protected)
router.get('/profile', auth, getProfile);

// Update user profile (protected)
router.put('/profile', auth, [
    body('firstName').optional().isLength({ min: 1, max: 50 }).withMessage('First name must be between 1 and 50 characters'),
    body('lastName').optional().isLength({ min: 1, max: 50 }).withMessage('Last name must be between 1 and 50 characters'),
    body('bio').optional().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters'),
    body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
    body('location').optional().isLength({ max: 100 }).withMessage('Location must be less than 100 characters')
], updateProfile);

// Change password (protected)
router.put('/change-password', auth, [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
], changePassword);

// Request password reset
router.post('/forgot-password', [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
], requestPasswordReset);

// Reset password with token
router.post('/reset-password', [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
], resetPassword);

// Verify email with token
router.get('/verify-email/:token', verifyEmail);

// Resend verification email
router.post('/resend-verification', [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
], resendVerificationEmail);

// Refresh token
router.post('/refresh-token', [
    body('refreshToken').notEmpty().withMessage('Refresh token is required')
], refreshToken);

// Delete account (protected)
router.delete('/account', auth, [
    body('password').notEmpty().withMessage('Password is required for account deletion')
], deleteAccount);

// Logout (protected)
router.post('/logout', auth, logout);

module.exports = router;
