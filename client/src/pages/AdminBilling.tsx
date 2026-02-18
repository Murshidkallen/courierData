import { useEffect, useState } from 'react';
import type { Invoice } from '../types';
import { ArrowLeft, Check, X, FileText, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

const AdminBilling = () => {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState<Invoice[]>([]);

    // Dashboard Stats State
    const [stats, setStats] = useState<any>(null);
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [loadingStats, setLoadingStats] = useState(false);

    useEffect(() => {
        fetchInvoices();
    }, []);

    useEffect(() => {
        fetchStats();
    }, [dateRange]);

    const fetchStats = async () => {
        setLoadingStats(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/billing/dashboard-summary?startDate=${dateRange.start}&endDate=${dateRange.end}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (err) { console.error(err); }
        finally { setLoadingStats(false); }
    };

    const fetchInvoices = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/invoices`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setInvoices(await res.json());
        } catch (err) { console.error(err); }
    };

    const updateStatus = async (id: number, status: string) => {
        if (!confirm(`Mark invoice #${id} as ${status}?`)) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/invoices/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                setInvoices(invoices.map(i => i.id === id ? { ...i, status: status as any } : i));
            }
        } catch (err) { console.error(err); }
    };

    const generateInvoice = async (recipient: string, amount: number) => {
        if (!amount || amount <= 0) return alert('Cannot generate invoice for zero or negative amount.');
        if (!confirm(`Generate Invoice for ${recipient}?\nAmount: ₹${amount.toLocaleString()}\nDate Range: ${dateRange.start} to ${dateRange.end}`)) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/billing/generate-internal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    recipient,
                    startDate: dateRange.start,
                    endDate: dateRange.end,
                    amount
                })
            });

            if (res.ok) {
                const newInvoice = await res.json();
                setInvoices([newInvoice, ...invoices]);
                alert('Invoice Generated Successfully!');
            } else {
                alert('Failed to generate invoice.');
            }
        } catch (err) {
            console.error(err);
            alert('Error generating invoice.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6 text-gray-700" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Billing Overview</h1>
                            <p className="text-gray-500 text-sm">Financial distribution and invoice management</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { fetchStats(); fetchInvoices(); }}
                        className="p-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg shadow-sm transition-all flex items-center gap-2 text-sm font-medium"
                    >
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                </header>

                {/* Dashboard Cards Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-800">Distribution Summary</h2>
                        <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1 gap-2">
                            <input
                                type="date"
                                className="bg-transparent text-gray-600 text-sm p-2 outline-none"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            />
                            <span className="text-gray-400 self-center">-</span>
                            <input
                                type="date"
                                className="bg-transparent text-gray-600 text-sm p-2 outline-none"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Card 1: Moto Club (50% Profit) */}
                        <div
                            onClick={() => navigate('/super-admin/billing/internal/Moto Club')}
                            className="bg-indigo-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden group cursor-pointer hover:bg-indigo-700 transition-all"
                        >
                            <div className="relative z-10">
                                <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Moto Club Share</p>
                                <h3 className="text-3xl font-extrabold">₹{stats?.motoClub?.toLocaleString() || '0'}</h3>
                                <p className="text-indigo-200 text-xs mt-2 mb-4">50% of Global Profit</p>
                                <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-colors border border-white/20 flex items-center justify-center gap-2">
                                    <FileText className="w-4 h-4" /> View Profile & Bill
                                </button>
                            </div>
                            <div className="absolute -right-4 -bottom-4 bg-white/10 w-24 h-24 rounded-full blur-2xl"></div>
                        </div>

                        {/* Card 2: Open Coders (50% Profit - Commissions) */}
                        <div
                            onClick={() => navigate('/super-admin/billing/internal/Open Coders')}
                            className="bg-purple-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden group cursor-pointer hover:bg-purple-700 transition-all"
                        >
                            <div className="relative z-10">
                                <p className="text-purple-200 text-xs font-bold uppercase tracking-wider mb-1">Open Coders Share</p>
                                <h3 className="text-3xl font-extrabold">₹{stats?.openCoders?.toLocaleString() || '0'}</h3>
                                <p className="text-purple-200 text-xs mt-2 mb-4">Net Profit (After Commissions)</p>
                                <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-colors border border-white/20 flex items-center justify-center gap-2">
                                    <FileText className="w-4 h-4" /> View Profile & Bill
                                </button>
                            </div>
                            <div className="absolute -right-4 -bottom-4 bg-white/10 w-24 h-24 rounded-full blur-2xl"></div>
                        </div>

                        {/* Card 3: Partners (Total Courier Cost) */}
                        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div>
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Partners Share</p>
                                <h3 className="text-3xl font-bold text-gray-800">₹{stats?.partners?.toLocaleString() || '0'}</h3>
                                <p className="text-green-600 text-xs mt-2 flex items-center font-medium">
                                    Total Courier Costs
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/super-admin/analytics')}
                                className="mt-4 w-full py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium border border-gray-200 transition-colors"
                            >
                                View List
                            </button>
                        </div>

                        {/* Card 4: Agents (Total Commissions) */}
                        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div>
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Agents Share</p>
                                <h3 className="text-3xl font-bold text-gray-800">₹{stats?.agents?.toLocaleString() || '0'}</h3>
                                <p className="text-blue-600 text-xs mt-2 flex items-center font-medium">
                                    Total Commissions
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/super-admin/analytics')}
                                className="mt-4 w-full py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium border border-gray-200 transition-colors"
                            >
                                View List
                            </button>
                        </div>
                    </div>
                </div>

                {/* Invoice Management Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-8">
                    <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800">Invoice Requests</h2>
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {invoices.length} Pending Actions
                        </span>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Invoice ID</th>
                                <th className="px-6 py-4 font-semibold">User</th>
                                <th className="px-6 py-4 font-semibold">Role</th>
                                <th className="px-6 py-4 font-semibold">Month</th>
                                <th className="px-6 py-4 font-semibold text-right">Amount</th>
                                <th className="px-6 py-4 font-semibold text-center">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {invoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-mono text-gray-500">#{inv.id}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{inv.user?.username}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-600 uppercase">{inv.user?.role}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{inv.month}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">₹{inv.amount.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium space-x-1
                                            ${inv.status === 'Paid' ? 'bg-green-100 text-green-800' :
                                                inv.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            <span>{inv.status}</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {inv.status === 'Pending' && (
                                            <div className="flex justify-end space-x-2">
                                                <button onClick={() => updateStatus(inv.id, 'Paid')} className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200" title="Approve & Pay">
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => updateStatus(inv.id, 'Rejected')} className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200" title="Reject">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminBilling;
