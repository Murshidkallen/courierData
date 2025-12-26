import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';

interface UserFormProps {
    initialData?: {
        username: string;
        role: string;
        visibleFields: string;
        Partner?: { id: number; name: string } | null;
    };
    onSubmit: (data: any) => void;
    onCancel: () => void;
}

const AVAILABLE_FIELDS = [
    { key: 'customerName', label: 'Customer Name' },
    { key: 'phoneNumber', label: 'Phone Number' },
    { key: 'products', label: 'Products' },
    { key: 'salesExecutive', label: 'Sales Executive' },
    { key: 'commissionPct', label: 'Commission %' },
    { key: 'commissionAmount', label: 'Commission Amount' },
    { key: 'courierPaid', label: 'Courier Paid' },
    { key: 'totalPaid', label: 'Total Paid' },
    { key: 'address', label: 'Address' },
    { key: 'courierCost', label: 'Courier Cost' },
    { key: 'status', label: 'Status' },
    { key: 'trackingId', label: 'Tracking ID' },
    { key: 'packingCost', label: 'Packing Cost' },
    { key: 'profit', label: 'Profit' },
    { key: 'date', label: 'Date' }
];

const UserForm: React.FC<UserFormProps> = ({ initialData, onSubmit, onCancel }) => {
    const [username, setUsername] = useState(initialData?.username || '');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState(initialData?.role || 'STAFF');
    const [selectedFields, setSelectedFields] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);

    // Partner Linking
    const [partners, setPartners] = useState<{ id: number, name: string }[]>([]);
    const [linkedPartnerId, setLinkedPartnerId] = useState<number | undefined>(initialData?.Partner?.id);

    useEffect(() => {
        const fetchPartners = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`${API_URL}/api/partners`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    setPartners(await res.json());
                }
            } catch (e) { console.error("Failed to fetch partners", e) }
        };
        fetchPartners();
    }, []);

    useEffect(() => {
        if (initialData?.visibleFields) {
            if (initialData.visibleFields === '*') {
                setSelectedFields(AVAILABLE_FIELDS.map(f => f.key));
                setSelectAll(true);
            } else {
                setSelectedFields(initialData.visibleFields.split(','));
            }
        } else {
            // Default to all selected for new users unless specified otherwise
            setSelectedFields(AVAILABLE_FIELDS.map(f => f.key));
            setSelectAll(true);
        }
    }, [initialData]);

    const handleFieldToggle = (key: string) => {
        if (selectedFields.includes(key)) {
            setSelectedFields(selectedFields.filter(f => f !== key));
            setSelectAll(false);
        } else {
            setSelectedFields([...selectedFields, key]);
        }
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedFields([]);
        } else {
            setSelectedFields(AVAILABLE_FIELDS.map(f => f.key));
        }
        setSelectAll(!selectAll);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const visibleFields = selectedFields.length === AVAILABLE_FIELDS.length ? '*' : selectedFields.join(',');
        onSubmit({ username, password, role, visibleFields, linkedPartnerId });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white/50 backdrop-blur-md rounded-xl border border-white/20">
            <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 bg-white/80"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Password {initialData && '(Leave blank to keep current)'}</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 bg-white/80"
                    required={!initialData}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 bg-white/80"
                >
                    <option value="STAFF">Staff</option>
                    <option value="PARTNER">Partner</option>
                    <option value="ADMIN">Admin</option>
                    <option value="VIEWER">Viewer</option>
                </select>
            </div>

            {role === 'PARTNER' && (
                <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                    <label className="block text-sm font-medium text-indigo-900 mb-1">Link to Service (Partner)</label>
                    <p className="text-xs text-gray-500 mb-2">Select an existing service to link this login to. Leave empty to auto-create a new one.</p>
                    <select
                        value={linkedPartnerId || ''}
                        onChange={(e) => setLinkedPartnerId(e.target.value ? Number(e.target.value) : undefined)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 bg-white"
                    >
                        <option value="">-- Auto Create New Service --</option>
                        {partners.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
            )}

            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Visible Fields</label>
                    <button type="button" onClick={handleSelectAll} className="text-xs text-indigo-600 hover:text-indigo-800">
                        {selectAll ? 'Deselect All' : 'Select All'}
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm max-h-48 overflow-y-auto p-2 border rounded-md bg-white/30">
                    {AVAILABLE_FIELDS.map((field) => (
                        <label key={field.key} className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={selectedFields.includes(field.key)}
                                onChange={() => handleFieldToggle(field.key)}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>{field.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Save
                </button>
            </div>
        </form>
    );
};

export default UserForm;
