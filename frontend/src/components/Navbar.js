import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiUser, FiLogOut, FiMenu, FiX, FiPlus, FiBell } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/dashboard" className="navbar-brand">
            Kanban Board
          </Link>
          
          <div className="navbar-nav">
            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
              <FiHome style={{ marginRight: '8px' }} />
              Dashboard
            </Link>
            <Link to="/profile" className={`nav-link ${isActive('/profile') ? 'active' : ''}`}>
              <FiUser style={{ marginRight: '8px' }} />
              Profile
            </Link>
            <button className="btn-icon" title="Notifications">
              <FiBell />
            </button>
            <div className="nav-user">
              <span>{user?.profile?.firstName || user?.username || user?.email}</span>
              <button onClick={handleLogout} className="btn btn-secondary">
                <FiLogOut style={{ marginRight: '8px' }} />
                Logout
              </button>
            </div>
          </div>
          
          <button className="navbar-toggle" onClick={toggleMenu}>
            {isMenuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
