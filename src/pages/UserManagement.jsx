import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { profileService } from '../services/supabaseService';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [formData, setFormData] = useState({ staff_id: '', full_name: '', email: '', password: '', department: '' });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await profileService.getAllUsers();
    setUsers(data || []);
    setLoading(false);
  };

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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const { data, error } = await profileService.adminCreateUser(
        formData.email,
        formData.password,
        formData.full_name,
        formData.department,
        formData.staff_id
      );
      
      console.log('Create User Response:', { data, error });
      
      if (error) {
        console.error('RPC Error:', error);
        alert('Error creating user: ' + (error.message || JSON.stringify(error)));
      } else if (data?.error) {
        console.error('Function Error:', data.error);
        alert('Error creating user: ' + data.error);
      } else {
        console.log('User created successfully:', data);
        setShowModal(false);
        setEditingUserId(null);
        setFormData({ staff_id: '', full_name: '', email: '', password: '', department: '' });
        loadUsers();
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Unexpected error: ' + err.message);
    }
    setFormLoading(false);
  };

  const handleEditUser = (u) => {
    setEditingUserId(u.id);
    setFormData({
      staff_id: u.staff_id || '',
      full_name: u.full_name || '',
      email: u.email || '',
      password: '',
      department: u.department || ''
    });
    setShowModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const { error } = await profileService.updateProfile(editingUserId, {
        staff_id: formData.staff_id,
        full_name: formData.full_name,
        department: formData.department
      });

      if (error) {
        console.error('Error updating user:', error);
        alert('Error updating user: ' + error.message);
      } else {
        console.log('User updated successfully');
        setShowModal(false);
        setEditingUserId(null);
        setFormData({ staff_id: '', full_name: '', email: '', password: '', department: '' });
        loadUsers();
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Unexpected error: ' + err.message);
    }
    setFormLoading(false);
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`Are you sure you want to completely delete ${u.full_name || u.email}? This cannot be undone.`)) return;
    const { error } = await profileService.adminDeleteUser(u.id);
    if (error) {
      alert('Failed to delete user: ' + error.message);
    } else {
      setUsers(prev => prev.filter(p => p.id !== u.id));
    }
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
          <button className="btn btn-primary" onClick={() => { setEditingUserId(null); setFormData({ staff_id: '', full_name: '', email: '', password: '', department: '' }); setShowModal(true); }}>+ Add User</button>
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
                            <div style={{ fontSize: 11, color: 'var(--clr-text-muted)' }}>{u.staff_id ? `${u.staff_id} • ${u.email}` : u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 13 }}>{u.department || '—'}</td>
                      <td><span className={`badge ${u.role === 'admin' ? 'badge-warning' : 'badge-primary'}`}>{u.role}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--clr-text-muted)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td><span className={`badge ${u.status === 'active' ? 'badge-success' : 'badge-muted'}`}>{u.status === 'active' ? '● Active' : '○ Inactive'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-outline btn-sm" onClick={() => handleEditUser(u)} title="Edit User">✏️ Edit</button>
                          <button className="btn btn-outline btn-sm" onClick={() => toggleRole(u)} title="Toggle Role">{u.role === 'admin' ? '👤 Demote' : '🛡️ Promote'}</button>
                          <button className={`btn btn-sm ${u.status === 'active' ? 'btn-danger' : 'btn-success'}`} onClick={() => toggleStatus(u)} title="Toggle Status">{u.status === 'active' ? 'Suspend' : 'Activate'}</button>
                          <button className="btn btn-outline btn-sm" style={{ borderColor: 'var(--clr-danger)', color: 'var(--clr-danger)' }} onClick={() => handleDeleteUser(u)} title="Delete User">🗑️</button>
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

      {/* Create/Edit User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingUserId ? 'Edit User' : 'Create New User'}</h3>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>✖</button>
            </div>
            
            <form onSubmit={editingUserId ? handleSaveUser : handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label>Staff ID</label>
                <div className="input-wrap">
                  <input required placeholder="e.g. EMP001" value={formData.staff_id} onChange={e => setFormData({ ...formData, staff_id: e.target.value })} disabled={editingUserId ? false : false} />
                </div>
              </div>

              <div className="input-group">
                <label>Name</label>
                <div className="input-wrap">
                  <input required placeholder="e.g. John Doe" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} />
                </div>
              </div>

              <div className="input-group">
                <label>Dept</label>
                <div className="input-wrap">
                  <input required placeholder="e.g. Engineering" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} />
                </div>
              </div>

              {!editingUserId && (
                <>
                  <div className="input-group">
                    <label>E-mail</label>
                    <div className="input-wrap">
                      <input required type="email" placeholder="e.g. john@jobook.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Password</label>
                    <div className="input-wrap">
                      <input required type="password" placeholder="At least 6 characters" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} minLength={6} />
                    </div>
                  </div>
                </>
              )}
              {editingUserId && (
                <>
                  <div className="input-group">
                    <label>E-mail</label>
                    <div className="input-wrap">
                      <input type="email" value={formData.email} disabled style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }} />
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
                <button type="button" className="btn btn-outline" onClick={() => { setShowModal(false); setEditingUserId(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? (editingUserId ? 'Updating...' : 'Creating...') : (editingUserId ? 'Update User' : 'Create User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
