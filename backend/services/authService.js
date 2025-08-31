const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Email transporter configuration
const createTransporter = () => {
    // Check if SMTP credentials are properly configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS ||
        process.env.SMTP_USER === 'your-email@gmail.com' ||
        process.env.SMTP_PASS === 'your-app-password') {
        console.warn('⚠️ SMTP credentials not configured. Email verification will be skipped.');
        return null;
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

// Generate JWT token
const generateToken = (userId, expiresIn = '7d') => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET || "secret",
        { expiresIn }
    );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
    const refreshToken = crypto.randomBytes(40).toString('hex');
    return refreshToken;
};

// User registration
const register = async (userData) => {
    const { email, username, password, firstName, lastName } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({
        $or: [{ email }, { username }]
    });

    if (existingUser) {
        throw new Error('User with this email or username already exists');
    }

    // Create new user
    const user = new User({
        email,
        username,
        password,
        profile: {
            firstName,
            lastName
        }
    });

    // Generate email verification token
    // const verificationToken = user.generateEmailVerificationToken();

    await user.save();

    // Send verification email
    // await sendVerificationEmail(user.email, verificationToken, user.username);

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    return {
        user: user.toJSON(),
        token,
        refreshToken
    };
};

// User login with security features
const login = async (credentials) => {
    const { email, password } = credentials;

    // Find user by email or username
    const user = await User.findOne({
        $or: [
            { email: email.toLowerCase() },
            { username: email }
        ]
    });

    if (!user) {
        throw new Error('Invalid credentials');
    }

    // Check if account is locked
    if (user.isLocked()) {
        throw new Error('Account is temporarily locked due to multiple failed login attempts. Please try again later.');
    }

    // Check if account is active
    if (!user.isActive) {
        throw new Error('Account is deactivated. Please contact support.');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
        // Increment login attempts
        // await user.incLoginAttempts();
        throw new Error('Invalid credentials');
    }

    // Reset login attempts on successful login
    // await user.resetLoginAttempts();

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    return {
        user: user.toJSON(),
        token,
        refreshToken
    };
};

// Social login
const socialLogin = async (provider, profile) => {
    let user = await User.findOne({
        'socialLogin.provider': provider,
        'socialLogin.socialId': profile.id
    });

    if (!user) {
        // Check if user exists with same email
        if (profile.emails && profile.emails[0]) {
            user = await User.findOne({ email: profile.emails[0].value });

            if (user) {
                // Link social account to existing user
                user.socialLogin = {
                    provider,
                    socialId: profile.id,
                    accessToken: profile.accessToken,
                    refreshToken: profile.refreshToken
                };
                await user.save();
            }
        }

        if (!user) {
            // Create new user from social profile
            user = new User({
                email: profile.emails ? profile.emails[0].value : null,
                username: profile.username || profile.displayName || `user_${Date.now()}`,
                profile: {
                    firstName: profile.name?.givenName || profile.displayName?.split(' ')[0],
                    lastName: profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' '),
                    avatar: profile.photos ? profile.photos[0].value : null
                },
                socialLogin: {
                    provider,
                    socialId: profile.id,
                    accessToken: profile.accessToken,
                    refreshToken: profile.refreshToken
                },
                isEmailVerified: true // Social accounts are pre-verified
            });

            await user.save();
        }
    }

    // Update social tokens
    user.socialLogin.accessToken = profile.accessToken;
    user.socialLogin.refreshToken = profile.refreshToken;
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    return {
        user: user.toJSON(),
        token,
        refreshToken
    };
};

// Get user by ID
const getUserById = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    return user;
};

// Get user profile
const getProfile = async (userId) => {
    const user = await User.findById(userId).select('-password -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires');

    if (!user) {
        throw new Error('User not found');
    }

    return user.toJSON();
};

// Update user profile
const updateProfile = async (userId, updateData) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    // Update allowed fields
    if (updateData.profile) {
        user.profile = { ...user.profile, ...updateData.profile };
    }

    if (updateData.preferences) {
        user.preferences = { ...user.preferences, ...updateData.preferences };
    }

    await user.save();

    return user.toJSON();
};

// Change password
const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return { message: 'Password changed successfully' };
};

// Request password reset
const requestPasswordReset = async (email) => {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        // Don't reveal if user exists or not
        return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Send reset email
    await sendPasswordResetEmail(user.email, resetToken, user.username);

    return { message: 'If an account with that email exists, a password reset link has been sent.' };
};

// Reset password with token
const resetPassword = async (resetToken, newPassword) => {
    const user = await User.findOne({
        passwordResetToken: resetToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
        throw new Error('Password reset token is invalid or has expired');
    }

    // Update password and clear reset token
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return { message: 'Password has been reset successfully' };
};

// Verify email
const verifyEmail = async (verificationToken) => {
    const user = await User.findOne({
        emailVerificationToken: verificationToken,
        emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
        throw new Error('Email verification token is invalid or has expired');
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return { message: 'Email verified successfully' };
};

// Resend verification email
const resendVerificationEmail = async (email) => {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        throw new Error('User not found');
    }

    if (user.isEmailVerified) {
        throw new Error('Email is already verified');
    }

    // Generate new verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken, user.username);

    return { message: 'Verification email sent successfully' };
};

// Refresh token
const refreshToken = async (refreshToken) => {
    // In a real implementation, you'd validate the refresh token against a database
    // For now, we'll just generate a new access token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || "secret");

    const user = await User.findById(decoded.userId);
    if (!user) {
        throw new Error('User not found');
    }

    const newToken = generateToken(user._id);
    return { token: newToken };
};

// Send verification email
const sendVerificationEmail = async (email, token, username) => {
    const transporter = createTransporter();

    if (!transporter) {
        console.warn(`⚠️ Could not send verification email to ${email} because SMTP credentials are not configured.`);
        return;
    }

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@kanbanapp.com',
        to: email,
        subject: 'Verify Your Email - Kanban Board App',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Welcome to Kanban Board App!</h2>
                <p>Hi ${username},</p>
                <p>Please verify your email address by clicking the button below:</p>
                <a href="${verificationUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Verify Email</a>
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p>${verificationUrl}</p>
                <p>This link will expire in 24 hours.</p>
                <p>Best regards,<br>The Kanban Board Team</p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
};

// Send password reset email
const sendPasswordResetEmail = async (email, token, username) => {
    const transporter = createTransporter();

    if (!transporter) {
        console.warn(`⚠️ Could not send password reset email to ${email} because SMTP credentials are not configured.`);
        return;
    }

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@kanbanapp.com',
        to: email,
        subject: 'Reset Your Password - Kanban Board App',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Password Reset Request</h2>
                <p>Hi ${username},</p>
                <p>You requested to reset your password. Click the button below to create a new password:</p>
                <a href="${resetUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Reset Password</a>
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p>${resetUrl}</p>
                <p>This link will expire in 10 minutes.</p>
                <p>If you didn't request this password reset, please ignore this email.</p>
                <p>Best regards,<br>The Kanban Board Team</p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
};

// Delete user account
const deleteAccount = async (userId, password) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    // Verify password before deletion
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        throw new Error('Password is incorrect');
    }

    // Mark user as inactive instead of deleting
    user.isActive = false;
    await user.save();

    return { message: 'Account deactivated successfully' };
};

module.exports = {
    register,
    login,
    socialLogin,
    getUserById,
    getProfile,
    updateProfile,
    changePassword,
    requestPasswordReset,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
    refreshToken,
    deleteAccount
};
