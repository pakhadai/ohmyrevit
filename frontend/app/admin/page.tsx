'use client';

import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import {
  Users, Package, ShoppingCart, CreditCard,
  TrendingUp, Tag, Settings, Menu, X, ArrowLeft, Trash2, Edit, PlusCircle, AlertTriangle
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- Компоненти управління (внутрішні) ---

// Компонент управління користувачами
function UsersManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/users', {
        params: { search, limit: 50 }
      });
      setUsers(response.data.users);
    } catch (error) {
      toast.error('Помилка завантаження користувачів');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAction = async (action: Promise<any>, successMessage: string, errorMessage: string) => {
    try {
      await action;
      toast.success(successMessage);
      fetchUsers();
    } catch (error) {
      toast.error(errorMessage);
    }
  };

  if (loading) return <div className="text-center py-8">Завантаження...</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Управління користувачами</h2>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Пошук за ім'ям або username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
        />
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ім'я</th>
                <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Бонуси</th>
                <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Статус</th>
                <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="p-3 whitespace-nowrap">
                    <div className="font-medium">{user.first_name}</div>
                    <div className="text-sm text-gray-500">@{user.username || '-'}</div>
                  </td>
                  <td className="p-3 whitespace-nowrap">{user.bonus_balance}</td>
                  <td className="p-3 whitespace-nowrap">
                    <div className="flex flex-wrap gap-2">
                      {user.is_admin && <span className="px-2 py-1 text-xs bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400 rounded">Admin</span>}
                      {user.is_active ? <span className="px-2 py-1 text-xs bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400 rounded">Active</span> : <span className="px-2 py-1 text-xs bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400 rounded">Blocked</span>}
                    </div>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <div className="flex flex-wrap gap-2">
                       <button onClick={() => handleAction(api.patch(`/admin/users/${user.id}/toggle-admin`), 'Статус адміністратора змінено', 'Помилка зміни статусу')} className="text-xs px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600">{user.is_admin ? 'Забрати адмін' : 'Зробити адміном'}</button>
                       <button onClick={() => handleAction(api.patch(`/admin/users/${user.id}/toggle-active`), 'Статус користувача змінено', 'Помилка зміни статусу')} className="text-xs px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">{user.is_active ? 'Заблокувати' : 'Розблокувати'}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Компонент управління товарами
function ProductsManagement() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/products');
      setProducts(response.data.products);
    } catch (error) {
      toast.error('Помилка завантаження товарів');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const deleteProduct = async (productId: number) => {
    try {
      await api.delete(`/admin/products/${productId}`);
      toast.success('Товар видалено');
      fetchProducts();
    } catch (error) {
      toast.error('Помилка видалення товару');
    } finally {
      setShowDeleteModal(null);
    }
  };

  if (loading) return <div className="text-center py-8">Завантаження...</div>;

  return (
    <Fragment>
       {showDeleteModal && (
        <ConfirmationModal
          title="Видалити товар?"
          message={`Ви впевнені, що хочете видалити товар #${showDeleteModal}? Цю дію неможливо буде скасувати.`}
          onConfirm={() => deleteProduct(showDeleteModal)}
          onCancel={() => setShowDeleteModal(null)}
        />
      )}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-xl font-bold">Управління товарами</h2>
          <button onClick={() => router.push('/admin/products/new')} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
            <PlusCircle size={18} />
            Додати товар
          </button>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Назва</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Тип</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ціна</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="p-3 whitespace-nowrap font-medium">{product.title}</td>
                    <td className="p-3 whitespace-nowrap">
                       <span className={`px-2 py-1 text-xs rounded ${product.product_type === 'free' ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400'}`}>
                         {product.product_type}
                       </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      ${product.price}
                      {product.is_on_sale && <span className="ml-2 text-red-500">${product.sale_price}</span>}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button onClick={() => router.push(`/admin/products/${product.id}/edit`)} className="flex items-center gap-1 text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"><Edit size={12}/>Редагувати</button>
                        <button onClick={() => setShowDeleteModal(product.id)} className="flex items-center gap-1 text-xs px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"><Trash2 size={12}/>Видалити</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Fragment>
  );
}

// Компонент управління замовленнями
function OrdersManagement() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/orders');
      setOrders(response.data.orders);
    } catch (error) {
      toast.error('Помилка завантаження замовлень');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (loading) return <div className="text-center py-8">Завантаження...</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Управління замовленнями</h2>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">ID</th>
                <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Користувач</th>
                <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Сума</th>
                <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Статус</th>
                <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Дата</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="p-3 whitespace-nowrap text-sm font-medium">#{order.id}</td>
                  <td className="p-3 whitespace-nowrap">{order.user.first_name} (@{order.user.username})</td>
                  <td className="p-3 whitespace-nowrap">${order.final_total}</td>
                  <td className="p-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded ${ order.status === 'paid' ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400' : order.status === 'pending' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400' : 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400' }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap text-sm">{new Date(order.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Компонент управління промокодами
function PromoCodesManagement() {
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPromo, setNewPromo] = useState({ code: '', discount_type: 'percentage', value: 10, max_uses: null as number | null });

  const fetchPromoCodes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/promo-codes');
      setPromoCodes(response.data);
    } catch (error) {
      toast.error('Помилка завантаження промокодів');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPromoCodes() }, [fetchPromoCodes]);

  const createPromoCode = async () => {
    try {
      await api.post('/admin/promo-codes', newPromo);
      toast.success('Промокод створено');
      setShowCreateForm(false);
      setNewPromo({ code: '', discount_type: 'percentage', value: 10, max_uses: null });
      fetchPromoCodes();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Помилка створення промокоду');
    }
  };

  const togglePromoCode = async (promoId: number) => {
    try {
      await api.patch(`/admin/promo-codes/${promoId}/toggle`);
      toast.success('Статус промокоду змінено');
      fetchPromoCodes();
    } catch (error) { toast.error('Помилка зміни статусу') }
  };

  if (loading) return <div className="text-center py-8">Завантаження...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold">Управління промокодами</h2>
        <button onClick={() => setShowCreateForm(!showCreateForm)} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
          <PlusCircle size={18} />
          {showCreateForm ? 'Сховати форму' : 'Створити промокод'}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow">
          <h3 className="font-semibold mb-4">Новий промокод</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Код (напр. WINTER25)" value={newPromo.code} onChange={(e) => setNewPromo({...newPromo, code: e.target.value})} className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"/>
            <select value={newPromo.discount_type} onChange={(e) => setNewPromo({...newPromo, discount_type: e.target.value})} className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
              <option value="percentage">Відсоток</option>
              <option value="fixed">Фіксована сума</option>
            </select>
            <input type="number" placeholder="Значення" value={newPromo.value} onChange={(e) => setNewPromo({...newPromo, value: Number(e.target.value)})} className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"/>
            <input type="number" placeholder="Макс. використань (необов'язково)" value={newPromo.max_uses || ''} onChange={(e) => setNewPromo({...newPromo, max_uses: e.target.value ? Number(e.target.value) : null})} className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"/>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={createPromoCode} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">Створити</button>
            <button onClick={() => setShowCreateForm(false)} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Скасувати</button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
         <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Код</th>
                <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Тип/Значення</th>
                <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Використано</th>
                <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Статус</th>
                <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {promoCodes.map((promo) => (
                <tr key={promo.id}>
                  <td className="p-3 whitespace-nowrap font-mono">{promo.code}</td>
                  <td className="p-3 whitespace-nowrap">{promo.discount_type === 'percentage' ? `${promo.value}%` : `$${promo.value}`}</td>
                  <td className="p-3 whitespace-nowrap">{promo.current_uses}/{promo.max_uses || '∞'}</td>
                  <td className="p-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded ${promo.is_active ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'}`}>
                      {promo.is_active ? 'Активний' : 'Неактивний'}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <button onClick={() => togglePromoCode(promo.id)} className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">{promo.is_active ? 'Деактивувати' : 'Активувати'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- Компоненти UI ---

function StatCard({ title, value, subtitle, icon: Icon, color }: any) {
  const colorClasses: { [key: string]: string } = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400',
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon size={20} />
        </div>
      </div>
      <h3 className="text-2xl font-bold">{value}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}

function ConfirmationModal({ title, message, onConfirm, onCancel }: {title: string, message: string, onConfirm: () => void, onCancel: () => void}) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full p-6">
        <div className="flex items-start gap-4">
           <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{message}</p>
            </div>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
          <button onClick={onConfirm} className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Видалити</button>
          <button onClick={onCancel} className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Скасувати</button>
        </div>
      </div>
    </div>
  );
}

// --- Головний компонент адмін-панелі ---

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (user === undefined) return;

    if (user) {
      if (!user.is_admin) {
        toast.error('Доступ заборонено');
        router.push('/');
        return;
      }
      if (!stats) {
        api.get('/admin/dashboard/stats')
          .then(response => setStats(response.data))
          .catch(error => {
            console.error('Error fetching stats:', error);
            toast.error('Помилка завантаження статистики');
          })
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    } else if (user === null) {
        toast.error('Доступ заборонено. Потрібна авторизація.');
        router.push('/');
    }
  }, [user, stats, router]);

  const menuItems = [
    { id: 'dashboard', label: 'Дашборд', icon: TrendingUp },
    { id: 'users', label: 'Користувачі', icon: Users },
    { id: 'products', label: 'Товари', icon: Package },
    { id: 'orders', label: 'Замовлення', icon: ShoppingCart },
    { id: 'promo', label: 'Промокоди', icon: Tag },
    { id: 'settings', label: 'Налаштування', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return (
        <div>
          <h2 className="text-xl font-bold mb-6">Статистика</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard title="Користувачі" value={stats?.users.total} subtitle={`+${stats?.users.new_this_week} за тиждень`} icon={Users} color="blue"/>
            <StatCard title="Товари" value={stats?.products.total} subtitle="Всього в каталозі" icon={Package} color="green"/>
            <StatCard title="Активні підписки" value={stats?.subscriptions.active} subtitle="Premium користувачі" icon={CreditCard} color="purple"/>
            <StatCard title="Дохід за місяць" value={`$${stats?.revenue.monthly.toFixed(2)}`} subtitle={`Всього: $${stats?.revenue.total.toFixed(2)}`} icon={TrendingUp} color="yellow"/>
          </div>
        </div>
      );
      case 'users': return <UsersManagement />;
      case 'products': return <ProductsManagement />;
      case 'orders': return <OrdersManagement />;
      case 'promo': return <PromoCodesManagement />;
      case 'settings': return <div className="text-center py-12 text-gray-500"><Settings size={48} className="mx-auto mb-4 opacity-50" /><p>Налаштування в розробці</p></div>;
      default: return null;
    }
  };

  if (loading || user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user?.is_admin) {
      return null; // Рендеримо нічого, поки йде редірект
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Toaster />
      <header className="md:hidden sticky top-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm z-20">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
              <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2"><Menu size={24} /></button>
              <h1 className="text-lg font-bold">{menuItems.find(item => item.id === activeTab)?.label}</h1>
              <button onClick={() => router.push('/')} className="p-2 -mr-2"><ArrowLeft size={20} /></button>
          </div>
      </header>
      <div className="flex">
        {isSidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-30 md:hidden"></div>}
        <aside className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg z-40 transform transition-transform md:relative md:translate-x-0 md:shadow-md ${ isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-4 border-b dark:border-gray-700 hidden md:block">
            <h1 className="text-xl font-bold">Адмін-панель</h1>
          </div>
          <nav className="p-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${activeTab === item.id ? 'bg-purple-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 p-4 md:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

