
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { API_URL } from '../config';
import { ArrowLeft, FileText, Calendar, Clock, Download, RefreshCw } from 'lucide-react';

export default function BillingProfile() {
    const { type, id } = useParams(); // type: 'internal', 'partner', 'agent'
    const navigate = useNavigate();
    const { user } = useAuth();

    // State
    const [stats, setStats] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const entityName = type === 'internal' ? id : (stats?.name || 'Loading...');
    // For internal, id is 'Moto Club' or 'Open Coders'

    useEffect(() => {
        fetchData();
    }, [type, id, dateRange]);

    const fetchData = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            let statsUrl = '';
            let historyUrl = '';

            if (type === 'internal') {
                statsUrl = `${API_URL}/api/billing/internal-stats/${id}?startDate=${dateRange.start}&endDate=${dateRange.end}`;
                historyUrl = `${API_URL}/api/billing/internal-history/${id}`;
            } else {
                const entityType = type === 'partner' ? 'PARTNER' : 'SALES_EXECUTIVE';
                statsUrl = `${API_URL}/api/billing/entity/${entityType}/${id}/stats?startDate=${dateRange.start}&endDate=${dateRange.end}`;
                historyUrl = `${API_URL}/api/billing/entity/${entityType}/${id}/history`;
            }

            const [statsRes, historyRes] = await Promise.all([
                fetch(statsUrl, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(historyUrl, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (statsRes.ok) setStats(await statsRes.json());
            if (historyRes.ok) {
                const histData = await historyRes.json();
                setHistory(histData.invoices || []);
            }

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const generateBill = async () => {
        if (!stats || stats.amount <= 0) return alert('No pending amount to bill.');
        if (!confirm(`Generate Invoice for ${entityName}?\nAmount: ₹${stats.amount}\nPeriod: ${dateRange.start} to ${dateRange.end}`)) return;

        const token = localStorage.getItem('token');
        const endpoint = type === 'internal' ? `${API_URL}/api/billing/generate-internal` : `${API_URL}/api/billing/entity/generate`;

        const body: any = {
            startDate: dateRange.start,
            endDate: dateRange.end,
            amount: stats.amount
        };

        if (type === 'internal') {
            body.recipient = id;
        } else {
            body.type = type === 'partner' ? 'PARTNER' : 'SALES_EXECUTIVE';
            body.id = id;
        }

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                alert('Invoice Generated!');
                fetchData(); // Refresh history
            } else {
                alert('Failed to generate.');
            }
        } catch (e) {
            console.error(e);
            alert('Error.');
        }
    };

    if (loading && !stats) return <div className="p-8 text-center">Loading Profile...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <header className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-200 rounded-full">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{decodeURIComponent(entityName)}</h1>
                        <p className="text-gray-500 capitalize">{type} Billing Profile</p>
                    </div>
                </header>

                {/* Current Stats Card */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 mb-2">Current Bill Cycle</h2>
                            <div className="flex gap-2 items-center mb-4">
                                <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} className="border rounded p-1 text-sm" />
                                <span>to</span>
                                <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} className="border rounded p-1 text-sm" />
                            </div>
                        </div>
                        <button onClick={fetchData} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><RefreshCw className="w-5 h-5" /></button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                        <div className="p-4 bg-indigo-50 rounded-lg">
                            <p className="text-xs font-bold text-indigo-500 uppercase">Total Items</p>
                            <h3 className="text-2xl font-bold text-indigo-900">{stats?.ordersCount || 0}</h3>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                            <p className="text-xs font-bold text-green-500 uppercase">Pending Amount</p>
                            <h3 className="text-3xl font-bold text-green-700">₹{stats?.amount?.toLocaleString()}</h3>
                            {stats?.details?.formula && <p className="text-xs text-green-600 mt-1">{stats.details.formula}</p>}
                        </div>
                        <div className="flex items-end">
                            {user?.role !== 'PARTNER' && (
                                <button
                                    onClick={generateBill}
                                    disabled={!stats || stats.amount <= 0}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-md transition-all flex justify-center items-center gap-2"
                                >
                                    <FileText className="w-5 h-5" /> Generate Bill
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* History Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                        <h3 className="font-bold text-gray-800">Billing History</h3>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-6 py-3">Invoice ID</th>
                                <th className="px-6 py-3">Date Range</th>
                                <th className="px-6 py-3">Month</th>
                                <th className="px-6 py-3 text-right">Amount</th>
                                <th className="px-6 py-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {history.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No invoice history found</td></tr>
                            ) : (
                                history.map(inv => (
                                    <tr key={inv.id} className="hover:bg-gray-50 cursor-pointer">
                                        <td className="px-6 py-4 text-sm font-mono text-gray-600">#{inv.id}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(inv.startDate).toLocaleDateString()} - {new Date(inv.endDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-800 font-medium">{inv.month}</td>
                                        <td className="px-6 py-4 text-sm text-right font-bold text-gray-900">₹{inv.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${inv.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
