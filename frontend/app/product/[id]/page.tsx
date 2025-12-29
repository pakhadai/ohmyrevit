'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { productsAPI, ratingsAPI } from '@/lib/api';
import { Product } from '@/types';
import { ArrowLeft, ShoppingCart, CheckCircle2, Info, Loader, Download, Heart, Share2, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useAccessStore } from '@/store/accessStore';
import { useCollectionStore } from '@/store/collectionStore';
import { useTranslation } from 'react-i18next';
import AddToCollectionModal from '@/components/collections/AddToCollectionModal';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { useTheme } from '@/lib/theme';
import StarRating from '@/components/ui/StarRating';

export default function ProductDetailPage() {
  const { theme } = useTheme();
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const productId = Array.isArray(id) ? id[0] : id;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const addItemToCart = useCartStore((state) => state.addItem);
  const { isAuthenticated, token } = useAuthStore();
  const { checkAccess, fetchAccessStatus } = useAccessStore();
  const { favoritedProductIds } = useCollectionStore();
  const { t } = useTranslation();

  useEffect(() => {
    if (productId) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const promises: Promise<any>[] = [productsAPI.getProductById(productId)];
          if (isAuthenticated) {
            promises.push(fetchAccessStatus([Number(productId)]));
            promises.push(ratingsAPI.getProductRatingStats(Number(productId)));
          }
          const results = await Promise.all(promises);
          const productData = results[0];
          setProduct(productData);
          setSelectedImage(productData.main_image_url);

          // Load user rating if authenticated
          if (isAuthenticated && results.length > 2) {
            const ratingStats = results[2];
            if (ratingStats && ratingStats.user_rating) {
              setUserRating(ratingStats.user_rating);
            }
          }
        } catch (err) {
          setError(t('productPage.loadError'));
          toast.error(t('toasts.productLoadError'));
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [productId, isAuthenticated, fetchAccessStatus, t]);

  const handleAddToCart = () => {
    if (product) {
      addItemToCart(product);
      toast.success(t('toasts.addedToCart', { title: product.title }));
    }
  };

  const handleDownload = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (product && token) {
      const downloadUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL || ''}/api/v1/profile/download/${product.id}?token=${token}`;
      window.location.href = downloadUrl;
      toast.success(t('toasts.downloadStarted', { title: product.title }));
    } else {
      toast.error(t('toasts.loginToDownload'));
    }
  };

  const handleFavoriteClick = () => {
    setIsModalOpen(true);
  };

  const handleShare = async () => {
    if (navigator.share && product) {
      try {
        await navigator.share({
          title: product.title,
          text: product.description,
          url: window.location.href,
        });
      } catch (error) {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(t('toasts.linkCopied'));
    }
  };

  const handleRatingChange = async (rating: number) => {
    if (!product || !isAuthenticated) {
      toast.error('Увійдіть щоб залишити оцінку');
      return;
    }

    if (!hasAccess) {
      toast.error('Ви можете ставити оцінку тільки після покупки товару');
      return;
    }

    try {
      setIsSubmittingRating(true);
      await ratingsAPI.createOrUpdateRating(product.id, rating);
      setUserRating(rating);

      // Update product stats locally
      const stats = await ratingsAPI.getProductRatingStats(product.id);
      if (stats) {
        setProduct(prev => prev ? {
          ...prev,
          average_rating: stats.average_rating,
          ratings_count: stats.ratings_count
        } : null);
      }

      toast.success('Дякуємо за вашу оцінку!');
    } catch (error: any) {
      console.error('Rating submission error:', error);
      toast.error(error.response?.data?.detail || 'Не вдалося зберегти оцінку');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const fullImageUrl = (path: string) => {
    if (!path) return '/placeholder.jpg';
    if (path.startsWith('http')) return path;
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${cleanBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  };

  const hasAccess = product ? checkAccess(product.id) || product.product_type === 'free' : false;
  const isFavorited = product ? favoritedProductIds.has(product.id) : false;
  const price = product ? Number(product.price) : 0;
  const salePrice = product?.sale_price ? Number(product.sale_price) : null;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen" style={{ backgroundColor: theme.colors.bg }}>
        <Loader className="w-10 h-10 animate-spin" style={{ color: theme.colors.primary }} />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-20 px-5" style={{ backgroundColor: theme.colors.bg }}>
        <h2 className="text-xl font-semibold mb-4" style={{ color: theme.colors.error }}>
          {error || t('productPage.loadError')}
        </h2>
        <button
          onClick={() => router.push('/marketplace')}
          className="px-6 py-3 font-semibold"
          style={{
            backgroundColor: theme.colors.primary,
            color: '#FFF',
            borderRadius: theme.radius.xl,
          }}
        >
          {t('cart.empty.goToMarket')}
        </button>
      </div>
    );
  }

  const categoryName = product.categories && product.categories.length > 0
    ? product.categories[0].name
    : null;

  return (
    <div className="min-h-screen pb-32" style={{ background: theme.colors.bgGradient }}>
      <AnimatePresence>
        {isModalOpen && <AddToCollectionModal product={product} onClose={() => setIsModalOpen(false)} />}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto px-5 pt-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: t('marketplace.title') || 'Маркетплейс', href: '/marketplace' },
            ...(categoryName ? [{ label: categoryName }] : []),
            { label: product.title },
          ]}
        />

        <div className="flex items-center justify-end mb-6 gap-2">
          <button
            onClick={() => router.back()}
            className="p-2.5 transition-colors"
            style={{
              backgroundColor: theme.colors.surface,
              color: theme.colors.textMuted,
              borderRadius: theme.radius.lg,
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="p-2.5 transition-colors"
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.textMuted,
                borderRadius: theme.radius.lg,
              }}
            >
              <Share2 size={20} />
            </button>
            <button
              onClick={handleFavoriteClick}
              className="p-2.5 transition-colors"
              style={{
                backgroundColor: isFavorited ? theme.colors.errorLight : theme.colors.surface,
                color: isFavorited ? theme.colors.error : theme.colors.textMuted,
                borderRadius: theme.radius.lg,
              }}
            >
              <Heart size={20} className={isFavorited ? 'fill-current' : ''} />
            </button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="space-y-3">
            <div
              className="relative aspect-square w-full overflow-hidden"
              style={{
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius['2xl'],
                boxShadow: theme.shadows.lg,
              }}
            >
              <Image
                src={fullImageUrl(selectedImage)}
                alt={product.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {product.is_on_sale && (
                <div
                  className="absolute top-4 left-4 px-3 py-1 text-xs font-bold"
                  style={{
                    backgroundColor: theme.colors.error,
                    color: '#FFF',
                    borderRadius: theme.radius.full,
                  }}
                >
                  SALE
                </div>
              )}
            </div>

            {product.gallery_image_urls.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {[product.main_image_url, ...product.gallery_image_urls].map((img, idx) => (
                  <div
                    key={idx}
                    className="relative w-20 h-20 flex-shrink-0 overflow-hidden cursor-pointer transition-all"
                    style={{
                      border: selectedImage === img ? `2px solid ${theme.colors.primary}` : `2px solid transparent`,
                      borderRadius: theme.radius.lg,
                      opacity: selectedImage === img ? 1 : 0.7,
                    }}
                    onClick={() => setSelectedImage(img)}
                  >
                    <Image
                      src={fullImageUrl(img)}
                      alt={`preview ${idx}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            className="p-6"
            style={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius['2xl'],
              boxShadow: theme.shadows.md,
            }}
          >
            <div className="flex justify-between items-start gap-4 mb-2">
              <h1 className="text-2xl font-bold leading-tight" style={{ color: theme.colors.text }}>
                {product.title}
              </h1>
            </div>

            <div className="flex items-center gap-3 mb-6">
              {product.is_on_sale && salePrice ? (
                <>
                  <span className="text-3xl font-bold" style={{ color: theme.colors.primary }}>
                    ${salePrice.toFixed(2)}
                  </span>
                  <span className="text-lg line-through" style={{ color: theme.colors.textMuted }}>
                    ${price.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-3xl font-bold" style={{ color: theme.colors.text }}>
                  {price === 0 ? (
                    <span style={{ color: theme.colors.success }}>FREE</span>
                  ) : (
                    `$${price.toFixed(2)}`
                  )}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium"
                style={{
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.textSecondary,
                  borderRadius: theme.radius.md,
                }}
              >
                <CheckCircle2 size={14} style={{ color: theme.colors.success }} />
                {product.compatibility || 'Revit 2021+'}
              </div>
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium"
                style={{
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.textSecondary,
                  borderRadius: theme.radius.md,
                }}
              >
                <Info size={14} style={{ color: theme.colors.blue }} />
                {product.file_size_mb} MB
              </div>
            </div>

            <p className="text-sm leading-relaxed" style={{ color: theme.colors.textSecondary }}>
              {product.description}
            </p>
          </div>

          {product.author_id && product.author_name && (
            <div
              className="p-6"
              style={{
                backgroundColor: theme.colors.card,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius['2xl'],
                boxShadow: theme.shadows.md,
              }}
            >
              <h3 className="text-sm font-semibold mb-3" style={{ color: theme.colors.text }}>
                {t('productPage.author') || 'Автор'}
              </h3>
              <Link
                href={`/creator/${product.author_id}`}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`,
                  }}
                >
                  <User size={24} color="#FFF" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm" style={{ color: theme.colors.text }}>
                    {product.author_name}
                  </p>
                  <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                    {t('productPage.viewProfile') || 'Переглянути профіль'}
                  </p>
                </div>
              </Link>
            </div>
          )}

          {/* Rating Section */}
          <div
            className="p-6"
            style={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius['2xl'],
              boxShadow: theme.shadows.md,
            }}
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: theme.colors.text }}>
              Рейтинг товару
            </h3>

            {/* Average Rating Display */}
            {product.ratings_count > 0 && (
              <div className="flex items-center gap-3 mb-4">
                <StarRating rating={product.average_rating || 0} readonly showNumber size={24} />
                <span className="text-sm" style={{ color: theme.colors.textMuted }}>
                  ({product.ratings_count} {product.ratings_count === 1 ? 'оцінка' : 'оцінок'})
                </span>
              </div>
            )}

            {/* User Rating Input */}
            {hasAccess ? (
              <div>
                <p className="text-xs mb-2" style={{ color: theme.colors.textMuted }}>
                  {userRating ? 'Ваша оцінка:' : 'Оцініть цей товар:'}
                </p>
                <StarRating
                  rating={userRating || 0}
                  onChange={handleRatingChange}
                  size={28}
                />
              </div>
            ) : product.ratings_count === 0 ? (
              <p className="text-sm" style={{ color: theme.colors.textMuted }}>
                Цей товар ще не має оцінок
              </p>
            ) : null}

            {!hasAccess && isAuthenticated && (
              <p className="text-xs mt-3 p-3" style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.textMuted,
                borderRadius: theme.radius.md,
              }}>
                💡 Ви зможете оцінити товар після покупки
              </p>
            )}
          </div>

          <div className="fixed bottom-24 left-0 right-0 px-5 z-20 pointer-events-none">
            <div
              className="pointer-events-auto max-w-4xl mx-auto"
              style={{ boxShadow: theme.shadows.xl }}
            >
              {hasAccess ? (
                <button
                  onClick={handleDownload}
                  className="w-full py-4 font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  style={{
                    backgroundColor: theme.colors.success,
                    color: '#FFF',
                    borderRadius: theme.radius.xl,
                  }}
                >
                  <Download size={20} />
                  <span>{t('productPage.download')}</span>
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className="w-full py-4 font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  style={{
                    backgroundColor: theme.colors.primary,
                    color: '#FFF',
                    borderRadius: theme.radius.xl,
                  }}
                >
                  <ShoppingCart size={20} />
                  <span>{t('product.addToCart')}</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}