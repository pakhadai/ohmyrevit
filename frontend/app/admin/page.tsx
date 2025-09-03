import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { 
  Users, Package, ShoppingCart, CreditCard, TrendingUp, Tag, Settings, 
  Menu, X, ArrowLeft, Trash2, Edit, PlusCircle, AlertTriangle, 
  Search, Filter, Download, Eye, ChevronDown, ChevronUp, 
  Calendar, DollarSign, Percent, Hash, Clock, CheckCircle, XCircle,
  Upload, FileArchive, Save, Plus, Loader, FileText
} from 'lucide-react';

// ========== API MODULE ==========
const API_URL = 'https://dev.ohmyrevit.pp.ua/api/v1';

class AdminAPI {
  private token: string | null = null;

  constructor() {
    // Get token from localStorage on init
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('auth-storage');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          this.token = parsed.state?.token || null;
        } catch {}
      }
    }
  }

  private async request(url: string, options: RequestInit = {}) {
    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': this.token ? `Bearer ${this.token}` : '',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Network error' }));
      throw new Error(error.detail || `Error: ${response.status}`);
    }

    return response.json();
  }

  // Dashboard
  async getDashboardStats() {
    return this.request('/admin/dashboard/stats');
  }

  // ========== PROMO CODES MANAGEMENT ==========
function PromoCodesManagement() {
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPromo, setNewPromo] = useState({
    code: '',
    discount_type: 'percentage',
    value: 10,
    max_uses: null as number | null,
    expires_at: null as string | null
  });

  const fetchPromoCodes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getPromoCodes();
      setPromoCodes(response || []);
    } catch (error) {
      toast.error('Failed to load promo codes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromoCodes();
  }, [fetchPromoCodes]);

  const createPromoCode = async () => {
    try {
      await api.createPromoCode(newPromo);
      toast.success('Promo code created successfully');
      setShowCreateForm(false);
      setNewPromo({ code: '', discount_type: 'percentage', value: 10, max_uses: null, expires_at: null });
      fetchPromoCodes();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create promo code');
    }
  };

  const togglePromoCode = async (promoId: number) => {
    try {
      await api.togglePromoCode(promoId);
      toast.success('Promo code status updated');
      fetchPromoCodes();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const deletePromoCode = async (promoId: number) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;

    try {
      await api.deletePromoCode(promoId);
      toast.success('Promo code deleted');
      fetchPromoCodes();
    } catch (error) {
      toast.error('Failed to delete promo code');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold">Promo Codes Management</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          <PlusCircle size={18} />
          {showCreateForm ? 'Hide Form' : 'Create Promo Code'}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow">
          <h3 className="font-semibold mb-4">New Promo Code</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Code (e.g., WINTER25)"
              value={newPromo.code}
              onChange={(e) => setNewPromo({...newPromo, code: e.target.value})}
              className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
            <select
              value={newPromo.discount_type}
              onChange={(e) => setNewPromo({...newPromo, discount_type: e.target.value})}
              className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
            <input
              type="number"
              placeholder="Value"
              value={newPromo.value}
              onChange={(e) => setNewPromo({...newPromo, value: Number(e.target.value)})}
              className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
            <input
              type="number"
              placeholder="Max uses (optional)"
              value={newPromo.max_uses || ''}
              onChange={(e) => setNewPromo({...newPromo, max_uses: e.target.value ? Number(e.target.value) : null})}
              className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
            <input
              type="datetime-local"
              placeholder="Expires at"
              value={newPromo.expires_at || ''}
              onChange={(e) => setNewPromo({...newPromo, expires_at: e.target.value || null})}
              className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 md:col-span-2"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={createPromoCode}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Create
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {promoCodes.length === 0 ? (
        <EmptyState message="No promo codes yet" icon={Tag} />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Code</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type/Value</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Usage</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {promoCodes.map((promo) => (
                  <tr key={promo.id}>
                    <td className="p-3 font-mono">{promo.code}</td>
                    <td className="p-3">
                      {promo.discount_type === 'percentage' ? `${promo.value}%` : `${promo.value}`}
                    </td>
                    <td className="p-3">{promo.current_uses}/{promo.max_uses || '∞'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs rounded ${
                        promo.is_active
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400'
                          : 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'
                      }`}>
                        {promo.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => togglePromoCode(promo.id)}
                          className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          {promo.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => deletePromoCode(promo.id)}
                          className="text-xs px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== ORDERS MANAGEMENT ==========
function OrdersManagement() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : undefined;
      const response = await api.getOrders(params);
      setOrders(response.orders || []);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      toast.success('Order status updated');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Orders Management</h2>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
        >
          <option value="">All Orders</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {orders.length === 0 ? (
        <EmptyState message="No orders found" icon={ShoppingCart} />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">ID</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">User</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="p-3 font-medium">#{order.id}</td>
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{order.user.first_name}</div>
                        <div className="text-xs text-gray-500">@{order.user.username}</div>
                      </div>
                    </td>
                    <td className="p-3">${order.final_total}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs rounded ${
                        order.status === 'paid'
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400'
                          : order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400'
                          : 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-3 text-sm">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="text-xs px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="failed">Failed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== MAIN ADMIN DASHBOARD ==========
export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    api.getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'promo', label: 'Promo Codes', icon: Tag },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return stats ? <DashboardView stats={stats} /> : <LoadingSpinner />;
      case 'users':
        return <UsersManagement />;
      case 'products':
        return <EmptyState message="Products management coming soon" icon={Package} />;
      case 'orders':
        return <OrdersManagement />;
      case 'promo':
        return <PromoCodesManagement />;
      case 'settings':
        return (
          <div className="text-center py-12 text-gray-500">
            <Settings size={48} className="mx-auto mb-4 opacity-50" />
            <p>Settings coming soon</p>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader className="animate-spin h-12 w-12 text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 bg-white dark:bg-gray-800 shadow-sm z-20">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-bold">Admin Panel</h1>
          <button onClick={() => window.location.href = '/'} className="p-2">
            <ArrowLeft size={20} />
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed lg:relative top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg z-40 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-4 border-b dark:border-gray-700 hidden lg:block">
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
          <nav className="p-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                    activeTab === item.id
                      ? 'bg-purple-500 text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}