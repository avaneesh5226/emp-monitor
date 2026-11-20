import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      const decoded = parseJwt(token);
      if (decoded) {
        setUser({ id: decoded.id, username: decoded.username, role: decoded.role, employeeId: decoded.employeeId });
      } else {
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [token]);

  const login = async (username, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const register = async (username, password, employeeId = null) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, employeeId })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      // Auto login after register
      return await login(username, password);
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const googleLogin = async (googleToken) => {
    try {
      const response = await fetch('/api/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: googleToken })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
