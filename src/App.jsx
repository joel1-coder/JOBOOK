import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import UserDashboard from './pages/UserDashboard';
import MyBookings from './pages/MyBookings';
import UserProfile from './pages/UserProfile';
import AdminDashboard from './pages/AdminDashboard';
import ManageBookings from './pages/ManageBookings';
import ManageSlots from './pages/ManageSlots';
import UserManagement from './pages/UserManagement';
import BookingRules from './pages/BookingRules';
import BookingScheduler from './pages/BookingScheduler';

function PrivateRoute({ children, adminOnly = false }) {
  const { user, profile, loading } = useAuth();

  // Only block on initial auth load
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '3px solid #4F46E5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: '#64748B', fontSize: 14 }}>Loading…</p>
    </div>
  );

  // Not logged in → back to login
  if (!user) return <Navigate to="/" replace />;

  // Admin routes: wait for profile, then check role
  if (adminOnly) {
    if (!profile) return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ color: '#64748B' }}>Verifying access…</p>
      </div>
    );
    if (profile.role !== 'admin') return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/admin-login" element={<AdminLoginPage />} />

      <Route path="/dashboard"   element={<PrivateRoute><UserDashboard /></PrivateRoute>} />
      <Route path="/schedule"    element={<PrivateRoute><BookingScheduler /></PrivateRoute>} />
      <Route path="/my-bookings" element={<PrivateRoute><MyBookings /></PrivateRoute>} />
      <Route path="/profile"     element={<PrivateRoute><UserProfile /></PrivateRoute>} />

      <Route path="/admin/dashboard" element={<PrivateRoute adminOnly><AdminDashboard /></PrivateRoute>} />
      <Route path="/admin/bookings" element={<PrivateRoute adminOnly><ManageBookings /></PrivateRoute>} />
      <Route path="/admin/slots" element={<PrivateRoute adminOnly><ManageSlots /></PrivateRoute>} />
      <Route path="/admin/users" element={<PrivateRoute adminOnly><UserManagement /></PrivateRoute>} />
      <Route path="/admin/rules" element={<PrivateRoute adminOnly><BookingRules /></PrivateRoute>} />

      <Route path="/book/:roomId" element={<PrivateRoute><BookingScheduler /></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
