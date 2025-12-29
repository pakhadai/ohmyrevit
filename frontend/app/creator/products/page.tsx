'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { creatorsAPI } from '@/lib/api';
import { MARKETPLACE_ENABLED } from '@/lib/features';
import { useTheme } from '@/lib/theme';

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  author_id: number;
  moderation_status: string;
  rejection_reason: string | null;
  main_image_url: string;
  gallery_image_urls: string[];
  zip_file_path: string;
  file_size_mb: number;
  compatibility: string | null;
  views_count: number;
  downloads_count: number;
  created_at: string;
  updated_at: string | null;
}

export default function CreatorProductsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!MARKETPLACE_ENABLED) {
      router.push('/');
      return;
    }
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await creatorsAPI.getMyProducts({ limit: 100 });
      setProducts(data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        router.push('/become-creator');
      } else {
        setError('Не вдалося завантажити товари');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForModeration = async (product: Product) => {
    if (!confirm(`Відправити товар "${product.title}" на модерацію?`)) return;

    setSubmitting(true);
    setError('');

    try {
      await creatorsAPI.submitProductForModeration(product.id);
      setProducts(
        products.map((p) =>
          p.id === product.id ? { ...p, moderation_status: 'pending' } : p
        )
      );
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не вдалося відправити на модерацію');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    setDeleting(true);
    setError('');

    try {
      await creatorsAPI.deleteProduct(selectedProduct.id);
      setProducts(products.filter((p) => p.id !== selectedProduct.id));
      setShowDeleteModal(false);
      setSelectedProduct(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не вдалося видалити товар');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'draft':
        return { bg: theme.colors.textMuted + '30', border: theme.colors.textMuted + '60', color: theme.colors.textSecondary };
      case 'pending':
        return { bg: theme.colors.warningLight, border: theme.colors.warning + '60', color: theme.colors.warning };
      case 'approved':
        return { bg: theme.colors.successLight, border: theme.colors.success + '60', color: theme.colors.success };
      case 'rejected':
        return { bg: theme.colors.errorLight, border: theme.colors.error + '60', color: theme.colors.error };
      case 'hidden':
        return { bg: theme.colors.orangeLight, border: theme.colors.orange + '60', color: theme.colors.orange };
      default:
        return { bg: theme.colors.textMuted + '30', border: theme.colors.textMuted + '60', color: theme.colors.textSecondary };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return '📝 Чернетка';
      case 'pending':
        return '⏳ На модерації';
      case 'approved':
        return '✅ Схвалено';
      case 'rejected':
        return '❌ Відхилено';
      case 'hidden':
        return '🚫 Приховано';
      default:
        return status;
    }
  };

  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  if (!MARKETPLACE_ENABLED || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: theme.colors.bgGradient }}>
        <div style={{ color: theme.colors.text }} className="text-xl">Завантаження...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 pb-28" style={{ background: theme.colors.bgGradient }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push('/creator/dashboard')}
          className="mb-6 flex items-center gap-2 transition-colors hover:opacity-80"
          style={{ color: theme.colors.purple }}
        >
          ← Назад до дашборду
        </button>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Мої товари
            </h1>
            <p style={{ color: theme.colors.textSecondary }}>{products.length} товарів</p>
          </div>
          <button
            onClick={() => router.push('/creator/products/new')}
            className="px-6 py-3 font-bold transition-all hover:opacity-90"
            style={{
              background: `linear-gradient(to right, ${theme.colors.purple}, ${theme.colors.pink})`,
              color: '#FFFFFF',
              borderRadius: theme.radius.lg,
              boxShadow: theme.shadows.lg
            }}
          >
            ➕ Додати товар
          </button>
        </div>

        {error && (
          <div
            className="p-4 mb-6"
            style={{
              backgroundColor: theme.colors.errorLight,
              border: `1px solid ${theme.colors.error}30`,
              borderRadius: theme.radius.lg
            }}
          >
            <p style={{ color: theme.colors.error }} className="text-sm">{error}</p>
          </div>
        )}

        {/* Products List */}
        {products.length === 0 ? (
          <div
            className="backdrop-blur-sm p-12 text-center"
            style={{
              backgroundColor: theme.colors.card + '80',
              border: `1px solid ${theme.colors.purple}30`,
              borderRadius: theme.radius['2xl']
            }}
          >
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: theme.colors.text }}>Поки що немає товарів</h2>
            <p className="mb-6" style={{ color: theme.colors.textSecondary }}>Створіть свій перший товар для продажу</p>
            <button
              onClick={() => router.push('/creator/products/new')}
              className="px-6 py-3 font-bold transition-all hover:opacity-90"
              style={{
                background: `linear-gradient(to right, ${theme.colors.purple}, ${theme.colors.pink})`,
                color: '#FFFFFF',
                borderRadius: theme.radius.lg
              }}
            >
              ➕ Створити товар
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => {
              const statusStyle = getStatusStyle(product.moderation_status);
              return (
                <div
                  key={product.id}
                  className="backdrop-blur-sm p-6 transition-all hover:opacity-95"
                  style={{
                    backgroundColor: theme.colors.card + '80',
                    border: `1px solid ${theme.colors.purple}30`,
                    borderRadius: theme.radius['2xl']
                  }}
                >
                  <div className="flex gap-6">
                    {/* Image */}
                    <img
                      src={product.main_image_url}
                      alt={product.title}
                      className="w-32 h-32 object-cover flex-shrink-0"
                      style={{ borderRadius: theme.radius.lg }}
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-2" style={{ color: theme.colors.text }}>
                            {product.title}
                          </h3>
                          <div className="flex items-center gap-3 mb-2">
                            <span
                              className="px-3 py-1 text-sm font-medium"
                              style={{
                                backgroundColor: statusStyle.bg,
                                border: `1px solid ${statusStyle.border}`,
                                borderRadius: theme.radius.lg,
                                color: statusStyle.color
                              }}
                            >
                              {getStatusLabel(product.moderation_status)}
                            </span>
                            <span className="text-sm" style={{ color: theme.colors.textMuted }}>ID: {product.id}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold" style={{ color: theme.colors.green }}>
                            ${formatPrice(product.price)}
                          </div>
                          <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                            {(product.price * 0.85).toFixed(2)} USD ваш дохід
                          </div>
                        </div>
                      </div>

                      <p className="text-sm mb-4 line-clamp-2" style={{ color: theme.colors.textSecondary }}>
                        {product.description}
                      </p>

                      {/* Stats */}
                      <div className="flex gap-4 text-sm mb-4" style={{ color: theme.colors.textMuted }}>
                        <span>👁️ {product.views_count} переглядів</span>
                        <span>⬇️ {product.downloads_count} завантажень</span>
                        {product.compatibility && (
                          <span>🔧 {product.compatibility}</span>
                        )}
                        <span>📦 {product.file_size_mb.toFixed(2)} MB</span>
                      </div>

                      {/* Rejection Reason */}
                      {product.moderation_status === 'rejected' && product.rejection_reason && (
                        <div
                          className="p-3 mb-4"
                          style={{
                            backgroundColor: theme.colors.errorLight,
                            border: `1px solid ${theme.colors.error}30`,
                            borderRadius: theme.radius.lg
                          }}
                        >
                          <div className="text-sm font-medium mb-1" style={{ color: theme.colors.error }}>
                            Причина відхилення:
                          </div>
                          <div className="text-sm" style={{ color: theme.colors.error }}>
                            {product.rejection_reason}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-3">
                        {(product.moderation_status === 'draft' || product.moderation_status === 'rejected') && (
                          <>
                            <button
                              onClick={() => router.push(`/creator/products/${product.id}/edit`)}
                              className="px-4 py-2 transition-all hover:opacity-80"
                              style={{
                                backgroundColor: theme.colors.purple,
                                color: '#FFFFFF',
                                borderRadius: theme.radius.lg
                              }}
                            >
                              ✏️ Редагувати
                            </button>
                            <button
                              onClick={() => handleSubmitForModeration(product)}
                              disabled={submitting}
                              className="px-4 py-2 transition-all hover:opacity-80 disabled:opacity-50"
                              style={{
                                backgroundColor: theme.colors.blue,
                                color: '#FFFFFF',
                                borderRadius: theme.radius.lg
                              }}
                            >
                              📤 На модерацію
                            </button>
                          </>
                        )}

                        {product.moderation_status === 'draft' && (
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowDeleteModal(true);
                              setError('');
                            }}
                            className="px-4 py-2 transition-all hover:opacity-80"
                            style={{
                              backgroundColor: theme.colors.error,
                              color: '#FFFFFF',
                              borderRadius: theme.radius.lg
                            }}
                          >
                            🗑️ Видалити
                          </button>
                        )}

                        {product.moderation_status === 'approved' && (
                          <button
                            onClick={() => router.push(`/product/${product.id}`)}
                            className="px-4 py-2 transition-all hover:opacity-80"
                            style={{
                              backgroundColor: theme.colors.green,
                              color: '#FFFFFF',
                              borderRadius: theme.radius.lg
                            }}
                          >
                            👁️ Переглянути
                          </button>
                        )}

                        {product.moderation_status === 'pending' && (
                          <div
                            className="px-4 py-2 text-sm font-medium"
                            style={{
                              backgroundColor: theme.colors.warningLight,
                              border: `1px solid ${theme.colors.warning}60`,
                              borderRadius: theme.radius.lg,
                              color: theme.colors.warning
                            }}
                          >
                            ⏳ Очікує модерації
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedProduct && (
        <div className="fixed inset-0 flex items-center justify-center p-6 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
          <div
            className="p-8 max-w-md w-full"
            style={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.error}30`,
              borderRadius: theme.radius['2xl']
            }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: theme.colors.text }}>
              Видалити товар?
            </h2>
            <div className="mb-6">
              <div className="mb-2" style={{ color: theme.colors.textSecondary }}>
                Ви впевнені, що хочете видалити товар:
              </div>
              <div className="font-bold" style={{ color: theme.colors.text }}>{selectedProduct.title}</div>
            </div>

            <div
              className="p-4 mb-6"
              style={{
                backgroundColor: theme.colors.warningLight,
                border: `1px solid ${theme.colors.warning}30`,
                borderRadius: theme.radius.lg
              }}
            >
              <p className="text-sm" style={{ color: theme.colors.warning }}>
                ⚠️ Цю дію неможливо скасувати
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedProduct(null);
                  setError('');
                }}
                disabled={deleting}
                className="flex-1 py-3 transition-all hover:opacity-80 disabled:opacity-50"
                style={{
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderRadius: theme.radius.lg
                }}
              >
                Скасувати
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 font-bold transition-all hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(to right, ${theme.colors.error}, #DC2626)`,
                  color: '#FFFFFF',
                  borderRadius: theme.radius.lg
                }}
              >
                {deleting ? 'Видалення...' : 'Видалити'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
