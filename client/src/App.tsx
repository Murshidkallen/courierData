import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CourierForm from './components/CourierForm'
import CourierTable from './components/CourierTable'
import Toast from './components/Toast'
import Login from './components/Login'
import DashboardStats from './components/DashboardStats'
import { AuthProvider, useAuth } from './AuthContext'
import type { Courier } from './types'
import AdminDashboard from './pages/AdminDashboard';
import BillingPage from './pages/BillingPage';
import AdminBilling from './pages/AdminBilling';
import MonthlySheet from './pages/MonthlySheet';
import { Settings, RefreshCw } from 'lucide-react';
import { API_URL } from './config';

function Dashboard() {
  const { user, logout } = useAuth();
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCourier, setEditingCourier] = useState<Courier | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const fetchCouriers = async (search = '') => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/couriers?search=${search}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }
      const data = await res.json();
      setCouriers(data);
    } catch (error) {
      console.error("Failed to fetch", error);
      showToast("Failed to load data", 'error');
    }
  };

  useEffect(() => {
    if (user) fetchCouriers();
  }, [user]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    fetchCouriers(e.target.value);
  };

  const handleUpdate = async (id: number, data: any) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/couriers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      showToast("Entry Updated!", 'success');
      fetchCouriers(searchTerm);
      if (editingCourier && editingCourier.id === id) setEditingCourier(null); // Clear edit if updated inline? Maybe not needed.
    } catch (error) {
      console.error(error);
      showToast("Update Failed", 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/couriers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete');
      showToast('Entry Deleted', 'success');
      fetchCouriers(searchTerm);
    } catch (e) {
      console.error(e);
      showToast('Delete Failed', 'error');
    }
  };

  const handleEdit = (courier: Courier) => {
    setEditingCourier(courier);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFormSubmit = async (data: any) => {
    try {
      const token = localStorage.getItem('token');
      const method = editingCourier ? 'PUT' : 'POST';
      const url = editingCourier
        ? `${API_URL}/api/couriers/${editingCourier.id}`
        : `${API_URL}/api/couriers`;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save');
      }

      showToast(editingCourier ? "Entry Updated Successfully!" : "Entry Saved Successfully!", 'success');
      setEditingCourier(null); // Clear edit mode
      fetchCouriers(searchTerm);
    } catch (error: any) {
      console.error("Failed to save", error);
      showToast(error.message || "Error Saving Entry!", 'error');
    }
  };

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8 font-sans">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-extrabold text-indigo-900 tracking-tight">📦 Courier Data</h1>
            <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full font-bold uppercase">{user.role}</span>
          </div>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={handleSearch}
                className="p-2 pl-4 border border-gray-300 rounded-full shadow-sm w-64 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            {/* Billing Link */}
            <button
              onClick={() => window.location.href = '/billing'}
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
              title="Billing"
            >
              <span className="text-xl">💳</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => window.location.reload()}
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            {user.role === 'ADMIN' && (
              <button
                onClick={() => window.location.href = '/admin'}
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                title="Admin Panel"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            <button onClick={logout} className="text-sm text-gray-500 hover:text-red-500 font-medium">Logout</button>
          </div>
        </header>

        {/* Dashboard Stats (Visible to All) */}
        <section className="animate-fade-in-up">
          <DashboardStats />
        </section>

        {/* Courier Form (Hidden for Partners) */}
        {user.role !== 'PARTNER' && (
          <section className="animate-fade-in-up">
            <CourierForm
              onSubmit={handleFormSubmit}
              initialData={editingCourier}
              onCancelEdit={() => setEditingCourier(null)}
            />
          </section>
        )}



        <section>
          <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
            <span className="mr-2">📋</span> Recent Entries
          </h2>
          <CourierTable couriers={couriers} onUpdate={handleUpdate} onEdit={handleEdit} onDelete={handleDelete} />
        </section>
      </div>
    </div>
  );
}

const RequireAuth = ({ children, roles }: { children: React.ReactNode, roles: string[] }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (!roles.includes(user.role)) return <Navigate to="/" />;

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/billing" element={
            <RequireAuth roles={['PARTNER', 'STAFF', 'ADMIN']}>
              <BillingPage />
            </RequireAuth>
          } />
          <Route path="/admin" element={
            <RequireAuth roles={['ADMIN']}>
              <AdminDashboard />
            </RequireAuth>
          } />
          <Route path="/admin/billing" element={
            <RequireAuth roles={['ADMIN']}>
              <AdminBilling />
            </RequireAuth>
          } />
          <Route path="/admin/monthly" element={
            <RequireAuth roles={['ADMIN']}>
              <MonthlySheet />
            </RequireAuth>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
