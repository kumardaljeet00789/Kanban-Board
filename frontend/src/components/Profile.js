import React, { useState, useEffect } from 'react';
import { FiUser, FiMail, FiPhone, FiMapPin, FiEdit3, FiSave, FiX, FiCamera, FiMoon, FiSun, FiBell, FiGlobe, FiShield, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user, updateProfile, changePassword, deleteAccount, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    phone: '',
    location: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [preferences, setPreferences] = useState({
    theme: 'light',
    notifications: true,
    language: 'en'
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        bio: user.profile?.bio || '',
        phone: user.profile?.phone || '',
        location: user.profile?.location || ''
      });
      setPreferences({
        theme: user.preferences?.theme || 'light',
        notifications: user.preferences?.notifications !== false,
        language: user.preferences?.language || 'en'
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences({
      ...preferences,
      [key]: value
    });
  };

  const handleProfileSave = async () => {
    try {
      await updateProfile(profileData);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    }
  };

  const handlePasswordSave = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setIsChangingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to change password');
    }
  };

  const handleAccountDelete = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await deleteAccount();
        toast.success('Account deleted successfully');
      } catch (error) {
        toast.error(error.message || 'Failed to delete account');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <style>
        {`
          :root {
            --bg-primary: #ffffff;
            --bg-secondary: #f8fafc;
            --bg-tertiary: #f1f5f9;
            --text-primary: #1e293b;
            --text-secondary: #64748b;
            --border-color: #e2e8f0;
            --primary-color: #3b82f6;
            --accent-color: #8b5cf6;
            --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          }

          .profile-container {
            min-height: 100vh;
            background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
            padding: 24px;
          }

          .profile-header {
            background: var(--bg-primary);
            border-radius: 16px;
            box-shadow: var(--shadow-md);
            border: 1px solid var(--border-color);
            margin-bottom: 32px;
            overflow: hidden;
          }

          .profile-header-content {
            padding: 32px;
            text-align: center;
          }

          .profile-avatar-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
          }

          .profile-avatar {
            position: relative;
            display: inline-block;
          }

          .profile-avatar-text {
            width: 120px;
            height: 120px;
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 48px;
            font-weight: 700;
            box-shadow: var(--shadow-lg);
          }

          .profile-avatar-camera {
            position: absolute;
            bottom: 0;
            right: 0;
            width: 40px;
            height: 40px;
            background: var(--bg-primary);
            border: 3px solid var(--border-color);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: var(--shadow-sm);
          }

          .profile-avatar-camera:hover {
            border-color: var(--primary-color);
            color: var(--primary-color);
            transform: scale(1.1);
          }

          .profile-name {
            font-size: 32px;
            font-weight: 700;
            color: var(--text-primary);
            margin: 0;
          }

          .profile-email {
            font-size: 18px;
            color: var(--text-secondary);
            margin: 0;
          }

          .profile-content {
            display: grid;
            grid-template-columns: 300px 1fr;
            gap: 32px;
            max-width: 1200px;
            margin: 0 auto;
          }

          .profile-sidebar {
            display: flex;
            flex-direction: column;
            gap: 24px;
          }

          .profile-sidebar-section {
            background: var(--bg-primary);
            border-radius: 16px;
            padding: 24px;
            box-shadow: var(--shadow-sm);
            border: 1px solid var(--border-color);
          }

          .profile-sidebar-title {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 18px;
            font-weight: 600;
            color: var(--text-primary);
            margin: 0 0 20px 0;
          }

          .profile-sidebar-title svg {
            color: var(--primary-color);
          }

          .profile-sidebar-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid var(--border-color);
          }

          .profile-sidebar-item:last-child {
            border-bottom: none;
          }

          .profile-sidebar-label {
            font-size: 14px;
            color: var(--text-secondary);
            font-weight: 500;
          }

          .profile-sidebar-value {
            font-size: 14px;
            color: var(--text-primary);
            font-weight: 600;
          }

          .profile-main {
            background: var(--bg-primary);
            border-radius: 16px;
            padding: 32px;
            box-shadow: var(--shadow-sm);
            border: 1px solid var(--border-color);
          }

          .profile-tabs {
            display: flex;
            gap: 8px;
            margin-bottom: 32px;
            border-bottom: 2px solid var(--border-color);
          }

          .profile-tab {
            padding: 12px 24px;
            background: none;
            border: none;
            color: var(--text-secondary);
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            border-bottom: 2px solid transparent;
            margin-bottom: -2px;
          }

          .profile-tab:hover {
            color: var(--text-primary);
          }

          .profile-tab.active {
            color: var(--primary-color);
            border-bottom-color: var(--primary-color);
          }

          .profile-tab-content {
            min-height: 400px;
          }

          .profile-section {
            margin-bottom: 40px;
          }

          .profile-section-title {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 20px;
            font-weight: 600;
            color: var(--text-primary);
            margin: 0 0 24px 0;
          }

          .profile-section-title svg {
            color: var(--primary-color);
          }

          .profile-form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 24px;
          }

          .profile-form-full {
            grid-column: 1 / -1;
          }

          .profile-actions {
            display: flex;
            gap: 16px;
            justify-content: flex-end;
            padding-top: 24px;
            border-top: 1px solid var(--border-color);
          }

          .profile-preference-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 0;
            border-bottom: 1px solid var(--border-color);
          }

          .profile-preference-item:last-child {
            border-bottom: none;
          }

          .profile-preference-label {
            font-size: 16px;
            color: var(--text-primary);
            font-weight: 500;
          }

          .profile-preference-control {
            display: flex;
            align-items: center;
          }

          .profile-theme-toggle {
            display: flex;
            background: var(--bg-tertiary);
            border-radius: 8px;
            padding: 4px;
            gap: 4px;
          }

          .profile-theme-option {
            width: 40px;
            height: 40px;
            border: none;
            background: transparent;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .profile-theme-option:hover {
            color: var(--text-primary);
          }

          .profile-theme-option.active {
            background: var(--primary-color);
            color: white;
          }

          .profile-toggle {
            width: 48px;
            height: 24px;
            background: var(--border-color);
            border-radius: 12px;
            position: relative;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .profile-toggle.active {
            background: var(--primary-color);
          }

          .profile-toggle-slider {
            width: 20px;
            height: 20px;
            background: white;
            border-radius: 50%;
            position: absolute;
            top: 2px;
            left: 2px;
            transition: all 0.2s ease;
            box-shadow: var(--shadow-sm);
          }

          .profile-toggle.active .profile-toggle-slider {
            transform: translateX(24px);
          }

          .profile-language-select {
            padding: 8px 12px;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            background: var(--bg-primary);
            color: var(--text-primary);
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .profile-language-select:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
          }

          .profile-danger-zone {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 12px;
            padding: 24px;
            margin-top: 32px;
          }

          .profile-danger-zone-title {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 18px;
            font-weight: 600;
            color: #dc2626;
            margin: 0 0 12px 0;
          }

          .profile-danger-zone-title svg {
            color: #dc2626;
          }

          .profile-danger-zone-description {
            color: #7f1d1d;
            margin: 0 0 20px 0;
            line-height: 1.5;
          }

          @media (max-width: 1024px) {
            .profile-content {
              grid-template-columns: 1fr;
              gap: 24px;
            }

            .profile-sidebar {
              order: 2;
            }

            .profile-main {
              order: 1;
            }
          }

          @media (max-width: 768px) {
            .profile-container {
              padding: 16px;
            }

            .profile-header-content {
              padding: 24px 16px;
            }

            .profile-avatar-text {
              width: 100px;
              height: 100px;
              font-size: 36px;
            }

            .profile-name {
              font-size: 24px;
            }

            .profile-main {
              padding: 24px 16px;
            }

            .profile-form-grid {
              grid-template-columns: 1fr;
              gap: 20px;
            }

            .profile-tabs {
              overflow-x: auto;
              padding-bottom: 8px;
            }

            .profile-tab {
              white-space: nowrap;
              padding: 12px 16px;
            }
          }

          @media (max-width: 480px) {
            .profile-actions {
              flex-direction: column;
            }

            .profile-actions .btn {
              width: 100%;
            }
          }

          /* Input and Button Styles */
          input, textarea, select {
            width: 100%;
            padding: 12px;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            font-size: 14px;
            transition: all 0.2s ease;
          }

          input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
          }

          button {
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .btn-primary {
            background: var(--primary-color);
            color: white;
            border: none;
          }

          .btn-primary:hover {
            background: #2563eb;
          }

          .btn-secondary {
            background: var(--bg-tertiary);
            color: var(--text-primary);
            border: 1px solid var(--border-color);
          }

          .btn-secondary:hover {
            background: var(--bg-secondary);
          }

          .btn-danger {
            background: #dc2626;
            color: white;
            border: none;
          }

          .btn-danger:hover {
            background: #b91c1c;
          }
        `}
      </style>

      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-header-content">
            <div className="profile-avatar-section">
              <div className="profile-avatar">
                <div className="profile-avatar-text">
                  {user.profile?.firstName?.[0] || user.email[0].toUpperCase()}
                </div>
                <button className="profile-avatar-camera">
                  <FiCamera />
                </button>
              </div>
              <h2 className="profile-name">
                {user.profile?.firstName && user.profile?.lastName
                  ? `${user.profile.firstName} ${user.profile.lastName}`
                  : user.email}
              </h2>
              <p className="profile-email">{user.email}</p>
              {user.profile?.bio && <p>{user.profile.bio}</p>}
            </div>
            <div className="profile-actions">
              <button onClick={handleLogout} className="btn-danger">Logout</button>
            </div>
          </div>
        </div>

        <div className="profile-content">
          <div className="profile-sidebar">
            <div className="profile-sidebar-section">
              <h3 className="profile-sidebar-title">
                <FiUser /> Personal Info
              </h3>
              <div className="profile-sidebar-item">
                <span className="profile-sidebar-label">Email</span>
                <span className="profile-sidebar-value">{user.email}</span>
              </div>
              <div className="profile-sidebar-item">
                <span className="profile-sidebar-label">Phone</span>
                <span className="profile-sidebar-value">{user.profile?.phone || 'Not set'}</span>
              </div>
              <div className="profile-sidebar-item">
                <span className="profile-sidebar-label">Location</span>
                <span className="profile-sidebar-value">{user.profile?.location || 'Not set'}</span>
              </div>
            </div>
          </div>

          <div className="profile-main">
            <div className="profile-section">
              <h3 className="profile-section-title">
                <FiUser /> Personal Information
              </h3>
              <div className="profile-form-grid">
                <div>
                  <label>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label>Location</label>
                  <input
                    type="text"
                    name="location"
                    value={profileData.location}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                  />
                </div>
                <div className="profile-form-full">
                  <label>Bio</label>
                  <textarea
                    name="bio"
                    value={profileData.bio}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    rows={3}
                  />
                </div>
              </div>
              <div className="profile-actions">
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="btn-secondary">
                    <FiEdit3 /> Edit Profile
                  </button>
                ) : (
                  <>
                    <button onClick={handleProfileSave} className="btn-primary">
                      <FiSave /> Save
                    </button>
                    <button onClick={() => setIsEditing(false)} className="btn-secondary">
                      <FiX /> Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="profile-section">
              <h3 className="profile-section-title">
                <FiShield /> Change Password
              </h3>
              {isChangingPassword ? (
                <div className="profile-form-grid">
                  <div>
                    <label>Current Password</label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                    />
                  </div>
                  <div>
                    <label>New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                    />
                  </div>
                  <div className="profile-form-full">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                    />
                  </div>
                  <div className="profile-actions">
                    <button onClick={handlePasswordSave} className="btn-primary">
                      <FiSave /> Save
                    </button>
                    <button
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }}
                      className="btn-secondary"
                    >
                      <FiX /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setIsChangingPassword(true)} className="btn-secondary">
                  <FiEdit3 /> Change Password
                </button>
              )}
            </div>

            <div className="profile-section">
              <h3 className="profile-section-title">
                <FiGlobe /> Preferences
              </h3>
              <div className="profile-preference-item">
                <div>
                  <h4>Theme</h4>
                  <p>Choose your preferred color scheme</p>
                </div>
                <select
                  value={preferences.theme}
                  onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                  className="profile-language-select"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
              <div className="profile-preference-item">
                <div>
                  <h4>Notifications</h4>
                  <p>Receive email and in-app notifications</p>
                </div>
                <label className="profile-toggle" htmlFor="notifications-toggle">
                  <input
                    id="notifications-toggle"
                    type="checkbox"
                    checked={preferences.notifications}
                    onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`profile-toggle-slider ${preferences.notifications ? 'active' : ''}`}></div>
                </label>
              </div>
              <div className="profile-preference-item">
                <div>
                  <h4>Language</h4>
                  <p>Choose your preferred language</p>
                </div>
                <select
                  value={preferences.language}
                  onChange={(e) => handlePreferenceChange('language', e.target.value)}
                  className="profile-language-select"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
            </div>

            <div className="profile-danger-zone">
              <h3 className="profile-danger-zone-title">
                <FiTrash2 /> Danger Zone
              </h3>
              <p className="profile-danger-zone-description">
                Permanently delete your account and all data
              </p>
              <button
                onClick={handleAccountDelete}
                disabled={isDeleting}
                className="btn-danger"
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
