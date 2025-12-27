import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Plus, Edit2, Trash2, ArrowLeft, Truck } from 'lucide-react';
import UserForm from '../components/UserForm';
import PartnerManager from '../components/PartnerManager';
import { API_URL } from '../config';

interface User {
    id: number;
    username: string;
    role: string;
    visibleFields: string;
    createdAt: string;
    Partner?: { id: number; name: string } | null;
}

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
    const [isPartnerManagerOpen, setIsPartnerManagerOpen] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                setError('Failed to fetch users');
            }
        } catch (err) {
            setError('Error connecting to server');
        }
    };

    const handleCreate = () => {
        setEditingUser(undefined);
        setIsFormOpen(true);
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/admin/users/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                fetchUsers();
            } else {
                alert('Failed to delete user');
            }
        } catch (err) {
            alert('Error deleting user');
        }
    };

    const handleSubmit = async (data: any) => {
        const token = localStorage.getItem('token');
        const url = editingUser
            ? `${API_URL}/api/admin/users/${editingUser.id}`
            : `${API_URL}/api/admin/users`;
        const method = editingUser ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                setIsFormOpen(false);
                fetchUsers();
            } else {
                const err = await res.json();
                alert(err.error || 'Operation failed');
            }
        } catch (err) {
            alert('Error submitting form');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        localStorage.removeItem('visibleFields');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white/40 backdrop-blur-lg p-6 rounded-2xl border border-white/50 shadow-xl gap-4 md:gap-0">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <button onClick={() => navigate('/')} className="p-2 hover:bg-white/50 rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6 text-gray-700" />
                        </button>
                        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Admin Dashboard
                        </h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full md:w-auto justify-end">
                        <button
                            onClick={() => setIsPartnerManagerOpen(true)}
                            className="flex items-center gap-2 px-3 py-2 text-sm md:text-base md:px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
                        >
                            <Truck className="w-4 h-4" />
                            <span className="hidden md:inline">Manage Services</span>
                            <span className="md:hidden">Services</span>
                        </button>
                        <button
                            onClick={handleCreate}
                            className="flex items-center gap-2 px-3 py-2 text-sm md:text-base md:px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden md:inline">New User</span>
                            <span className="md:hidden">Add</span>
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3 py-2 text-sm md:text-base md:px-4 bg-white/50 text-gray-700 rounded-lg hover:bg-white/80 transition-colors border border-white/60"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {isPartnerManagerOpen && <PartnerManager onClose={() => setIsPartnerManagerOpen(false)} />}

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                {isFormOpen ? (
                    <div className="max-w-2xl mx-auto">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">{editingUser ? 'Edit User' : 'Create New User'}</h2>
                        <UserForm
                            initialData={editingUser}
                            onSubmit={handleSubmit}
                            onCancel={() => setIsFormOpen(false)}
                        />
                    </div>
                ) : (
                    <div className="bg-white/40 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-white/50 border-b border-white/20">
                                <tr>
                                    <th className="p-4 font-semibold text-gray-700">Username</th>
                                    <th className="p-4 font-semibold text-gray-700">Role</th>
                                    <th className="p-4 font-semibold text-gray-700">Visible Fields</th>
                                    <th className="p-4 font-semibold text-gray-700">Created At</th>
                                    <th className="p-4 font-semibold text-gray-700 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/20">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-white/30 transition-colors">
                                        <td className="p-4 text-gray-800 font-medium">{user.username}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-600 text-sm max-w-xs truncate" title={user.visibleFields}>
                                            {user.visibleFields === '*' ? 'All Access' : `${user.visibleFields.split(',').length} fields`}
                                        </td>
                                        <td className="p-4 text-gray-600 text-sm">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
