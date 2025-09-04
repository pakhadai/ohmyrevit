'use client';

import React, { useState, useEffect, useCallback, Fragment } from 'react';
import {
  Users, Package, ShoppingCart, CreditCard, TrendingUp, Tag, Settings,
  Menu, X, ArrowLeft, Trash2, Edit, PlusCircle, AlertTriangle,
  Search, Filter, Download, Eye, ChevronDown, ChevronUp, Image as ImageIcon,
  Calendar, DollarSign, Percent, Hash, Clock, CheckCircle, XCircle,
  Upload, FileArchive, Save, Plus, Loader, FileText, Gift, UserPlus, UserCheck
} from 'lucide-react';

// ========== API MODULE ==========
const API_URL = 'https://dev.ohmyrevit.pp.ua/api/v1';

class AdminAPI {
  private token: string | null = null;

  constructor() {
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
    const headers: Record<string, string> = {
      ...options.headers,
      'Authorization': this.token ? `Bearer ${this.token}` : '',
    };

    // ВАЖЛИВО: Визначаємо тип контенту на основі body
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers,
      // ВИПРАВЛЕНО: Правильна серіалізація body
      body: options.body instanceof FormData
        ? options.body
        : options.body
          ? JSON.stringify(options.body)
          : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Мережева помилка' }));
      throw new Error(error.detail || `Помилка: ${response.status}`);
    }

    return response.json();
  }

  // Dashboard
  async getDashboardStats() {
    return this.request('/admin/dashboard/stats');
  }

  // Users
  async getUsers(params?: { search?: string, skip?: number, limit?: number }) {
    const defaultParams = { skip: 0, limit: 100 };
    const queryParams = { ...defaultParams, ...params };
    const queryString = new URLSearchParams(queryParams as any).toString();
    return this.request(`/admin/users?${queryString}`);
}

  async toggleUserAdmin(userId: number) {
    return this.request(`/admin/users/${userId}/toggle-admin`, { method: 'PATCH' });
  }

  async toggleUserActive(userId: number) {
    return this.request(`/admin/users/${userId}/toggle-active`, { method: 'PATCH' });
  }

  async addUserBonus(userId: number, amount: number, reason?: string) {
    const formData = new FormData();
    formData.append('amount', amount.toString());
    if (reason) formData.append('reason', reason);
    return this.request(`/admin/users/${userId}/add-bonus`, { method: 'POST', body: formData });
  }

  async giveSubscription(userId: number, days: number) {
    return this.request(`/admin/users/${userId}/subscription`, {
      method: 'POST',
      body: JSON.stringify({ days })
    });
  }

  // Products
  async getProducts(params?: any) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/products?${queryString}`);
  }

  async createProduct(data: any) {
    return this.request('/admin/products', { method: 'POST', body: data });
  }

  async updateProduct(id: number, data: any) {
    // Правильно передаємо дані як JSON
    return this.request(`/admin/products/${id}`, {
      method: 'PUT',
      body: data // request() автоматично серіалізує в JSON
    });
  }

  // Альтернативний варіант з явною серіалізацією
  async updateProductAlternative(id: number, data: any) {
    const response = await fetch(`${API_URL}/admin/products/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': this.token ? `Bearer ${this.token}` : '',
        'Content-Type': 'application/json', // Явно вказуємо JSON
      },
      body: JSON.stringify(data) // Явно серіалізуємо в JSON
    });

    if (!response.ok) {
      throw new Error(`Помилка оновлення товару: ${response.status}`);
    }

    return response.json();
  }

  async deleteProduct(id: number) {
    return this.request(`/admin/products/${id}`, { method: 'DELETE' });
  }

  async uploadImage(file: File, oldPath?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (oldPath) formData.append('old_path', oldPath);
    return this.request('/admin/upload/image', { method: 'POST', body: formData });
  }

  async uploadArchive(file: File, oldPath?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (oldPath) formData.append('old_path', oldPath);
    return this.request('/admin/upload/archive', { method: 'POST', body: formData });
  }

  // Categories
  async getCategories() {
    return this.request('/admin/categories');
  }

  async createCategory(name: string, slug: string) {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('slug', slug);
    return this.request('/admin/categories', { method: 'POST', body: formData });
  }

  async updateCategory(id: number, name?: string, slug?: string) {
    const formData = new FormData();
    if (name) formData.append('name', name);
    if (slug) formData.append('slug', slug);
    return this.request(`/admin/categories/${id}`, { method: 'PUT', body: formData });
  }

  async deleteCategory(id: number) {
    return this.request(`/admin/categories/${id}`, { method: 'DELETE' });
  }

  // Promo Codes
  async getPromoCodes() {
    return this.request('/admin/promo-codes');
  }

  async createPromoCode(data: any) {
    return this.request('/admin/promo-codes', { method: 'POST', body: data });
  }

  async togglePromoCode(id: number) {
    return this.request(`/admin/promo-codes/${id}/toggle`, { method: 'PATCH' });
  }

  async deletePromoCode(id: number) {
    return this.request(`/admin/promo-codes/${id}`, { method: 'DELETE' });
  }

  // Orders
  async getOrders(params?: any) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/admin/orders?${queryString}`);
  }

  async updateOrderStatus(id: number, status: string) {
    const formData = new FormData();
    formData.append('status', status);
    return this.request(`/admin/orders/${id}/status`, { method: 'PATCH', body: formData });
  }
}

const api = new AdminAPI();

// ========== UTILITIES ==========
const toast = {
  success: (msg: string) => console.log('✅', msg),
  error: (msg: string) => console.error('❌', msg),
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <Loader className="animate-spin h-8 w-8 text-purple-500" />
  </div>
);

const EmptyState = ({ message, icon: Icon }: { message: string; icon: any }) => (
  <div className="text-center py-12 text-gray-500">
    <Icon size={48} className="mx-auto mb-4 opacity-50" />
    <p>{message}</p>
  </div>
);

// ========== PRODUCTS MANAGEMENT ==========
function ProductsManagement() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingArchive, setUploadingArchive] = useState(false);

  const [formData, setFormData] = useState({
    title_uk: '',
    description_uk: '',
    price: 0,
    product_type: 'premium',
    main_image_url: '',
    gallery_image_urls: [] as string[],
    zip_file_path: '',
    file_size_mb: 0,
    compatibility: 'Revit 2021-2024',
    is_on_sale: false,
    sale_price: null as number | null,
    category_ids: [] as number[]
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.getProducts({ limit: 100 }),
        api.getCategories()
      ]);
      setProducts(productsRes.products || []);
      setCategories(categoriesRes || []);
    } catch (error) {
      toast.error('Не вдалося завантажити дані');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const response = await api.uploadImage(file, formData.main_image_url);
      setFormData({ ...formData, main_image_url: response.file_path });
      toast.success('Зображення успішно завантажено');
    } catch (error) {
      toast.error('Не вдалося завантажити зображення');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleArchiveUpload = async (file: File) => {
    setUploadingArchive(true);
    try {
      const response = await api.uploadArchive(file, formData.zip_file_path);
      setFormData({
        ...formData,
        zip_file_path: response.file_path,
        file_size_mb: response.file_size_mb
      });
      toast.success('Архів успішно завантажено');
    } catch (error) {
      toast.error('Не вдалося завантажити архів');
    } finally {
      setUploadingArchive(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, formData);
        toast.success('Товар успішно оновлено');
      } else {
        await api.createProduct(formData);
        toast.success('Товар успішно створено');
      }
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Не вдалося зберегти товар');
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      title_uk: product.title,
      description_uk: product.description,
      price: product.price,
      product_type: product.product_type,
      main_image_url: product.main_image_url,
      gallery_image_urls: product.gallery_image_urls || [],
      zip_file_path: product.zip_file_path || '',
      file_size_mb: product.file_size_mb,
      compatibility: product.compatibility || 'Revit 2021-2024',
      is_on_sale: product.is_on_sale,
      sale_price: product.sale_price,
      category_ids: product.categories?.map((c: any) => c.id) || []
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Ви впевнені, що хочете видалити цей товар?')) return;
    try {
      await api.deleteProduct(id);
      toast.success('Товар успішно видалено');
      fetchData();
    } catch (error) {
      toast.error('Не вдалося видалити товар');
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setShowForm(false);
    setFormData({
      title_uk: '',
      description_uk: '',
      price: 0,
      product_type: 'premium',
      main_image_url: '',
      gallery_image_urls: [],
      zip_file_path: '',
      file_size_mb: 0,
      compatibility: 'Revit 2021-2024',
      is_on_sale: false,
      sale_price: null,
      category_ids: []
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Керування товарами</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          <PlusCircle size={18} />
          {showForm ? 'Сховати форму' : 'Новий товар'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow">
          <h3 className="font-semibold mb-4">
            {editingProduct ? 'Редагувати товар' : 'Новий товар'}
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Назва (українською)"
                value={formData.title_uk}
                onChange={(e) => setFormData({...formData, title_uk: e.target.value})}
                className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <input
                type="number"
                placeholder="Ціна"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <textarea
              placeholder="Опис (українською)"
              value={formData.description_uk}
              onChange={(e) => setFormData({...formData, description_uk: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              rows={4}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Головне зображення</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])}
                  disabled={uploadingImage}
                  className="w-full"
                />
                {formData.main_image_url && (
                  <img src={formData.main_image_url} alt="Preview" className="mt-2 h-20 object-cover rounded" />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Файл архіву</label>
                <input
                  type="file"
                  accept=".zip,.rar,.7z"
                  onChange={(e) => e.target.files && handleArchiveUpload(e.target.files[0])}
                  disabled={uploadingArchive}
                  className="w-full"
                />
                {formData.zip_file_path && (
                  <p className="mt-2 text-sm text-gray-600">
                    Файл: {formData.zip_file_path.split('/').pop()} ({formData.file_size_mb} МБ)
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Категорії</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={formData.category_ids.includes(cat.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({...formData, category_ids: [...formData.category_ids, cat.id]});
                        } else {
                          setFormData({...formData, category_ids: formData.category_ids.filter(id => id !== cat.id)});
                        }
                      }}
                    />
                    <span className="text-sm">{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_on_sale}
                  onChange={(e) => setFormData({...formData, is_on_sale: e.target.checked})}
                />
                <span>Знижка</span>
              </label>

              {formData.is_on_sale && (
                <input
                  type="number"
                  placeholder="Ціна зі знижкою"
                  value={formData.sale_price || ''}
                  onChange={(e) => setFormData({...formData, sale_price: e.target.value ? Number(e.target.value) : null})}
                  className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                {editingProduct ? 'Оновити' : 'Створити'}
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200"
              >
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <EmptyState message="Товарів ще немає" icon={Package} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <img
                src={product.main_image_url || '/placeholder.jpg'}
                alt={product.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold mb-2">{product.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-lg">${product.price}</span>
                  {product.is_on_sale && (
                    <span className="text-sm bg-red-500 text-white px-2 py-1 rounded">
                      ЗНИЖКА: ${product.sale_price}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    <Edit size={16} className="inline mr-1" />
                    Редагувати
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="flex-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    <Trash2 size={16} className="inline mr-1" />
                    Видалити
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ========== USERS MANAGEMENT ==========
function UsersManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [bonusAmount, setBonusAmount] = useState(100);
  const [bonusReason, setBonusReason] = useState('');
  const [subscriptionDays, setSubscriptionDays] = useState(30);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getUsers({ search: '', skip: 0, limit: 50 });
      setUsers(response.users || []);
    } catch (error) {
      toast.error('Не вдалося завантажити користувачів');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleAdmin = async (userId: number) => {
    try {
      await api.toggleUserAdmin(userId);
      toast.success('Статус адміна оновлено');
      fetchUsers();
    } catch (error) {
      toast.error('Не вдалося оновити статус адміна');
    }
  };

  const toggleActive = async (userId: number) => {
    try {
      await api.toggleUserActive(userId);
      toast.success('Статус користувача оновлено');
      fetchUsers();
    } catch (error) {
      toast.error('Не вдалося оновити статус користувача');
    }
  };

  const handleAddBonus = async () => {
    if (!selectedUser) return;
    try {
      await api.addUserBonus(selectedUser.id, bonusAmount, bonusReason);
      toast.success(`Додано ${bonusAmount} бонусів користувачеві`);
      setShowBonusModal(false);
      setBonusAmount(100);
      setBonusReason('');
      fetchUsers();
    } catch (error) {
      toast.error('Не вдалося додати бонус');
    }
  };

  const handleGiveSubscription = async () => {
    if (!selectedUser) return;
    try {
      await api.giveSubscription(selectedUser.id, subscriptionDays);
      toast.success(`Надано підписку на ${subscriptionDays} днів користувачеві`);
      setShowSubscriptionModal(false);
      setSubscriptionDays(30);
      fetchUsers();
    } catch (error) {
      toast.error('Не вдалося надати підписку');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Керування користувачами</h2>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Пошук користувачів..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
      </div>

      {users.length === 0 ? (
        <EmptyState message="Користувачів не знайдено" icon={Users} />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Користувач</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Електронна пошта</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Бонуси</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Статус</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{user.first_name} {user.last_name}</div>
                        <div className="text-xs text-gray-500">@{user.username || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="p-3 text-sm">{user.email || 'N/A'}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{user.bonus_balance}</span>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowBonusModal(true);
                          }}
                          className="text-green-500 hover:text-green-600"
                        >
                          <Gift size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        {user.is_admin && (
                          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400 rounded">
                            Адмін
                          </span>
                        )}
                        {user.is_active ? (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400 rounded">
                            Активний
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400 rounded">
                            Заблокований
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => toggleAdmin(user.id)}
                          className="p-1 text-purple-500 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded"
                          title="Змінити статус адміна"
                        >
                          <UserCheck size={16} />
                        </button>
                        <button
                          onClick={() => toggleActive(user.id)}
                          className="p-1 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded"
                          title="Змінити статус активності"
                        >
                          {user.is_active ? <X size={16} /> : <CheckCircle size={16} />}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowSubscriptionModal(true);
                          }}
                          className="p-1 text-green-500 hover:bg-green-100 dark:hover:bg-green-900/50 rounded"
                          title="Надати підписку"
                        >
                          <CreditCard size={16} />
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

      {/* Bonus Modal */}
      {showBonusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Додати бонус для {selectedUser?.first_name}</h3>
            <input
              type="number"
              placeholder="Сума бонусу"
              value={bonusAmount}
              onChange={(e) => setBonusAmount(Number(e.target.value))}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 mb-3"
            />
            <input
              type="text"
              placeholder="Причина (необов'язково)"
              value={bonusReason}
              onChange={(e) => setBonusReason(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddBonus}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Додати бонус
              </button>
              <button
                onClick={() => setShowBonusModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Надати підписку для {selectedUser?.first_name}</h3>
            <select
              value={subscriptionDays}
              onChange={(e) => setSubscriptionDays(Number(e.target.value))}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 mb-4"
            >
              <option value={7}>7 днів</option>
              <option value={30}>30 днів</option>
              <option value={90}>90 днів</option>
              <option value={180}>180 днів</option>
              <option value={365}>365 днів</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleGiveSubscription}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Надати підписку
              </button>
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
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
      toast.error('Не вдалося завантажити промокоди');
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
      toast.success('Промокод успішно створено');
      setShowCreateForm(false);
      setNewPromo({ code: '', discount_type: 'percentage', value: 10, max_uses: null, expires_at: null });
      fetchPromoCodes();
    } catch (error: any) {
      toast.error(error.message || 'Не вдалося створити промокод');
    }
  };

  const togglePromoCode = async (promoId: number) => {
    try {
      await api.togglePromoCode(promoId);
      toast.success('Статус промокоду оновлено');
      fetchPromoCodes();
    } catch (error) {
      toast.error('Не вдалося оновити статус');
    }
  };

  const deletePromoCode = async (promoId: number) => {
    if (!confirm('Ви впевнені, що хочете видалити цей промокод?')) return;

    try {
      await api.deletePromoCode(promoId);
      toast.success('Промокод видалено');
      fetchPromoCodes();
    } catch (error) {
      toast.error('Не вдалося видалити промокод');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold">Керування промокодами</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          <PlusCircle size={18} />
          {showCreateForm ? 'Сховати форму' : 'Створити промокод'}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow">
          <h3 className="font-semibold mb-4">Новий промокод</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Код (напр., WINTER25)"
              value={newPromo.code}
              onChange={(e) => setNewPromo({...newPromo, code: e.target.value})}
              className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
            <select
              value={newPromo.discount_type}
              onChange={(e) => setNewPromo({...newPromo, discount_type: e.target.value})}
              className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="percentage">Відсоток</option>
              <option value="fixed">Фіксована сума</option>
            </select>
            <input
              type="number"
              placeholder="Значення"
              value={newPromo.value}
              onChange={(e) => setNewPromo({...newPromo, value: Number(e.target.value)})}
              className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
            <input
              type="number"
              placeholder="Макс. використань (необов'язково)"
              value={newPromo.max_uses || ''}
              onChange={(e) => setNewPromo({...newPromo, max_uses: e.target.value ? Number(e.target.value) : null})}
              className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
            <input
              type="datetime-local"
              placeholder="Дійсний до"
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
              Створити
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200"
            >
              Скасувати
            </button>
          </div>
        </div>
      )}

      {promoCodes.length === 0 ? (
        <EmptyState message="Промокодів ще немає" icon={Tag} />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Код</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Тип/Значення</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Використання</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Статус</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Дії</th>
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
                        {promo.is_active ? 'Активний' : 'Неактивний'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => togglePromoCode(promo.id)}
                          className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          {promo.is_active ? 'Деактивувати' : 'Активувати'}
                        </button>
                        <button
                          onClick={() => deletePromoCode(promo.id)}
                          className="text-xs px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Видалити
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
      toast.error('Не вдалося завантажити замовлення');
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
      toast.success('Статус замовлення оновлено');
      fetchOrders();
    } catch (error) {
      toast.error('Не вдалося оновити статус замовлення');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Керування замовленнями</h2>

      <div className="mb-6 flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
        >
          <option value="">Всі замовлення</option>
          <option value="pending">Очікує</option>
          <option value="paid">Оплачено</option>
          <option value="failed">Невдале</option>
        </select>
      </div>

      {orders.length === 0 ? (
        <EmptyState message="Замовлень не знайдено" icon={ShoppingCart} />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">ID</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Користувач</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Сума</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Статус</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Дата</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Дії</th>
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
                        {order.status === 'paid' ? 'Оплачено' : order.status === 'pending' ? 'Очікує' : 'Невдале'}
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
                        <option value="pending">Очікує</option>
                        <option value="paid">Оплачено</option>
                        <option value="failed">Невдале</option>
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

// ========== DASHBOARD VIEW ==========
function DashboardView({ stats }: { stats: any }) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Огляд панелі</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Всього користувачів</p>
              <p className="text-2xl font-bold">{stats.users.total}</p>
              <p className="text-xs text-green-500">+{stats.users.new_this_week} цього тижня</p>
            </div>
            <Users className="text-blue-500" size={32} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Товари</p>
              <p className="text-2xl font-bold">{stats.products.total}</p>
            </div>
            <Package className="text-purple-500" size={32} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Активні підписки</p>
              <p className="text-2xl font-bold">{stats.subscriptions.active}</p>
            </div>
            <CreditCard className="text-green-500" size={32} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Дохід</p>
              <p className="text-2xl font-bold">${stats.revenue.total}</p>
              <p className="text-xs text-green-500">${stats.revenue.monthly} цього місяця</p>
            </div>
            <DollarSign className="text-yellow-500" size={32} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="font-semibold mb-4">Огляд замовлень</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Всього замовлень</span>
              <span className="font-semibold">{stats.orders.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Оплачені замовлення</span>
              <span className="font-semibold text-green-500">{stats.orders.paid}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Коефіцієнт конверсії</span>
              <span className="font-semibold">{stats.orders.conversion_rate}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="font-semibold mb-4">Швидкі дії</h3>
          <div className="space-y-2">
            <button className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-left">
              <PlusCircle size={18} className="inline mr-2" />
              Додати новий товар
            </button>
            <button className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-left">
              <Tag size={18} className="inline mr-2" />
              Створити промокод
            </button>
            <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-left">
              <UserPlus size={18} className="inline mr-2" />
              Додати адміністратора
            </button>
          </div>
        </div>
      </div>
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
    { id: 'dashboard', label: 'Панель', icon: TrendingUp },
    { id: 'users', label: 'Користувачі', icon: Users },
    { id: 'products', label: 'Товари', icon: Package },
    { id: 'orders', label: 'Замовлення', icon: ShoppingCart },
    { id: 'promo', label: 'Промокоди', icon: Tag },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return stats ? <DashboardView stats={stats} /> : <LoadingSpinner />;
      case 'users':
        return <UsersManagement />;
      case 'products':
        return <ProductsManagement />;
      case 'orders':
        return <OrdersManagement />;
      case 'promo':
        return <PromoCodesManagement />;
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
          <h1 className="text-lg font-bold">Адмін-панель</h1>
          <button onClick={() => window.history.back()} className="p-2">
            <ArrowLeft size={20} />
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed lg:relative top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg z-40 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-4 border-b dark:border-gray-700 hidden lg:flex items-center justify-between">
            <h1 className="text-xl font-bold">Адмін-панель</h1>
            <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <ArrowLeft size={20} />
            </button>
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
        <main className="flex-1 p-4 lg:p-6 max-w-7xl">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}