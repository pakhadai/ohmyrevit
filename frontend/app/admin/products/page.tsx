'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package, PlusCircle, Edit, Trash2
} from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { LoadingSpinner, EmptyState } from '@/components/admin/Shared';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function ProductsManagementPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const productsRes = await adminApi.getProducts({ limit: 100 });
      setProducts(productsRes.products || []);
    } catch (error) {
      toast.error(t('admin.products.toasts.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = (product: any) => {
    router.push(`/admin/products/${product.id}/edit`);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('admin.products.confirmDelete'))) return;
    try {
      await adminApi.deleteProduct(id);
      toast.success(t('admin.products.toasts.deleted'));
      fetchData();
    } catch (error) {
      toast.error(t('admin.products.toasts.deleteError'));
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="hidden lg:flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">{t('admin.products.pageTitle')}</h2>
        <button
          onClick={() => router.push('/admin/products/new')}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          <PlusCircle size={18} />
          {t('admin.products.new')}
        </button>
      </div>

      {products.length === 0 ? (
        <EmptyState message="Товарів ще немає" icon={Package} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <img src={product.main_image_url || '/placeholder.jpg'} alt={product.title} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h3 className="font-semibold mb-2">{product.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{product.description}</p>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-lg">${product.price}</span>
                  {product.is_on_sale && (<span className="text-sm bg-red-500 text-white px-2 py-1 rounded">{t('admin.products.saleBadge')}: ${product.sale_price}</span>)}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(product)} className="flex-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"><Edit size={16} className="inline mr-1" /> {t('admin.products.edit')}</button>
                  <button onClick={() => handleDelete(product.id)} className="flex-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"><Trash2 size={16} className="inline mr-1" /> {t('admin.products.delete')}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}