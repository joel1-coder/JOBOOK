import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { bookingService } from '../services/supabaseService';

export default function ManageBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    bookingService.getAllBookings().then(({ data }) => {
      setBookings(data || []);
      setLoading(false);
    });
  }, []);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    setError('');
    const { error: err } = await bookingService.updateBookingStatus(id, status);
    setUpdating(null);
    
    if (err) {
      setError('Failed to update booking: ' + err.message);
      return;
    }
    
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  const filtered = bookings.filter(b => {
    const matchStatus = filter === 'all' || b.status === filter;
    const matchSearch =
      b.rooms?.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.booking_ref?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const statusBadge = (s) => {
    const map = { confirmed: 'badge-success', completed: 'badge-info', cancelled: 'badge-danger', pending: 'badge-warning' };
    return <span className={`badge ${map[s] || 'badge-muted'}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>;
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <div>
            <div className="page-title">Manage Bookings</div>
            <div className="page-subtitle">Review and control all room reservations</div>
          </div>
          <button className="btn btn-primary">+ Export CSV</button>
        </div>

        <div className="page-body">
          {error && <div className="alert alert-danger">{error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'All', value: bookings.length, color: '#EEF2FF', key: 'all' },
              { label: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length, color: '#DCFCE7', key: 'confirmed' },
              { label: 'Pending', value: bookings.filter(b => b.status === 'pending').length, color: '#FEF3C7', key: 'pending' },
              { label: 'Cancelled', value: bookings.filter(b => b.status === 'cancelled').length, color: '#FEE2E2', key: 'cancelled' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '16px 20px', cursor: 'pointer' }} onClick={() => setFilter(s.key)}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{s.label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>{loading ? '…' : s.value}</div>
              </div>
            ))}
          </div>

          <div className="toolbar">
            <div className="search-box">
              <span>🔍</span>
              <input placeholder="Search by room, user, or ID…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Booking ID</th><th>Room</th><th>User</th><th>Date</th><th>Slot</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--clr-text-muted)' }}>Loading bookings…</td></tr>
                  ) : filtered.map(b => (
                    <tr key={b.id}>
                      <td><code style={{ fontSize: 12, background: 'var(--clr-surface2)', padding: '2px 7px', borderRadius: 4 }}>{b.booking_ref}</code></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18 }}>{b.rooms?.emoji || '🏢'}</span>
                          <span style={{ fontWeight: 500 }}>{b.rooms?.name || '—'}</span>
                        </div>
                      </td>
                      <td>{b.profiles?.full_name || '—'}</td>
                      <td style={{ color: 'var(--clr-text-muted)', fontSize: 13 }}>{b.date}</td>
                      <td style={{ fontSize: 13 }}>{b.time_slots?.label || '—'}</td>
                      <td>{statusBadge(b.status)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {b.status === 'pending' && (
                            <>
                              <button className="btn btn-success btn-sm" disabled={updating === b.id} onClick={() => updateStatus(b.id, 'confirmed')}>✓ {updating === b.id ? 'Updating...' : 'Approve'}</button>
                              <button className="btn btn-danger btn-sm" disabled={updating === b.id} onClick={() => updateStatus(b.id, 'cancelled')}>✕ {updating === b.id ? 'Updating...' : 'Reject'}</button>
                            </>
                          )}
                          {b.status === 'confirmed' && (
                            <button className="btn btn-danger btn-sm" disabled={updating === b.id} onClick={() => updateStatus(b.id, 'cancelled')}>{updating === b.id ? 'Updating...' : 'Cancel'}</button>
                          )}
                          {(b.status === 'cancelled' || b.status === 'completed') && (
                            <span style={{ fontSize: 12, color: 'var(--clr-text-light)' }}>—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && filtered.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--clr-text-muted)' }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
                  <p>No bookings match your filters</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
