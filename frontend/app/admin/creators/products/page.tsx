'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminCreatorsAPI } from '@/lib/api';
import { MARKETPLACE_ENABLED } from '@/lib/features';

interface Product {
  id: number;
  title: string;
  description: string;
  price_coins: number;
  author_id: number;
  author_name: string;
  file_url: string | null;
  images: string[];
  created_at: string;
}

export default function AdminProductsModerationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | 'hide'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);

  useEffect(() => {
    if (!MARKETPLACE_ENABLED) {
      router.push('/admin');
      return;
    }
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await adminCreatorsAPI.getPendingProducts({ limit: 100 });
      setProducts(data);
    } catch (err: any) {
      setError('Не вдалося завантажити товари');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async () => {
    if (!selectedProduct) return;

    if ((modalAction === 'reject' || modalAction === 'hide') && !rejectionReason.trim()) {
      setError('Введіть причину');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      await adminCreatorsAPI.moderateProduct(selectedProduct.id, {
        action: modalAction,
        rejection_reason: modalAction !== 'approve' ? rejectionReason : undefined,
      });

      setProducts(products.filter((p) => p.id !== selectedProduct.id));
      setShowModal(false);
      setRejectionReason('');
      setSelectedProduct(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не вдалося модерувати товар');
    } finally {
      setProcessing(false);
    }
  };

  const openModal = (product: Product, action: 'approve' | 'reject' | 'hide') => {
    setSelectedProduct(product);
    setModalAction(action);
    setShowModal(true);
    setRejectionReason('');
    setError('');
  };

  const formatCoins = (coins: number) => {
    return coins.toLocaleString('uk-UA');
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push('/admin')}
          className="text-purple-400 hover:text-purple-300 mb-6 flex items-center gap-2"
        >
          ← Назад до адмін-панелі
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Модерація товарів креаторів
          </h1>
          <p className="text-slate-400">{products.length} товарів на розгляді</p>
        </div>

        {error && !showModal && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Products List */}
        <div className="space-y-4">
          {products.length === 0 ? (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-12 text-center">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-slate-300 text-lg">Немає товарів на модерації</p>
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6"
              >
                <div className="flex gap-6">
                  {/* Image Gallery */}
                  <div className="flex-shrink-0">
                    {product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-48 h-48 object-cover rounded-lg cursor-pointer"
                        onClick={() =>
                          setExpandedProduct(
                            expandedProduct === product.id ? null : product.id
                          )
                        }
                      />
                    ) : (
                      <div className="w-48 h-48 bg-slate-700 rounded-lg flex items-center justify-center">
                        <span className="text-slate-500 text-4xl">📦</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-2">
                          {product.title}
                        </h3>
                        <div className="flex gap-4 text-sm text-slate-400 mb-3">
                          <span>👤 {product.author_name}</span>
                          <span>ID автора: {product.author_id}</span>
                          <span>ID товару: {product.id}</span>
                          <span>
                            📅{' '}
                            {new Date(product.created_at).toLocaleDateString('uk-UA', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-green-400">
                          {formatCoins(product.price_coins)} 💎
                        </div>
                        <div className="text-lg text-slate-300">
                          ${(product.price_coins / 100).toFixed(2)}
                        </div>
                        <div className="text-sm text-slate-500 mt-1">
                          Креатор: ${((product.price_coins * 0.85) / 100).toFixed(2)}
                        </div>
                        <div className="text-sm text-slate-500">
                          Комісія: ${((product.price_coins * 0.15) / 100).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 mb-4">
                      <div className="text-slate-400 text-sm mb-2 font-medium">
                        Опис:
                      </div>
                      <div className="text-slate-300 text-sm whitespace-pre-wrap">
                        {product.description}
                      </div>
                    </div>

                    {/* Gallery (if expanded) */}
                    {expandedProduct === product.id && product.images.length > 1 && (
                      <div className="mb-4">
                        <div className="text-slate-400 text-sm mb-2 font-medium">
                          Галерея зображень:
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {product.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`${product.title} ${idx + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* File Info */}
                    {product.file_url && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2 text-blue-400 text-sm">
                          <span>📦</span>
                          <a
                            href={product.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            Завантажити ZIP файл
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => openModal(product, 'approve')}
                        disabled={processing}
                        className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        ✅ Схвалити
                      </button>
                      <button
                        onClick={() => openModal(product, 'reject')}
                        disabled={processing}
                        className="flex-1 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-lg hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        ❌ Відхилити
                      </button>
                      <button
                        onClick={() => openModal(product, 'hide')}
                        disabled={processing}
                        className="flex-1 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white font-bold rounded-lg hover:from-slate-700 hover:to-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        🚫 Приховати
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Moderation Modal */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50">
          <div
            className={`bg-slate-800 border rounded-2xl p-8 max-w-md w-full ${
              modalAction === 'approve'
                ? 'border-green-500/20'
                : modalAction === 'reject'
                ? 'border-red-500/20'
                : 'border-slate-500/20'
            }`}
          >
            <h2 className="text-2xl font-bold text-white mb-4">
              {modalAction === 'approve'
                ? 'Схвалити товар'
                : modalAction === 'reject'
                ? 'Відхилити товар'
                : 'Приховати товар'}
            </h2>

            <div className="mb-4 p-4 bg-slate-900/50 rounded-lg">
              <div className="text-slate-400 text-sm">Товар:</div>
              <div className="text-white font-medium">{selectedProduct.title}</div>
              <div className="text-slate-400 text-sm mt-2">Автор:</div>
              <div className="text-white">{selectedProduct.author_name}</div>
            </div>

            {modalAction === 'approve' ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
                <p className="text-green-400 text-sm">
                  ✅ Товар буде опубліковано в маркетплейсі
                </p>
              </div>
            ) : (
              <>
                <div
                  className={`${
                    modalAction === 'reject'
                      ? 'bg-orange-500/10 border-orange-500/20'
                      : 'bg-slate-500/10 border-slate-500/20'
                  } border rounded-lg p-3 mb-4`}
                >
                  <p
                    className={`text-sm ${
                      modalAction === 'reject' ? 'text-orange-400' : 'text-slate-400'
                    }`}
                  >
                    {modalAction === 'reject'
                      ? '⚠️ Креатор зможе виправити та подати знову'
                      : '⚠️ Товар буде прихований через порушення правил'}
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-slate-300 mb-2 font-medium">
                    Причина {modalAction === 'reject' ? 'відхилення' : 'приховання'}
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    placeholder="Наприклад: недостатньо інформації про функціонал..."
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                    required
                  />
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setRejectionReason('');
                  setSelectedProduct(null);
                  setError('');
                }}
                disabled={processing}
                className="flex-1 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                Скасувати
              </button>
              <button
                onClick={handleModerate}
                disabled={
                  processing ||
                  (modalAction !== 'approve' && !rejectionReason.trim())
                }
                className={`flex-1 py-3 font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  modalAction === 'approve'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                    : modalAction === 'reject'
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white'
                    : 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white'
                }`}
              >
                {processing
                  ? 'Обробка...'
                  : modalAction === 'approve'
                  ? 'Схвалити'
                  : modalAction === 'reject'
                  ? 'Відхилити'
                  : 'Приховати'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
