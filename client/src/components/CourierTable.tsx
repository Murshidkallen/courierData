import React, { useState } from 'react';
import type { Courier } from '../types';
import { useAuth } from '../AuthContext';

interface Props {
    couriers: Courier[];
    onUpdate: (id: number, data: any) => void;
    onEdit?: (courier: Courier) => void;
    onDelete?: (id: number) => void;
}

const CourierTable: React.FC<Props> = ({ couriers, onUpdate, onEdit, onDelete }) => {
    const { user } = useAuth();
    const [expandedRow, setExpandedRow] = useState<number | null>(null);

    const isFieldVisible = (field: string) => {
        if (!user || !user.visibleFields || user.visibleFields === '*') return true;
        return user.visibleFields.split(',').includes(field);
    };

    const handleWhatsApp = (courier: Courier, type: 'General' | 'Paid' | 'Shipped') => {
        if (!courier.phoneNumber) return;
        const cleanPhone = courier.phoneNumber.replace(/[^0-9]/g, '');

        let message = '';
        if (type === 'Paid') {
            message = `Dear ${courier.customerName},

Thank you for your order with Moto Club Online🙏
We’re happy to confirm that your order has been successfully placed.

📦 Order Details:
• Order ID: ${courier.slipNo || 'N/A'}
• Product(s): ${courier.products.map(p => p.name).join(', ')}
• Amount: ₹${courier.totalPaid}
• Payment Status: Paid

⏱️ Your order is being processed and will be dispatched soon.
We’ll share the tracking details once it’s shipped.

For any queries, feel free to contact us here anytime 😊
Thank you for choosing us!

— Moto Club Online🚗✨`;
        } else if (type === 'Shipped') {
            const partnerName = courier.partner?.name || 'Courier';
            const trackingLink = partnerName.includes('Gokulam Speed and Safe')
                ? `https://motoclub-tracking.vercel.app/?id=${courier.trackingId}`
                : '';

            message = `Dear ${courier.customerName},

Your order from Moto Club Online has been dispatched successfully 📦✨

📄 Shipment Details:
• Order ID: ${courier.slipNo || 'N/A'}
• Tracking ID: ${courier.trackingId}
• Courier Partner: ${partnerName}

⏱️ You can track your shipment using the tracking ID provided.
Delivery will be completed soon.

${trackingLink}

For any assistance, feel free to message us anytime 😊
Thank you for shopping with us!

— Moto Club Online 🚗💨`;
        }

        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const handleStatusChange = (courier: Courier, newStatus: string) => {
        onUpdate(courier.id, { status: newStatus });

        // Trigger WhatsApp logic
        if (newStatus === 'Paid' && courier.status !== 'Paid') {
            if (confirm('Order marked as PAID. Open WhatsApp to send confirmation?')) {
                handleWhatsApp(courier, 'Paid');
            }
        }
        if (newStatus === 'Shipped' && courier.status !== 'Shipped') {
            if (confirm('Order marked as SHIPPED. Open WhatsApp to send tracking details?')) {
                handleWhatsApp(courier, 'Shipped');
            }
        }
    };

    const toggleRow = (id: number) => {
        setExpandedRow(expandedRow === id ? null : id);
    }

    // Role Logic: Admin/Partner/Staff/Viewer permissions

    // Wait, Staff can enter but maybe not edit status freely? 
    // Requirement 4: "admin can be update from recent to Paid...". 
    // Requirement 11: "partner ... status ( can be change to shipped, deliverd, returend"
    // Staff role usually enters "Pending". Can they update? 
    // "staff coluld be add new order as pending/-, only shown entered by him"
    // Assuming Staff cannot change status from Pending -> Paid? Only Admin?
    // Let's allow Admin/Partner to change status. Staff? strict interpretation: ADD new order.
    // I'll stick to: Admin & Partner (specific statuses) can edit. Staff? Maybe not.
    // I'll allow Admin and Partner. Staff usually just enters.

    return (
        <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tracking</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Products</th>
                            {(user?.role === 'ADMIN' || user?.role === 'PARTNER') && (
                                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Unit / Wt</th>
                            )}
                            {user?.role !== 'PARTNER' && (
                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total Paid</th>
                            )}
                            {(user?.role === 'ADMIN' || user?.role === 'PARTNER') && (
                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Courier Cost</th>
                            )}
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">WA</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white">
                        {couriers.map((courier) => (
                            <React.Fragment key={courier.id}>
                                <tr className={`hover:bg-indigo-50/30 transition-colors duration-150 group ${expandedRow === courier.id ? 'bg-indigo-50/50' : ''}`}>
                                    {/* Date */}
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-medium" onClick={() => toggleRow(courier.id)}>
                                        {new Date(courier.date).toLocaleDateString()}
                                    </td>

                                    {/* Customer + Phone */}
                                    <td className="px-4 py-3" onClick={() => toggleRow(courier.id)}>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900">{courier.customerName}</span>
                                            <span className="text-xs text-gray-400">{courier.phoneNumber}</span>
                                        </div>
                                    </td>

                                    {/* Tracking ID */}
                                    <td className="px-4 py-3" onClick={() => toggleRow(courier.id)}>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-mono text-gray-700 tracking-tight">{courier.trackingId}</span>
                                            {courier.slipNo && <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full w-fit mt-1">#{courier.slipNo}</span>}
                                        </div>
                                    </td>

                                    {/* Products */}
                                    <td className="px-4 py-3 text-sm text-gray-500" onClick={() => toggleRow(courier.id)}>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {courier.products?.length || 0} Items
                                        </span>
                                    </td>

                                    {/* Unit / Wt (Partner Update) */}
                                    {(user?.role === 'ADMIN' || user?.role === 'PARTNER') && (
                                        <td className="px-3 py-3">
                                            <input
                                                type="text"
                                                defaultValue={courier.unit || ''}
                                                placeholder="kg/unit"
                                                onBlur={(e) => {
                                                    const val = e.target.value;
                                                    if (val !== courier.unit) {
                                                        onUpdate(courier.id, { unit: val });
                                                    }
                                                }}
                                                className="w-20 p-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none bg-gray-50 focus:bg-white transition-all disabled:opacity-50"
                                            />
                                        </td>
                                    )}

                                    {/* Total Paid */}
                                    {user?.role !== 'PARTNER' && (
                                        <td className="px-4 py-3 text-right text-sm font-bold text-gray-900" onClick={() => toggleRow(courier.id)}>
                                            {isFieldVisible('totalPaid') && `₹${courier.totalPaid?.toFixed(2)}`}
                                            {user?.role !== 'STAFF' && isFieldVisible('profit') && (
                                                <div className={`text-xs ${courier.profit! >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                    (P: {courier.profit?.toFixed(0)})
                                                </div>
                                            )}
                                        </td>
                                    )}

                                    {/* Courier Cost (Partner Update) */}
                                    {(user?.role === 'ADMIN' || user?.role === 'PARTNER') && (
                                        <td className="px-4 py-3 text-right">
                                            <input
                                                type="number"
                                                defaultValue={courier.courierCost || 0}
                                                onBlur={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    if (val !== courier.courierCost) {
                                                        onUpdate(courier.id, { courierCost: val });
                                                    }
                                                }}
                                                className="w-20 p-1 text-right text-sm border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none bg-gray-50 focus:bg-white transition-all disabled:opacity-50"
                                            />
                                        </td>
                                    )}

                                    {/* Status */}
                                    <td className="px-4 py-3 text-center">
                                        {(user?.role === 'ADMIN' || user?.role === 'PARTNER') ? (
                                            <select
                                                defaultValue={courier.status || 'Pending'}
                                                onChange={(e) => handleStatusChange(courier, e.target.value)}
                                                className={`text-xs font-bold py-1 px-2 rounded-full border-0 cursor-pointer outline-none appearance-none text-center w-24 disabled:opacity-50
                                                    ${courier.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                                        courier.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                                                            courier.status === 'Returned' ? 'bg-red-100 text-red-700' :
                                                                courier.status === 'Paid' ? 'bg-teal-100 text-teal-700' : 'bg-yellow-100 text-yellow-700'}`}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Paid">Paid</option>
                                                <option value="Packed">Packed</option>
                                                <option value="Sent">Sent</option>
                                                <option value="Shipped">Shipped</option>
                                                <option value="Delivered">Delivered</option>
                                                <option value="Returned">Returned</option>
                                            </select>
                                        ) : (
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${courier.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                                    courier.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                                                        courier.status === 'Paid' ? 'bg-teal-100 text-teal-800' :
                                                            courier.status === 'Returned' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {courier.status || 'Pending'}
                                            </span>
                                        )}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
                                        {user?.role === 'PARTNER' ? (
                                            <a href={`tel:${courier.phoneNumber}`} onClick={(e) => e.stopPropagation()}
                                                className="text-white bg-indigo-500 hover:bg-indigo-600 rounded-full p-2 shadow-md hover:shadow-lg transition-all" title="Call">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                            </a>
                                        ) : (
                                            courier.phoneNumber && (
                                                <button onClick={(e) => { e.stopPropagation(); handleWhatsApp(courier, 'General'); }}
                                                    className="text-white bg-green-500 hover:bg-green-600 rounded-full p-2 shadow-md hover:shadow-lg transition-all" title="WhatsApp">
                                                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                                </button>
                                            )
                                        )}
                                        {/* Edit/Delete for Admin */}
                                        {user?.role === 'ADMIN' && (
                                            <>
                                                <button onClick={(e) => { e.stopPropagation(); onEdit && onEdit(courier); }}
                                                    className="text-white bg-blue-500 hover:bg-blue-600 rounded-full p-2 shadow-md transition-colors" title="Edit">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete this courier?')) onDelete && onDelete(courier.id); }}
                                                    className="text-white bg-red-500 hover:bg-red-600 rounded-full p-2 shadow-md transition-colors" title="Delete">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                                {expandedRow === courier.id && (
                                    <tr className="bg-gray-50/50 animate-fade-in-down">
                                        <td colSpan={user?.role === 'ADMIN' || user?.role === 'PARTNER' ? 8 : 7} className="px-4 py-4">
                                            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-inner">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Product Manifest</h4>
                                                        <ul className="space-y-2">
                                                            {courier.products?.map((p, i) => (
                                                                <li key={i} className="text-sm text-gray-700 flex justify-between border-b border-gray-50 pb-1">
                                                                    <span>{p.name}</span>
                                                                    {user?.role !== 'PARTNER' && (
                                                                        <span className="text-gray-400 text-xs">Cost: ₹{p.cost} | Price: ₹{p.price}</span>
                                                                    )}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Shipping Details</h4>
                                                        <div className="text-sm text-gray-600 space-y-1">
                                                            <p><span className="font-medium text-gray-900">Address:</span> {courier.address}</p>
                                                            {courier.pincode && <p><span className="font-medium text-gray-900">Pincode:</span> {courier.pincode}</p>}
                                                            {courier.unit && <p><span className="font-medium text-gray-900">Unit/Wt:</span> {courier.unit}</p>}

                                                            {courier.partner && (
                                                                <p className="font-bold text-indigo-700 mt-2">
                                                                    Via: {courier.partner.name}
                                                                </p>
                                                            )}

                                                            {courier.salesExecutive && (
                                                                <p className="text-indigo-600 font-medium mt-2 bg-indigo-50 p-2 rounded-lg inline-block">
                                                                    Sales Agent: {courier.salesExecutive.name} • Commission: ₹{courier.commissionAmount}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CourierTable;
