import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/supabaseService';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  useEffect(() => {
    // Check if there's a valid reset token
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    
    if (!token || type !== 'recovery') {
      setTokenValid(false);
      setError('Invalid or expired password reset link.');
    }
  }, [searchParams]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    const { error } = await authService.updatePassword(password);
    setLoading(false);

    if (error) {
      setError('Error resetting password: ' + error.message);
    } else {
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
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
          <div className="auth-brand-icon"></div>
          <span className="auth-brand-name">JOBOOK</span>
        </div>

        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">Create a new password for your account</p>

        {!tokenValid ? (
          <>
            {error && <div className="alert alert-danger">{error}</div>}
            <div style={{ marginTop: 20, padding: 16, background: '#FEF3C7', borderRadius: 10, border: '1px solid #FBBF24', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#92400E' }}>
                This password reset link is invalid or has expired.
              </p>
              <button 
                className="btn btn-primary" 
                style={{ marginTop: 12 }}
                onClick={() => navigate('/')}
              >
                Back to Login
              </button>
            </div>
          </>
        ) : success ? (
          <div style={{ marginTop: 20, padding: 16, background: '#DCFCE7', borderRadius: 10, border: '1px solid #86EFAC', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#166534' }}>
              Password reset successfully! Redirecting to login...
            </p>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleResetPassword}>
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="input-group">
              <label>New Password</label>
              <div className="input-wrap">
                <input 
                  type={showPass ? 'text' : 'password'} 
                  placeholder="••••••••" 
                  value={password}
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  minLength={6}
                />
                <span className="input-icon" onClick={() => setShowPass(!showPass)}>{showPass ? '' : ''}</span>
              </div>
            </div>

            <div className="input-group">
              <label>Confirm Password</label>
              <div className="input-wrap">
                <input 
                  type={showConfirmPass ? 'text' : 'password'} 
                  placeholder="••••••••" 
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)} 
                  required 
                  minLength={6}
                />
                <span className="input-icon" onClick={() => setShowConfirmPass(!showConfirmPass)}>{showConfirmPass ? '' : ''}</span>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password →'}
            </button>
          </form>
        )}

        <div style={{ marginTop: 20, padding: 14, background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#64748B' }}><strong>JOBOOK</strong> — Spatial Room Booking System</p>
        </div>
      </div>
    </div>
  );
}
