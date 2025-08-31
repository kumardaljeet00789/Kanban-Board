import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { requestPasswordReset } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);

    try {
      await requestPasswordReset(email);
      setIsSubmitted(true);
      toast.success('Password reset link sent to your email!');
    } catch (error) {
      toast.error(error.message || 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <FiCheckCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Check your email</h2>
            <p className="text-gray-600 mb-6">
              We've sent a password reset link to <strong>{email}</strong>
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Didn't receive the email?</strong> Check your spam folder or{' '}
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="text-blue-600 hover:text-blue-700 font-medium underline"
                >
                  try again with a different email address
                </button>
              </p>
            </div>

            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              <FiArrowLeft className="h-4 w-4 mr-2" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        {isSubmitted ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', color: '#10b981', marginBottom: '24px' }}>
              <FiCheckCircle />
            </div>
            <h2 className="auth-title">Check your email</h2>
            <p className="auth-subtitle">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <div style={{ marginTop: '32px' }}>
              <Link to="/login" className="btn btn-primary">
                <FiArrowLeft style={{ marginRight: '8px' }} />
                Back to login
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="auth-header">
              <div className="auth-logo">
                <FiMail style={{ width: '32px', height: '32px' }} />
              </div>
              <h2 className="auth-title">Forgot your password?</h2>
              <p className="auth-subtitle">
                No worries, we'll send you reset instructions.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="Enter your email"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="auth-submit"
              >
                {isLoading ? (
                  <div className="loading">
                    <div className="loading-spinner"></div>
                    Sending...
                  </div>
                ) : (
                  'Send reset instructions'
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
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
