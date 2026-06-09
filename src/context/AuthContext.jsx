import { createContext, useContext, useEffect, useState } from 'react';
import { mongoClient } from '../lib/mongodb';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId) => {
    try {
      const { data } = await mongoClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (data) setProfile(data);
    } catch (_) {}
  };

  useEffect(() => {
    // Check existing session on mount
    mongoClient.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = mongoClient.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const res = await mongoClient.auth.signInWithPassword({ email, password });
    if (res.data?.session?.user) {
      setUser(res.data.session.user);
      await loadProfile(res.data.session.user.id);
    }
    return res;
  };

  const signup = async (email, password, fullName) => {
    const res = await mongoClient.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
    if (res.data?.user) {
      // Some signup flows Auto-login, some don't. We'll leave state alone if it requires email confirmation.
      // But if it auto-logs in:
      if (res.data.session) {
        setUser(res.data.session.user);
        await loadProfile(res.data.session.user.id);
      }
    }
    return res;
  };

  const logout = async () => {
    await mongoClient.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, signup, logout, isAdmin, loadProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
