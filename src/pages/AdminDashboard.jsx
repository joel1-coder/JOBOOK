import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationDropdown from '../components/NotificationDropdown';
import { useAuth } from '../context/AuthContext';
import { bookingService } from '../services/supabaseService';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, AreaChart, Area,
} from 'recharts';

/* ── helpers ── */
const today = new Date().toISOString().split('T')[0];
const fmt = (d) =>
  new Date(d).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

const statusColor = {
  confirmed: '#10B981',
  pending:   '#F59E0B',
  released:  '#6366F1',
  cancelled: '#EF4444',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
        borderRadius: 8, padding: '8px 14px', fontSize: 12, boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--clr-text)' }}>{label}</div>
        {payload.map(p => (
          <div key={p.name} style={{ color: p.color }}>
            {p.name}: <strong>{p.value}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Admin';

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
    bookingService.getAllBookings().then(({ data }) => {
      setBookings(data || []);
      setLoading(false);
    });
  }, []);

  /* ── KPI stats ── */
  const total      = bookings.length;
  const todayCount = bookings.filter(b => b.date === today).length;
  const pending    = bookings.filter(b => b.status === 'pending').length;
  const confirmed  = bookings.filter(b => b.status === 'confirmed').length;
  const occupancy  = total ? Math.round((confirmed / total) * 100) : 0;

  const kpis = [
    {
      label: 'Total Bookings',
      value: total,
      sub: 'All time',
      icon: '📋',
      accent: '#6366F1',
      bg: 'linear-gradient(135deg,#EEF2FF,#E0E7FF)',
    },
    {
      label: "Today's Bookings",
      value: todayCount,
      sub: fmt(today).split(',')[0],
      icon: '📅',
      accent: '#10B981',
      bg: 'linear-gradient(135deg,#D1FAE5,#A7F3D0)',
    },
    {
      label: 'Pending Approval',
      value: pending,
      sub: pending > 0 ? 'Needs attention' : 'All clear',
      icon: '⏳',
      accent: '#F59E0B',
      bg: 'linear-gradient(135deg,#FEF3C7,#FDE68A)',
    },
    {
      label: 'Occupancy Rate',
      value: `${occupancy}%`,
      sub: `${confirmed} confirmed`,
      icon: '📈',
      accent: '#3B82F6',
      bg: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)',
    },
  ];

  /* ── Chart data grouped by date ── */
  const chartData = (() => {
    const counts = {};
    bookings.forEach(b => {
      if (!b.date) return;
      const label = b.date.slice(5); // MM-DD
      if (!counts[label]) counts[label] = { name: label, confirmed: 0, pending: 0 };
      if (b.status === 'confirmed') counts[label].confirmed++;
      else if (b.status === 'pending') counts[label].pending++;
    });
    return Object.values(counts).slice(-8);
  })();

  /* ── Quick actions ── */
  const actions = [
    { icon: '🏢', label: 'Manage Rooms',    path: '/admin/rooms',    color: '#EEF2FF', accent: '#6366F1' },
    { icon: '📋', label: 'All Bookings',    path: '/admin/bookings', color: '#D1FAE5', accent: '#10B981' },
    { icon: '🕐', label: 'Manage Slots',    path: '/admin/slots',    color: '#FEF3C7', accent: '#F59E0B' },
    { icon: '👥', label: 'Users',           path: '/admin/users',    color: '#EFF6FF', accent: '#3B82F6' },
    { icon: '⚙️', label: 'Rules & Settings',path: '/admin/rules',    color: '#FDF4FF', accent: '#A855F7' },
  ];

  /* ── Recent activity ── */
  const recent = [...bookings]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 6);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">

        {/* ── Page Header ── */}
        <div className="page-header">
          <div>
            <div className="page-title">Admin Overview</div>
            <div className="page-subtitle">{fmt(today)}</div>
          </div>
          <div className="header-actions">
            <NotificationDropdown />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="header-avatar">A</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{displayName}</div>
                <div style={{ fontSize: 11, color: 'var(--clr-text-muted)' }}>Administrator</div>
              </div>
            </div>
          </div>
        </div>

        <div className="page-body">

          {/* ── Greeting Banner ── */}
          <div style={{
            background: 'linear-gradient(135deg,#312E81 0%,#4F46E5 50%,#7C3AED 100%)',
            borderRadius: 'var(--radius)', padding: '28px 32px', color: '#fff',
            marginBottom: 28, position: 'relative', overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(79,70,229,.30)',
          }}>
            {/* decorative circles */}
            {[
              { size: 200, right: -40, top: -60, opacity: .08 },
              { size: 120, right: 80,  top: 40,  opacity: .06 },
              { size: 80,  right: 200, top: -10, opacity: .05 },
            ].map((c, i) => (
              <div key={i} style={{
                position: 'absolute', width: c.size, height: c.size,
                borderRadius: '50%', background: '#fff',
                right: c.right, top: c.top, opacity: c.opacity,
              }} />
            ))}
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 13, fontWeight: 500, opacity: .75, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                {greeting}
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
                {displayName} 👋
              </h1>
              <p style={{ fontSize: 14, opacity: .8, maxWidth: 480 }}>
                You have <strong style={{ color: '#A5B4FC' }}>{pending} pending</strong> bookings waiting for approval
                and <strong style={{ color: '#6EE7B7' }}>{todayCount}</strong> scheduled today.
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
                <button className="btn"
                  onClick={() => navigate('/admin/bookings')}
                  style={{ background: 'rgba(255,255,255,.2)', color: '#fff', border: '1px solid rgba(255,255,255,.3)', backdropFilter: 'blur(4px)' }}>
                  📋 View All Bookings
                </button>
                {pending > 0 && (
                  <button className="btn"
                    onClick={() => navigate('/admin/bookings')}
                    style={{ background: '#F59E0B', color: '#fff', border: 'none', fontWeight: 700 }}>
                    ⚠️ Review {pending} Pending
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── KPI Cards ── */}
          <div className="stats-grid" style={{ marginBottom: 28 }}>
            {kpis.map(k => (
              <div key={k.label} className="stat-card" style={{
                borderTop: `3px solid ${k.accent}`,
                transition: 'box-shadow .2s, transform .2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div className="stat-label">{k.label}</div>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, background: k.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                  }}>{k.icon}</div>
                </div>
                <div className="stat-value" style={{ color: k.accent }}>
                  {loading ? <span style={{ fontSize: 16, color: 'var(--clr-text-light)' }}>Loading…</span> : k.value}
                </div>
                <div style={{ fontSize: 12, color: 'var(--clr-text-muted)', marginTop: 4 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Chart + Activity ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, marginBottom: 24 }}>

            {/* Booking Trend Chart */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Booking Trends</div>
                  <div style={{ fontSize: 12, color: 'var(--clr-text-muted)' }}>Confirmed vs Pending — live data</div>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--clr-text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: '#6366F1', display: 'inline-block' }} />
                    Confirmed
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: '#FCD34D', display: 'inline-block' }} />
                    Pending
                  </span>
                </div>
              </div>
              <div style={{ width: '100%', height: 230 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.length ? chartData : [{ name: 'No data', confirmed: 0, pending: 0 }]} barSize={22} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,.06)' }} />
                    <Bar dataKey="confirmed" name="Confirmed" fill="#6366F1" radius={[5, 5, 0, 0]} />
                    <Bar dataKey="pending"   name="Pending"   fill="#FCD34D" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Recent Activity</div>
              <div style={{ fontSize: 12, color: 'var(--clr-text-muted)', marginBottom: 16 }}>Latest booking events</div>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {loading ? (
                  <p style={{ color: 'var(--clr-text-muted)', fontSize: 13 }}>Loading…</p>
                ) : recent.length === 0 ? (
                  <p style={{ color: 'var(--clr-text-muted)', fontSize: 13 }}>No bookings yet.</p>
                ) : recent.map(b => (
                  <div key={b.id} style={{
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                    padding: '10px 12px', borderRadius: 8,
                    background: 'var(--clr-surface2)',
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: statusColor[b.status] || '#94A3B8',
                      marginTop: 5, flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {b.rooms?.name || 'Room'} — {b.profiles?.full_name || 'User'}
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                        <span className={`badge ${b.status === 'confirmed' ? 'badge-success' : b.status === 'pending' ? 'badge-warning' : 'badge-muted'}`}
                          style={{ fontSize: 10 }}>
                          {b.status}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--clr-text-light)' }}>{b.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {recent.length > 0 && (
                <button className="btn btn-outline btn-sm" style={{ marginTop: 14, width: '100%' }}
                  onClick={() => navigate('/admin/bookings')}>
                  View All →
                </button>
              )}
            </div>
          </div>

          {/* ── Quick Actions + System Health ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>

            {/* Quick Actions */}
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Quick Actions</div>
              <div style={{ fontSize: 12, color: 'var(--clr-text-muted)', marginBottom: 18 }}>Navigate to key management areas</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
                {actions.map(a => (
                  <button key={a.path} onClick={() => navigate(a.path)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 10, padding: '20px 12px', borderRadius: 10, border: '1.5px solid var(--clr-border)',
                      background: 'var(--clr-surface)', cursor: 'pointer', transition: 'all .2s',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = a.accent;
                      e.currentTarget.style.background = a.color;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--clr-border)';
                      e.currentTarget.style.background = 'var(--clr-surface)';
                      e.currentTarget.style.transform = '';
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
                    <div style={{ fontSize: 28 }}>{a.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', textAlign: 'center' }}>
                      {a.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* System Health */}
            <div className="card" style={{
              background: 'linear-gradient(160deg,#1E1B4B 0%,#312E81 60%,#3730A3 100%)',
              border: 'none', color: '#fff',
            }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>System Status</div>
              <div style={{ fontSize: 12, opacity: .6, marginBottom: 20 }}>Real-time infrastructure health</div>

              {[
                { name: 'Database',   status: 'Operational', icon: '🗄️',  latency: '12ms'  },
                { name: 'Auth',       status: 'Operational', icon: '🔐',  latency: '8ms'   },
                { name: 'API Server', status: 'Operational', icon: '⚡',  latency: '34ms'  },
                { name: 'Storage',    status: 'Operational', icon: '💾',  latency: '21ms'  },
              ].map(s => (
                <div key={s.name} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.08)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                      <div style={{ fontSize: 11, opacity: .5 }}>{s.latency} avg</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#86EFAC', fontWeight: 600 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#86EFAC', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                    {s.status}
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 8, background: 'rgba(255,255,255,.07)' }}>
                <div style={{ fontSize: 11, opacity: .6, marginBottom: 6 }}>OVERALL UPTIME</div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>99.9%</div>
                <div style={{ height: 4, borderRadius: 999, background: 'rgba(255,255,255,.15)', marginTop: 8 }}>
                  <div style={{ width: '99.9%', height: '100%', borderRadius: 999, background: '#86EFAC' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: .4; }
        }
        @media (max-width: 900px) {
          .admin-chart-grid   { grid-template-columns: 1fr !important; }
          .admin-actions-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
