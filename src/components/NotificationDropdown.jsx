import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, CircleAlert, Clock3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/supabaseService';

export default function NotificationDropdown() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (!user?.id) return;

    // Load initial notifications
    const loadNotifications = async () => {
      const { data } = await notificationService.getNotifications(user.id);
      setNotifications(data || []);
    };
    loadNotifications();

    // Refresh notifications periodically (every 30 seconds)
    const interval = setInterval(loadNotifications, 30000);

    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    await notificationService.markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const notificationIcon = (type = '') => {
    if (type.includes('approved')) return <CheckCircle2 size={18} color="var(--clr-success)" aria-hidden="true" />;
    if (type.includes('rejected')) return <CircleAlert size={18} color="var(--clr-danger)" aria-hidden="true" />;
    return <Clock3 size={18} color="var(--clr-warning)" aria-hidden="true" />;
  };

  return (
    <div className="header-notif" ref={dropdownRef} onClick={() => setIsOpen(!isOpen)} style={{ position: 'relative' }} title="Notifications" aria-label="Notifications">
      <Bell size={18} aria-hidden="true" />
      {unreadCount > 0 && <span className="header-notif-dot" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 800, width: 16, height: 16, right: -4, top: -4 }}>{unreadCount}</span>}

      {isOpen && (
        <div style={{
          position: 'absolute', top: 46, right: 0, width: 320, background: 'var(--clr-surface)',
          border: '1px solid var(--clr-border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
          zIndex: 1000, overflow: 'hidden', cursor: 'default'
        }} onClick={e => e.stopPropagation()}>
          
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--clr-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--clr-surface2)' }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications</span>
            {unreadCount > 0 && (
              <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 8px', borderRadius: 4 }} onClick={handleMarkAllAsRead}>
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--clr-text-muted)', fontSize: 13 }}>
                You have no notifications yet.
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} onClick={() => handleMarkAsRead(n.id)} style={{
                  padding: '16px', borderBottom: '1px solid var(--clr-border)',
                  background: n.is_read ? 'transparent' : 'rgba(79, 70, 229, 0.04)',
                  cursor: 'pointer', transition: 'background .2s', display: 'flex', gap: 12
                }}>
                  <div style={{ width: 22, display: 'flex', justifyContent: 'center', paddingTop: 1, flexShrink: 0 }}>
                    {notificationIcon(n.type)}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: n.is_read ? 500 : 700, color: 'var(--clr-text)' }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--clr-text-muted)', marginTop: 2, lineHeight: 1.4 }}>{n.message}</div>
                    <div style={{ fontSize: 11, color: 'var(--clr-text-light)', marginTop: 6 }}>
                      {new Date(n.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
