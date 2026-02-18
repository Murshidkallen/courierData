import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { Edit2, Trash2, Plus, X, User } from 'lucide-react';

interface Partner {
    id: number;
    name: string;
    rate: number;
    user?: { username: string };
}

interface Props {
    onClose: () => void;
}

const PartnerManager: React.FC<Props> = ({ onClose }) => {
    const navigate = useNavigate();
    const [partners, setPartners] = useState<Partner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editing, setEditing] = useState<Partner | null>(null);
    const [newName, setNewName] = useState('');
    const [newRate, setNewRate] = useState('');


    useEffect(() => {
        fetchPartners();
    }, []);

    const fetchPartners = async () => {
        try {
            const res = await fetch(`${API_URL}/api/partners`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                setPartners(await res.json());
            }
        } catch (e) {
            console.error('Failed to load services');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!newName) return;

        try {
            const url = editing ? `${API_URL}/api/partners/${editing.id}` : `${API_URL}/api/partners`;
            const method = editing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ name: newName, rate: newRate || 0 })
            });

            if (res.ok) {
                fetchPartners();
                setEditing(null);
                setNewName('');
                setNewRate('');
            } else {
                alert('Failed to save service');
            }
        } catch (e) {
            alert('Error saving service');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this service? This cannot be undone if it has no dependencies.')) return;

        try {
            const res = await fetch(`${API_URL}/api/partners/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            if (res.ok) {
                fetchPartners();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to delete');
            }
        } catch (e) {
            alert('Error deleting service');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-800">Manage Services (Partners)</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
                </div>

                <div className="p-4">
                    {/* Add/Edit Form */}
                    <div className="flex gap-2 mb-6">
                        <input
                            placeholder="Service Name (e.g. DHL)"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            className="flex-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <input
                            placeholder="Def. Rate"
                            type="number"
                            value={newRate}
                            onChange={e => setNewRate(e.target.value)}
                            className="w-20 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <button
                            onClick={handleSave}
                            disabled={!newName}
                            className={`px-4 py-2 rounded-lg text-white font-medium shadow-sm transition-colors ${editing ? 'bg-orange-500 hover:bg-orange-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                        >
                            {editing ? 'Update' : <Plus className="w-5 h-5" />}
                        </button>
                        {editing && (
                            <button onClick={() => { setEditing(null); setNewName(''); setNewRate(''); }} className="px-3 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300">
                                Cancel
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-96 overflow-y-auto space-y-2">
                        {isLoading ? <p className="text-center text-gray-500">Loading...</p> :
                            partners.map(p => (
                                <div key={p.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 group transition-colors">
                                    <div>
                                        <p className="font-semibold text-gray-800">{p.name}</p>
                                        <p className="text-xs text-gray-500">
                                            Rate: {p.rate || 0}% | Used by: <span className="text-indigo-600">{p.user?.username || 'No Linked User'}</span>
                                        </p>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => navigate(`/super-admin/profile/partner/${p.id}`)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                            title="View Profile"
                                        >
                                            <User className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => { setEditing(p); setNewName(p.name); setNewRate(String(p.rate || '')); }}
                                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(p.id)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        }
                        {!isLoading && partners.length === 0 && <p className="text-center text-gray-400 py-4">No services found.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PartnerManager;
