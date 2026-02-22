import { useEffect, useState } from 'react';
import type { Invoice } from '../types';
import { ArrowLeft, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

const AdminBilling = () => {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState<Invoice[]>([]);

    useEffect(() => {
        fetchInvoices();
    }, []);

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

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            <div className="max-w-6xl mx-auto space-y-6">
                <header className="flex items-center space-x-4 mb-8">
                    <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-700" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Invoice Management</h1>
                        <p className="text-gray-500 text-sm">Review and approve partner/staff invoices</p>
                    </div>
                </header>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
