import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../AuthContext';
import { API_URL } from '../config';

interface StatsData {
    kpi: {
        totalOrders: number;
        totalProfit: number;
        totalSales: number;
        todayOrders: number;
        pendingCosts: number;
    };
    chartData: {
        name: string;
        profit: number;
        expenses: number;
    }[];
}

const DashboardStats = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<StatsData | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`${API_URL}/api/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    setStats(await res.json());
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchStats();
    }, []);

    if (!stats) return <div className="p-12 text-center text-gray-400 font-medium animate-pulse">Loading Dashboard Data...</div>;

    const StatCard = ({ title, value, icon, color, subValue }: any) => (
        <div className={`p-6 rounded-2xl shadow-xl bg-gradient-to-br ${color} text-white transform hover:scale-105 transition-all duration-300 relative overflow-hidden`}>
            <div className="relative z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">{title}</p>
                        <h3 className="text-3xl font-extrabold">{value}</h3>
                    </div>
                    <span className="text-3xl opacity-50">{icon}</span>
                </div>
                {subValue && <div className="mt-4 text-sm font-medium opacity-90">{subValue}</div>}
            </div>
            {/* Decoration */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-10">
            {/* KPI Cards */}
            <StatCard
                title="Total Orders"
                value={stats.kpi.totalOrders}
                icon="📦"
                color="from-blue-500 to-blue-600"
                subValue="All time entries"
            />
            {user?.role === 'ADMIN' && (
                <StatCard
                    title="Total Sale Amount"
                    value={`₹${stats.kpi.totalSales?.toFixed(0) || '0'}`}
                    icon="💵"
                    color="from-pink-500 to-rose-500"
                    subValue="Sum of Total Paid"
                />
            )}
            <StatCard
                title={user?.role === 'PARTNER' ? "My Earnings" : "Total Profit"}
                value={`₹${stats.kpi.totalProfit.toFixed(2)}`}
                icon="💰"
                color="from-emerald-400 to-emerald-600"
                subValue={user?.role === 'PARTNER' ? "From Courier Cost" : "+12% from last month"}
            />
            <StatCard
                title="Today's Activity"
                value={stats.kpi.todayOrders}
                icon="📅"
                color="from-purple-500 to-indigo-600"
                subValue={stats.kpi.todayOrders === 0 ? "No orders yet" : "Orders processing"}
            />
            <StatCard
                title={user?.role === 'PARTNER' ? "Active Orders" : "Pending Costs"}
                value={stats.kpi.pendingCosts}
                icon={user?.role === 'PARTNER' ? "🚚" : "⚠️"}
                color="from-orange-400 to-red-500"
                subValue={user?.role === 'PARTNER' ? "In Progress" : "Needs attention"}
            />

            {/* Chart */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-5 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-gray-800 text-lg font-bold">
                        {user?.role === 'PARTNER' ? "Earnings Trends" : "Profit Structure"}
                        <span className="text-gray-400 text-sm font-normal">(Last 7 Days)</span>
                    </h3>
                    <div className="flex space-x-2">
                        <span className="flex items-center text-xs text-gray-500"><span className="w-3 h-3 rounded-full bg-emerald-400 mr-1"></span> {user?.role === 'PARTNER' ? "Earnings" : "Profit"}</span>
                        {user?.role !== 'PARTNER' && <span className="flex items-center text-xs text-gray-500"><span className="w-3 h-3 rounded-full bg-red-400 mr-1"></span> Expense</span>}
                    </div>
                </div>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.chartData} barGap={4}>
                            <XAxis dataKey="name" fontSize={12} stroke="#9CA3AF" tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} stroke="#9CA3AF" tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                cursor={{ fill: '#F3F4F6' }}
                            />
                            <Bar dataKey="profit" fill="#34D399" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            <Bar dataKey="expenses" fill="#F87171" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default DashboardStats;
