import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { profileService } from '../services/supabaseService';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    profileService.getAllUsers().then(({ data }) => { setUsers(data || []); setLoading(false); });
  }, []);

  const toggleRole = async (u) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    await profileService.updateUserRole(u.id, newRole);
    setUsers(prev => prev.map(p => p.id === u.id ? { ...p, role: newRole } : p));
  };

  const toggleStatus = async (u) => {
    const newStatus = u.status === 'active' ? 'inactive' : 'active';
    await profileService.updateUserStatus(u.id, newStatus);
    setUsers(prev => prev.map(p => p.id === u.id ? { ...p, status: newStatus } : p));
  };

  const filtered = users.filter(u => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchSearch = u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.department?.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const initials = (name) => (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <div>
            <div className="page-title">User Management</div>
            <div className="page-subtitle">Admin Console — {users.length} registered users</div>
          </div>
          <button className="btn btn-primary">+ Invite User</button>
        </div>

        <div className="page-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Total Users', value: users.length, icon: '👥', color: '#EEF2FF' },
              { label: 'Active', value: users.filter(u => u.status === 'active').length, icon: '✅', color: '#DCFCE7' },
              { label: 'Admins', value: users.filter(u => u.role === 'admin').length, icon: '🛡️', color: '#FEF3C7' },
              { label: 'Inactive', value: users.filter(u => u.status === 'inactive').length, icon: '⛔', color: '#FEE2E2' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{s.label}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>{loading ? '…' : s.value}</div>
                  </div>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{s.icon}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="toolbar">
            <div className="search-box">
              <span>🔍</span>
              <input placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="filter-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>User</th><th>Department</th><th>Role</th><th>Joined</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--clr-text-muted)' }}>Loading users…</td></tr>
                  ) : filtered.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#4F46E5,#818CF8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                            {initials(u.full_name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{u.full_name || 'Unknown'}</div>
                            <div style={{ fontSize: 11, color: 'var(--clr-text-muted)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 13 }}>{u.department || '—'}</td>
                      <td><span className={`badge ${u.role === 'admin' ? 'badge-warning' : 'badge-primary'}`}>{u.role}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--clr-text-muted)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td><span className={`badge ${u.status === 'active' ? 'badge-success' : 'badge-muted'}`}>{u.status === 'active' ? '● Active' : '○ Inactive'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-outline btn-sm" onClick={() => toggleRole(u)}>{u.role === 'admin' ? '👤 Demote' : '🛡️ Promote'}</button>
                          <button className={`btn btn-sm ${u.status === 'active' ? 'btn-danger' : 'btn-success'}`} onClick={() => toggleStatus(u)}>{u.status === 'active' ? 'Suspend' : 'Activate'}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && filtered.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--clr-text-muted)' }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>👤</div><p>No users found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
