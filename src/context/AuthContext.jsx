import { createContext, useContext, useEffect, useState } from 'react';
import api, { tokenStore } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, if a token exists, resolve the current admin profile.
  useEffect(() => {
    async function bootstrap() {
      if (!tokenStore.get()) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        setAdmin(data.data);
      } catch {
        tokenStore.clear();
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  }, []);

  async function login(email, password, rememberMe = false) {
    const { data } = await api.post('/auth/login', { email, password });
    tokenStore.set(data.data.token, rememberMe);
    setAdmin(data.data.admin);
    return data.data.admin;
  }

  function logout() {
    tokenStore.clear();
    setAdmin(null);
  }

  return (
    <AuthContext.Provider
      value={{
        admin,
        loading,
        login,
        logout,
        isAuthenticated: !!admin,
        isViewer: admin?.role === 'VIEWER',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
