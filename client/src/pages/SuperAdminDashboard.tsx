import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { Calendar, TrendingUp, Users, DollarSign, Package, Activity, FileText } from 'lucide-react';

export default function SuperAdminDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Date Range State (Defaults to current month in backend if empty, but let's handle UI)
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        fetchStats();
    }, [dateRange]);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const query = dateRange.start ? `?startDate=${dateRange.start}&endDate=${dateRange.end}` : '';
            const res = await fetch(`${API_URL}/api/stats/super-admin${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401 || res.status === 403) {
                // handle auth error
            }
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch super admin stats", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading Dashboard...</div>;

    const metrics = stats?.metrics || {};

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                            Business Command Center
                        </h1>
                        <p className="text-gray-400 mt-2 flex items-center gap-2">
                            Welcome back, <span className="text-white font-semibold">{user?.username}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-700"
                        >
                            Return to App
                        </button>
                        <div className="bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-lg">
                            <span className="text-yellow-500 font-mono font-bold text-xs tracking-wider">SUPER_ADMIN</span>
                        </div>
                    </div>
                </div>

                {/* Main Navigation Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div
                        onClick={() => navigate('/super-admin/analytics')}
                        className="bg-gray-800 p-6 rounded-2xl border border-gray-700 hover:border-yellow-500/50 transition-all cursor-pointer group hover:bg-gray-800/80"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-200 group-hover:text-yellow-400 transition-colors">Analytics & Partners</h3>
                            <Activity className="w-6 h-6 text-gray-500 group-hover:text-yellow-500 transition-colors" />
                        </div>
                        <p className="text-gray-500 text-sm">Deep dive into partner performance, revenue trends, and operational metrics.</p>
                    </div>

                    <div
                        onClick={() => navigate('/admin')}
                        className="bg-gray-800 p-6 rounded-2xl border border-gray-700 hover:border-blue-500/50 transition-all cursor-pointer group hover:bg-gray-800/80"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-200 group-hover:text-blue-400 transition-colors">User Management</h3>
                            <Users className="w-6 h-6 text-gray-500 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <p className="text-gray-500 text-sm">Manage Admins, Partners, and Staff accounts and permissions.</p>
                    </div>

                    <div
                        onClick={() => navigate('/admin/billing')}
                        className="bg-gray-800 p-6 rounded-2xl border border-gray-700 hover:border-green-500/50 transition-all cursor-pointer group hover:bg-gray-800/80"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-200 group-hover:text-green-400 transition-colors">Global Billing</h3>
                            <FileText className="w-6 h-6 text-gray-500 group-hover:text-green-500 transition-colors" />
                        </div>
                        <p className="text-gray-500 text-sm">View and manage global billing sheets and invoices.</p>
                    </div>
                </div>

                {/* Global Metrics Section */}
                <div>
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-yellow-500" />
                        Performance Overview
                        <span className="text-xs font-normal text-gray-500 ml-2">(Current Month Default)</span>
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard
                            label="Total Revenue"
                            value={`₹${Number(metrics.totalRevenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                            icon={DollarSign}
                            color="text-green-400"
                        />
                        <MetricCard
                            label="Net Profit"
                            value={`₹${Number(metrics.totalProfit || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                            icon={TrendingUp}
                            color={metrics.totalProfit >= 0 ? "text-yellow-400" : "text-red-400"}
                        />
                        <MetricCard
                            label="Total Orders"
                            value={metrics.totalOrders || '0'}
                            icon={Package}
                            color="text-blue-400"
                        />
                        <MetricCard
                            label="Active Partners"
                            value={metrics.activePartnersCount || '0'}
                            icon={Users}
                            color="text-purple-400"
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}

function MetricCard({ label, value, icon: Icon, color }: any) {
    return (
        <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl border border-gray-700/50 shadow-sm">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{label}</p>
                    <p className={`text-2xl font-extrabold mt-1 ${color}`}>{value}</p>
                </div>
                <div className={`p-2 rounded-lg bg-gray-700/50 ${color.replace('text-', 'text-opacity-80 ')}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
}
