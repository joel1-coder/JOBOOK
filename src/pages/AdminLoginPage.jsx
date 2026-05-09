import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/supabaseService';

export default function AdminLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: loginErr } = await login(email, token);
    if (loginErr) { setError(loginErr.message); setLoading(false); return; }

    // Check role is admin
    const { data: prof } = await profileService.getProfile(data.user.id);
    if (prof?.role !== 'admin') {
      setError('Access denied. This account does not have admin privileges.');
      setLoading(false);
      return;
    }
    navigate('/admin/dashboard');
  };

  return (
    <div className="auth-page" style={{ background: 'linear-gradient(135deg,#0F172A 0%,#1E293B 55%,#1E1B4B 100%)' }}>
      <div className="auth-card" style={{ maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#4F46E5,#6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 14px' }}>🛡️</div>
          <h1 className="auth-title" style={{ fontSize: 22 }}>Admin Access</h1>
          <p className="auth-subtitle">Authorized personnel only. All access attempts are logged and monitored.</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="input-group">
            <div className="input-wrap has-icon-left">
              <span className="input-icon-left">🔐</span>
              <input type="email" placeholder="Admin email address" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>
          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label>Security Token (Password)</label>
              <span className="security-badge level4">LEVEL 4 REQ</span>
            </div>
            <div className="input-wrap has-icon-left">
              <span className="input-icon-left">🔑</span>
              <input type={showToken ? 'text' : 'password'} placeholder="••••••••" value={token} onChange={e => setToken(e.target.value)} required />
              <span className="input-icon" onClick={() => setShowToken(!showToken)}>{showToken ? '🙈' : '👁️'}</span>
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} style={{ background: 'linear-gradient(135deg,#4F46E5,#4338CA)' }}>
            {loading ? '⏳ Verifying…' : '🔒 Secure Login'}
          </button>
        </form>

        <p className="auth-footer" style={{ marginTop: 14 }}>
          <a href="#" onClick={e => { e.preventDefault(); navigate('/'); }}>User Access →</a>
        </p>

        <div style={{ marginTop: 20, padding: '12px 14px', background: '#FEF2F2', borderRadius: 8, border: '1px solid #FECACA', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <span style={{ fontSize: 14 }}>⚠️</span>
          <p style={{ fontSize: 11, color: '#991B1B' }}>Unauthorized access to this system is strictly prohibited by federal law and is punishable to the fullest extent.</p>
        </div>
      </div>
    </div>
  );
}
