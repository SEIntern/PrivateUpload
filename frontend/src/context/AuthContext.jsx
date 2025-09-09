import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';


const AuthContext = createContext();


export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('token');
    console.log('[AuthContext] Loaded token from localStorage:', stored);
    if (stored) {
      try {
        const decoded = jwtDecode(stored);
        console.log('[AuthContext] Decoded token:', decoded);
        if (decoded.exp * 1000 > Date.now()) {
          setUser(decoded);
          setToken(stored);
        } else {
          console.log('[AuthContext] Token expired:', decoded.exp, Date.now());
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.log('[AuthContext] Error decoding token:', err);
        localStorage.removeItem('token');
      }
    } else {
      console.log('[AuthContext] No token found in localStorage.');
    }
    setLoading(false);
  }, []);

  const login = (token) => {
    localStorage.setItem('token', token);
    const decoded = jwtDecode(token);
    setUser(decoded);
    setToken(token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
