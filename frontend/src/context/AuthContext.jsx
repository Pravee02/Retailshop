import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore user from localStorage
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    try {
      if (savedUser && savedToken) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error('Auth restoration error:', e);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/auth';
  };

  const isAdmin = () => user?.role === 'ADMIN';
  const isAuthenticated = () => !!user;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
