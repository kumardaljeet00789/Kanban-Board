const { validationResult } = require('express-validator');
const {
    register: registerService,
    login: loginService,
    getProfile: getProfileService,
    socialLogin: socialLoginService,
    updateProfile: updateProfileService,
    changePassword: changePasswordService,
    requestPasswordReset: requestPasswordResetService,
    resetPassword: resetPasswordService,
    verifyEmail: verifyEmailService,
    resendVerificationEmail: resendVerificationEmailService,
    refreshToken: refreshTokenService,
    deleteAccount: deleteAccountService
} = require('../services/authService');

// User registration
const register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email, username, password, firstName, lastName } = req.body;

        const result = await registerService({
            email,
            username,
            password,
            firstName,
            lastName
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully. Please check your email to verify your account.',
            data: result
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Registration failed'
        });
    }
};

// User login
const login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        const result = await loginService({ email, password });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: result
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({
            success: false,
            message: error.message || 'Login failed'
        });
    }
};

// Social login
const socialLogin = async (req, res) => {
    try {
        const { provider, profile } = req.body;

        if (!provider || !profile) {
            return res.status(400).json({
                success: false,
                message: 'Provider and profile are required'
            });
        }

        const result = await socialLoginService(provider, profile);

        res.status(200).json({
            success: true,
            message: 'Social login successful',
            data: result
        });
    } catch (error) {
        console.error('Social login error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Social login failed'
        });
    }
};

// Get user profile
const getProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const profile = await getProfileService(userId);

        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(404).json({
            success: false,
            message: error.message || 'Profile not found'
        });
    }
};

// Update user profile
const updateProfile = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const userId = req.user._id;
        const updateData = req.body;

        const updatedProfile = await updateProfileService(userId, updateData);

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedProfile
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Profile update failed'
        });
    }
};

// Change password
const changePassword = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const userId = req.user._id;
        const { currentPassword, newPassword } = req.body;

        const result = await changePasswordService(userId, currentPassword, newPassword);

        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Password change failed'
        });
    }
};

// Request password reset
const requestPasswordReset = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email } = req.body;

        const result = await requestPasswordResetService(email);

        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Request password reset error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Password reset request failed'
        });
    }
};

// Reset password
const resetPassword = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { resetToken, newPassword } = req.body;

        const result = await resetPasswordService(resetToken, newPassword);

        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Password reset failed'
        });
    }
};

// Verify email
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        const result = await verifyEmailService(token);

        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Verify email error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Email verification failed'
        });
    }
};

// Resend verification email
const resendVerificationEmail = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email } = req.body;

        const result = await resendVerificationEmailService(email);

        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Resend verification email error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Verification email resend failed'
        });
    }
};

// Refresh token
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        const result = await refreshTokenService(refreshToken);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(401).json({
            success: false,
            message: error.message || 'Token refresh failed'
        });
    }
};

// Delete account
const deleteAccount = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const userId = req.user._id;
        const { password } = req.body;

        const result = await deleteAccountService(userId, password);

        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Account deletion failed'
        });
    }
};

// Logout (client-side token removal)
const logout = async (req, res) => {
    try {
        // In a real implementation, you might want to blacklist the token
        // For now, we'll just return a success message
        res.status(200).json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
};

module.exports = {
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
};
