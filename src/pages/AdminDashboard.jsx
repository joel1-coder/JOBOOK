import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import NotificationDropdown from '../components/NotificationDropdown';
import { bookingService } from '../services/supabaseService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const activityColor = { confirmed: '#10B981', released: '#6366F1', info: '#3B82F6', warning: '#F59E0B' };

export default function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingService.getAllBookings().then(({ data }) => {
      setBookings(data || []);
      setLoading(false);
    });
  }, []);

  // Build chart data from real bookings grouped by date
  const chartData = (() => {
    const counts = {};
    bookings.forEach(b => {
      const d = b.date ? b.date.slice(5) : '??'; // MM-DD
      counts[d] = (counts[d] || 0) + 1;
    });
    return Object.entries(counts).slice(-6).map(([name, bookings]) => ({ name, bookings }));
  })();

  const stats = [
    { label: 'Total Bookings', value: bookings.length, change: 'All time', up: true, icon: '📋', color: '#EEF2FF' },
    { label: "Today's Bookings", value: bookings.filter(b => b.date === new Date().toISOString().split('T')[0]).length, change: 'Today', up: true, icon: '📅', color: '#DCFCE7' },
    { label: 'Pending Approval', value: bookings.filter(b => b.status === 'pending').length, change: 'Requires attention', up: false, icon: '⚠️', color: '#FEF3C7' },
    { label: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length, change: 'Active reservations', up: true, icon: '✅', color: '#DCFCE7' },
  ];

  const recent = bookings.slice(0, 4);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <div>
            <div className="page-title">Admin Overview</div>
            <div className="page-subtitle">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
          <div className="header-actions">
            <NotificationDropdown />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="header-avatar">A</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Admin</div>
                <div style={{ fontSize: 11, color: 'var(--clr-text-muted)' }}>Administrator</div>
              </div>
            </div>
          </div>
        </div>

        <div className="page-body">
          <div className="stats-grid">
            {stats.map(s => (
              <div key={s.label} className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-icon" style={{ background: s.color, fontSize: 18 }}>{s.icon}</div>
                </div>
                <div className="stat-value">{loading ? '…' : s.value}</div>
                <div className={`stat-change ${s.up ? 'up' : 'down'}`}>{s.change}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 24 }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Booking Trends</div>
                  <div style={{ fontSize: 12, color: 'var(--clr-text-muted)' }}>Volume from live database</div>
                </div>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.length ? chartData : [{ name: 'No data', bookings: 0 }]} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                    <Bar dataKey="bookings" fill="#818CF8" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Recent Activity</div>
              {loading ? <p style={{ color: 'var(--clr-text-muted)', fontSize: 13 }}>Loading…</p> : recent.map(b => (
                <div key={b.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: activityColor[b.status] || '#94A3B8', marginTop: 5, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.4 }}>{b.rooms?.name} — {b.profiles?.full_name || 'User'}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
                      <span className={`badge ${b.status === 'confirmed' ? 'badge-success' : b.status === 'pending' ? 'badge-warning' : 'badge-muted'}`} style={{ fontSize: 10 }}>{b.status}</span>
                      <span style={{ fontSize: 11, color: 'var(--clr-text-light)' }}>{b.date}</span>
                    </div>
                  </div>
                </div>
              ))}
              {!loading && recent.length === 0 && <p style={{ fontSize: 13, color: 'var(--clr-text-muted)' }}>No bookings yet.</p>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 280px', gap: 20 }}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏗️</div>
                <div>
                  <div style={{ fontWeight: 700 }}>Infrastructure</div>
                  <div style={{ fontSize: 12, color: 'var(--clr-text-muted)' }}>Supabase PostgreSQL</div>
                </div>
              </div>
              <button className="btn btn-outline btn-sm">Manage Rooms →</button>
            </div>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📈</div>
                <div>
                  <div style={{ fontWeight: 700 }}>Occupancy Rate</div>
                  <div style={{ fontSize: 12, color: 'var(--clr-text-muted)' }}>Based on confirmed bookings</div>
                </div>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: 'var(--clr-surface2)', overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ width: `${Math.min(100, (bookings.filter(b => b.status === 'confirmed').length / Math.max(bookings.length, 1)) * 100).toFixed(0)}%`, height: '100%', background: 'var(--clr-success)', borderRadius: 999 }} />
              </div>
            </div>
            <div className="card" style={{ background: 'linear-gradient(135deg,#4F46E5,#6D28D9)', color: '#fff', border: 'none' }}>
              <div style={{ fontWeight: 700, fontSize: 13, opacity: .75, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>System Health</div>
              {['Database', 'Auth', 'API'].map(s => (
                <div key={s} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,.12)', fontSize: 12 }}>
                  <span style={{ opacity: .8 }}>{s}</span>
                  <span style={{ color: '#86EFAC', fontWeight: 600 }}>● Operational</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
