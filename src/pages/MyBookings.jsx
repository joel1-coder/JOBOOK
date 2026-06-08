import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { bookingService } from '../services/mongodbService';

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    bookingService.getUserBookings(user.id).then(({ data }) => {
      setBookings(data || []);
      setLoading(false);
    });
  }, [user]);

  const handleCancel = async (id) => {
    await bookingService.updateBookingStatus(id, 'cancelled');
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
  };

  const filtered = bookings.filter(b => {
    const matchStatus = filter === 'all' || b.status === filter;
    const matchSearch = b.rooms?.name?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const statusBadge = (s) => {
    const map = { confirmed: 'badge-success', completed: 'badge-info', cancelled: 'badge-danger', pending: 'badge-warning' };
    return <span className={`badge ${map[s] || 'badge-muted'}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>;
  };

  const counts = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };
  const roomImage = (room) => room?.image_url || '/sjc-trichy.avif';

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <div>
            <div className="page-title">My Bookings</div>
            <div className="page-subtitle">Manage your room reservations</div>
          </div>
        </div>

        <div className="page-body">
          {/* Stat cards — 4-col desktop, 2-col mobile */}
          <div className="bookings-stats-grid" style={{ marginBottom: 24 }}>
            {[
              { label: 'Total', value: counts.total, accent: '#6366F1' },
              { label: 'Confirmed', value: counts.confirmed, accent: '#10B981' },
              { label: 'Completed', value: counts.completed, accent: '#3B82F6' },
              { label: 'Cancelled', value: counts.cancelled, accent: '#EF4444' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '16px 20px', borderTop: `3px solid ${s.accent}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{s.label}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: s.accent }}>{s.value}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Search + filter pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            <div className="search-box" style={{ maxWidth: '100%' }}>
              <input placeholder="Search bookings…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['all', 'confirmed', 'pending', 'completed', 'cancelled'].map(f => (
                <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? (
              <p style={{ padding: 40, textAlign: 'center', color: 'var(--clr-text-muted)' }}>Loading bookings…</p>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--clr-text-muted)' }}>
                <p>No bookings found</p>
              </div>
            ) : filtered.map(b => (
              <div key={b.id} className="booking-card" style={{ borderRadius: 0, borderBottom: '1px solid var(--clr-border)', margin: 0 }}>
                <img className="booking-thumb" src={roomImage(b.rooms)} alt={b.rooms?.name || 'Room'} />
                <div className="booking-info">
                  <div className="booking-name">{b.rooms?.name || 'Unknown Room'}</div>
                  <div className="booking-meta">
                    <span>{b.booking_ref}</span>
                    <span>{b.date}</span>
                    <span>{b.time_slots?.label || '—'}</span>
                  </div>
                </div>
                {statusBadge(b.status)}
                {b.status === 'confirmed' && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleCancel(b.id)}>Cancel</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
