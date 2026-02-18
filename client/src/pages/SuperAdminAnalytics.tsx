import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { ArrowLeft, Calendar, Download } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export default function SuperAdminAnalytics() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        if (!user || user.role !== 'SUPER_ADMIN') {
            navigate('/');
            return;
        }
        fetchStats();
    }, [dateRange]);

    const fetchStats = async () => {
        try {
            setLoading(true);
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
            console.error("Failed to fetch analytics", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading Analytics...</div>;

    const chartData = stats?.chartData || [];
    const partnerPerformance = stats?.partnerPerformance || [];

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header with Back Button */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/super-admin')}
                            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-400" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Analytics & Insights</h1>
                            <p className="text-gray-400 text-sm">Comprehensive performance dataview.</p>
                        </div>
                    </div>

                    {/* Simple Date Filter (Native) */}
                    <div className="flex bg-gray-800 rounded-lg p-1 gap-2">
                        <input
                            type="date"
                            className="bg-transparent text-white text-sm p-2 outline-none"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                        <span className="text-gray-500 self-center">-</span>
                        <input
                            type="date"
                            className="bg-transparent text-white text-sm p-2 outline-none"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                    </div>
                </div>

                {/* Revenue Trend Chart */}
                <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                    <h3 className="text-lg font-bold text-white mb-6">Revenue & Profit Trend</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, '']}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10B981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                                <Area type="monotone" dataKey="profit" name="Profit" stroke="#F59E0B" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Partner Performance Table */}
                <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white">Partner Performance</h3>
                        <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                            Ranked by Volume
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-900/50 text-xs text-gray-400 uppercase">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Partner Name</th>
                                    <th className="px-6 py-4 font-semibold text-right">Total Orders</th>
                                    <th className="px-6 py-4 font-semibold text-right">Revenue Generated</th>
                                    <th className="px-6 py-4 font-semibold text-right">Net Profit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {partnerPerformance.length > 0 ? (
                                    partnerPerformance.map((partner: any) => (
                                        <tr key={partner.id} className="hover:bg-gray-700/30 transition-colors">
                                            <td className="px-6 py-4 font-medium text-white">{partner.name}</td>
                                            <td className="px-6 py-4 text-right text-gray-300">{partner.orders}</td>
                                            <td className="px-6 py-4 text-right text-green-400 font-medium">₹{partner.revenue.toLocaleString()}</td>
                                            <td className={`px-6 py-4 text-right font-bold ${partner.profit >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                ₹{partner.profit.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No partner data available for this period.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
