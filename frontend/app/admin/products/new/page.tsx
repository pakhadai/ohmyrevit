// frontend/app/admin/products/new/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { ArrowLeft, Upload, X, Package, Tag, Image as ImageIcon, FileArchive, Loader } from 'lucide-react'
// OLD: import { adminApi } from '@/lib/api/admin';
// OLD: import { productsAPI } from '@/lib/api';
import { adminAPI, productsAPI } from '@/lib/api' // ВИПРАВЛЕНО: Використовуємо централізований API
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

// Компонент для завантаження файлів
function FileUploader({
    onUpload,
    accept,
    label
}: {
    onUpload: (path: string, size: number) => void,
    accept: string,
    label: string
}) {
    const { t } = useTranslation();
    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = async (file: File) => {
        setIsUploading(true);

        try {
            const isImage = accept.includes('image');
// OLD:             const uploadFunction = isImage ? adminApi.uploadImage : adminApi.uploadArchive;
            const uploadFunction = isImage ? adminAPI.uploadImage : adminAPI.uploadArchive; // ВИПРАВЛЕНО

            const response = await uploadFunction(file);

            onUpload(response.file_path, response.file_size_mb);
            toast.success('Файл успішно завантажено!');
        } catch (error: any) {
            toast.error(error.message || 'Помилка завантаження файлу.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center h-full flex flex-col justify-center">
            <input
                type="file"
                accept={accept}
                className="hidden"
                id={label}
                onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                disabled={isUploading}
            />
            <label htmlFor={label} className="cursor-pointer">
                 {isUploading ? (
                    <div className="flex flex-col items-center">
                        <Loader className="w-8 h-8 text-purple-500 animate-spin mb-2" />
                        <span className="text-sm font-semibold">Завантаження...</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <Upload className="w-10 h-10 text-gray-400 mb-2" />
                        <span className="text-sm font-semibold">{label}</span>
                        <p className="text-xs text-gray-500">Натисніть для вибору</p>
                    </div>
                )}
            </label>
        </div>
    );
}


export default function NewProductPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { t } = useTranslation()
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

  const fetchCategories = useCallback(async () => {
    try {
// OLD:       const response = await adminApi.getCategories();
      const response = await adminAPI.getCategories(); // ВИПРАВЛЕНО
      setCategories(response);
    } catch (error) {
        console.error('Помилка завантаження категорій:', error);
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

    fetchCategories();
  }, [user, router, fetchCategories]);

  const handleSubmit = async () => {
    if (!formData.title_uk || !formData.main_image_url || !formData.zip_file_path) {
      toast.error("Будь ласка, заповніть обов'язкові поля: Назва, Головне зображення, ZIP-архів.");
      return;
    }

    setLoading(true);
    try {
      // # OLD: await adminAPI.createProduct(formData);
// OLD:       await adminApi.createProduct(formData);
      await adminAPI.createProduct(formData); // ВИПРАВЛЕНО
      toast.success('Товар успішно створено! Переклад розпочнеться у фоновому режимі.');
      router.push('/admin/products');
    } catch (error: any) {
      toast.error(error.message || 'Помилка створення товару');
    } finally {
      setLoading(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setFormData({
      ...formData,
      gallery_image_urls: formData.gallery_image_urls.filter((_, i) => i !== index)
    });
  };

  const toggleCategory = (categoryId: number) => {
    setFormData((prev) => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...prev.category_ids, categoryId]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.push('/admin/products')}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold">{t('admin.products.form.createTitle')}</h1>
        </div>

        <div className="space-y-6">
            {/* Основна інформація */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Package size={20} /> {t('admin.products.form.mainInfo')}</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium mb-2">{t('admin.products.form.titleUk')}</label>
                        <input type="text" value={formData.title_uk} onChange={(e) => setFormData({ ...formData, title_uk: e.target.value })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" placeholder={t('admin.products.form.titlePlaceholder')} required />
                     </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">{t('admin.products.form.productType')}</label>
                        <select value={formData.product_type} onChange={(e) => setFormData({ ...formData, product_type: e.target.value })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                            <option value="premium">{t('admin.products.form.premium')}</option>
                            <option value="free">{t('admin.products.form.free')}</option>
                        </select>
                      </div>
                 </div>
                 <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">{t('admin.products.form.descriptionUk')}</label>
                    <textarea value={formData.description_uk} onChange={(e) => setFormData({ ...formData, description_uk: e.target.value })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" rows={5} placeholder={t('admin.products.form.descriptionPlaceholder')}></textarea>
                 </div>
                 <div className="mt-4">
                     <label className="block text-sm font-medium mb-2">{t('admin.products.form.compatibility')}</label>
                     <input type="text" value={formData.compatibility} onChange={(e) => setFormData({ ...formData, compatibility: e.target.value })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" placeholder={t('admin.products.form.compatibilityPlaceholder')} />
                 </div>
            </div>

            {/* Ціни та знижки */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Tag size={20} /> {t('admin.products.form.pricing')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">{t('admin.products.form.price')}</label>
                        <input type="number" step="0.01" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">{t('admin.products.form.salePrice')}</label>
                        <input type="number" step="0.01" min="0" placeholder={t('admin.products.form.optional')} disabled={!formData.is_on_sale} value={formData.sale_price || ''} onChange={(e) => setFormData({ ...formData, sale_price: e.target.value ? Number(e.target.value) : null })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50" />
                    </div>
                </div>
                 <div className="mt-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData.is_on_sale} onChange={(e) => setFormData({ ...formData, is_on_sale: e.target.checked, sale_price: e.target.checked ? formData.sale_price : null })} className="w-4 h-4" />
                        <span>{t('admin.products.form.onSale')}</span>
                    </label>
                 </div>
            </div>

            {/* Зображення */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><ImageIcon size={20} /> {t('admin.products.form.images')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-medium mb-2">{t('admin.products.form.mainImage')}</h3>
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
                        <h3 className="font-medium mb-2">{t('admin.products.form.gallery')}</h3>
                        <div className="grid grid-cols-3 gap-2">
                             {formData.gallery_image_urls.map((url, index) => (
                              <div key={index} className="relative group"><img src={url} alt={`Gallery ${index + 1}`} className="w-full h-20 object-cover rounded-lg border dark:border-gray-600" /><button type="button" onClick={() => removeGalleryImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                              </div>
                            ))}
                            {formData.gallery_image_urls.length < 6 && (
                                <div className="h-20">
                                <FileUploader onUpload={(path) => setFormData({...formData, gallery_image_urls: [...formData.gallery_image_urls, path]})} accept="image/*" label="Додати фото"/>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Файли товару */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileArchive size={20} /> {t('admin.products.form.files')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                     <div>
                        <label className="block text-sm font-medium mb-2">{t('admin.products.form.archive')} *</label>
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
                        <label className="block text-sm font-medium mb-2">{t('admin.products.form.calculatedSize')}</label>
                        <input type="number" value={formData.file_size_mb} disabled className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 bg-gray-100 cursor-not-allowed" />
                     </div>
                </div>
            </div>

            {/* Категорії */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">{t('admin.products.form.categories')}</h2>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <label key={category.id} className={`px-4 py-2 rounded-lg border cursor-pointer transition-colors ${formData.category_ids.includes(category.id) ? 'bg-purple-500 text-white border-purple-500' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-purple-400'}`}>
                      <input type="checkbox" checked={formData.category_ids.includes(category.id)} onChange={() => toggleCategory(category.id)} className="hidden" />
                      {category.name}
                    </label>
                  ))}
                </div>
            </div>
        </div>

        {/* Кнопки */}
        <div className="flex justify-end gap-4 mt-8">
            <button type="button" onClick={() => router.push('/admin/products')} className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">{t('common.cancel')}</button>
            <button onClick={handleSubmit} disabled={loading} className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors">
              {loading ? t('common.processing') : t('common.create')}
            </button>
        </div>
      </div>
    </div>
  )
}