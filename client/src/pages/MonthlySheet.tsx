import { useEffect, useState } from 'react';
import type { Courier } from '../types';
import { ArrowLeft, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MonthlySheet = () => {
    const navigate = useNavigate();
    const [couriers, setCouriers] = useState<Courier[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        fetchData();
    }, [currentDate]);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth(); // 0-11

        const m = String(month + 1).padStart(2, '0');
        const start = `${year}-${m}-01`;
        const lastDay = new Date(year, month + 1, 0).getDate();
        const end = `${year}-${m}-${String(lastDay).padStart(2, '0')}`;

        try {
            const res = await fetch(`${API_URL}/api/couriers?startDate=${start}&endDate=${end}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCouriers(data);
            }
        } catch (err) { console.error(err); }
    };

    const changeMonth = (offset: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    const exportToPDF = () => {
        const doc = new jsPDF('landscape');
        const headers = ['Date', 'Slip', 'Tracking', 'Customer', 'Phone', 'Products', 'Paid', 'Prod Cost', 'Cour Cost', 'Status', 'Partner'];

        const rows = couriers.map(c => [
            new Date(c.date).toLocaleDateString(),
            c.slipNo || '-',
            c.trackingId || '-',
            c.customerName,
            c.phoneNumber || '-',
            c.products?.map(p => p.name).join(', ') || '-',
            c.totalPaid || 0,
            c.products?.reduce((acc, p) => acc + (Number(p.cost) || 0), 0) || 0,
            c.courierCost || 0,
            c.status || '-',
            c.partner?.name || '-'
        ]);

        doc.setFontSize(14);
        doc.text(`Monthly Sheet - ${currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`, 14, 15);

        autoTable(doc, {
            head: [headers],
            body: rows,
            startY: 20,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [79, 70, 229] }, // Indigo
            columnStyles: {
                5: { cellWidth: 60 } // Products column width
            }
        });

        doc.save(`monthly_sheet_${currentDate.getMonth() + 1}_${currentDate.getFullYear()}.pdf`);
    };

    return (
        <div className="min-h-screen bg-white font-sans text-sm">
            {/* Header */}
            <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between bg-white sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin')} className="p-1 hover:bg-gray-100 rounded transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <h1 className="font-bold text-gray-700 text-lg flex items-center gap-2">
                        Monthly Sheet
                        <span className="text-gray-400 font-normal">|</span>
                        <span className="text-indigo-600">
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 rounded border border-gray-300">
                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded border border-gray-300">
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                    <div className="h-6 w-px bg-gray-300 mx-2"></div>
                    <button onClick={exportToPDF} className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium">
                        <FileText className="w-4 h-4" />
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Dense Table */}
            <div className="overflow-auto h-[calc(100vh-60px)]">
                <table className="w-full border-collapse">
                    <thead className="bg-gray-50 sticky top-0 z-50 shadow-sm">
                        <tr>
                            <th className="border border-gray-200 px-2 py-1 text-left font-semibold text-gray-600 w-24">Date</th>
                            <th className="border border-gray-200 px-2 py-1 text-left font-semibold text-gray-600 w-16">Slip</th>
                            <th className="border border-gray-200 px-2 py-1 text-left font-semibold text-gray-600 w-32">Tracking</th>
                            <th className="border border-gray-200 px-2 py-1 text-left font-semibold text-gray-600">Customer</th>
                            <th className="border border-gray-200 px-2 py-1 text-left font-semibold text-gray-600 w-48">Products</th>
                            <th className="border border-gray-200 px-2 py-1 text-right font-semibold text-gray-600 w-24">Paid</th>
                            <th className="border border-gray-200 px-2 py-1 text-right font-semibold text-gray-600 w-24">Cost</th>
                            <th className="border border-gray-200 px-2 py-1 text-center font-semibold text-gray-600 w-24">Status</th>
                            <th className="border border-gray-200 px-2 py-1 text-left font-semibold text-gray-600 w-32">Partner</th>
                        </tr>
                    </thead>
                    <tbody>
                        {couriers.map((c) => (
                            <tr key={c.id} className="hover:bg-indigo-50/30 transition-colors">
                                <td className="border border-gray-200 px-2 py-1 text-gray-600 truncate">{new Date(c.date).toLocaleDateString()}</td>
                                <td className="border border-gray-200 px-2 py-1 text-gray-900 font-mono text-xs">{c.slipNo}</td>
                                <td className="border border-gray-200 px-2 py-1 text-indigo-600 font-mono text-xs truncate" title={c.trackingId}>{c.trackingId}</td>
                                <td className="border border-gray-200 px-2 py-1 text-gray-900 font-medium truncate" title={c.customerName}>{c.customerName}</td>
                                <td className="border border-gray-200 px-2 py-1 text-gray-500 text-xs truncate" title={c.products.map(p => p.name).join(', ')}>
                                    {c.products.map(p => p.name).join(', ')}
                                </td>
                                <td className="border border-gray-200 px-2 py-1 text-gray-900 text-right font-medium">{c.totalPaid}</td>
                                <td className="border border-gray-200 px-2 py-1 text-gray-500 text-right">{c.courierCost}</td>
                                <td className="border border-gray-200 px-2 py-1 text-center">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold
                                        ${c.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                            c.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                                                c.status === 'Returned' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {c.status}
                                    </span>
                                </td>
                                <td className="border border-gray-200 px-2 py-1 text-gray-600 text-xs truncate">{c.partner?.name}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MonthlySheet;
