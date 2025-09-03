'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { ArrowLeft, Upload, X } from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export default function NewProductPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title_uk: '',
    description_uk: '',
    price: 0.00,
    product_type: 'premium',
    main_image_url: '',
    gallery_image_urls: [] as string[],
    zip_file_path: '',
    file_size_mb: 0.0,
    compatibility: 'Revit 2021-2024',
    is_on_sale: false,
    sale_price: null as number | null,
    category_ids: [] as number[]
  })

  // Перевірка прав доступу та завантаження категорій
  useEffect(() => {
    if (user === undefined) return; // Чекаємо на завантаження даних користувача

    if (!user?.is_admin) {
      toast.error('Доступ заборонено')
      router.push('/')
      return
    }
    fetchCategories()
  }, [user, router])

  // Функція для завантаження категорій
  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/categories')
      setCategories(response.data)
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Не вдалося завантажити категорії')
    }
  }

  // Обробка відправки форми
  const handleSubmit = async () => {
    if (!formData.title_uk || !formData.description_uk || !formData.main_image_url || !formData.zip_file_path) {
      toast.error("Будь ласка, заповніть всі обов'язкові поля, позначені *")
      return
    }

    setLoading(true)
    try {
      await api.post('/admin/products', formData)
      toast.success('Товар успішно створено! Переклад запуститься у фоновому режимі.')
      router.push('/admin')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Помилка створення товару')
    } finally {
      setLoading(false)
    }
  }

  // Додавання зображення до галереї
  const addGalleryImage = () => {
    const url = prompt('Введіть URL зображення:')
    if (url) {
      setFormData({
        ...formData,
        gallery_image_urls: [...formData.gallery_image_urls, url]
      })
    }
  }

  // Видалення зображення з галереї
  const removeGalleryImage = (index: number) => {
    setFormData({
      ...formData,
      gallery_image_urls: formData.gallery_image_urls.filter((_, i) => i !== index)
    })
  }

  // Перемикання категорії
  const toggleCategory = (categoryId: number) => {
    setFormData((prev) => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...prev.category_ids, categoryId]
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Хедер */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold">Створення нового товару</h1>
          </div>
        </div>

        {/* Форма */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          {/* Основна інформація */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Основна інформація</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Назва (українською) *</label>
                <input
                  type="text"
                  value={formData.title_uk}
                  onChange={(e) => setFormData({ ...formData, title_uk: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Сучасний офісний стіл"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Тип товару</label>
                <select
                  value={formData.product_type}
                  onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="premium">Преміум</option>
                  <option value="free">Безкоштовний</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ціна ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Сумісність</label>
                <input
                  type="text"
                  value={formData.compatibility}
                  onChange={(e) => setFormData({ ...formData, compatibility: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Revit 2021-2024"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Опис (українською) *</label>
              <textarea
                value={formData.description_uk}
                onChange={(e) => setFormData({ ...formData, description_uk: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                rows={5}
                placeholder="Детальний опис товару..."
                required
              />
            </div>
          </div>

          {/* Знижка */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Знижка</h2>
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_on_sale}
                  onChange={(e) => setFormData({ ...formData, is_on_sale: e.target.checked, sale_price: e.target.checked ? formData.sale_price : null })}
                  className="w-4 h-4"
                />
                <span>Активувати знижку</span>
              </label>
              {formData.is_on_sale && (
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ціна зі знижкою"
                  value={formData.sale_price || ''}
                  onChange={(e) => setFormData({ ...formData, sale_price: e.target.value ? Number(e.target.value) : null })}
                  className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              )}
            </div>
          </div>

          {/* Медіа та файли */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Медіа та файли</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Головне зображення (URL) *</label>
                <input
                  type="url"
                  value={formData.main_image_url}
                  onChange={(e) => setFormData({ ...formData, main_image_url: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="https://example.com/image.jpg"
                  required
                />
                {formData.main_image_url && (
                  <img src={formData.main_image_url} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-lg border dark:border-gray-600" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">ZIP файл (шлях на сервері) *</label>
                <input
                  type="text"
                  value={formData.zip_file_path}
                  onChange={(e) => setFormData({ ...formData, zip_file_path: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="/uploads/models/model.zip"
                  required
                />
                <label className="block text-sm font-medium mb-2 mt-4">Розмір файлу (MB) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.file_size_mb}
                  onChange={(e) => setFormData({ ...formData, file_size_mb: Number(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Галерея зображень (URL)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.gallery_image_urls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img src={url} alt={`Gallery ${index + 1}`} className="w-20 h-20 object-cover rounded-lg border dark:border-gray-600" />
                    <button type="button" onClick={() => removeGalleryImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                  </div>
                ))}
                <button type="button" onClick={addGalleryImage} className="w-20 h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors"><Upload size={20} className="text-gray-400" /></button>
              </div>
            </div>
          </div>

          {/* Категорії */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Категорії</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <label key={category.id} className={`px-4 py-2 rounded-lg border cursor-pointer transition-colors ${formData.category_ids.includes(category.id) ? 'bg-purple-500 text-white border-purple-500' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-purple-400'}`}>
                  <input type="checkbox" checked={formData.category_ids.includes(category.id)} onChange={() => toggleCategory(category.id)} className="hidden" />
                  {category.name}
                </label>
              ))}
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex justify-end gap-4 mt-8">
            <button type="button" onClick={() => router.push('/admin')} className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Скасувати</button>
            <button onClick={handleSubmit} disabled={loading} className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors">
              {loading ? 'Створення...' : 'Створити товар'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
