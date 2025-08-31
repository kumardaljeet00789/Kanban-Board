import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Configure axios defaults
  useEffect(() => {
    console.log('🔑 AuthContext - Setting axios headers with token:', token ? 'YES' : 'NO');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('🔑 AuthContext - Axios headers set:', axios.defaults.headers.common);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      console.log('🔑 AuthContext - Axios headers cleared');
    }
  }, [token]);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/me`);
          if (response.data.success) {
            setUser(response.data.data);
          } else {
            throw new Error('Auth check failed');
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      console.log('🔑 AuthContext - Login attempt for:', email);
      console.log('🔑 AuthContext - REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
        email,
        password
      });

      console.log('🔑 AuthContext - Login response:', response.data);

      if (response.data.success) {
        const { token: newToken, user: userData } = response.data.data;

        console.log('🔑 AuthContext - Token received:', newToken ? 'YES' : 'NO');
        console.log('🔑 AuthContext - User data received:', userData ? 'YES' : 'NO');

        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);

        return { success: true };
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('🔑 AuthContext - Login error:', error);
      const message = error.response?.data?.message || error.message || 'Login failed';
      throw new Error(message);
    }
  };

  const register = async (userData) => {
    try {
      console.log('Registering user:', process.env.REACT_APP_API_URL);
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/register`, userData);

      if (response.data.success) {
        const { token: newToken, user: newUser } = response.data.data;

        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(newUser);

        return { success: true };
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      throw new Error(message);
    }
  };

  const socialLogin = async (provider) => {
    try {
      // For social login, we'll redirect to the backend OAuth endpoint
      const authUrl = `${process.env.REACT_APP_API_URL}/api/auth/${provider}`;
      window.location.href = authUrl;
    } catch (error) {
      const message = error.response?.data?.message || `${provider} login failed`;
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/logout`);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/auth/profile`, profileData);
      setUser(response.data.user);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile';
      throw new Error(message);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/auth/change-password`, {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to change password';
      throw new Error(message);
    }
  };

  const requestPasswordReset = async (email) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/forgot-password`, { email });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send password reset email';
      throw new Error(message);
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/reset-password`, {
        token,
        newPassword
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to reset password';
      throw new Error(message);
    }
  };

  const verifyResetToken = async (token) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/verify-reset-token/${token}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid reset token';
      throw new Error(message);
    }
  };

  const verifyEmail = async (token) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/verify-email/${token}`);
      if (response.data.user) {
        setUser(response.data.user);
      }
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to verify email';
      throw new Error(message);
    }
  };

  const resendVerificationEmail = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/resend-verification`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resend verification email';
      throw new Error(message);
    }
  };

  const refreshToken = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/refresh-token`);
      const { token: newToken } = response.data;

      localStorage.setItem('token', newToken);
      setToken(newToken);

      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to refresh token';
      throw new Error(message);
    }
  };

  const deleteAccount = async () => {
    try {
      const response = await axios.delete(`${process.env.REACT_APP_API_URL}/api/auth/account`);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete account';
      throw new Error(message);
    }
  };

  const value = {
    user,
    loading,
    token,
    login,
    register,
    socialLogin,
    logout,
    updateProfile,
    changePassword,
    requestPasswordReset,
    resetPassword,
    verifyResetToken,
    verifyEmail,
    resendVerificationEmail,
    refreshToken,
    deleteAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
