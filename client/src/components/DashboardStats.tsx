import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { BarChart2, TrendingUp, ChevronRight } from 'lucide-react';
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

interface Props {
    externalDateRange?: { start: string; end: string };
    onDateRangeChange?: (range: { start: string; end: string }) => void;
}

const DashboardStats: React.FC<Props> = ({ externalDateRange }) => {
    const { user } = useAuth();
    const [stats, setStats] = useState<StatsData | null>(null);
    const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
    // Use Global Bill Cycle or External Props
    const [internalDateRange, setInternalDateRange] = useState<{ start: string, end: string }>({ start: '', end: '' });
    const [isPresetOpen, setIsPresetOpen] = useState(false);

    const dateRange = externalDateRange || internalDateRange;

    useEffect(() => {
        // If external provided, do nothing (parent controls)
        if (externalDateRange) return;

        // Default to Current Month if no external
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        setInternalDateRange({ start, end });
    }, [externalDateRange]);

    const applyPreset = (daysOrMode: number | 'thisMonth') => {
        const end = new Date();
        let start = new Date();

        if (daysOrMode === 'thisMonth') {
            start = new Date(end.getFullYear(), end.getMonth(), 1);
            end.setMonth(end.getMonth() + 1);
            end.setDate(0);
        } else {
            start.setDate(end.getDate() - daysOrMode);
        }

        setInternalDateRange({
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        });
        setIsPresetOpen(false);
    };

    const fetchStats = async () => {
        if (!dateRange.start || !dateRange.end) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/stats?startDate=${dateRange.start}&endDate=${dateRange.end}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setStats(await res.json());
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchStats();
    }, [dateRange]);

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
            {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                <StatCard
                    title="Total Sale Amount"
                    value={`₹${stats.kpi.totalSales?.toFixed(0) || '0'}`}
                    icon="💵"
                    color="from-pink-500 to-rose-500"
                    subValue="Sum of Total Paid"
                />
            )}
            {user?.role !== 'ADMIN' && (
                <StatCard
                    title={user?.role === 'PARTNER' ? "My Earnings" : "Total Profit"}
                    value={`₹${stats.kpi.totalProfit?.toFixed(2) || '0.00'}`}
                    icon="💰"
                    color="from-emerald-400 to-emerald-600"
                    subValue={user?.role === 'PARTNER' ? "From Courier Cost" : "+12% from last month"}
                />
            )}
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <span className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600"><TrendingUp className="w-5 h-5" /></span>
                            Earnings Trend
                        </h3>
                        {/* Date Range Badge */}
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                                {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
                            </span>
                            {!externalDateRange && (
                                <div className="relative z-10">
                                    <button onClick={() => setIsPresetOpen(!isPresetOpen)} className="text-xs text-indigo-600 hover:underline font-semibold flex items-center gap-1">
                                        Change <ChevronRight className="w-3 h-3 rotate-90" />
                                    </button>
                                    {isPresetOpen && (
                                        <div className="absolute top-6 left-0 w-40 bg-white shadow-xl rounded-lg border border-gray-100 py-1 overflow-hidden animate-fade-in-up">
                                            <button onClick={() => applyPreset(7)} className="w-full text-left px-4 py-2 text-xs hover:bg-indigo-50 text-gray-700">Last 7 Days</button>
                                            <button onClick={() => applyPreset(14)} className="w-full text-left px-4 py-2 text-xs hover:bg-indigo-50 text-gray-700">Last 2 Weeks</button>
                                            <button onClick={() => applyPreset('thisMonth')} className="w-full text-left px-4 py-2 text-xs hover:bg-indigo-50 text-gray-700 border-t">This Month</button>
                                        </div>
                                    )}
                                    {isPresetOpen && <div className="fixed inset-0 z-0" onClick={() => setIsPresetOpen(false)}></div>}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex space-x-2">
                        <div className="bg-gray-100 p-1 rounded-lg flex space-x-1 mr-4">
                            <button onClick={() => setChartType('bar')} className={`p-1.5 rounded-md transition-all ${chartType === 'bar' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
                                <BarChart2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => setChartType('line')} className={`p-1.5 rounded-md transition-all ${chartType === 'line' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
                                <TrendingUp className="w-4 h-4" />
                            </button>
                        </div>
                        <span className="flex items-center text-xs text-gray-500"><span className="w-3 h-3 rounded-full bg-emerald-400 mr-1"></span> {user?.role === 'PARTNER' ? "Earnings" : (user?.role === 'ADMIN' ? "Sales Amount" : "Profit")}</span>
                        {user?.role !== 'PARTNER' && <span className="flex items-center text-xs text-gray-500"><span className="w-3 h-3 rounded-full bg-red-400 mr-1"></span> Expense</span>}
                    </div>
                </div>
                <div className="h-72 w-full">
                    {stats?.chartData && stats.chartData.length > 0 ? (
                        <>
                            {chartType === 'bar' ? (
                                <div className="w-full h-full overflow-x-auto overflow-y-hidden custom-scrollbar">
                                    <div style={{ minWidth: '100%', width: `${Math.max(600, stats.chartData.length * 60)}px`, height: '100%' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={stats.chartData} barGap={4} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="1 1" vertical={true} stroke="#E0E7FF" strokeOpacity={0.8} />
                                                <XAxis dataKey="name" fontSize={11} stroke="#6B7280" tickLine={false} axisLine={true} dy={10} />
                                                <YAxis fontSize={11} stroke="#6B7280" tickLine={false} axisLine={true} tickFormatter={(value) => `₹${value}`} />
                                                <Tooltip
                                                    cursor={{ fill: '#F3F4F6', opacity: 0.5 }}
                                                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                                />
                                                <Bar dataKey={user?.role === 'PARTNER' ? "profit" : (user?.role === 'ADMIN' ? "totalSales" : "profit")} name={user?.role === 'PARTNER' ? "Earnings" : (user?.role === 'ADMIN' ? "Sales" : "Profit")} fill="#34D399" radius={[4, 4, 0, 0]} barSize={20} />
                                                {user?.role !== 'PARTNER' && <Bar dataKey="expenses" name="Expense" fill="#F87171" radius={[4, 4, 0, 0]} barSize={20} />}
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full h-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={stats.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E7FF" />
                                            <XAxis dataKey="name" fontSize={11} stroke="#6B7280" tickLine={false} axisLine={false} dy={10} />
                                            <YAxis fontSize={11} stroke="#6B7280" tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                                            <Tooltip
                                                cursor={{ stroke: '#6366F1', strokeWidth: 2 }}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                            />
                                            {/* Graph Paper Style: Solid dark lines with dots */}
                                            <Line type="monotone" dataKey={user?.role === 'PARTNER' ? "profit" : (user?.role === 'ADMIN' ? "totalSales" : "profit")} name={user?.role === 'PARTNER' ? "Earnings" : (user?.role === 'ADMIN' ? "Sales" : "Profit")} stroke="#4F46E5" strokeWidth={3} dot={{ r: 4, fill: '#4F46E5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                            {user?.role !== 'PARTNER' && <Line type="monotone" dataKey="expenses" name="Expense" stroke="#EF4444" strokeWidth={3} dot={{ r: 4, fill: '#EF4444', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />}
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">No chart data available for this range</div>
                    )}
                </div>
            </div >
        </div >
    );
};

export default DashboardStats;
