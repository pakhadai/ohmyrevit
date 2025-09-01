import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { ArrowLeft, Upload, X } from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [categories, setCategories] = useState<any[]>([])
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
  })

  useEffect(() => {
    // Перевірка доступу
    if (!user?.is_admin) {
      toast.error('Доступ заборонено')
      router.push('/')
      return
    }

    fetchProduct()
    fetchCategories()
  }, [user, productId])

  const fetchProduct = async () => {
    try {
      // Отримуємо товар з українським перекладом
      const response = await api.get(`/products/${productId}`, {
        headers: { 'Accept-Language': 'uk' }
      })

      const product = response.data

      // Заповнюємо форму даними товару
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
        category_ids: product.categories.map((cat: any) => cat.id)
      })
    } catch (error) {
      toast.error('Помилка завантаження товару')
      router.push('/admin')
    } finally {
      setFetching(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/categories')
      setCategories(response.data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleSubmit = async () => {

    if (!formData.title_uk || !formData.description_uk) {
      toast.error('Заповніть всі обов\'язкові поля')
      return
    }

    setLoading(true)
    try {
      await api.put(`/admin/products/${productId}`, formData)
      toast.success('Товар оновлено! Якщо змінився текст - переклад оновиться автоматично.')
      router.push('/admin')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Помилка оновлення товару')
    } finally {
      setLoading(false)
    }
  }

  const addGalleryImage = () => {
    const url = prompt('Введіть URL зображення:')
    if (url) {
      setFormData({
        ...formData,
        gallery_image_urls: [...formData.gallery_image_urls, url]
      })
    }
  }

  const removeGalleryImage = (index: number) => {
    setFormData({
      ...formData,
      gallery_image_urls: formData.gallery_image_urls.filter((_, i) => i !== index)
    })
  }

  const toggleCategory = (categoryId: number) => {
    setFormData({
      ...formData,
      category_ids: formData.category_ids.includes(categoryId)
        ? formData.category_ids.filter(id => id !== categoryId)
        : [...formData.category_ids, categoryId]
    })
  }

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Хедер */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold">Редагування товару #{productId}</h1>
          </div>
        </div>

        {/* Форма */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          {/* Основна інформація */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Основна інформація</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Назва (українською) *
                </label>
                <input
                  type="text"
                  value={formData.title_uk}
                  onChange={(e) => setFormData({...formData, title_uk: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Сучасний офісний стіл"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Тип товару
                </label>
                <select
                  value={formData.product_type}
                  onChange={(e) => setFormData({...formData, product_type: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="free">Безкоштовний</option>
                  <option value="premium">Преміум</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Ціна ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Сумісність
                </label>
                <input
                  type="text"
                  value={formData.compatibility}
                  onChange={(e) => setFormData({...formData, compatibility: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Revit 2021-2024"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">
                Опис (українською) *
              </label>
              <textarea
                value={formData.description_uk}
                onChange={(e) => setFormData({...formData, description_uk: e.target.value})}
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
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_on_sale}
                  onChange={(e) => setFormData({...formData, is_on_sale: e.target.checked})}
                  className="w-4 h-4"
                />
                <span>Товар зі знижкою</span>
              </label>

              {formData.is_on_sale && (
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ціна зі знижкою"
                  value={formData.sale_price || ''}
                  onChange={(e) => setFormData({...formData, sale_price: e.target.value ? Number(e.target.value) : null})}
                  className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              )}
            </div>
          </div>

          {/* Медіа */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Медіа</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Головне зображення (URL) *
                </label>
                <input
                  type="url"
                  value={formData.main_image_url}
                  onChange={(e) => setFormData({...formData, main_image_url: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="https://example.com/image.jpg"
                  required
                />
                {formData.main_image_url && (
                  <img
                    src={formData.main_image_url}
                    alt="Preview"
                    className="mt-2 w-full h-32 object-cover rounded-lg"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  ZIP файл (шлях) *
                </label>
                <input
                  type="text"
                  value={formData.zip_file_path}
                  onChange={(e) => setFormData({...formData, zip_file_path: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="/files/model.zip"
                  required
                />

                <label className="block text-sm font-medium mb-2 mt-4">
                  Розмір файлу (MB) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.file_size_mb}
                  onChange={(e) => setFormData({...formData, file_size_mb: Number(e.target.value)})}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
            </div>

            {/* Галерея */}
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">
                Галерея зображень
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.gallery_image_urls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Gallery ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addGalleryImage}
                  className="w-20 h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center hover:border-gray-400"
                >
                  <Upload size={20} className="text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Категорії */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Категорії</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className={`px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                    formData.category_ids.includes(category.id)
                      ? 'bg-purple-500 text-white border-purple-500'
                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.category_ids.includes(category.id)}
                    onChange={() => toggleCategory(category.id)}
                    className="hidden"
                  />
                  {category.name}
                </label>
              ))}
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => {
                if (confirm('Ви впевнені, що хочете видалити цей товар?')) {
                  api.delete(`/admin/products/${productId}`)
                    .then(() => {
                      toast.success('Товар видалено')
                      router.push('/admin')
                    })
                    .catch(() => toast.error('Помилка видалення'))
                }
              }}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Видалити товар
            </button>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push('/admin')}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Скасувати
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
              >
                {loading ? 'Збереження...' : 'Зберегти зміни'}
              </button>
            </div>
          </div>
        </div>

        {/* Інформаційний блок */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Примітка:</strong> При зміні назви або опису автоматично оновиться переклад на інші мови.
            Ви також можете вручну відредагувати переклади в розділі "Переклади".
          </p>
        </div>
      </div>
    </div>
  )
}