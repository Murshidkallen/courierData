import React, { createContext, useContext, useState, useEffect } from 'react';
import * as jwtDecodeLib from 'jwt-decode';

// Robust import for different build environments
const jwtDecode = (jwtDecodeLib as any).jwtDecode || (jwtDecodeLib as any).default || jwtDecodeLib;

interface User {
    username: string;
    role: string;
    visibleFields: string;
}

interface AuthContextType {
    user: User | null;
    login: (token: string, username: string, role: string, visibleFields: string) => void;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // Check if jwtDecode is actually a function
                if (typeof jwtDecode !== 'function') {
                    console.error("jwt-decode library issue: Import failed to resolve a function", jwtDecodeLib);
                    throw new Error("jwt-decode import failed");
                }

                const decoded: any = jwtDecode(token);
                // Helper check for expiry could go here
                if (decoded.exp * 1000 < Date.now()) {
                    console.warn("Token expired");
                    localStorage.removeItem('token');
                    setUser(null);
                } else {
                    setUser({ username: decoded.username, role: decoded.role, visibleFields: decoded.visibleFields || '*' });
                }
            } catch (e) {
                console.error("Auth Restoration Error:", e);
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    }, []);

    const login = (token: string, username: string, role: string, visibleFields: string) => {
        localStorage.setItem('token', token);
        setUser({ username, role, visibleFields });
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
