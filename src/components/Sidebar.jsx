import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const userNav = [
  { label: 'Dashboard', icon: '📊', path: '/dashboard' },
  { label: 'Schedule',  icon: '📅', path: '/schedule' },
  { label: 'My Bookings', icon: '🗓️', path: '/my-bookings' },
  { label: 'Profile', icon: '👤', path: '/profile' },
];

const adminNav = [
  { label: 'Dashboard', icon: '📊', path: '/admin/dashboard', section: 'OVERVIEW' },
  { label: 'Manage Bookings', icon: '📋', path: '/admin/bookings', section: 'MANAGEMENT' },
  { label: 'Manage Slots', icon: '🕐', path: '/admin/slots' },
  { label: 'Users', icon: '👥', path: '/admin/users' },
  { label: 'Settings', icon: '⚙️', path: '/admin/rules' },
];

export default function Sidebar() {
  const { profile, user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const nav = isAdmin ? adminNav : userNav;
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <aside className="sidebar">
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
              onClick={() => navigate(item.path)}
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
        <button className="sidebar-item" style={{ marginTop: 6, color: '#F87171' }} onClick={() => { logout(); navigate('/'); }}>
          <span className="sidebar-item-icon">🚪</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
