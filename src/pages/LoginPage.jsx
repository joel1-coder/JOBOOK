import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authService, profileService } from '../services/supabaseService';

export default function LoginPage() {
  const { login, signup, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isSignup) {
      const { error: err } = await signup(email, password, fullName);
      setLoading(false);
      if (err) { setError(err.message); return; }
      alert('Check your email to confirm your account, then log in!');
      setIsSignup(false);
      return;
    }

    const { data, error: err } = await login(email, password);
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    if (data?.user) {
      // Check if user role is admin (prevent admin login on user portal)
      if (data.user.role === 'admin') {
        setError('Access denied. Admin accounts must use the Admin Portal.');
        await logout();
        setLoading(false);
        return;
      }
      setLoading(false);
      navigate('/dashboard');
    } else {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessage('');

    const { error } = await authService.resetPassword(forgotEmail);
    setForgotLoading(false);

    if (error) {
      setForgotMessage('' + error.message);
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
    <div className="auth-page">
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
      <div className="auth-card">
        <div className="auth-brand">
          <img src="/favicon.jpg" alt="JOBOOK" className="auth-brand-icon" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          <span className="auth-brand-name">JOBOOK</span>
        </div>

        <h1 className="auth-title">{isSignup ? 'Create account' : 'Welcome back'}</h1>
        <p className="auth-subtitle">{isSignup ? 'Sign up to get started' : 'Sign in to your account'}</p>

        <div className="auth-tabs">
          <button className="auth-tab active">User Login</button>
          <button className="auth-tab" onClick={() => navigate('/admin-login')}>Admin Portal</button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignup && (
            <div className="input-group">
              <label>Full Name</label>
              <div className="input-wrap">
                <input type="text" placeholder="Your full name" value={fullName}
                  onChange={e => setFullName(e.target.value)} required />
              </div>
            </div>
          )}
          <div className="input-group">
            <label>Email</label>
            <div className="input-wrap">
              <input type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>
          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Password</label>
              {!isSignup && <span style={{ fontSize: 12, color: 'var(--clr-primary)', cursor: 'pointer', fontWeight: 500 }} onClick={() => setShowForgotPassword(true)}>Forgot password?</span>}
            </div>
            <div className="input-wrap">
              <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)} required minLength={6} />
              <span className="input-icon" onClick={() => setShowPass(!showPass)}>{showPass ? '' : ''}</span>
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading ? '⏳ Please wait…' : isSignup ? 'Create Account' : 'Login →'}
          </button>
        </form>

        <p className="auth-footer">
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <a href="#" onClick={e => { e.preventDefault(); setIsSignup(!isSignup); setError(''); }}>
            {isSignup ? 'Sign In' : 'Sign Up'}
          </a>
        </p>

        <div style={{ marginTop: 20, padding: 14, background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#64748B' }}><strong>JOBOOK</strong> — Spatial Room Booking System</p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="modal-overlay" onClick={() => setShowForgotPassword(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3 className="modal-title">Reset Password</h3>
              <button className="btn btn-ghost" onClick={() => setShowForgotPassword(false)}>✖</button>
            </div>

            <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: 13, color: 'var(--clr-text-muted)' }}>Enter your email address and we'll send you a link to reset your password.</p>

              <div className="input-group">
                <label>Email Address</label>
                <div className="input-wrap">
                  <input 
                    type="email" 
                    placeholder="you@example.com" 
                    value={forgotEmail} 
                    onChange={e => setForgotEmail(e.target.value)}
                    required 
                  />
                </div>
              </div>

              {forgotMessage && (
                <div style={{ padding: 12, borderRadius: 8, background: forgotMessage.includes('Password reset') ? '#DCFCE7' : '#FEE2E2', border: `1px solid ${forgotMessage.includes('Password reset') ? '#86EFAC' : '#FECACA'}`, fontSize: 13 }}>
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
