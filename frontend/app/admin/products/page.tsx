'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package, PlusCircle, Edit, Trash2, Tag
} from 'lucide-react';
import { adminAPI, productsAPI } from '@/lib/api';
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
      const productsRes = await productsAPI.getProducts({ limit: 100 });
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
      await adminAPI.deleteProduct(id);
      toast.success(t('admin.products.toasts.deleted'));
      fetchData();
    } catch (error) {
      toast.error(t('admin.products.toasts.deleteError'));
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-foreground">{t('admin.products.pageTitle')}</h2>
        <button
          onClick={() => router.push('/admin/products/new')}
          className="hidden lg:flex btn-primary items-center gap-2"
        >
          <PlusCircle size={18} />
          {t('admin.products.new')}
        </button>
      </div>

      {products.length === 0 ? (
        <EmptyState message="Товарів ще немає" icon={Package} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.map((product) => (
            <div key={product.id} className="card-minimal overflow-hidden group hover:border-primary/30 transition-all">
              <div className="relative h-48 w-full bg-muted">
                  <img src={product.main_image_url || '/placeholder.jpg'} alt={product.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  {product.is_on_sale && (
                      <div className="absolute top-2 left-2 bg-pink-soft text-white dark:text-slate-900 text-xs font-bold px-2 py-1 rounded-lg shadow-sm">
                          SALE
                      </div>
                  )}
                  <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-foreground text-xs font-bold px-2 py-1 rounded-lg">
                      {product.product_type === 'free' ? 'FREE' : 'PREMIUM'}
                  </div>
              </div>

              <div className="p-4">
                <h3 className="font-bold text-foreground line-clamp-1 mb-1" title={product.title}>{product.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3 min-h-[2.5em]">{product.description}</p>

                <div className="flex justify-between items-center mb-4 pt-3 border-t border-border/50">
                  <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Ціна</span>
                      <div className="flex items-center gap-2">
                        {product.is_on_sale ? (
                            <>
                                <span className="font-bold text-primary">${product.sale_price}</span>
                                <span className="text-xs text-muted-foreground line-through">${product.price}</span>
                            </>
                        ) : (
                            <span className="font-bold text-foreground">${product.price}</span>
                        )}
                      </div>
                  </div>
                  <div className="text-right">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Розмір</span>
                      <p className="text-xs font-medium">{product.file_size_mb} MB</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => handleEdit(product)} className="flex-1 py-2 bg-secondary text-secondary-foreground rounded-xl text-xs font-bold hover:brightness-95 transition-all flex items-center justify-center gap-2">
                    <Edit size={14} /> {t('admin.products.edit')}
                  </button>
                  <button onClick={() => handleDelete(product.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors">
                    <Trash2 size={18} />
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