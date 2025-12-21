'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { ArrowLeft, Upload, X, Package, Tag, Image as ImageIcon, FileArchive, Loader } from 'lucide-react'
import { adminAPI, productsAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

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
            const uploadFunction = isImage ? adminAPI.uploadImage : adminAPI.uploadArchive;
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
        <div className="border-2 border-dashed border-border bg-muted/20 hover:bg-muted/40 rounded-xl p-8 text-center h-full flex flex-col justify-center transition-colors cursor-pointer group">
            <input
                type="file"
                accept={accept}
                className="hidden"
                id={label}
                onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                disabled={isUploading}
            />
            <label htmlFor={label} className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                 {isUploading ? (
                    <div className="flex flex-col items-center">
                        <Loader className="w-8 h-8 text-primary animate-spin mb-3" />
                        <span className="text-sm font-semibold text-muted-foreground">Завантаження...</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                            <Upload className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-sm font-semibold text-foreground mb-1">{label}</span>
                        <p className="text-xs text-muted-foreground">Натисніть для вибору</p>
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
      const response = await adminAPI.getCategories();
      setCategories(response);
    } catch (error) {
        console.error('Помилка завантаження категорій:', error);
        toast.error('Не вдалося завантажити категорії');
    }
  }, []);

  useEffect(() => {
    if (user === undefined) return;
    if (!user?.isAdmin) {
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
      await adminAPI.createProduct(formData);
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

  // Стилі для інпутів
  const inputClass = "w-full px-4 py-3 bg-muted/50 border border-transparent rounded-xl text-foreground text-sm placeholder:text-muted-foreground focus:bg-background focus:border-primary/30 focus:ring-0 outline-none transition-all";
  const labelClass = "block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.push('/admin/products')}
              className="p-2 hover:bg-muted rounded-xl transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-foreground">{t('admin.products.form.createTitle')}</h1>
        </div>

        {/* Основна інформація */}
        <div className="card-minimal p-6">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-foreground">
                <Package size={20} className="text-primary" />
                {t('admin.products.form.mainInfo')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className={labelClass}>{t('admin.products.form.titleUk')}</label>
                    <input type="text" value={formData.title_uk} onChange={(e) => setFormData({ ...formData, title_uk: e.target.value })} className={inputClass} placeholder={t('admin.products.form.titlePlaceholder')} required />
                </div>
                <div>
                    <label className={labelClass}>{t('admin.products.form.productType')}</label>
                    <div className="relative">
                        <select value={formData.product_type} onChange={(e) => setFormData({ ...formData, product_type: e.target.value })} className={`${inputClass} appearance-none cursor-pointer`}>
                            <option value="premium">{t('admin.products.form.premium')}</option>
                            <option value="free">{t('admin.products.form.free')}</option>
                        </select>
                    </div>
                </div>
            </div>
            <div className="mt-5">
                <label className={labelClass}>{t('admin.products.form.descriptionUk')}</label>
                <textarea value={formData.description_uk} onChange={(e) => setFormData({ ...formData, description_uk: e.target.value })} className={inputClass} rows={5} placeholder={t('admin.products.form.descriptionPlaceholder')}></textarea>
            </div>
            <div className="mt-5">
                <label className={labelClass}>{t('admin.products.form.compatibility')}</label>
                <input type="text" value={formData.compatibility} onChange={(e) => setFormData({ ...formData, compatibility: e.target.value })} className={inputClass} placeholder={t('admin.products.form.compatibilityPlaceholder')} />
            </div>
        </div>

        {/* Ціни та знижки */}
        <div className="card-minimal p-6">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-foreground">
                <Tag size={20} className="text-primary" />
                {t('admin.products.form.pricing')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className={labelClass}>{t('admin.products.form.price')}</label>
                    <input type="number" step="0.01" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} className={inputClass} required />
                </div>
                <div>
                    <label className={labelClass}>{t('admin.products.form.salePrice')}</label>
                    <input type="number" step="0.01" min="0" placeholder={t('admin.products.form.optional')} disabled={!formData.is_on_sale} value={formData.sale_price || ''} onChange={(e) => setFormData({ ...formData, sale_price: e.target.value ? Number(e.target.value) : null })} className={`${inputClass} disabled:opacity-50 disabled:cursor-not-allowed`} />
                </div>
            </div>
            <div className="mt-5">
                <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl hover:bg-muted/30 transition-colors border border-transparent hover:border-border/50">
                    <input type="checkbox" checked={formData.is_on_sale} onChange={(e) => setFormData({ ...formData, is_on_sale: e.target.checked, sale_price: e.target.checked ? formData.sale_price : null })} className="w-5 h-5 rounded text-primary focus:ring-primary border-border bg-muted" />
                    <span className="text-sm font-medium">{t('admin.products.form.onSale')}</span>
                </label>
            </div>
        </div>

        {/* Зображення */}
        <div className="card-minimal p-6">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-foreground">
                <ImageIcon size={20} className="text-primary" />
                {t('admin.products.form.images')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-sm font-semibold mb-3">{t('admin.products.form.mainImage')}</h3>
                    {formData.main_image_url ? (
                            <div className="relative group overflow-hidden rounded-xl border border-border">
                            <img src={formData.main_image_url} alt="Головне зображення" className="w-full h-48 object-cover"/>
                            <button type="button" onClick={() => setFormData({...formData, main_image_url: ''})} className="absolute top-2 right-2 bg-destructive/90 text-white rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive"><X size={16} /></button>
                            </div>
                    ) : (
                            <div className="h-48">
                                <FileUploader onUpload={(path) => setFormData({...formData, main_image_url: path})} accept="image/*" label="Завантажити головне фото"/>
                            </div>
                    )}
                </div>
                <div>
                    <h3 className="text-sm font-semibold mb-3">{t('admin.products.form.gallery')}</h3>
                    <div className="grid grid-cols-3 gap-3">
                            {formData.gallery_image_urls.map((url, index) => (
                            <div key={index} className="relative group overflow-hidden rounded-xl border border-border h-24">
                                <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                                <button type="button" onClick={() => removeGalleryImage(index)} className="absolute top-1 right-1 bg-destructive/90 text-white rounded-md p-1 opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive"><X size={12} /></button>
                            </div>
                        ))}
                        {formData.gallery_image_urls.length < 6 && (
                            <div className="h-24">
                                <FileUploader onUpload={(path) => setFormData({...formData, gallery_image_urls: [...formData.gallery_image_urls, path]})} accept="image/*" label="+ Фото"/>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Файли товару */}
        <div className="card-minimal p-6">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-foreground">
                <FileArchive size={20} className="text-primary" />
                {t('admin.products.form.files')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                    <div>
                    <label className={labelClass}>{t('admin.products.form.archive')} *</label>
                    {formData.zip_file_path ? (
                        <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl border border-border">
                            <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                <FileArchive size={20} />
                            </div>
                            <span className="text-sm font-mono truncate flex-1">{formData.zip_file_path.split('/').pop()}</span>
                            <button onClick={() => setFormData({...formData, zip_file_path: '', file_size_mb: 0})} className="text-muted-foreground hover:text-destructive transition-colors"><X size={18}/></button>
                        </div>
                    ) : (
                        <div className="h-24">
                            <FileUploader onUpload={(path, size) => setFormData({...formData, zip_file_path: path, file_size_mb: size})} accept=".zip,.rar,.7z,application/octet-stream" label="Завантажити архів"/>
                        </div>
                    )}
                    </div>
                    <div>
                    <label className={labelClass}>{t('admin.products.form.calculatedSize')}</label>
                    <input type="number" value={formData.file_size_mb} disabled className={`${inputClass} bg-muted/20 opacity-70 cursor-not-allowed`} />
                    </div>
            </div>
        </div>

        {/* Категорії */}
        <div className="card-minimal p-6">
            <h2 className="text-lg font-bold mb-6 text-foreground">{t('admin.products.form.categories')}</h2>
            <div className="flex flex-wrap gap-3">
                {categories.map((category) => (
                <label key={category.id} className={`px-4 py-2.5 rounded-xl border cursor-pointer transition-all text-sm font-medium ${
                    formData.category_ids.includes(category.id)
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                    : 'bg-muted/30 border-transparent hover:bg-muted text-foreground'
                }`}>
                    <input type="checkbox" checked={formData.category_ids.includes(category.id)} onChange={() => toggleCategory(category.id)} className="hidden" />
                    {category.name}
                </label>
                ))}
            </div>
        </div>

        {/* Кнопки */}
        <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={() => router.push('/admin/products')} className="px-8 py-3 border border-border bg-card rounded-xl hover:bg-muted transition-colors font-medium text-foreground">
                {t('common.cancel')}
            </button>
            <button onClick={handleSubmit} disabled={loading} className="btn-primary px-8 py-3 flex items-center gap-2 disabled:opacity-70">
                {loading ? t('common.processing') : t('common.create')}
            </button>
        </div>
    </div>
  )
}