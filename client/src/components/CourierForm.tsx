import React, { useState, useEffect } from 'react';
import type { Courier, Product, SalesExecutive, Partner } from '../types';
import { useAuth } from '../AuthContext';
import { API_URL } from '../config';

type CourierFormData = Omit<Courier, 'id' | 'createdAt' | 'updatedAt' | 'products' | 'salesExecutive' | 'partner' | 'enteredBy'> & {
    products: Omit<Product, 'id' | 'courierId'>[];
};

interface Props {
    onSubmit: (data: CourierFormData) => void;
    initialData?: Courier | null;
    onCancelEdit?: () => void;
}

const CourierForm: React.FC<Props> = ({ onSubmit, initialData, onCancelEdit }) => {
    const { user } = useAuth();
    const [executives, setExecutives] = useState<SalesExecutive[]>([]);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [suggestions, setSuggestions] = useState<Product[]>([]);

    // UI States
    const [isCreatingAgent, setIsCreatingAgent] = useState(false);
    const [isCreatingPartner, setIsCreatingPartner] = useState(false);

    // New Entity States
    const [newAgent, setNewAgent] = useState({ name: '', rate: 10 });
    const [newPartner, setNewPartner] = useState({ name: '', rate: 0 });

    const [formData, setFormData] = useState<CourierFormData>({
        date: new Date(),
        slipNo: '',
        unit: '',
        customerName: '',
        phoneNumber: '+91 ', // Default +91
        products: [{ name: '', cost: 0, price: 0 }],
        salesExecutiveId: undefined,
        partnerId: undefined,
        pincode: '',
        courierPaid: 0,
        totalPaid: 0,
        address: '',
        courierCost: 0,
        trackingId: '',
        packingCost: 0,
        profit: 0,
        commissionPct: 0,
        commissionAmount: 0
    });

    const formatDateForInput = (date: Date | string) => {
        const d = new Date(date);
        const pad = (n: number) => n < 10 ? '0' + n : n;
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [execRes, partRes, suggRes] = await Promise.all([
                    fetch(`${API_URL}/api/sales-executives`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
                    fetch(`${API_URL}/api/partners`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
                    fetch(`${API_URL}/api/products/suggestions`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
                ]);

                if (execRes.ok) setExecutives(await execRes.json());
                if (partRes.ok) setPartners(await partRes.json());
                if (suggRes.ok) setSuggestions(await suggRes.json());
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, []);

    // Populate Form on Edit OR Load from Session
    useEffect(() => {
        if (initialData) {
            setFormData({
                date: new Date(initialData.date),
                slipNo: initialData.slipNo || '',
                unit: initialData.unit || '',
                customerName: initialData.customerName,
                phoneNumber: initialData.phoneNumber || '+91 ',
                // Map products (Courier has Product[], FormData needs correct shape)
                products: initialData.products.map(p => ({
                    name: p.name,
                    cost: p.cost || 0,
                    price: p.price || 0
                })),
                salesExecutiveId: initialData.salesExecutiveId || undefined,
                partnerId: initialData.partnerId || undefined,
                pincode: initialData.pincode || '',
                courierPaid: initialData.courierPaid || 0,
                totalPaid: initialData.totalPaid || 0,
                address: initialData.address || '',
                courierCost: initialData.courierCost || 0,
                trackingId: initialData.trackingId,
                packingCost: initialData.packingCost || 0,
                profit: initialData.profit || 0,
                commissionAmount: initialData.commissionAmount || 0,
                commissionPct: initialData.commissionPct || 0 // Load saved %
            });
        } else {
            // New Entry Mode: Check Session Storage
            const saved = sessionStorage.getItem('courier_form_backup');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    // Convert date string back to object
                    if (parsed.date) parsed.date = new Date(parsed.date);
                    setFormData(parsed);
                } catch (e) { console.error("Failed to load backup", e); }
            }
        }
    }, [initialData]);

    // Save to Session Storage on Change (if not editing existing)
    useEffect(() => {
        if (!initialData) {
            sessionStorage.setItem('courier_form_backup', JSON.stringify(formData));
        }
    }, [formData, initialData]);

    // Auto-Calculation
    useEffect(() => {
        const productsTotal = formData.products.reduce((sum, p) => sum + (p.price || 0), 0);
        const productsCost = formData.products.reduce((sum, p) => sum + (p.cost || 0), 0);

        const calculatedTotalPaid = productsTotal + (formData.courierPaid || 0);

        // PROFIT = Revenue - Direct Costs (Commission is NOT an expense here)
        const calculatedProfit = calculatedTotalPaid - (productsCost + (formData.courierCost || 0) + (formData.packingCost || 0));

        let currentPct = formData.commissionPct || 0;

        // Auto-set % if Agent selected and no % set (or switching agents)
        // Note: Logic allows manual override if we only update when ID changes.
        // But for simplicity, let's trust the state unless ID changed handling happens elsewhere.

        const calculatedCommission = calculatedProfit * (currentPct / 100);

        if (
            calculatedTotalPaid !== formData.totalPaid ||
            calculatedProfit !== formData.profit ||
            calculatedCommission !== formData.commissionAmount
        ) {
            setFormData(prev => ({
                ...prev,
                totalPaid: parseFloat(calculatedTotalPaid.toFixed(2)),
                profit: parseFloat(calculatedProfit.toFixed(2)),
                commissionAmount: parseFloat(calculatedCommission.toFixed(2))
            }));
        }
    }, [formData.products, formData.courierPaid, formData.courierCost, formData.packingCost, formData.commissionPct]);

    // Watch for Agent Change to set default %
    useEffect(() => {
        if (formData.salesExecutiveId) {
            const exec = executives.find(e => e.id === formData.salesExecutiveId);
            if (exec) {
                // Only set if we haven't manually set it? Or always reset?
                // Usually better to reset to agent defaults on selection change
                // But we need to distinguish "Initial Load" vs "User Change".
                // Simple hack: check if current PCT is 0 or different.
                // Or just let the Select change handler do it (better).
            }
        }
    }, [formData.salesExecutiveId, executives]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let formattedValue: string | number | undefined = value;

        // Handle Select "Create New" logic
        if (name === 'salesExecutiveId' && value === 'NEW') {
            setIsCreatingAgent(true);
            return;
        }
        if (name === 'partnerId' && value === 'NEW') {
            setIsCreatingPartner(true);
            return;
        }

        // Special: If Agent Changed, set default %
        if (name === 'salesExecutiveId') {
            const agentId = Number(value);
            const agent = executives.find(e => e.id === agentId);
            setFormData(prev => ({
                ...prev,
                salesExecutiveId: agentId || undefined,
                commissionPct: agent ? agent.rate : 0
            }));
            return;
        }

        // Formatting Logic
        if (type === 'text' || name === 'address' || name === 'customerName') {
            if (value.length > 0) {
                // Default Caps for first letter
                formattedValue = value.charAt(0).toUpperCase() + value.slice(1);
            }

            if (name === 'address') {
                // Address: Space after comma and capitalize next
                // We apply this on every change, might feel jumpy if not careful, but works for simple "letter by letter"
                // Better regex: Replace comma followed by non-space with comma+space+Upper
                formattedValue = (formattedValue as string).replace(/,(\S)/g, ', $1')
                    .replace(/, ([a-z])/g, (match, p1) => `, ${p1.toUpperCase()}`);
            }
        }

        if (type === 'number' || name === 'salesExecutiveId' || name === 'partnerId') {
            formattedValue = value ? parseFloat(value) : undefined;
        }

        setFormData(prev => ({
            ...prev,
            [name]: formattedValue,
        }));
    };

    const handleProductChange = (index: number, field: keyof Product, value: string | number) => {
        const newProducts = [...formData.products];
        let newVal = typeof value === 'string' && field !== 'name' ? parseFloat(value) || 0 : value;

        // Title Case for Product Name
        if (field === 'name' && typeof newVal === 'string' && newVal.length > 0) {
            // Lowercase everything first to normalize? No, just capitalize first letter of words
            // Actually user said "new ones first letter of each words make caps"
            newVal = newVal.replace(/\b\w/g, l => l.toUpperCase());
        }

        newProducts[index] = { ...newProducts[index], [field]: newVal };

        // Suggestion Logic on Name Change/Blur
        if (field === 'name' && typeof newVal === 'string') {
            const match = suggestions.find(s => s.name.toLowerCase() === (newVal as string).toLowerCase());
            if (match) {
                // Determine if we should auto-fill (only if current values are empty/zero)
                if (newProducts[index].cost === 0) newProducts[index].cost = match.cost;
                if (newProducts[index].price === 0) newProducts[index].price = match.price;
            }
        }

        setFormData(prev => ({ ...prev, products: newProducts }));
    };

    const addProduct = () => {
        setFormData(prev => ({ ...prev, products: [...prev.products, { name: '', cost: 0, price: 0 }] }));
    };

    const removeProduct = (index: number) => {
        if (formData.products.length > 1) {
            setFormData(prev => ({ ...prev, products: prev.products.filter((_, i) => i !== index) }));
        }
    };

    const createAgent = async () => {
        if (!newAgent.name) return;
        try {
            const res = await fetch(`${API_URL}/api/sales-executives`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify(newAgent)
            });
            const data = await res.json();
            setExecutives([...executives, data]);
            setFormData(prev => ({ ...prev, salesExecutiveId: data.id }));
            setIsCreatingAgent(false);
            setNewAgent({ name: '', rate: 10 });
        } catch (e) { console.error(e); }
    };

    const createPartner = async () => {
        if (!newPartner.name) return;
        try {
            const res = await fetch(`${API_URL}/api/partners`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify(newPartner)
            });
            const data = await res.json();
            setPartners([...partners, data]);
            setFormData(prev => ({ ...prev, partnerId: data.id }));
            setIsCreatingPartner(false);
            setNewPartner({ name: '', rate: 0 });
        } catch (e) { console.error(e); }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
        // Reset
        setFormData(prev => ({
            ...prev,
            trackingId: '',
            customerName: '',
            phoneNumber: '',
            unit: '',
            address: '',
            pincode: '',
            products: [{ name: '', cost: 0, price: 0 }],
            courierPaid: 0,
            courierCost: 0,
            packingCost: 0,
            salesExecutiveId: undefined, // Reset selection
            partnerId: undefined
        }));
        sessionStorage.removeItem('courier_form_backup');
    };

    if (user?.role === 'VIEWER') return null;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col md:grid md:grid-cols-4 gap-4 md:gap-6">

                {/* Section: Basic Info */}
                <div className="md:col-span-4 border-b border-gray-100 pb-2 mb-2 md:hidden">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Basic Details</h3>
                </div>

                {/* Date */}
                <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Date & Time</label>
                    <input type="datetime-local" name="date" required
                        value={formatDateForInput(formData.date)}
                        className="w-full rounded-lg border-gray-200 bg-gray-50 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
                    />
                </div>

                {/* Tracking ID (Hidden for Staff on Create) */}
                {(user?.role !== 'STAFF' || initialData) && (
                    <div className="col-span-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tracking ID</label>
                        <input type="text" name="trackingId" onChange={handleChange} value={formData.trackingId}
                            placeholder={user?.role === 'STAFF' ? "Auto-generated" : "Scan or Type ID"}
                            disabled={user?.role === 'STAFF' && !initialData}
                            className="w-full rounded-lg border-gray-200 p-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                    </div>
                )}

                {/* Sales Exec / Agent (Hidden for Staff) */}
                {user?.role !== 'STAFF' && (
                    <div className="col-span-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Sales Agent</label>
                        {!isCreatingAgent ? (
                            <select name="salesExecutiveId" onChange={handleChange} value={formData.salesExecutiveId || ''}
                                className="w-full rounded-lg border-gray-200 p-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                                <option value="">-- Direct / None --</option>
                                {executives.map(e => (
                                    <option key={e.id} value={e.id}>{e.name} ({e.rate}%)</option>
                                ))}
                                <option value="NEW" className="text-indigo-600 font-bold">+ Create New Agent</option>
                            </select>
                        ) : (
                            <div className="flex space-x-2">
                                <input placeholder="Name" className="w-full border rounded p-2 text-xs" value={newAgent.name} onChange={e => setNewAgent({ ...newAgent, name: e.target.value })} />
                                <input placeholder="%" type="number" className="w-16 border rounded p-2 text-xs" value={newAgent.rate} onChange={e => setNewAgent({ ...newAgent, rate: parseFloat(e.target.value) })} />
                                <button type="button" onClick={createAgent} className="bg-indigo-600 text-white px-2 rounded">✓</button>
                                <button type="button" onClick={() => setIsCreatingAgent(false)} className="bg-gray-300 text-gray-700 px-2 rounded">✕</button>
                            </div>
                        )}
                        {formData.salesExecutiveId && (
                            <div className="flex items-center gap-2 mt-2">
                                <label className="text-xs font-bold text-gray-500">Rate (%):</label>
                                <input
                                    type="number"
                                    name="commissionPct"
                                    value={formData.commissionPct || ''}
                                    onChange={handleChange}
                                    step="0.1"
                                    className="w-20 rounded border-gray-200 p-1 text-sm text-center focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <span className="text-xs text-orange-500 font-bold ml-auto">
                                    Total: ₹{formData.commissionAmount?.toFixed(2)}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Partner / Service (Hidden for Staff) */}
                {user?.role !== 'STAFF' && (
                    <div className="col-span-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Courier Service</label>
                        {!isCreatingPartner ? (
                            <select name="partnerId" onChange={handleChange} value={formData.partnerId || ''}
                                className="w-full rounded-lg border-gray-200 p-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                                <option value="">-- Select Partner --</option>
                                {partners.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                                <option value="NEW" className="text-indigo-600 font-bold">+ Create New Service</option>
                            </select>
                        ) : (
                            <div className="flex space-x-2">
                                <input placeholder="Name" className="w-full border rounded p-2 text-xs" value={newPartner.name} onChange={e => setNewPartner({ ...newPartner, name: e.target.value })} />
                                <button type="button" onClick={createPartner} className="bg-indigo-600 text-white px-2 rounded">✓</button>
                                <button type="button" onClick={() => setIsCreatingPartner(false)} className="bg-gray-300 text-gray-700 px-2 rounded">✕</button>
                            </div>
                        )}
                    </div>
                )}

                {/* Customer Info */}
                <div className="md:col-span-4 border-b border-gray-100 pb-2 mb-2 md:hidden mt-4">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Customer Details</h3>
                </div>
                <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Customer Name</label>
                    <input type="text" name="customerName" required onChange={handleChange} value={formData.customerName}
                        placeholder="Full Name"
                        className="w-full rounded-lg border-gray-200 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
                <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Phone</label>
                    <input type="text" name="phoneNumber" onChange={handleChange} value={formData.phoneNumber || ''}
                        placeholder="Mobile Number"
                        className="w-full rounded-lg border-gray-200 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
                {/* Unit & Pincode */}
                {user?.role !== 'STAFF' && (
                    <div className="col-span-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Unit / Wt</label>
                        <input type="text" name="unit" onChange={handleChange} value={formData.unit || ''}
                            placeholder="e.g. 5kg"
                            className="w-full rounded-lg border-gray-200 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                    </div>
                )}
                <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pincode</label>
                    <input type="text" name="pincode" onChange={handleChange} value={formData.pincode || ''}
                        placeholder="e.g. 679321"
                        className="w-full rounded-lg border-gray-200 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>

                <div className="md:col-span-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Address</label>
                    <input name="address" onChange={handleChange} value={formData.address || ''}
                        placeholder="Full Address"
                        className="w-full rounded-lg border-gray-200 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>

                {/* Products Section */}
                <div className="md:col-span-4 border-b border-gray-100 pb-2 mb-2 md:hidden mt-4">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Order Items</h3>
                </div>
                <div className="md:col-span-4 bg-gray-50/50 p-4 rounded-xl border border-dashed border-gray-300">
                    <div className="flex justify-between items-center mb-3">
                        <label className="block text-sm font-bold text-gray-700">📦 Products</label>
                        <button type="button" onClick={addProduct} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 shadow-sm transition-all focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500">
                            + Add Item
                        </button>
                    </div>
                    <datalist id="suggested-products">
                        {suggestions.map((s, i) => <option key={i} value={s.name} />)}
                    </datalist>
                    {formData.products.map((product, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-2 items-center bg-white p-2 md:p-0 rounded-lg shadow-sm md:shadow-none border md:border-0 border-gray-100">
                            <div className="col-span-1 md:col-span-5">
                                <input type="text" placeholder="Item Name" list="suggested-products"
                                    value={product.name}
                                    onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            {user?.role === 'SUPER_ADMIN' && (
                                <div className="col-span-1 md:col-span-3">
                                    <input type="number" placeholder="Cost (₹)" step="0.01"
                                        value={product.cost || ''}
                                        onChange={(e) => handleProductChange(index, 'cost', e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-orange-50" />
                                </div>
                            )}
                            <div className="col-span-1 md:col-span-3">
                                <input type="number" placeholder="Price (₹)" step="0.01"
                                    value={product.price || ''}
                                    onChange={(e) => handleProductChange(index, 'price', e.target.value)}
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div className="col-span-1 md:col-span-1 text-center">
                                {index > 0 && (
                                    <button type="button" onClick={() => removeProduct(index)} className="text-red-400 hover:text-red-600 font-bold transition-colors w-full p-2 md:p-0 bg-red-50 md:bg-transparent rounded-lg">✕</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Financials */}
                <div className="md:col-span-4 border-b border-gray-100 pb-2 mb-2 md:hidden mt-4">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Payment & Costs</h3>
                </div>
                <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-5 gap-4 bg-indigo-50/50 p-4 rounded-xl items-center border border-indigo-100">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Courier Paid (Extra)</label>
                        <input type="number" name="courierPaid" step="0.01" onChange={handleChange} value={formData.courierPaid || ''}
                            className="w-full rounded-lg border-gray-200 p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    {user?.role === 'SUPER_ADMIN' && (
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Expense: Courier</label>
                            <input type="number" name="courierCost" step="0.01" onChange={handleChange} value={formData.courierCost || ''}
                                className="w-full rounded-lg border-gray-200 p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-orange-50" />
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Expense: Packing</label>
                        <input type="number" name="packingCost" step="0.01" onChange={handleChange} value={formData.packingCost || ''}
                            className="w-full rounded-lg border-gray-200 p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    {/* Live Totals */}
                    <div className="text-right">
                        <span className="block text-xs font-bold text-gray-500 uppercase">Total Paid (Sum)</span>
                        <span className="text-xl font-extrabold text-gray-900">₹{formData.totalPaid?.toFixed(2)}</span>
                    </div>
                    {user?.role === 'SUPER_ADMIN' && (
                        <div className="text-right">
                            <span className="block text-xs font-bold text-gray-500 uppercase">Est. Profit</span>
                            <span className={`text-xl font-extrabold ${formData.profit! >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{formData.profit?.toFixed(2)}
                            </span>
                        </div>
                    )}
                </div>

                <div className="md:col-span-4 mt-2 flex gap-4">
                    {onCancelEdit && (
                        <button type="button" onClick={onCancelEdit} className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors">
                            Cancel
                        </button>
                    )}
                    <button type="submit" className={`flex-[2] py-4 text-white font-bold rounded-xl shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                        ${initialData ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'}`}>
                        {initialData ? 'Update Entry' : 'Save Entry'}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default CourierForm;
