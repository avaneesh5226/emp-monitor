import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  Briefcase, 
  Search, 
  Bell, 
  Settings as SettingsIcon,
  ShieldAlert,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './DashboardLayout.css';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout-container">
      {/* Top Navigation Bar */}
      <header className="top-nav-bar">
        <div className="nav-container">
          {/* Logo Section */}
          <div className="nav-brand">
            <div className="logo-icon">
              <ShieldAlert size={18} strokeWidth={2.5} />
            </div>
            <h2 className="logo-text">EmpMonitor</h2>
          </div>
          
          {/* Main Horizontal Menu */}
          <nav className="horizontal-nav">
            <NavLink to="/dashboard" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <LayoutDashboard size={18} className="nav-icon" />
              <span>Dashboard</span>
            </NavLink>
            {user?.role === 'admin' && (
              <>
                <NavLink to="/employees" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
                  <Users size={18} className="nav-icon" />
                  <span>Employees</span>
                </NavLink>
                <NavLink to="/attendance" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
                  <Clock size={18} className="nav-icon" />
                  <span>Attendance</span>
                </NavLink>
              </>
            )}
            <NavLink to="/projects" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Briefcase size={18} className="nav-icon" />
              <span>Projects</span>
            </NavLink>
          </nav>

          {/* Right side actions */}
          <div className="nav-actions">
            <div className="header-search">
              <Search size={16} className="search-icon" />
              <input type="text" placeholder="Search..." className="search-input" />
            </div>
            
            {user?.role === 'admin' && (
              <>
                <NavLink to="/alerts" className={({isActive}) => isActive ? "icon-btn active" : "icon-btn"}>
                  <Bell size={20} />
                </NavLink>
                <NavLink to="/settings" className={({isActive}) => isActive ? "icon-btn active" : "icon-btn"}>
                  <SettingsIcon size={20} />
                </NavLink>
              </>
            )}

            <div 
              className="user-profile" 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{ position: 'relative' }}
            >
              <div className="avatar">{user?.username ? user.username.charAt(0).toUpperCase() : 'A'}</div>
              <ChevronDown size={16} className="user-chevron" />
              
              {showProfileMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.5rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  padding: '0.5rem',
                  minWidth: '150px',
                  zIndex: 100
                }}>
                  <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{user?.username || 'Admin'}</p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    style={{ 
                      width: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      padding: '0.5rem',
                      color: 'var(--danger-color)',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      borderRadius: 'var(--border-radius-sm)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#fef2f2'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Centered Container */}
      <main className="main-content">
        <div className="content-container">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
