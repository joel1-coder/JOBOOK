import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const userNav = [
  { label: 'Dashboard', icon: '📊', path: '/dashboard' },
  { label: 'Schedule',  icon: '📅', path: '/schedule' },
  { label: 'My Bookings', icon: '🗓️', path: '/my-bookings' },
  { label: 'Profile', icon: '👤', path: '/profile' },
];

const adminNav = [
  { label: 'Dashboard', icon: '📊', path: '/admin/dashboard', section: 'OVERVIEW' },
  { label: 'Manage Bookings', icon: '📋', path: '/admin/bookings', section: 'MANAGEMENT' },
  { label: 'Manage Rooms', icon: '🏢', path: '/admin/rooms' },
  { label: 'Manage Slots', icon: '🕐', path: '/admin/slots' },
  { label: 'Users', icon: '👥', path: '/admin/users' },
  { label: 'Settings', icon: '⚙️', path: '/admin/rules' },
];

export default function Sidebar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { profile, user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const nav = isAdmin ? adminNav : userNav;
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const handleNavClick = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Hamburger Button - Mobile Only */}
      <button 
        className="hamburger-btn"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        title={mobileMenuOpen ? 'Close menu' : 'Open menu'}
      >
        <span className="hamburger-icon"></span>
        <span className="hamburger-icon"></span>
        <span className="hamburger-icon"></span>
      </button>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-menu-overlay"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">🏢</div>
          <span className="sidebar-brand-name">JOBOOK</span>
        </div>

        <nav className="sidebar-nav">
          {nav.map((item) => (
            <div key={item.path}>
              {item.section && <div className="sidebar-label">{item.section}</div>}
              <button
                className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => handleNavClick(item.path)}
              >
                <span className="sidebar-item-icon">{item.icon}</span>
                {item.label}
              </button>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{displayName}</div>
              <div className="sidebar-user-role">{isAdmin ? 'Administrator' : 'Member'}</div>
            </div>
          </div>
          <button className="sidebar-item" style={{ marginTop: 6 }} onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
            <span className="sidebar-item-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
          <button className="sidebar-item" style={{ marginTop: 6, color: '#F87171' }} onClick={() => { logout(); navigate('/'); }}>
            <span className="sidebar-item-icon">🚪</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-nav">
        {nav.map(item => (
          <button
            key={item.path}
            className={`mobile-nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => handleNavClick(item.path)}
            style={{ background: 'transparent', border: 'none' }}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span>{item.label.split(' ')[0]}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
