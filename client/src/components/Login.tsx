import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

const Login = () => {
    // ... logic remains same ...
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();
            if (res.ok) {
                login(data.token, data.username, data.role, data.visibleFields);
                navigate('/');
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to login');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 animate-gradient-x">
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-96 border border-white/20">
                <div className="text-center mb-8">
                    <span className="text-4xl">📦</span>
                    <h2 className="text-3xl font-extrabold text-white mt-2 tracking-tight">Welcome Back</h2>
                    <p className="text-indigo-200 text-sm mt-1">Sign in to manage your courier data</p>
                </div>

                {error && <div className="bg-red-500/20 border border-red-500/50 text-white p-3 rounded-lg mb-6 text-sm text-center font-medium backdrop-blur-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-indigo-100 text-xs font-bold uppercase tracking-wider mb-2">Username</label>
                        <input
                            className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/10 text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white/30 transition-all"
                            type="text"
                            placeholder="Enter username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-indigo-100 text-xs font-bold uppercase tracking-wider mb-2">Password</label>
                        <input
                            className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/10 text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white/30 transition-all"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    <div>
                        <button className="w-full bg-gradient-to-r from-pink-500 to-indigo-500 hover:from-pink-600 hover:to-indigo-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg transform hover:-translate-y-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" type="submit">
                            Sign In
                        </button>
                    </div>
                </form>
                <div className="mt-8 text-center">
                    <p className="text-indigo-200 text-xs">Protected System • Authorized Access Only</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
