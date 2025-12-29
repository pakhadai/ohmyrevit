'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { creatorsAPI } from '@/lib/api';
import { MARKETPLACE_ENABLED } from '@/lib/features';

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
      // Update product status locally
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-slate-500/20 border-slate-500/40 text-slate-400';
      case 'pending':
        return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400';
      case 'approved':
        return 'bg-green-500/20 border-green-500/40 text-green-400';
      case 'rejected':
        return 'bg-red-500/20 border-red-500/40 text-red-400';
      case 'hidden':
        return 'bg-orange-500/20 border-orange-500/40 text-orange-400';
      default:
        return 'bg-slate-500/20 border-slate-500/40 text-slate-400';
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
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Завантаження...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 p-6 pb-28">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push('/creator/dashboard')}
          className="text-purple-400 hover:text-purple-300 mb-6 flex items-center gap-2"
        >
          ← Назад до дашборду
        </button>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Мої товари
            </h1>
            <p className="text-slate-400">{products.length} товарів</p>
          </div>
          <button
            onClick={() => router.push('/creator/products/new')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
          >
            ➕ Додати товар
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Products List */}
        {products.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-white mb-2">Поки що немає товарів</h2>
            <p className="text-slate-400 mb-6">Створіть свій перший товар для продажу</p>
            <button
              onClick={() => router.push('/creator/products/new')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              ➕ Створити товар
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 hover:border-purple-400/40 transition-colors"
              >
                <div className="flex gap-6">
                  {/* Image */}
                  <img
                    src={product.main_image_url}
                    alt={product.title}
                    className="w-32 h-32 object-cover rounded-lg flex-shrink-0"
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">
                          {product.title}
                        </h3>
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`px-3 py-1 rounded-lg text-sm font-medium border ${getStatusColor(
                              product.moderation_status
                            )}`}
                          >
                            {getStatusLabel(product.moderation_status)}
                          </span>
                          <span className="text-slate-400 text-sm">ID: {product.id}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-400">
                          ${formatPrice(product.price)}
                        </div>
                        <div className="text-slate-400 text-sm">
                          {(product.price * 0.85).toFixed(2)} USD ваш дохід
                        </div>
                      </div>
                    </div>

                    <p className="text-slate-300 text-sm mb-4 line-clamp-2">
                      {product.description}
                    </p>

                    {/* Stats */}
                    <div className="flex gap-4 text-sm text-slate-400 mb-4">
                      <span>👁️ {product.views_count} переглядів</span>
                      <span>⬇️ {product.downloads_count} завантажень</span>
                      {product.compatibility && (
                        <span>🔧 {product.compatibility}</span>
                      )}
                      <span>📦 {product.file_size_mb.toFixed(2)} MB</span>
                    </div>

                    {/* Rejection Reason */}
                    {product.moderation_status === 'rejected' &&
                      product.rejection_reason && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                          <div className="text-red-400 text-sm font-medium mb-1">
                            Причина відхилення:
                          </div>
                          <div className="text-red-300 text-sm">
                            {product.rejection_reason}
                          </div>
                        </div>
                      )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      {/* Can edit if DRAFT or REJECTED */}
                      {(product.moderation_status === 'draft' ||
                        product.moderation_status === 'rejected') && (
                        <>
                          <button
                            onClick={() =>
                              router.push(`/creator/products/${product.id}/edit`)
                            }
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                          >
                            ✏️ Редагувати
                          </button>
                          <button
                            onClick={() => handleSubmitForModeration(product)}
                            disabled={submitting}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                          >
                            📤 На модерацію
                          </button>
                        </>
                      )}

                      {/* Can delete if DRAFT */}
                      {product.moderation_status === 'draft' && (
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowDeleteModal(true);
                            setError('');
                          }}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                          🗑️ Видалити
                        </button>
                      )}

                      {/* View stats for APPROVED */}
                      {product.moderation_status === 'approved' && (
                        <button
                          onClick={() =>
                            router.push(`/product/${product.id}`)
                          }
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        >
                          👁️ Переглянути
                        </button>
                      )}

                      {/* Waiting indicator for PENDING */}
                      {product.moderation_status === 'pending' && (
                        <div className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 rounded-lg text-sm font-medium">
                          ⏳ Очікує модерації
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50">
          <div className="bg-slate-800 border border-red-500/20 rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-4">
              Видалити товар?
            </h2>
            <div className="mb-6">
              <div className="text-slate-300 mb-2">
                Ви впевнені, що хочете видалити товар:
              </div>
              <div className="text-white font-bold">{selectedProduct.title}</div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
              <p className="text-yellow-400 text-sm">
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
                className="flex-1 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                Скасувати
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-lg hover:from-red-700 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
