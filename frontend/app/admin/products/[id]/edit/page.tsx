'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { ArrowLeft, Upload, X, Package, Tag, Image as ImageIcon, FileArchive } from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

// Компонент для завантаження файлів
function FileUploader({ onUpload, accept, label }: { onUpload: (path: string, size: number) => void, accept: string, label: string }) {
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFileUpload = async (file: File) => {
        setIsUploading(true);
        setProgress(0);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const url = accept.includes('image') ? '/admin/upload/image' : '/admin/upload/archive';
            const response = await api.post(url, formData, {
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setProgress(percentCompleted);
                    }
                },
            });
            onUpload(response.data.file_path, response.data.file_size_mb);
            toast.success('Файл завантажено!');
        } catch (error) {
            toast.error('Помилка завантаження файлу.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <input
                type="file"
                accept={accept}
                className="hidden"
                id={label}
                onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
            />
            <label htmlFor={label} className="cursor-pointer">
                <div className="flex flex-col items-center">
                    <Upload className="w-10 h-10 text-gray-400 mb-2" />
                    <span className="text-sm font-semibold">{label}</span>
                    <p className="text-xs text-gray-500">Перетягніть або натисніть для вибору</p>
                </div>
            </label>
            {isUploading && (
                <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
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

  const fetchProduct = useCallback(async () => {
    try {
      const response = await api.get(`/products/${productId}`, {
        headers: { 'Accept-Language': 'uk' }
      });
      const product = response.data;
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
      });
    } catch (error) {
      toast.error('Помилка завантаження товару');
      router.push('/admin');
    } finally {
      setFetching(false);
    }
  }, [productId, router]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/products/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Не вдалося завантажити категорії');
    }
  }, []);

  useEffect(() => {
    if (user === undefined) return;
    if (!user?.is_admin) {
      toast.error('Доступ заборонено');
      router.push('/');
      return;
    }

    if (productId) {
      fetchProduct();
      fetchCategories();
    }
  }, [user, productId, router, fetchProduct, fetchCategories]);

  const handleSubmit = async () => {
    if (!formData.title_uk || !formData.main_image_url || !formData.zip_file_path) {
      toast.error("Будь ласка, заповніть всі обов'язкові поля: Назва, Головне зображення, ZIP файл.");
      return;
    }

    setLoading(true);
    try {
      await api.put(`/admin/products/${productId}`, formData);
      toast.success('Товар оновлено!');
      router.push('/admin');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Помилка оновлення товару');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
      if (window.confirm(`Ви впевнені, що хочете видалити товар #${productId}?`)) {
          setLoading(true);
          try {
              await api.delete(`/admin/products/${productId}`);
              toast.success('Товар успішно видалено');
              router.push('/admin');
          } catch (error) {
              toast.error('Помилка видалення товару');
              setLoading(false);
          }
      }
  };

  const removeGalleryImage = (index: number) => {
    setFormData({ ...formData, gallery_image_urls: formData.gallery_image_urls.filter((_, i) => i !== index) });
  };

  const toggleCategory = (categoryId: number) => {
    setFormData((prev) => ({ ...prev, category_ids: prev.category_ids.includes(categoryId) ? prev.category_ids.filter(id => id !== categoryId) : [...prev.category_ids, categoryId] }));
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div></div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
            <button onClick={() => router.push('/admin')} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"><ArrowLeft size={20} /></button>
            <h1 className="text-2xl font-bold">Редагування товару #{productId}</h1>
        </div>

        <div className="space-y-6">
            {/* Основна інформація */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Package size={20} /> Основна інформація</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium mb-2">Назва (українською) *</label>
                        <input type="text" value={formData.title_uk} onChange={(e) => setFormData({ ...formData, title_uk: e.target.value })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required />
                     </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Тип товару</label>
                        <select value={formData.product_type} onChange={(e) => setFormData({ ...formData, product_type: e.target.value })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                          <option value="premium">Преміум</option>
                          <option value="free">Безкоштовний</option>
                        </select>
                      </div>
                 </div>
                 <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Опис (українською)</label>
                    <textarea value={formData.description_uk} onChange={(e) => setFormData({ ...formData, description_uk: e.target.value })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" rows={5}></textarea>
                 </div>
                 <div className="mt-4">
                     <label className="block text-sm font-medium mb-2">Сумісність</label>
                     <input type="text" value={formData.compatibility} onChange={(e) => setFormData({ ...formData, compatibility: e.target.value })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                 </div>
            </div>

            {/* Ціни та знижки */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Tag size={20} /> Ціни та знижки</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Ціна ($) *</label>
                        <input type="number" step="0.01" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Ціна зі знижкою ($)</label>
                        <input type="number" step="0.01" min="0" placeholder="Вкажіть, якщо є" disabled={!formData.is_on_sale} value={formData.sale_price || ''} onChange={(e) => setFormData({ ...formData, sale_price: e.target.value ? Number(e.target.value) : null })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50" />
                    </div>
                </div>
                 <div className="mt-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData.is_on_sale} onChange={(e) => setFormData({ ...formData, is_on_sale: e.target.checked, sale_price: e.target.checked ? formData.sale_price : null })} className="w-4 h-4" />
                        <span>Активувати знижку</span>
                    </label>
                 </div>
            </div>

            {/* Зображення */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><ImageIcon size={20} /> Зображення</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-medium mb-2">Головне зображення *</h3>
                        {formData.main_image_url ? (
                             <div className="relative group">
                                <img src={formData.main_image_url} alt="Головне зображення" className="w-full h-40 object-cover rounded-lg border dark:border-gray-600"/>
                                <button type="button" onClick={() => setFormData({...formData, main_image_url: ''})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                             </div>
                        ) : (
                             <FileUploader onUpload={(path) => setFormData({...formData, main_image_url: path})} accept="image/*" label="Завантажити головне фото"/>
                        )}
                    </div>
                    <div>
                        <h3 className="font-medium mb-2">Галерея</h3>
                        <div className="grid grid-cols-3 gap-2">
                             {formData.gallery_image_urls.map((url, index) => (
                              <div key={index} className="relative group"><img src={url} alt={`Gallery ${index + 1}`} className="w-full h-20 object-cover rounded-lg border dark:border-gray-600" /><button type="button" onClick={() => removeGalleryImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button></div>
                            ))}
                            {formData.gallery_image_urls.length < 6 && (
                                <FileUploader onUpload={(path) => setFormData({...formData, gallery_image_urls: [...formData.gallery_image_urls, path]})} accept="image/*" label="Додати"/>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Файли товару */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileArchive size={20} /> Файли товару</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                     <div>
                        <label className="block text-sm font-medium mb-2">ZIP-Архів *</label>
                        {formData.zip_file_path ? (
                            <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <FileArchive className="text-gray-500" />
                                <span className="text-sm truncate">{formData.zip_file_path.split('/').pop()}</span>
                                <button onClick={() => setFormData({...formData, zip_file_path: '', file_size_mb: 0})} className="ml-auto text-red-500"><X size={16}/></button>
                            </div>
                        ) : (
                            <FileUploader onUpload={(path, size) => setFormData({...formData, zip_file_path: path, file_size_mb: size})} accept=".zip,.rar,.7z,application/octet-stream" label="Завантажити архів"/>
                        )}
                     </div>
                     <div>
                        <label className="block text-sm font-medium mb-2">Розрахований розмір (MB)</label>
                        <input type="number" value={formData.file_size_mb} disabled className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 bg-gray-100 cursor-not-allowed" />
                     </div>
                </div>
            </div>

            {/* Категорії */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Категорії</h2>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <label key={category.id} className={`px-4 py-2 rounded-lg border cursor-pointer transition-colors ${formData.category_ids.includes(category.id) ? 'bg-purple-500 text-white border-purple-500' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-purple-400'}`}>
                      <input type="checkbox" checked={formData.category_ids.includes(category.id)} onChange={() => toggleCategory(category.id)} className="hidden" />{category.name}
                    </label>
                  ))}
                </div>
            </div>
        </div>

        {/* Кнопки */}
        <div className="flex justify-between mt-8">
            <button onClick={handleDelete} disabled={loading} className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors">Видалити товар</button>
            <div className="flex gap-4">
              <button type="button" onClick={() => router.push('/admin')} className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Скасувати</button>
              <button onClick={handleSubmit} disabled={loading} className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors">{loading ? 'Збереження...' : 'Зберегти зміни'}</button>
            </div>
          </div>
      </div>
    </div>
  )
}