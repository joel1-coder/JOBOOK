import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isSignup) {
      const { error: err } = await signup(email, password, fullName);
      setLoading(false);
      if (err) { setError(err.message); return; }
      alert('✅ Check your email to confirm your account, then log in!');
      setIsSignup(false);
      return;
    }

    const { data, error: err } = await login(email, password);
    setLoading(false);
    if (err) { setError(err.message); return; }
    if (data?.user) navigate('/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-icon">🛡️</div>
          <span className="auth-brand-name">JOBOOK</span>
        </div>

        <h1 className="auth-title">{isSignup ? 'Create account' : 'Welcome back'}</h1>
        <p className="auth-subtitle">{isSignup ? 'Sign up to get started' : 'Sign in to your account'}</p>

        <div className="auth-tabs">
          <button className="auth-tab active">👤 User Login</button>
          <button className="auth-tab" onClick={() => navigate('/admin-login')}>⚙️ Admin Portal</button>
        </div>

        {error && <div className="alert alert-danger">⚠️ {error}</div>}

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
              {!isSignup && <span style={{ fontSize: 12, color: 'var(--clr-primary)', cursor: 'pointer', fontWeight: 500 }}>Forgot password?</span>}
            </div>
            <div className="input-wrap">
              <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)} required minLength={6} />
              <span className="input-icon" onClick={() => setShowPass(!showPass)}>{showPass ? '🙈' : '👁️'}</span>
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
          <p style={{ fontSize: 11, color: '#64748B' }}>🏢 <strong>JOBOOK</strong> — Spatial Room Booking System</p>
        </div>
      </div>
    </div>
  );
}
