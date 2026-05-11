import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/supabaseService';

export default function UserProfile() {
  const { user, profile, loadProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', department: '', phone: '', bio: '' });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        email: profile.email || user?.email || '',
        department: profile.department || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
      });
    }
  }, [profile, user]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await profileService.updateProfile(user.id, {
      full_name: form.full_name,
      department: form.department,
      phone: form.phone,
      bio: form.bio,
    });
    setSaving(false);
    if (error) { alert('Error: ' + error.message); return; }
    await loadProfile(user.id);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const initials = form.full_name?.split(' ').map(n => n[0]).join('') || '?';

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <div>
            <div className="page-title">My Profile</div>
            <div className="page-subtitle">Manage your account details</div>
          </div>
          <button
            className={`btn ${editing ? 'btn-success' : 'btn-primary'}`}
            disabled={saving}
            onClick={() => editing ? handleSave() : setEditing(true)}
          >
            {saving ? '⏳ Saving…' : editing ? '💾 Save Changes' : '✏️ Edit Profile'}
          </button>
        </div>

        <div className="page-body">
          {saved && <div className="alert alert-info">✅ Profile updated successfully!</div>}

          <div className="profile-hero">
            <div className="profile-avatar-lg">{initials}</div>
            <div>
              <div className="profile-name">{form.full_name || 'User'}</div>
              <div className="profile-role">🏢 {form.department || 'General'} · {profile?.role || 'Member'}</div>
              <div style={{ display: 'flex', gap: 20, marginTop: 14 }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{profile?.role === 'admin' ? '∞' : '—'}</div>
                  <div style={{ fontSize: 11, opacity: .75 }}>Bookings</div>
                </div>
                <div style={{ width: 1, background: 'rgba(255,255,255,.2)' }} />
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{profile?.status === 'active' ? '✅' : '⛔'}</div>
                  <div style={{ fontSize: 11, opacity: .75 }}>Status</div>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-form-grid">
            <div className="card card-lg">
              <h3 style={{ fontWeight: 700, marginBottom: 18 }}>👤 Personal Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { label: 'Full Name', key: 'full_name', type: 'text' },
                  { label: 'Email Address', key: 'email', type: 'email', disabled: true },
                  { label: 'Department', key: 'department', type: 'text' },
                  { label: 'Phone Number', key: 'phone', type: 'tel' },
                ].map(f => (
                  <div key={f.key} className="input-group">
                    <label>{f.label}</label>
                    <div className="input-wrap">
                      <input
                        type={f.type}
                        value={form[f.key]}
                        disabled={!editing || f.disabled}
                        onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                        style={(!editing || f.disabled) ? { background: 'var(--clr-surface2)', cursor: 'default' } : {}}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card card-lg">
                <h3 style={{ fontWeight: 700, marginBottom: 14 }}>📝 Bio</h3>
                <textarea
                  rows={5} value={form.bio} disabled={!editing}
                  onChange={e => setForm({ ...form, bio: e.target.value })}
                  placeholder="Tell us about yourself…"
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--clr-border)', borderRadius: 'var(--radius-sm)', fontSize: 14, color: 'var(--clr-text)', resize: 'none', fontFamily: 'var(--font)', background: !editing ? 'var(--clr-surface2)' : 'var(--clr-surface)' }}
                />
              </div>

              <div className="card card-lg">
                <h3 style={{ fontWeight: 700, marginBottom: 14 }}>🔒 Security</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--clr-border)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Password</div>
                    <div style={{ fontSize: 12, color: 'var(--clr-text-muted)' }}>Managed via Supabase Auth</div>
                  </div>
                  <button className="btn btn-outline btn-sm">Change</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Account Role</div>
                    <div style={{ fontSize: 12, color: 'var(--clr-text-muted)' }}>{profile?.role || 'user'}</div>
                  </div>
                  <span className={`badge ${profile?.role === 'admin' ? 'badge-warning' : 'badge-primary'}`}>{profile?.role || 'user'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
