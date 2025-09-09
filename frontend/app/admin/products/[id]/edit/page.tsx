'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { ArrowLeft, Upload, X, Package, Tag, Image as ImageIcon, FileArchive, Loader } from 'lucide-react'
// # OLD: import { adminAPI, productsAPI } from '@/lib/api'
import { adminApi } from '@/lib/api/admin'
import { productsAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

function FileUploader({
    onUpload,
    accept,
    label,
    oldPath
}: {
    onUpload: (path: string, size: number) => void,
    accept: string,
    label: string,
    oldPath?: string
}) {
    const { t } = useTranslation();
    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = async (file: File) => {
        setIsUploading(true);
        try {
            const isImage = accept.includes('image');
            const uploadFunction = isImage ? adminApi.uploadImage : adminApi.uploadArchive;
            const response = await uploadFunction(file, oldPath);

            onUpload(response.file_path, response.file_size_mb);
            toast.success(t('admin.products.form.toasts.fileUploaded'));
        } catch (error: any) {
            toast.error(error.message || t('admin.products.form.toasts.fileUploadError'));
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
                        <span className="text-sm font-semibold">{t('common.loading')}</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <Upload className="w-10 h-10 text-gray-400 mb-2" />
                        <span className="text-sm font-semibold">{label}</span>
                        <p className="text-xs text-gray-500">{t('admin.products.form.toasts.clickToSelect')}</p>
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
      const response = await adminApi.getCategories();
      setCategories(response);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error(t('admin.products.form.toasts.categoriesLoadError'));
    }
  }, [t]);

  useEffect(() => {
    if (user === undefined) return;
    if (!user?.is_admin) {
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
      // # OLD: await adminAPI.updateProduct(productId, formData);
      await adminApi.updateProduct(Number(productId), formData);
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
              // # OLD: await adminAPI.deleteProduct(productId);
              await adminApi.deleteProduct(Number(productId));
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
    setFormData((prev) => ({ ...prev, category_ids: prev.category_ids.includes(categoryId) ? prev.category_ids.filter(id => id !== categoryId) : [...prev.category_ids, categoryId] }));
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" /></div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
            <button onClick={() => router.push('/admin/products')} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"><ArrowLeft size={20} /></button>
            <h1 className="text-2xl font-bold">{t('admin.products.form.editTitle', { id: productId })}</h1>
        </div>

        <div className="space-y-6">
           <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Package size={20} /> {t('admin.products.form.mainInfo')}</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium mb-2">{t('admin.products.form.titleUk')}</label>
                        <input type="text" value={formData.title_uk} onChange={(e) => setFormData({ ...formData, title_uk: e.target.value })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required />
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
                    <textarea value={formData.description_uk} onChange={(e) => setFormData({ ...formData, description_uk: e.target.value })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" rows={5}></textarea>
                 </div>
                 <div className="mt-4">
                     <label className="block text-sm font-medium mb-2">{t('admin.products.form.compatibility')}</label>
                     <input type="text" value={formData.compatibility} onChange={(e) => setFormData({ ...formData, compatibility: e.target.value })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                 </div>
            </div>

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

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><ImageIcon size={20} /> {t('admin.products.form.images')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-medium mb-2">{t('admin.products.form.mainImage')}</h3>
                        {formData.main_image_url ? (
                             <div className="relative group">
                                <img src={formData.main_image_url} alt="Main image" className="w-full h-40 object-cover rounded-lg border dark:border-gray-600"/>
                                <button type="button" onClick={() => setFormData({...formData, main_image_url: ''})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                             </div>
                        ) : (
                             <FileUploader onUpload={(path) => setFormData({...formData, main_image_url: path})} accept="image/*" label={t('admin.products.form.uploadMain')} oldPath={formData.main_image_url} />
                        )}
                    </div>
                    <div>
                        <h3 className="font-medium mb-2">{t('admin.products.form.gallery')}</h3>
                        <div className="grid grid-cols-3 gap-2">
                             {formData.gallery_image_urls.map((url, index) => (
                              <div key={index} className="relative group"><img src={url} alt={`Gallery ${index + 1}`} className="w-full h-20 object-cover rounded-lg border dark:border-gray-600" /><button type="button" onClick={() => removeGalleryImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button></div>
                            ))}
                            {formData.gallery_image_urls.length < 6 && (
                                <div className="h-20">
                                    <FileUploader onUpload={(path) => setFormData({...formData, gallery_image_urls: [...formData.gallery_image_urls, path]})} accept="image/*" label={t('admin.products.form.addImage')}/>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileArchive size={20} /> {t('admin.products.form.files')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                     <div>
                        <label className="block text-sm font-medium mb-2">{t('admin.products.form.archive')}</label>
                        {formData.zip_file_path ? (
                            <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <FileArchive className="text-gray-500" />
                                <span className="text-sm truncate">{formData.zip_file_path.split('/').pop()}</span>
                                <button onClick={() => setFormData({...formData, zip_file_path: '', file_size_mb: 0})} className="ml-auto text-red-500"><X size={16}/></button>
                            </div>
                        ) : (
                            <FileUploader onUpload={(path, size) => setFormData({...formData, zip_file_path: path, file_size_mb: size})} accept=".zip,.rar,.7z,application/octet-stream" label={t('admin.products.form.uploadArchive')} oldPath={formData.zip_file_path}/>
                        )}
                     </div>
                     <div>
                        <label className="block text-sm font-medium mb-2">{t('admin.products.form.calculatedSize')}</label>
                        <input type="number" value={formData.file_size_mb} disabled className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 bg-gray-100 cursor-not-allowed" />
                     </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">{t('admin.products.form.categories')}</h2>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <label key={category.id} className={`px-4 py-2 rounded-lg border cursor-pointer transition-colors ${formData.category_ids.includes(category.id) ? 'bg-purple-500 text-white border-purple-500' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-purple-400'}`}>
                      <input type="checkbox" checked={formData.category_ids.includes(category.id)} onChange={() => toggleCategory(category.id)} className="hidden" />{category.name}
                    </label>
                  ))}
                </div>
            </div>
        </div>

        <div className="flex justify-between mt-8">
            <button onClick={handleDelete} disabled={loading} className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors">{t('common.delete')}</button>
            <div className="flex gap-4">
              <button type="button" onClick={() => router.push('/admin/products')} className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">{t('common.cancel')}</button>
              <button onClick={handleSubmit} disabled={loading} className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors">{loading ? t('common.processing') : t('common.save')}</button>
            </div>
          </div>
      </div>
    </div>
  )
}