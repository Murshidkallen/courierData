import React from 'react';
import { useAuth } from '../AuthContext';

export default function SuperAdminDashboard() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                            Business Command Center
                        </h1>
                        <p className="text-gray-400 mt-2">Welcome back, {user?.name}</p>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-lg">
                        <span className="text-yellow-500 font-mono font-bold">SUPER_ADMIN ACCESS</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 hover:border-yellow-500/50 transition-all cursor-pointer group">
                        <h3 className="text-xl font-bold text-gray-200 group-hover:text-yellow-400 transition-colors">Financial Overview</h3>
                        <p className="text-gray-500 mt-2 text-sm">View profits, expenses, and margins.</p>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 hover:border-yellow-500/50 transition-all cursor-pointer group">
                        <h3 className="text-xl font-bold text-gray-200 group-hover:text-yellow-400 transition-colors">Courier Performance</h3>
                        <p className="text-gray-500 mt-2 text-sm">Partner efficiency and volumes.</p>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 hover:border-yellow-500/50 transition-all cursor-pointer group">
                        <h3 className="text-xl font-bold text-gray-200 group-hover:text-yellow-400 transition-colors">System Health</h3>
                        <p className="text-gray-500 mt-2 text-sm">Server status and error logs.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
