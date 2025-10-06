import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/api/auth/me')
      .then(({ user }) => setUser(user))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { user } = await api('/api/auth/login', { method: 'POST', body: { email, password } });
    setUser(user);
  };

  const signup = async (email, password) => {
    const { user } = await api('/api/auth/signup', { method: 'POST', body: { email, password } });
    setUser(user);
  };

  const logout = async () => {
    await api('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
