// frontend/src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { apiService } from '@/services/api';
export function useAuth() {
    const [user, setUser] = useState(null);
    const [adminMode, setAdminMode] = useState(false);
    // Load user from token if token exists and is valid
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const isExpired = decoded.exp * 1000 < Date.now();
                if (!isExpired) {
                    setUser(decoded.sub); // set user from token
                }
                else {
                    localStorage.removeItem('token'); // clear expired token
                }
            }
            catch (err) {
                console.error('Invalid token');
                localStorage.removeItem('token');
            }
        }
    }, []);
    const login = async ({ username, password }) => {
        try {
            const response = await apiService.login({ username, password });
            localStorage.setItem('token', response.token);
            const decoded = jwtDecode(response.token);
            setUser(decoded.sub);
        }
        catch (error) {
            throw new Error(error.response?.data?.detail || 'Login failed');
        }
    };
    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setAdminMode(false);
    };
    return {
        isAuthenticated: !!user,
        adminMode,
        toggleAdminMode: () => setAdminMode((prev) => !prev),
        login,
        logout,
    };
}
