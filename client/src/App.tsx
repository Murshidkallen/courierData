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
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminAnalytics from './pages/SuperAdminAnalytics';
import { Settings, RefreshCw, Download, Plus, Calendar } from 'lucide-react';
import { API_URL } from './config';
import Modal from './components/Modal';

function Dashboard() {
  const { user, logout, loading } = useAuth();
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCourier, setEditingCourier] = useState<Courier | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const [isDateOpen, setIsDateOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Default dates logic
  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    setStartDate(start);
    setEndDate(end);
  }, []);

  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Apply Filter
  const handleApplyFilter = () => {
    setDateRange({ start: startDate, end: endDate });
    fetchCouriers(searchTerm);
  };

  // Initial fetch when dates are ready
  useEffect(() => {
    if (startDate && endDate && !dateRange.start) {
      handleApplyFilter();
    }
  }, [startDate, endDate]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const downloadCSV = () => {
    if (!couriers.length) return showToast("No data to download", 'error');

    const headers = ['Date', 'Slip No', 'Customer', 'Phone', 'Tracking ID', 'Address', 'Pincode', 'Status', 'Total Paid', 'Courier Cost', 'Profit', 'Partner', 'Agent'];
    const rows = couriers.map(c => [
      new Date(c.date).toLocaleDateString(),
      c.slipNo,
      c.customerName,
      c.phoneNumber,
      c.trackingId,
      `"${c.address || ''}"`, // Quote address to handle commas
      c.pincode,
      c.status,
      c.totalPaid,
      c.courierCost,
      c.profit,
      c.partner?.name || '',
      c.salesExecutive?.name || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `courier_data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchCouriers = async (search = '') => {
    try {
      const token = localStorage.getItem('token');
      // Use local state if apply not clicked yet? No, use dateRange state
      const start = dateRange.start || startDate;
      const end = dateRange.end || endDate;

      const query = `?search=${search}&startDate=${start}&endDate=${end}`;
      const res = await fetch(`${API_URL}/api/couriers${query}`, {
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
    if (user && dateRange.start) fetchCouriers();
  }, [user, dateRange]); // Fetch when range applied

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    fetchCouriers(e.target.value);
  };

  // ... (Update/Delete handlers same) ...

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
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update");
      }
      showToast("Entry Updated!", 'success');
      fetchCouriers(searchTerm);
      if (editingCourier && editingCourier.id === id) setEditingCourier(null);
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Update Failed", 'error');
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
    setIsModalOpen(true);
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
      setEditingCourier(null);
      setIsModalOpen(false);
      fetchCouriers(searchTerm);
    } catch (error: any) {
      console.error("Failed to save", error);
      showToast(error.message || "Error Saving Entry!", 'error');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8 font-sans">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm gap-4">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl md:text-3xl font-extrabold text-indigo-900 tracking-tight">📦 Courier Data</h1>
              <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full font-bold uppercase">{user.role}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full md:w-auto">

            {/* Date Display */}
            <div className="hidden md:block text-sm font-semibold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              {(() => {
                if (!dateRange.start) return new Date().toLocaleDateString('en-US', { month: 'long' });

                const start = new Date(dateRange.start);
                const end = new Date(dateRange.end);
                const isFullMonth = start.getDate() === 1 &&
                  new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate() === end.getDate();

                return isFullMonth
                  ? start.toLocaleDateString('en-US', { month: 'long' })
                  : `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
              })()}
            </div>

            {/* Date Filter Popover */}
            <div className="relative">
              <button
                onClick={() => setIsDateOpen(!isDateOpen)}
                className={`p-2 rounded-full transition-colors ${dateRange.start ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
                title="Filter by Date"
              >
                <Calendar className="w-6 h-6" />
              </button>

              {isDateOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 z-50 animate-fade-in-up">
                  <div className="flex flex-col space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Filter Orders</h3>
                    <div className="flex flex-col space-y-1">
                      <label className="text-xs text-gray-500">Start Date</label>
                      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded p-1 text-sm outline-none focus:ring-1 ring-indigo-500" />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-xs text-gray-500">End Date</label>
                      <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border rounded p-1 text-sm outline-none focus:ring-1 ring-indigo-500" />
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => { handleApplyFilter(); setIsDateOpen(false); }}
                        className="bg-indigo-600 text-white px-4 py-1.5 text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors w-full"
                      >
                        Apply Filter
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Background Overlay for mobile/click-outside */}
            {isDateOpen && <div className="fixed inset-0 z-40" onClick={() => setIsDateOpen(false)}></div>}

            {/* New Order Button (Mobile Top Priority) */}
            {user.role !== 'PARTNER' && (
              <button
                onClick={() => { setEditingCourier(null); setIsModalOpen(true); }}
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Order</span>
              </button>
            )}

            <div className="relative w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={handleSearch}
                className="p-2 pl-4 border border-gray-300 rounded-full shadow-sm w-full sm:w-64 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-between w-full sm:w-auto space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2">
                {/* Download Button */}
                <button
                  onClick={downloadCSV}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors flex-shrink-0"
                  title="Download CSV"
                >
                  <Download className="w-5 h-5" />
                </button>

                {/* Billing Link - Hidden for Admin */}
                {user.role !== 'ADMIN' && (
                  <button
                    onClick={() => window.location.href = user.role === 'ADMIN' ? '/admin/billing' : '/billing'}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors flex-shrink-0"
                    title="Billing"
                  >
                    <span className="text-xl">💳</span>
                  </button>
                )}

                {/* Refresh Button */}
                <button
                  onClick={() => window.location.reload()}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors flex-shrink-0"
                  title="Refresh Data"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>

                {/* Settings - Hidden for Admin */}
                {user.role === 'SUPER_ADMIN' && (
                  <button
                    onClick={() => window.location.href = '/admin'}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors flex-shrink-0"
                    title="Admin Panel"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                )}
              </div>
              <button onClick={logout} className="text-sm text-gray-500 hover:text-red-500 font-medium whitespace-nowrap ml-auto sm:ml-0">Logout</button>
            </div>
          </div>
        </header>

        {/* Dashboard Stats (Visible to All) - Pass Global Date Range */}
        <section className="animate-fade-in-up">
          <DashboardStats externalDateRange={dateRange.start ? dateRange : undefined} />
        </section>

        {/* Modal Form */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingCourier(null); }}
          title={editingCourier ? `Edit Order #${editingCourier.slipNo || ''}` : '✨ Create New Order'}
        >
          <CourierForm
            onSubmit={handleFormSubmit}
            initialData={editingCourier}
            onCancelEdit={() => { setIsModalOpen(false); setEditingCourier(null); }}
          />
        </Modal>



        <section>
          <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
            <span className="mr-2">📋</span> Order details
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
          <Route path="/super-admin" element={
            <RequireAuth roles={['SUPER_ADMIN']}>
              <SuperAdminDashboard />
            </RequireAuth>
          } />
          <Route path="/super-admin/analytics" element={
            <RequireAuth roles={['SUPER_ADMIN']}>
              <SuperAdminAnalytics />
            </RequireAuth>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
