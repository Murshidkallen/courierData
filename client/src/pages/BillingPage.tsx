import { useEffect, useState } from 'react';
import type { Invoice } from '../types';
import { ArrowLeft, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

const BillingPage = () => {
    // const { user } = useAuth(); // Unused for now
    const navigate = useNavigate();
    const [stats, setStats] = useState<{ ordersCount: number; totalAmount: number; month: string } | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const [statsRes, invoicesRes] = await Promise.all([
                    fetch(`${API_URL}/api/billing/stats`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API_URL}/api/invoices`, { headers: { Authorization: `Bearer ${token}` } })
                ]);

                if (statsRes.ok) setStats(await statsRes.json());
                if (invoicesRes.ok) setInvoices(await invoicesRes.json());
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const generateInvoice = async () => {
        if (!stats) return;
        if (!confirm(`Generate invoice for ${stats.month} with amount ₹${stats.totalAmount}?`)) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/invoices`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ amount: stats.totalAmount, month: stats.month })
            });
            if (res.ok) {
                const newInvoice = await res.json();
                setInvoices([newInvoice, ...invoices]);
                alert('Invoice generated successfully!');
            } else {
                alert('Failed to generate invoice');
            }
        } catch (err) {
            console.error(err);
            alert('Error generating invoice');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading billing data...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            <div className="max-w-4xl mx-auto space-y-6">
                <header className="flex items-center space-x-4 mb-8">
                    <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-700" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Billing & Profile</h1>
                        <p className="text-gray-500 text-sm">Manage your monthly invoices and earnings</p>
                    </div>
                </header>

                {/* Stats Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-indigo-50 rounded-xl">
                        <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">Current Month</p>
                        <h3 className="text-xl font-bold text-indigo-900">{stats?.month}</h3>
                        <p className="text-sm text-indigo-600 mt-2">{stats?.ordersCount} Orders</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-xl">
                        <p className="text-xs font-bold text-green-500 uppercase tracking-wider mb-1">Due Amount</p>
                        <h3 className="text-3xl font-extrabold text-green-700">₹{stats?.totalAmount.toFixed(2)}</h3>
                        <p className="text-sm text-green-600 mt-2">To be invoiced</p>
                    </div>
                    <div className="flex items-center justify-center">
                        <button
                            onClick={generateInvoice}
                            disabled={stats?.totalAmount === 0}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2"
                        >
                            <FileText className="w-5 h-5" />
                            <span>Generate Invoice</span>
                        </button>
                    </div>
                </div>

                {/* Invoice History */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                        <h2 className="text-lg font-bold text-gray-800">Invoice History</h2>
                    </div>
                    {invoices.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">No invoices found here.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">Date</th>
                                        <th className="px-6 py-3 font-semibold">Month</th>
                                        <th className="px-6 py-3 font-semibold text-right">Amount</th>
                                        <th className="px-6 py-3 font-semibold text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {invoices.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-600">{new Date(inv.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{inv.month}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">₹{inv.amount.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium space-x-1
                                                    ${inv.status === 'Paid' ? 'bg-green-100 text-green-800' :
                                                        inv.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {inv.status === 'Paid' && <CheckCircle className="w-3 h-3" />}
                                                    {inv.status === 'Pending' && <Clock className="w-3 h-3" />}
                                                    {inv.status === 'Rejected' && <XCircle className="w-3 h-3" />}
                                                    <span>{inv.status}</span>
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BillingPage;
