// frontend/src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { apiService } from '@/services/api';

interface JwtPayload {
  sub: string;       // usually username
  exp: number;       // expiry (unix timestamp)
}

export function useAuth() {
  const [user, setUser] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);

  // Load user and admin mode from storage on startup
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedAdminMode = localStorage.getItem('adminMode') === 'true';
    
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        const isExpired = decoded.exp * 1000 < Date.now();

        if (!isExpired) {
          setUser(decoded.sub); // set user from token
          setAdminMode(savedAdminMode); // restore admin mode only if authenticated
        } else {
          localStorage.removeItem('token'); // clear expired token
          localStorage.removeItem('adminMode'); // clear admin mode for expired sessions
        }
      } catch (err) {
        console.error('Invalid token');
        localStorage.removeItem('token');
        localStorage.removeItem('adminMode');
      }
    }
  }, []);

  const login = async ({ username, password }: { username: string; password: string }) => {
    try {
      const response = await apiService.login({ username, password });
      localStorage.setItem('token', response.token);
      const decoded = jwtDecode<JwtPayload>(response.token);
      setUser(decoded.sub);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminMode');
    setUser(null);
    setAdminMode(false);
  };

  const toggleAdminMode = () => {
    setAdminMode((prev) => {
      const newMode = !prev;
      // Persist admin mode to localStorage
      localStorage.setItem('adminMode', newMode.toString());
      return newMode;
    });
  };

  return {
    isAuthenticated: !!user,
    adminMode,
    toggleAdminMode,
    login,
    logout,
  };
}
