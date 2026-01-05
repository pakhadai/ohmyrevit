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
import { useTheme } from '@/lib/theme';

export default function ProductsManagementPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const { theme } = useTheme();

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
        <h2 className="text-3xl font-bold" style={{ color: theme.colors.text }}>
          {t('admin.products.pageTitle')}
        </h2>
        <button
          onClick={() => router.push('/admin/products/new')}
          className="hidden lg:flex items-center gap-2 px-4 py-2 font-medium transition-all"
          style={{
            backgroundColor: theme.colors.primary,
            color: '#fff',
            borderRadius: theme.radius.xl,
            boxShadow: theme.shadows.md,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.boxShadow = theme.shadows.lg;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = theme.shadows.md;
          }}
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
            <div
              key={product.id}
              className="overflow-hidden group transition-all"
              style={{
                backgroundColor: theme.colors.card,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.xl,
                boxShadow: theme.shadows.md,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${theme.colors.primary}4d`;
                e.currentTarget.style.boxShadow = theme.shadows.lg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = theme.colors.border;
                e.currentTarget.style.boxShadow = theme.shadows.md;
              }}
            >
              <div
                className="relative h-48 w-full"
                style={{ backgroundColor: theme.colors.surface }}
              >
                <img
                  src={product.main_image_url || '/placeholder.jpg'}
                  alt={product.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {product.is_on_sale && (
                  <div
                    className="absolute top-2 left-2 text-xs font-bold px-2 py-1 shadow-sm"
                    style={{
                      backgroundColor: theme.colors.pink,
                      color: '#fff',
                      borderRadius: theme.radius.lg,
                    }}
                  >
                    SALE
                  </div>
                )}
                <div
                  className="absolute top-2 right-2 backdrop-blur-sm text-xs font-bold px-2 py-1"
                  style={{
                    backgroundColor: `${theme.colors.bg}cc`,
                    color: theme.colors.text,
                    borderRadius: theme.radius.lg,
                  }}
                >
                  {product.product_type === 'free' ? 'FREE' : 'PREMIUM'}
                </div>
              </div>

              <div className="p-4">
                <h3
                  className="font-bold line-clamp-1 mb-1"
                  style={{ color: theme.colors.text }}
                  title={product.title}
                >
                  {product.title}
                </h3>
                <p
                  className="text-xs line-clamp-2 mb-3 min-h-[2.5em]"
                  style={{ color: theme.colors.textMuted }}
                >
                  {product.description}
                </p>

                <div
                  className="flex justify-between items-center mb-4 pt-3"
                  style={{ borderTop: `1px solid ${theme.colors.border}80` }}
                >
                  <div className="flex flex-col">
                    <span
                      className="text-[10px] uppercase font-bold tracking-wider"
                      style={{ color: theme.colors.textMuted }}
                    >
                      Ціна
                    </span>
                    <div className="flex items-center gap-2">
                      {product.is_on_sale ? (
                        <>
                          <span className="font-bold" style={{ color: theme.colors.primary }}>
                            ${product.sale_price}
                          </span>
                          <span
                            className="text-xs line-through"
                            style={{ color: theme.colors.textMuted }}
                          >
                            ${product.price}
                          </span>
                        </>
                      ) : (
                        <span className="font-bold" style={{ color: theme.colors.text }}>
                          ${product.price}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className="text-[10px] uppercase font-bold tracking-wider"
                      style={{ color: theme.colors.textMuted }}
                    >
                      Розмір
                    </span>
                    <p className="text-xs font-medium" style={{ color: theme.colors.text }}>
                      {product.file_size_mb} MB
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 py-2 text-xs font-bold transition-all flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text,
                      borderRadius: theme.radius.xl,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.surfaceHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.surface;
                    }}
                  >
                    <Edit size={14} /> {t('admin.products.edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2 transition-colors"
                    style={{
                      color: theme.colors.textMuted,
                      borderRadius: theme.radius.xl,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = theme.colors.error;
                      e.currentTarget.style.backgroundColor = theme.colors.errorLight;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = theme.colors.textMuted;
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
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
