'use client';

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import {
  Users, Package, ShoppingCart, CreditCard,
  TrendingUp, Gift, Tag, Settings
} from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    // Перевірка доступу
    if (!user?.is_admin) {
      toast.error('Доступ заборонено')
      router.push('/')
      return
    }

    fetchDashboardStats()
  }, [user])

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/admin/dashboard/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
      toast.error('Помилка завантаження статистики')
    } finally {
      setLoading(false)
    }
  }

  const menuItems = [
    { id: 'dashboard', label: 'Дашборд', icon: TrendingUp },
    { id: 'users', label: 'Користувачі', icon: Users },
    { id: 'products', label: 'Товари', icon: Package },
    { id: 'orders', label: 'Замовлення', icon: ShoppingCart },
    { id: 'promo', label: 'Промокоди', icon: Tag },
    { id: 'settings', label: 'Налаштування', icon: Settings }
  ]

  if (loading) return <div className="text-center py-8">Завантаження...</div>

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Управління користувачами</h2>

      {/* Пошук */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Пошук за ім'ям або username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
        />
      </div>

      {/* Таблиця користувачів */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ім'я</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Бонуси</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Статус</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{user.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.first_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">@{user.username || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.bonus_balance}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    {user.is_admin && (
                      <span className="px-2 py-1 text-xs bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400 rounded">
                        Admin
                      </span>
                    )}
                    {!user.is_active && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400 rounded">
                        Blocked
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleAdmin(user.id)}
                      className="text-xs px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
                    >
                      {user.is_admin ? 'Забрати адмін' : 'Зробити адміном'}
                    </button>
                    <button
                      onClick={() => toggleActive(user.id)}
                      className="text-xs px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      {user.is_active ? 'Заблокувати' : 'Розблокувати'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
}

// Компонент управління товарами
function ProductsManagement() {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products')
      setProducts(response.data.products)
    } catch (error) {
      toast.error('Помилка завантаження товарів')
    } finally {
      setLoading(false)
    }
  }

  const deleteProduct = async (productId: number) => {
    if (!confirm('Ви впевнені, що хочете видалити цей товар?')) return

    try {
      await api.delete(`/admin/products/${productId}`)
      toast.success('Товар видалено')
      fetchProducts()
    } catch (error) {
      toast.error('Помилка видалення товару')
    }
  }

  if (loading) return <div className="text-center py-8">Завантаження...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Управління товарами</h2>
        <button
          onClick={() => router.push('/admin/products/new')}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          + Додати товар
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Назва</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Тип</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ціна</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{product.id}</td>
                <td className="px-6 py-4">{product.title}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded ${
                    product.product_type === 'free'
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400'
                      : 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400'
                  }`}>
                    {product.product_type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ${product.price}
                  {product.is_on_sale && (
                    <span className="ml-2 text-red-500">${product.sale_price}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                      className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Редагувати
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id)}
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
  )
}

// Компонент управління замовленнями
function OrdersManagement() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await api.get('/admin/orders')
      setOrders(response.data.orders)
    } catch (error) {
      toast.error('Помилка завантаження замовлень')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-center py-8">Завантаження...</div>

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Управління замовленнями</h2>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Користувач</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Сума</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Статус</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Дата</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">#{order.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{order.user.first_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">${order.final_total}</td>
                <td className="px-6 py-4 whitespace-nowrap">
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
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Компонент управління промокодами
function PromoCodesManagement() {
  const [promoCodes, setPromoCodes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newPromo, setNewPromo] = useState({
    code: '',
    discount_type: 'percentage',
    value: 10,
    max_uses: null
  })

  useEffect(() => {
    fetchPromoCodes()
  }, [])

  const fetchPromoCodes = async () => {
    try {
      const response = await api.get('/admin/promo-codes')
      setPromoCodes(response.data)
    } catch (error) {
      toast.error('Помилка завантаження промокодів')
    } finally {
      setLoading(false)
    }
  }

  const createPromoCode = async () => {
    try {
      await api.post('/admin/promo-codes', newPromo)
      toast.success('Промокод створено')
      setShowCreateForm(false)
      setNewPromo({ code: '', discount_type: 'percentage', value: 10, max_uses: null })
      fetchPromoCodes()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Помилка створення промокоду')
    }
  }

  const togglePromoCode = async (promoId: number) => {
    try {
      await api.patch(`/admin/promo-codes/${promoId}/toggle`)
      toast.success('Статус промокоду змінено')
      fetchPromoCodes()
    } catch (error) {
      toast.error('Помилка зміни статусу')
    }
  }

  if (loading) return <div className="text-center py-8">Завантаження...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Управління промокодами</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          + Створити промокод
        </button>
      </div>

      {/* Форма створення */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow">
          <h3 className="font-semibold mb-4">Новий промокод</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Код (напр. WINTER25)"
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
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Скасувати
            </button>
          </div>
        </div>
      )}

      {/* Список промокодів */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Код</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Тип</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Значення</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Використано</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Статус</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {promoCodes.map((promo) => (
              <tr key={promo.id}>
                <td className="px-6 py-4 whitespace-nowrap font-mono">{promo.code}</td>
                <td className="px-6 py-4 whitespace-nowrap">{promo.discount_type}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {promo.discount_type === 'percentage' ? `${promo.value}%` : `${promo.value}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {promo.current_uses}/{promo.max_uses || '∞'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded ${
                    promo.is_active
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400'
                      : 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'
                  }`}>
                    {promo.is_active ? 'Активний' : 'Неактивний'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => togglePromoCode(promo.id)}
                    className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    {promo.is_active ? 'Деактивувати' : 'Активувати'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Хедер адмін-панелі */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Адмін-панель OhMyRevit
            </h1>
            <button
              onClick={() => router.push('/')}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              ← Повернутися на сайт
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Бокова панель */}
        <aside className="w-64 bg-white dark:bg-gray-800 min-h-screen shadow-md">
          <nav className="p-4">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                    activeTab === item.id
                      ? 'bg-purple-500 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Основний контент */}
        <main className="flex-1 p-6">
          {activeTab === 'dashboard' && stats && (
            <div>
              <h2 className="text-xl font-bold mb-6">Статистика</h2>

              {/* Картки статистики */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="Користувачі"
                  value={stats.users.total}
                  subtitle={`+${stats.users.new_this_week} за тиждень`}
                  icon={Users}
                  color="blue"
                />
                <StatCard
                  title="Товари"
                  value={stats.products.total}
                  subtitle="Всього в каталозі"
                  icon={Package}
                  color="green"
                />
                <StatCard
                  title="Активні підписки"
                  value={stats.subscriptions.active}
                  subtitle="Premium користувачі"
                  icon={CreditCard}
                  color="purple"
                />
                <StatCard
                  title="Дохід за місяць"
                  value={`$${stats.revenue.monthly.toFixed(2)}`}
                  subtitle={`Всього: $${stats.revenue.total.toFixed(2)}`}
                  icon={TrendingUp}
                  color="yellow"
                />
              </div>

              {/* Додаткова статистика */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                  <h3 className="font-semibold mb-4">Замовлення</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Всього замовлень:</span>
                      <span className="font-semibold">{stats.orders.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Оплачено:</span>
                      <span className="font-semibold text-green-500">{stats.orders.paid}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Конверсія:</span>
                      <span className="font-semibold">{stats.orders.conversion_rate}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                  <h3 className="font-semibold mb-4">Швидкі дії</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => router.push('/admin/products/new')}
                      className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                    >
                      Додати новий товар
                    </button>
                    <button
                      onClick={() => setActiveTab('promo')}
                      className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Створити промокод
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && <UsersManagement />}
          {activeTab === 'products' && <ProductsManagement />}
          {activeTab === 'orders' && <OrdersManagement />}
          {activeTab === 'promo' && <PromoCodesManagement />}
          {activeTab === 'settings' && (
            <div className="text-center py-12 text-gray-500">
              <Settings size={48} className="mx-auto mb-4 opacity-50" />
              <p>Налаштування в розробці</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// Компонент картки статистики
function StatCard({ title, value, subtitle, icon: Icon, color }: any) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
      <h3 className="text-2xl font-bold mb-1">{value}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
      <p className="text-xs text-gray-500 dark:text-gray-500">{subtitle}</p>
    </div>
  )
}

// Компонент управління користувачами
function UsersManagement() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [search])

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users', {
        params: { search, limit: 50 }
      })
      setUsers(response.data.users)
    } catch (error) {
      toast.error('Помилка завантаження користувачів')
    } finally {
      setLoading(false)
    }
  }

  const toggleAdmin = async (userId: number) => {
    try {
      await api.patch(`/admin/users/${userId}/toggle-admin`)
      toast.success('Статус адміністратора змінено')
      fetchUsers()
    } catch (error) {
      toast.error('Помилка зміни статусу')
    }
  }

  const toggleActive = async (userId: number) => {
    try {
      await api.patch(`/admin/users/${userId}/toggle-active`)
      toast.success('Статус користувача змінено')
      fetchUsers()
    } catch (error) {
      toast.error('Помилка зміни статусу')
    }
  }

  if (loading)