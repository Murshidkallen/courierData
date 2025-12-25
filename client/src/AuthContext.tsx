import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

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
                const decoded: any = jwtDecode(token);
                // Helper check for expiry could go here
                if (decoded.exp * 1000 < Date.now()) {
                    localStorage.removeItem('token');
                    setUser(null);
                } else {
                    setUser({ username: decoded.username, role: decoded.role, visibleFields: decoded.visibleFields || '*' });
                }
            } catch (e) {
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
