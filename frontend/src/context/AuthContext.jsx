import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sentinel_user');
    return saved ? JSON.parse(saved) : {
      id: 1,
      username: 'analyst_priya',
      email: 'analyst@sentinelgrid.cni',
      full_name: 'Priya Sharma',
      role: 'SOC Analyst',
      department: 'Critical Infrastructure Defense Unit (CIDU)',
      badge_id: 'SEC-0492'
    };
  });
  const [token, setToken] = useState(() => localStorage.getItem('sentinel_token') || 'demo-active-token');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && token !== 'demo-active-token') {
      api.getProfile()
        .then(profile => {
          setUser(profile);
          localStorage.setItem('sentinel_user', JSON.stringify(profile));
        })
        .catch(() => {
          // Keep demo analyst fallback
        });
    }
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await api.login(email, password);
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem('sentinel_token', data.access_token);
      localStorage.setItem('sentinel_user', JSON.stringify(data.user));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (roleType) => {
    if (roleType === 'Admin') {
      return login('admin@sentinelgrid.cni', 'Admin@2026');
    }
    return login('analyst@sentinelgrid.cni', 'Analyst@2026');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('sentinel_token');
    localStorage.removeItem('sentinel_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        quickLogin,
        logout,
        isAdmin: user?.role === 'Security Administrator',
        isAnalyst: user?.role === 'SOC Analyst'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
