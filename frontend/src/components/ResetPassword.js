import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FiLock, FiEye, FiEyeOff, FiCheckCircle, FiArrowLeft, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const ResetPassword = () => {
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isValidToken, setIsValidToken] = useState(true);

    const navigate = useNavigate();
    const { token } = useParams();
    const { resetPassword, verifyResetToken } = useAuth();

    useEffect(() => {
        const validateToken = async () => {
            try {
                await verifyResetToken(token);
            } catch (error) {
                setIsValidToken(false);
                toast.error('Invalid or expired reset token');
            }
        };

        if (token) {
            validateToken();
        }
    }, [token, verifyResetToken]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const validateForm = () => {
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return false;
        }
        if (formData.password.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            await resetPassword(token, formData.password);
            setIsSuccess(true);
            toast.success('Password reset successfully!');
        } catch (error) {
            toast.error(error.message || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isValidToken) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '64px', color: '#ef4444', marginBottom: '24px' }}>
                            <FiX />
                        </div>
                        <h2 className="auth-title">Invalid Reset Link</h2>
                        <p className="auth-subtitle">
                            This password reset link is invalid or has expired.
                        </p>
                        <div style={{ marginTop: '32px' }}>
                            <Link to="/forgot-password" className="btn btn-primary">
                                Request new reset link
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '64px', color: '#10b981', marginBottom: '24px' }}>
                            <FiCheckCircle />
                        </div>
                        <h2 className="auth-title">Password Reset Successfully!</h2>
                        <p className="auth-subtitle">
                            Your password has been updated. You can now sign in with your new password.
                        </p>
                        <div style={{ marginTop: '32px' }}>
                            <Link to="/login" className="btn btn-primary">
                                Sign in
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                {/* Header */}
                <div className="auth-header">
                    <div className="auth-logo">
                        <FiLock style={{ width: '32px', height: '32px' }} />
                    </div>
                    <h2 className="auth-title">Reset your password</h2>
                    <p className="auth-subtitle">
                        Enter your new password below.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="password" className="form-label">
                            New password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="Enter your new password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="btn-icon"
                            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8' }}
                        >
                            {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                        </button>
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword" className="form-label">
                            Confirm new password
                        </label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            required
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="Confirm your new password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="btn-icon"
                            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8' }}
                        >
                            {showConfirmPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="auth-submit"
                    >
                        {isLoading ? (
                            <div className="loading">
                                <div className="loading-spinner"></div>
                                Updating password...
                            </div>
                        ) : (
                            'Update password'
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="auth-footer">
                    <p>
                        Remember your password?{' '}
                        <Link to="/login">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
