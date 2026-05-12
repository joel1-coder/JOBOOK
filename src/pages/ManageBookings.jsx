import { useState, useEffect } from 'react';
import { FileSpreadsheet, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
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
    bookingService.getAllBookings().then(({ data, error: loadError }) => {
      if (loadError) setError('Could not load bookings: ' + loadError.message);
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

  const deleteBooking = async (booking) => {
    if (!window.confirm(`Delete booking ${booking.booking_ref || ''}? This cannot be undone.`)) return;
    setUpdating(booking.id);
    setError('');
    const { error: err } = await bookingService.deleteBooking(booking.id);
    setUpdating(null);

    if (err) {
      setError('Failed to delete booking: ' + err.message);
      return;
    }

    setBookings(prev => prev.filter(b => b.id !== booking.id));
  };

  const filtered = bookings.filter(b => {
    const matchStatus = filter === 'all' || b.status === filter;
    const matchSearch =
      b.rooms?.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.booking_ref?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });
  const roomImage = (room) => room?.image_url || '/sjc-trichy.avif';

  const statusBadge = (s) => {
    const map = { confirmed: 'badge-success', completed: 'badge-info', cancelled: 'badge-danger', pending: 'badge-warning' };
    return <span className={`badge ${map[s] || 'badge-muted'}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>;
  };

  const exportExcel = () => {
    try {
      // Prepare data for export
      const data = filtered.map(b => ({
        'Booking ID': b.booking_ref || '-',
        'Room': b.rooms?.name || '-',
        'User': b.profiles?.full_name || '-',
        'Date': b.date || '-',
        'Slot': b.time_slots?.label || '-',
        'Status': b.status ? b.status.charAt(0).toUpperCase() + b.status.slice(1) : '-',
      }));

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Bookings');

      // Style the header row
      ws['!cols'] = [
        { wch: 15 }, // Booking ID
        { wch: 20 }, // Room
        { wch: 20 }, // User
        { wch: 12 }, // Date
        { wch: 15 }, // Slot
        { wch: 12 }, // Status
      ];

      // Generate filename with current date
      const filename = `jobook-bookings-${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export Excel file. Please try again.');
    }
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
          <button className="btn btn-primary" onClick={exportExcel}>
            <FileSpreadsheet size={16} aria-hidden="true" />
            Excel Sheet
          </button>
        </div>

        <div className="page-body">
          {error && <div className="alert alert-danger">{error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'All', value: bookings.length, color: 'linear-gradient(135deg,rgba(99,102,241,.24),rgba(99,102,241,.08))', accent: '#A5B4FC', key: 'all' },
              { label: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length, color: 'linear-gradient(135deg,rgba(16,185,129,.24),rgba(16,185,129,.08))', accent: '#6EE7B7', key: 'confirmed' },
              { label: 'Pending', value: bookings.filter(b => b.status === 'pending').length, color: 'linear-gradient(135deg,rgba(245,158,11,.26),rgba(245,158,11,.08))', accent: '#FCD34D', key: 'pending' },
              { label: 'Cancelled', value: bookings.filter(b => b.status === 'cancelled').length, color: 'linear-gradient(135deg,rgba(239,68,68,.25),rgba(239,68,68,.08))', accent: '#FCA5A5', key: 'cancelled' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '16px 20px', cursor: 'pointer', borderTop: `3px solid ${s.accent}`, background: s.color }} onClick={() => setFilter(s.key)}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#C7D2FE', textTransform: 'uppercase', letterSpacing: '.04em' }}>{s.label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>{loading ? '…' : s.value}</div>
              </div>
            ))}
          </div>

          <div className="toolbar">
            <div className="search-box">
              <span></span>
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
                          <img src={roomImage(b.rooms)} alt={b.rooms?.name || 'Room'} style={{ width: 34, height: 34, borderRadius: 7, objectFit: 'cover', flexShrink: 0 }} />
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
                          <button className="btn btn-outline btn-sm" style={{ borderColor: 'var(--clr-danger)', color: 'var(--clr-danger)' }} onClick={() => deleteBooking(b)} title="Delete Booking" aria-label="Delete Booking" disabled={updating === b.id}>
                            <Trash2 size={14} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && filtered.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--clr-text-muted)' }}>
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
