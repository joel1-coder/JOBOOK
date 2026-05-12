import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { profileService } from '../services/supabaseService';
import { authService } from '../services/supabaseService';

export default function AdminLoginPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');

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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessage('');

    const { error } = await authService.resetPassword(forgotEmail);
    setForgotLoading(false);

    if (error) {
      setForgotMessage('Error: ' + error.message);
    } else {
      setForgotMessage('Password reset email sent! Check your inbox.');
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotEmail('');
        setForgotMessage('');
      }, 2000);
    }
  };

  return (
    <div className="auth-page" style={{ background: 'linear-gradient(135deg,#0F172A 0%,#1E293B 55%,#1E1B4B 100%)' }}>
      <button 
        onClick={toggleTheme} 
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          padding: '8px 14px',
          background: 'var(--clr-surface)',
          border: '1px solid var(--clr-border)',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--clr-text)',
          zIndex: 100
        }}
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? '' : ''}
        {theme === 'light' ? 'Dark' : 'Light'}
      </button>
      <div className="auth-card" style={{ maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/favicon.jpg" alt="JOBOOK" style={{ width: 64, height: 64, objectFit: 'contain', margin: '0 auto 14px', display: 'block' }} />
          <h1 className="auth-title" style={{ fontSize: 22 }}>Admin Access</h1>
          <p className="auth-subtitle">Authorized personnel only. All access attempts are logged and monitored.</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="input-group">
            <div className="input-wrap has-icon-left">
              <span className="input-icon-left"></span>
              <input type="email" placeholder="Admin email address" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>
          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label>Security Token (Password)</label>
              <span style={{ fontSize: 11, color: 'var(--clr-primary)', cursor: 'pointer', fontWeight: 500 }} onClick={() => setShowForgotPassword(true)}>Reset token?</span>
            </div>
            <div className="input-wrap has-icon-left">
              <span className="input-icon-left"></span>
              <input type={showToken ? 'text' : 'password'} placeholder="••••••••" value={token} onChange={e => setToken(e.target.value)} required />
              <span className="input-icon" onClick={() => setShowToken(!showToken)}>{showToken ? '' : ''}</span>
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} style={{ background: 'linear-gradient(135deg,#4F46E5,#4338CA)' }}>
            {loading ? 'Verifying…' : 'Secure Login'}
          </button>
        </form>

        <p className="auth-footer" style={{ marginTop: 14 }}>
          <a href="#" onClick={e => { e.preventDefault(); navigate('/'); }}>User Access →</a>
        </p>

        <div style={{ marginTop: 20, padding: '12px 14px', background: '#FEF2F2', borderRadius: 8, border: '1px solid #FECACA', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <span style={{ fontSize: 14 }}></span>
          <p style={{ fontSize: 11, color: '#991B1B' }}>Unauthorized access to this system is strictly prohibited by federal law and is punishable to the fullest extent.</p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="modal-overlay" onClick={() => setShowForgotPassword(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3 className="modal-title">Reset Security Token</h3>
              <button className="btn btn-ghost" onClick={() => setShowForgotPassword(false)}>✖</button>
            </div>

            <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: 13, color: 'var(--clr-text-muted)' }}>Enter your admin email address and we'll send you a link to reset your security token.</p>

              <div className="input-group">
                <label>Admin Email Address</label>
                <div className="input-wrap">
                  <input 
                    type="email" 
                    placeholder="admin@example.com" 
                    value={forgotEmail} 
                    onChange={e => setForgotEmail(e.target.value)}
                    required 
                  />
                </div>
              </div>

              {forgotMessage && (
                <div style={{ padding: 12, borderRadius: 8, background: forgotMessage.includes('sent') ? '#DCFCE7' : '#FEE2E2', border: `1px solid ${forgotMessage.includes('sent') ? '#86EFAC' : '#FECACA'}`, fontSize: 13 }}>
                  {forgotMessage}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowForgotPassword(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={forgotLoading}>
                  {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
