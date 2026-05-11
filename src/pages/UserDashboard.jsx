import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationDropdown from '../components/NotificationDropdown';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function UserDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomError, setRoomError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    const loadRooms = async () => {
      setLoadingRooms(true);
      const { data, error } = await supabase.from('rooms').select('*').order('name');
      if (error) setRoomError(error.message);
      else setRooms(data || []);
      setLoadingRooms(false);
    };

    const loadBookings = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('bookings')
        .select('*, rooms(name, emoji), time_slots(label, start_time, end_time)')
        .eq('user_id', user.id)
        .in('status', ['pending', 'confirmed'])
        .order('date', { ascending: true })
        .limit(3);
      setBookings(data || []);
    };

    loadRooms();
    loadBookings();
  }, [user]);

  const availableCount = rooms.filter(r => r.available).length;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <div style={{ minWidth: 0 }}>
            <div className="page-title">Dashboard Overview</div>
            <div className="page-subtitle">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
          <div className="header-actions" style={{ flexShrink: 0 }}>
            <NotificationDropdown />
            <div className="header-avatar">{(profile?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}</div>
          </div>
        </div>

        <div className="page-body">
          {toast && <div className="alert alert-success">{toast}</div>}

          {/* Welcome Banner */}
          <div style={{ background: 'linear-gradient(135deg,#4F46E5,#6D28D9)', borderRadius: 'var(--radius)', padding: '28px 32px', color: '#fff', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -20, top: -20, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,.07)' }} />
            <div style={{ position: 'absolute', right: 60, bottom: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />
            <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6, position: 'relative' }}>
              Welcome, {profile?.full_name?.split(' ')[0] || 'User'}! 👋
            </h2>
            <p style={{ fontSize: 14, opacity: .85, position: 'relative' }}>
              You have <strong style={{ color: '#A5B4FC' }}>{bookings.length} active</strong> bookings · <strong style={{ color: '#A5B4FC' }}>{availableCount}</strong> rooms available
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 20, position: 'relative' }}>
              <button className="btn" style={{ background: 'rgba(255,255,255,.2)', color: '#fff', border: '1px solid rgba(255,255,255,.3)' }}
                onClick={() => document.getElementById('rooms-section')?.scrollIntoView({ behavior: 'smooth' })}>
                🏢 Book a Room
              </button>
              <button className="btn" style={{ background: 'rgba(255,255,255,.12)', color: '#fff', border: '1px solid rgba(255,255,255,.2)' }}
                onClick={() => navigate('/my-bookings')}>
                📅 My Bookings
              </button>
            </div>
          </div>

          {/* Active Bookings */}
          {bookings.length > 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>📅 Active Bookings</h3>
              {bookings.map(b => (
                <div key={b.id} className="booking-card">
                  <div className="booking-thumb">{b.rooms?.emoji || '🏢'}</div>
                  <div className="booking-info">
                    <div className="booking-name">{b.rooms?.name}</div>
                    <div className="booking-meta">
                      <span>📆 {b.date}</span>
                      {b.time_slots && <span>🕐 {b.time_slots.start_time} – {b.time_slots.end_time}</span>}
                    </div>
                  </div>
                  <span className={`badge ${b.status === 'confirmed' ? 'badge-success' : 'badge-warning'}`}>
                    {b.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Rooms Section */}
          <div id="rooms-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700 }}>🏢 Available Rooms</h3>
              <span className="badge badge-primary">{availableCount} available</span>
            </div>

            {loadingRooms && (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--clr-text-muted)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                <p>Loading rooms…</p>
              </div>
            )}

            {!loadingRooms && roomError && (
              <div className="alert alert-danger">
                ❌ Could not load rooms: {roomError}
                <button className="btn btn-sm btn-outline" style={{ marginLeft: 'auto' }} onClick={() => window.location.reload()}>Retry</button>
              </div>
            )}

            {!loadingRooms && !roomError && rooms.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--clr-text-muted)', background: 'var(--clr-surface)', borderRadius: 'var(--radius)', border: '1px dashed var(--clr-border)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🏢</div>
                <p style={{ fontWeight: 600 }}>No rooms found</p>
                <p style={{ fontSize: 13, marginTop: 4 }}>The admin may not have added any rooms yet.</p>
              </div>
            )}

            {!loadingRooms && !roomError && rooms.length > 0 && (
              <div className="room-grid">
                {rooms.map(room => (
                  <div key={room.id} className="room-card">
                    <div className="room-img" style={{
                      background: room.available
                        ? 'linear-gradient(135deg,#4F46E5,#818CF8)'
                        : 'linear-gradient(135deg,#94A3B8,#CBD5E1)'
                    }}>
                      <span style={{ fontSize: 48 }}>{room.emoji}</span>
                    </div>
                    <div className="room-card-body">
                      <div className="room-card-name">{room.name}</div>
                      <div className="room-card-meta">👥 {room.capacity} · {room.floor} · {room.building}</div>
                      <p style={{ fontSize: 12, color: 'var(--clr-text-muted)', marginTop: 8, lineHeight: 1.5 }}>{room.description}</p>
                    </div>
                    <div className="room-card-footer">
                      <span className={`badge ${room.available ? 'badge-success' : 'badge-muted'}`}>
                        {room.available ? '✅ Available' : '⛔ Occupied'}
                      </span>
                      {room.available && (
                        <button className="btn btn-primary btn-sm" onClick={() => navigate(`/book/${room.id}`)}>
                          Book Now →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
