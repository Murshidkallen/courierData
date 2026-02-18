import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { useAuth } from '../AuthContext';
import { ArrowLeft, RefreshCw, CreditCard, FileText, Bell, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';

export default function BillingPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    // Payment / Notification State
    const [pendingInvoice, setPendingInvoice] = useState<any>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [processingPayment, setProcessingPayment] = useState(false);

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    const fetchData = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const [statsRes, historyRes] = await Promise.all([
                fetch(`${API_URL}/api/billing/my-stats?startDate=${dateRange.start}&endDate=${dateRange.end}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${API_URL}/api/billing/user-history`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (statsRes.ok) setStats(await statsRes.json());
            if (historyRes.ok) {
                const data = await historyRes.json();
                const invoices = data.invoices || [];
                setHistory(invoices);

                // Check for Pending Invoices and Notify
                const pending = invoices.find((inv: any) => inv.status === 'Pending');
                if (pending) {
                    setPendingInvoice(pending);
                    setShowPaymentModal(true); // Auto-show (Pop up)
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        if (!pendingInvoice) return;
        setProcessingPayment(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/billing/invoices/${pendingInvoice.id}/pay`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ paymentMode })
            });

            if (res.ok) {
                // Success
                setShowPaymentModal(false);
                setPendingInvoice(null);
                fetchData(); // Refresh data
                alert('Payment Accepted Successfully!');
            } else {
                alert('Failed to process payment. Please try again.');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred.');
        } finally {
            setProcessingPayment(false);
        }
    };

    if (loading && !stats) return <div className="min-h-screen flex items-center justify-center">Loading Billing...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            <div className="max-w-5xl mx-auto space-y-6">
                <header className="flex items-center gap-4 mb-6 justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6 text-gray-700" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">My Billing</h1>
                            <p className="text-gray-500 text-sm">Track your earnings and invoices</p>
                        </div>
                    </div>

                    {/* Notification Badge if minimized */}
                    {pendingInvoice && !showPaymentModal && (
                        <button
                            onClick={() => setShowPaymentModal(true)}
                            className="bg-red-100 text-red-600 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold animate-pulse hover:bg-red-200 transition-colors"
                        >
                            <Bell className="w-4 h-4" />
                            Action Required: Invoice Pending
                        </button>
                    )}
                </header>

                {/* Current Stats Card */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-gray-500" /> Current Period
                            </h2>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                                    className="border rounded p-1 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <span className="text-gray-400">to</span>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                                    className="border rounded p-1 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <button onClick={fetchData} className="ml-2 p-1.5 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                            <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide">Total Items</p>
                            <h3 className="text-2xl font-bold text-indigo-900 mt-1">{stats?.ordersCount || 0}</h3>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                            <p className="text-xs font-bold text-green-600 uppercase tracking-wide">
                                {user?.role === 'PARTNER' ? 'Estimated Earnings' : 'Pending Commission'}
                            </p>
                            <h3 className="text-3xl font-bold text-green-700 mt-1">₹{stats?.amount?.toLocaleString() || 0}</h3>
                            {stats?.details?.formula && (
                                <p className="text-xs text-green-600 mt-1 opacity-75 truncate" title={stats.details.formula}>
                                    {stats.details.formula}
                                </p>
                            )}
                        </div>

                        {/* Total Paid / Due Card */}
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Lifetime Due</p>
                            <h3 className="text-3xl font-bold text-gray-700 mt-1">₹{stats?.totalDue?.toLocaleString() || 0}</h3>
                            <p className="text-xs text-gray-400 mt-1">Total Unpaid Earnings</p>
                        </div>
                    </div>
                </div>

                {/* History Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                        <h3 className="font-bold text-gray-800">Invoice History</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-6 py-3 font-semibold">Invoice ID</th>
                                    <th className="px-6 py-3 font-semibold">Date Range</th>
                                    <th className="px-6 py-3 font-semibold text-right">Amount</th>
                                    <th className="px-6 py-3 font-semibold text-center">Status</th>
                                    <th className="px-6 py-3 font-semibold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {history.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No invoices found</td></tr>
                                ) : (
                                    history.map(inv => (
                                        <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-mono text-gray-600">#{inv.id}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(inv.startDate).toLocaleDateString()} - {new Date(inv.endDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right font-bold text-gray-900">₹{inv.amount.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${inv.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                                        inv.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {inv.status === 'Pending' && (
                                                    <button
                                                        onClick={() => { setPendingInvoice(inv); setShowPaymentModal(true); }}
                                                        className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition-colors"
                                                    >
                                                        Pay / Accept
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Payment Modal */}
                <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Invoice Payment">
                    <div className="space-y-4">
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <Bell className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-700">
                                        You have a pending invoice of <strong>₹{pendingInvoice?.amount?.toLocaleString()}</strong>
                                        <br />
                                        <span className="text-xs text-yellow-600">Please confirm payment to proceed.</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Payment Mode</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['Cash', 'UPI', 'Bank Transfer'].map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setPaymentMode(mode)}
                                        className={`p-3 rounded-lg border text-sm font-medium transition-all ${paymentMode === mode
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600'
                                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                            >
                                Minimize
                            </button>
                            <button
                                onClick={handlePayment}
                                disabled={processingPayment}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {processingPayment ? 'Processing...' : (
                                    <>
                                        <CheckCircle className="w-4 h-4" /> Confirm & Accept
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
}
