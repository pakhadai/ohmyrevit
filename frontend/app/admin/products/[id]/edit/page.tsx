'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft, Upload, X, Package, Tag, Image as ImageIcon, FileArchive, Loader, Save, Trash2 } from 'lucide-react';
import { adminAPI, productsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme';

// Хелпер для відображення повного шляху картинки
const fullImageUrl = (path: string) => {
    if (!path) return '/placeholder.jpg';
    if (path.startsWith('http')) return path;

    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://ohmyrevit.pp.ua';
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

    if (path.startsWith('/uploads/')) {
        return `${cleanBaseUrl}${path}`;
    }

    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBaseUrl}${cleanPath}`;
};

// Компонент завантаження файлів з підтримкою multiple
function FileUploader({
    onUpload,
    accept,
    label,
    multiple = false
}: {
    onUpload: (result: { path: string; size: number }[]) => void,
    accept: string,
    label: string,
    multiple?: boolean
}) {
    const { theme } = useTheme();
    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = async (files: FileList) => {
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const results: { path: string; size: number }[] = [];
        const isImage = accept.includes('image');
        const uploadFunction = isImage ? adminAPI.uploadImage : adminAPI.uploadArchive;

        try {
            // Завантажуємо файли по черзі
            for (let i = 0; i < files.length; i++) {
                const response = await uploadFunction(files[i]);
                results.push({
                    path: response.file_path,
                    size: response.file_size_mb
                });
            }

            onUpload(results);
            toast.success(files.length > 1 ? 'Файли успішно завантажено!' : 'Файл успішно завантажено!');
        } catch (error: any) {
            toast.error(error.message || 'Помилка завантаження файлу.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div
            className="transition-all cursor-pointer group h-full min-h-[120px]"
            style={{
                border: `2px dashed ${theme.colors.border}`,
                backgroundColor: `${theme.colors.surface}33`,
                borderRadius: theme.radius.xl,
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${theme.colors.surface}66`;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = `${theme.colors.surface}33`;
            }}
        >
            <input
                type="file"
                accept={accept}
                multiple={multiple}
                className="hidden"
                id={label}
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                disabled={isUploading}
            />
            <label htmlFor={label} className="cursor-pointer w-full h-full flex flex-col items-center justify-center p-6">
                {isUploading ? (
                    <div className="flex flex-col items-center animate-pulse">
                        <Loader className="w-8 h-8 animate-spin mb-3" style={{ color: theme.colors.primary }} />
                        <span className="text-sm font-semibold" style={{ color: theme.colors.textMuted }}>Завантаження...</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-center">
                        <div
                            className="w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform"
                            style={{
                                backgroundColor: theme.colors.bg,
                                border: `1px solid ${theme.colors.border}`,
                            }}
                        >
                            <Upload className="w-6 h-6" style={{ color: theme.colors.primary }} />
                        </div>
                        <span className="text-sm font-semibold mb-1" style={{ color: theme.colors.text }}>{label}</span>
                        <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                            {multiple ? 'Можна обрати декілька файлів' : 'Натисніть для вибору'}
                        </p>
                    </div>
                )}
            </label>
        </div>
    );
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const { theme } = useTheme();
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
      const product = await productsAPI.getProductById(productId, 'uk');
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
      toast.error(t('admin.products.form.toasts.dataLoadError'));
      router.push('/admin/products');
    } finally {
      setFetching(false);
    }
  }, [productId, router, t]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await adminAPI.getCategories();
      setCategories(response);
    } catch (error) {
      toast.error(t('admin.products.form.toasts.categoriesLoadError'));
    }
  }, [t]);

  useEffect(() => {
    if (user === undefined) return;
    if (!user?.isAdmin) {
      toast.error(t('toasts.authError'));
      router.push('/');
      return;
    }

    if (productId) {
      fetchProduct();
      fetchCategories();
    }
  }, [user, productId, router, fetchProduct, fetchCategories, t]);

  const handleSubmit = async () => {
    if (!formData.title_uk || !formData.main_image_url || !formData.zip_file_path) {
      toast.error(t('admin.products.form.toasts.fillRequired'));
      return;
    }

    setLoading(true);
    try {
      await adminAPI.updateProduct(Number(productId), formData);
      toast.success(t('admin.products.form.toasts.updated'));
      router.push('/admin/products');
    } catch (error: any) {
      toast.error(error.message || t('admin.products.form.toasts.updateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
      if (window.confirm(t('admin.products.confirmDelete'))) {
          setLoading(true);
          try {
              await adminAPI.deleteProduct(Number(productId));
              toast.success(t('admin.products.toasts.deleted'));
              router.push('/admin/products');
          } catch (error: any) {
              toast.error(error.message || t('admin.products.toasts.deleteError'));
              setLoading(false);
          }
      }
  };

  const removeGalleryImage = (index: number) => {
    setFormData({ ...formData, gallery_image_urls: formData.gallery_image_urls.filter((_, i) => i !== index) });
  };

  const toggleCategory = (categoryId: number) => {
    setFormData((prev) => ({
        ...prev,
        category_ids: prev.category_ids.includes(categoryId)
            ? prev.category_ids.filter(id => id !== categoryId)
            : [...prev.category_ids, categoryId]
    }));
  };

  if (fetching) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin h-10 w-10" style={{ color: theme.colors.primary }} /></div>;

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
        <div className="flex items-center gap-4">
            <button
                onClick={() => router.push('/admin/products')}
                className="p-2 transition-colors"
                style={{
                    borderRadius: theme.radius.xl,
                    color: theme.colors.textMuted,
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.surface;
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                }}
            >
                <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold" style={{ color: theme.colors.text }}>
                {t('admin.products.form.editTitle', { id: productId })}
            </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Ліва колонка - Основна інформація */}
            <div className="lg:col-span-2 space-y-6">
                <div
                    className="p-6"
                    style={{
                        backgroundColor: theme.colors.card,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.radius.xl,
                        boxShadow: theme.shadows.md,
                    }}
                >
                    <h2 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: theme.colors.text }}>
                        <Package size={20} style={{ color: theme.colors.primary }} />
                        {t('admin.products.form.mainInfo')}
                    </h2>
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>
                                    {t('admin.products.form.titleUk')}
                                </label>
                                <input
                                    type="text"
                                    value={formData.title_uk}
                                    onChange={(e) => setFormData({ ...formData, title_uk: e.target.value })}
                                    className="w-full px-4 py-3 text-sm outline-none transition-all"
                                    style={{
                                        backgroundColor: `${theme.colors.surface}80`,
                                        border: `1px solid transparent`,
                                        borderRadius: theme.radius.xl,
                                        color: theme.colors.text,
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.backgroundColor = theme.colors.bg;
                                        e.currentTarget.style.borderColor = `${theme.colors.primary}4d`;
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.backgroundColor = `${theme.colors.surface}80`;
                                        e.currentTarget.style.borderColor = 'transparent';
                                    }}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>
                                    {t('admin.products.form.productType')}
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.product_type}
                                        onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                                        className="w-full px-4 py-3 text-sm appearance-none cursor-pointer outline-none transition-all"
                                        style={{
                                            backgroundColor: `${theme.colors.surface}80`,
                                            border: `1px solid transparent`,
                                            borderRadius: theme.radius.xl,
                                            color: theme.colors.text,
                                        }}
                                        onFocus={(e) => {
                                            e.currentTarget.style.backgroundColor = theme.colors.bg;
                                            e.currentTarget.style.borderColor = `${theme.colors.primary}4d`;
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.backgroundColor = `${theme.colors.surface}80`;
                                            e.currentTarget.style.borderColor = 'transparent';
                                        }}
                                    >
                                        <option value="premium">{t('admin.products.form.premium')}</option>
                                        <option value="free">{t('admin.products.form.free')}</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>
                                {t('admin.products.form.descriptionUk')}
                            </label>
                            <textarea
                                value={formData.description_uk}
                                onChange={(e) => setFormData({ ...formData, description_uk: e.target.value })}
                                className="w-full px-4 py-3 text-sm outline-none transition-all"
                                style={{
                                    backgroundColor: `${theme.colors.surface}80`,
                                    border: `1px solid transparent`,
                                    borderRadius: theme.radius.xl,
                                    color: theme.colors.text,
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.backgroundColor = theme.colors.bg;
                                    e.currentTarget.style.borderColor = `${theme.colors.primary}4d`;
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.backgroundColor = `${theme.colors.surface}80`;
                                    e.currentTarget.style.borderColor = 'transparent';
                                }}
                                rows={6}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>
                                {t('admin.products.form.compatibility')}
                            </label>
                            <input
                                type="text"
                                value={formData.compatibility}
                                onChange={(e) => setFormData({ ...formData, compatibility: e.target.value })}
                                className="w-full px-4 py-3 text-sm outline-none transition-all"
                                style={{
                                    backgroundColor: `${theme.colors.surface}80`,
                                    border: `1px solid transparent`,
                                    borderRadius: theme.radius.xl,
                                    color: theme.colors.text,
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.backgroundColor = theme.colors.bg;
                                    e.currentTarget.style.borderColor = `${theme.colors.primary}4d`;
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.backgroundColor = `${theme.colors.surface}80`;
                                    e.currentTarget.style.borderColor = 'transparent';
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div
                    className="p-6"
                    style={{
                        backgroundColor: theme.colors.card,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.radius.xl,
                        boxShadow: theme.shadows.md,
                    }}
                >
                    <h2 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: theme.colors.text }}>
                        <ImageIcon size={20} style={{ color: theme.colors.primary }} />
                        {t('admin.products.form.images')}
                    </h2>

                    <div className="space-y-6">
                        {/* Головне фото */}
                        <div>
                            <h3 className="text-sm font-semibold mb-3" style={{ color: theme.colors.text }}>Головне зображення</h3>
                            {formData.main_image_url ? (
                                <div
                                    className="relative group overflow-hidden aspect-video max-w-md"
                                    style={{
                                        borderRadius: theme.radius.xl,
                                        border: `1px solid ${theme.colors.border}`,
                                        backgroundColor: theme.colors.surface,
                                    }}
                                >
                                    <img src={fullImageUrl(formData.main_image_url)} alt="Main" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => setFormData({...formData, main_image_url: ''})}
                                        className="absolute top-2 right-2 p-2 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg transform translate-y-2 group-hover:translate-y-0"
                                        style={{
                                            backgroundColor: `${theme.colors.error}e6`,
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = theme.colors.error;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = `${theme.colors.error}e6`;
                                        }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div className="max-w-md">
                                    <FileUploader
                                        onUpload={(results) => setFormData({...formData, main_image_url: results[0].path})}
                                        accept="image/*"
                                        label={t('admin.products.form.uploadMain')}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Галерея */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-semibold" style={{ color: theme.colors.text }}>
                                    {t('admin.products.form.gallery')}
                                </h3>
                                <span className="text-xs" style={{ color: theme.colors.textMuted }}>
                                    {formData.gallery_image_urls.length}/6
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {formData.gallery_image_urls.map((url, index) => (
                                    <div
                                        key={index}
                                        className="relative group overflow-hidden aspect-square"
                                        style={{
                                            borderRadius: theme.radius.xl,
                                            border: `1px solid ${theme.colors.border}`,
                                            backgroundColor: theme.colors.surface,
                                        }}
                                    >
                                        <img src={fullImageUrl(url)} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeGalleryImage(index)}
                                            className="absolute top-1 right-1 p-1.5 text-white opacity-0 group-hover:opacity-100 transition-all"
                                            style={{
                                                backgroundColor: `${theme.colors.error}e6`,
                                                borderRadius: theme.radius.md,
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = theme.colors.error;
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = `${theme.colors.error}e6`;
                                            }}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}

                                {formData.gallery_image_urls.length < 6 && (
                                    <FileUploader
                                        onUpload={(results) => {
                                            const newUrls = results.map(r => r.path);
                                            setFormData(prev => ({
                                                ...prev,
                                                gallery_image_urls: [...prev.gallery_image_urls, ...newUrls].slice(0, 6)
                                            }));
                                        }}
                                        accept="image/*"
                                        label={t('admin.products.form.addImage')}
                                        multiple={true}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Права колонка - Налаштування та файли */}
            <div className="space-y-6">
                <div
                    className="p-6"
                    style={{
                        backgroundColor: theme.colors.card,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.radius.xl,
                        boxShadow: theme.shadows.md,
                    }}
                >
                    <h2 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: theme.colors.text }}>
                        <Tag size={20} style={{ color: theme.colors.primary }} />
                        {t('admin.products.form.pricing')}
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>
                                {t('admin.products.form.price')}
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                className="w-full px-4 py-3 text-sm outline-none transition-all"
                                style={{
                                    backgroundColor: `${theme.colors.surface}80`,
                                    border: `1px solid transparent`,
                                    borderRadius: theme.radius.xl,
                                    color: theme.colors.text,
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.backgroundColor = theme.colors.bg;
                                    e.currentTarget.style.borderColor = `${theme.colors.primary}4d`;
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.backgroundColor = `${theme.colors.surface}80`;
                                    e.currentTarget.style.borderColor = 'transparent';
                                }}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>
                                {t('admin.products.form.salePrice')}
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder={t('admin.products.form.optional')}
                                disabled={!formData.is_on_sale}
                                value={formData.sale_price || ''}
                                onChange={(e) => setFormData({ ...formData, sale_price: e.target.value ? Number(e.target.value) : null })}
                                className="w-full px-4 py-3 text-sm outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    backgroundColor: `${theme.colors.surface}80`,
                                    border: `1px solid transparent`,
                                    borderRadius: theme.radius.xl,
                                    color: theme.colors.text,
                                }}
                                onFocus={(e) => {
                                    if (!formData.is_on_sale) return;
                                    e.currentTarget.style.backgroundColor = theme.colors.bg;
                                    e.currentTarget.style.borderColor = `${theme.colors.primary}4d`;
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.backgroundColor = `${theme.colors.surface}80`;
                                    e.currentTarget.style.borderColor = 'transparent';
                                }}
                            />
                        </div>
                        <label
                            className="flex items-center gap-3 cursor-pointer group p-3 transition-colors"
                            style={{
                                borderRadius: theme.radius.xl,
                                border: `1px solid transparent`,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = `${theme.colors.surface}4d`;
                                e.currentTarget.style.borderColor = `${theme.colors.border}80`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.borderColor = 'transparent';
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={formData.is_on_sale}
                                onChange={(e) => setFormData({ ...formData, is_on_sale: e.target.checked, sale_price: e.target.checked ? formData.sale_price : null })}
                                className="w-5 h-5"
                                style={{
                                    accentColor: theme.colors.primary,
                                    borderRadius: theme.radius.md,
                                }}
                            />
                            <span className="text-sm font-medium" style={{ color: theme.colors.text }}>
                                {t('admin.products.form.onSale')}
                            </span>
                        </label>
                    </div>
                </div>

                <div
                    className="p-6"
                    style={{
                        backgroundColor: theme.colors.card,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.radius.xl,
                        boxShadow: theme.shadows.md,
                    }}
                >
                    <h2 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: theme.colors.text }}>
                        <FileArchive size={20} style={{ color: theme.colors.primary }} />
                        {t('admin.products.form.files')}
                    </h2>

                    {formData.zip_file_path ? (
                        <div className="space-y-4">
                            <div
                                className="flex items-center gap-3 p-4"
                                style={{
                                    backgroundColor: `${theme.colors.surface}4d`,
                                    border: `1px solid ${theme.colors.border}`,
                                    borderRadius: theme.radius.xl,
                                }}
                            >
                                <div
                                    className="p-2.5 rounded-lg"
                                    style={{
                                        backgroundColor: `${theme.colors.primaryLight}33`,
                                        color: theme.colors.primary,
                                    }}
                                >
                                    <FileArchive size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-mono truncate" title={formData.zip_file_path} style={{ color: theme.colors.text }}>
                                        {formData.zip_file_path.split('/').pop()}
                                    </p>
                                    <p className="text-xs mt-0.5" style={{ color: theme.colors.textMuted }}>
                                        {formData.file_size_mb} MB
                                    </p>
                                </div>
                                <button
                                    onClick={() => setFormData({...formData, zip_file_path: '', file_size_mb: 0})}
                                    className="p-2 transition-colors"
                                    style={{
                                        color: theme.colors.textMuted,
                                        borderRadius: theme.radius.lg,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = theme.colors.error;
                                        e.currentTarget.style.backgroundColor = `${theme.colors.errorLight}33`;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = theme.colors.textMuted;
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    <Trash2 size={18}/>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <FileUploader
                            onUpload={(results) => setFormData({...formData, zip_file_path: results[0].path, file_size_mb: results[0].size})}
                            accept=".zip,.rar,.7z,application/octet-stream"
                            label={t('admin.products.form.uploadArchive')}
                        />
                    )}
                </div>

                <div
                    className="p-6"
                    style={{
                        backgroundColor: theme.colors.card,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.radius.xl,
                        boxShadow: theme.shadows.md,
                    }}
                >
                    <h2 className="text-lg font-bold mb-6" style={{ color: theme.colors.text }}>
                        {t('admin.products.form.categories')}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {categories.map((category) => (
                            <label
                                key={category.id}
                                className="px-3 py-2 text-xs font-medium select-none cursor-pointer transition-all"
                                style={{
                                    borderRadius: theme.radius.lg,
                                    border: `1px solid ${formData.category_ids.includes(category.id) ? theme.colors.primary : 'transparent'}`,
                                    backgroundColor: formData.category_ids.includes(category.id) ? theme.colors.primary : `${theme.colors.surface}4d`,
                                    color: formData.category_ids.includes(category.id) ? '#FFFFFF' : theme.colors.text,
                                    boxShadow: formData.category_ids.includes(category.id) ? theme.shadows.sm : 'none',
                                }}
                                onMouseEnter={(e) => {
                                    if (!formData.category_ids.includes(category.id)) {
                                        e.currentTarget.style.backgroundColor = theme.colors.surface;
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!formData.category_ids.includes(category.id)) {
                                        e.currentTarget.style.backgroundColor = `${theme.colors.surface}4d`;
                                    }
                                }}
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

                <div className="flex flex-col gap-3 pt-2">
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 font-semibold transition-all"
                        style={{
                            backgroundColor: loading ? `${theme.colors.primary}cc` : theme.colors.primary,
                            color: '#FFFFFF',
                            borderRadius: theme.radius.xl,
                            opacity: loading ? 0.7 : 1,
                            cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.currentTarget.style.backgroundColor = `${theme.colors.primary}e6`;
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) {
                                e.currentTarget.style.backgroundColor = theme.colors.primary;
                            }
                        }}
                    >
                        {loading ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                        {t('common.save')}
                    </button>

                    <button
                        onClick={handleDelete}
                        disabled={loading}
                        className="w-full py-3.5 font-semibold transition-colors flex items-center justify-center gap-2"
                        style={{
                            backgroundColor: `${theme.colors.errorLight}33`,
                            color: theme.colors.error,
                            borderRadius: theme.radius.xl,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = `${theme.colors.errorLight}4d`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = `${theme.colors.errorLight}33`;
                        }}
                    >
                        <Trash2 size={18} />
                        {t('common.delete')}
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
}
