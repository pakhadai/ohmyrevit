'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { productsAPI, ratingsAPI, profileAPI } from '@/lib/api';
import { Product } from '@/types';
import {
  ArrowLeft, ShoppingCart, Download, Heart, Share2, User,
  Eye, Package, Star, Code, ChevronLeft, ChevronRight
} from 'lucide-react';
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
import ProductCard from '@/components/product/ProductCard';

export default function ProductDetailPage() {
  const { theme } = useTheme();
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const productId = Array.isArray(id) ? id[0] : id;

  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const addItemToCart = useCartStore((state) => state.addItem);
  const { isAuthenticated, token, user } = useAuthStore();
  const { checkAccess, fetchAccessStatus } = useAccessStore();
  const { favoritedProductIds } = useCollectionStore();
  const { t } = useTranslation();

  useEffect(() => {
    if (productId) {
      const fetchData = async () => {
        try {
          setLoading(true);

          // Load product (main request - must succeed)
          const productData = await productsAPI.getProductById(productId);
          setProduct(productData);
          setSelectedImage(productData.main_image_url);

          // Load access status and rating (optional - failures won't break page)
          if (isAuthenticated) {
            try {
              await fetchAccessStatus([Number(productId)]);
            } catch (err) {
              console.warn('Failed to fetch access status:', err);
            }

            try {
              const ratingStats = await ratingsAPI.getProductRatingStats(Number(productId));
              // Завжди встановлюємо userRating (null якщо немає)
              setUserRating(ratingStats?.user_rating || null);
            } catch (err) {
              console.warn('Failed to fetch rating stats:', err);
              setUserRating(null);
            }
          }

          // Load similar products (optional - failures won't break page)
          try {
            if (productData.categories && productData.categories.length > 0) {
              const similar = await productsAPI.getProducts({
                category_id: productData.categories[0].id,
                limit: 8,
              });
              setSimilarProducts(similar.filter((p: Product) => p.id !== productData.id).slice(0, 4));
            } else {
              const similar = await productsAPI.getProducts({ limit: 8 });
              setSimilarProducts(similar.filter((p: Product) => p.id !== productData.id).slice(0, 4));
            }
          } catch (err) {
            console.warn('Failed to fetch similar products:', err);
          }
        } catch (err) {
          console.error('Failed to load product:', err);
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

  const handleDownload = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (product && token) {
      try {
        const { download_token } = await profileAPI.generateDownloadToken(product.id);
        const downloadUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL || ''}/api/v1/profile/download/${product.id}?download_token=${download_token}`;
        window.location.href = downloadUrl;
        toast.success(t('toasts.downloadStarted', { title: product.title }));
      } catch (error: any) {
        toast.error(error?.response?.data?.detail || 'Не вдалося завантажити файл');
      }
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

    try {
      setIsSubmittingRating(true);
      await ratingsAPI.createOrUpdateRating(product.id, rating);
      setUserRating(rating);

      await fetchAccessStatus([product.id]);
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

  const allImages = product ? [product.main_image_url, ...product.gallery_image_urls] : [];

  const nextImage = () => {
    const newIndex = (selectedImageIndex + 1) % allImages.length;
    setSelectedImageIndex(newIndex);
    setSelectedImage(allImages[newIndex]);
  };

  const prevImage = () => {
    const newIndex = selectedImageIndex === 0 ? allImages.length - 1 : selectedImageIndex - 1;
    setSelectedImageIndex(newIndex);
    setSelectedImage(allImages[newIndex]);
  };

  const hasAccess = product ? checkAccess(product.id) || product.product_type === 'free' : false;
  const isFavorited = product ? favoritedProductIds.has(product.id) : false;
  const price = product ? Number(product.price) : 0;
  const salePrice = product?.sale_price ? Number(product.sale_price) : null;
  const isOwnProduct = product && user ? product.author_id === user.id : false;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen" style={{ backgroundColor: theme.colors.bg }}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent"
          style={{ borderColor: theme.colors.primary }} />
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Маркетплейс', href: '/marketplace' },
            ...(categoryName ? [{ label: categoryName, href: `/marketplace?category=${product.categories[0].slug}` }] : []),
            { label: product.title },
          ]}
        />

        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
          {/* Left: Image Gallery */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative aspect-square rounded-3xl overflow-hidden group"
              style={{
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                boxShadow: theme.shadows.xl,
              }}
            >
              <Image
                src={fullImageUrl(selectedImage)}
                alt={product.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />

              {/* Navigation Arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    style={{
                      backgroundColor: `${theme.colors.card}E6`,
                      color: theme.colors.text,
                    }}
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    style={{
                      backgroundColor: `${theme.colors.card}E6`,
                      color: theme.colors.text,
                    }}
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}

              {/* Sale Badge */}
              {product.is_on_sale && (
                <div
                  className="absolute top-4 right-4 px-4 py-2 text-sm font-bold"
                  style={{
                    backgroundColor: theme.colors.error,
                    color: '#FFF',
                    borderRadius: theme.radius.full,
                    boxShadow: theme.shadows.lg,
                  }}
                >
                  SALE
                </div>
              )}
            </motion.div>

            {/* Thumbnail Gallery */}
            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {allImages.map((img, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden cursor-pointer"
                    style={{
                      border: selectedImageIndex === idx
                        ? `3px solid ${theme.colors.primary}`
                        : `1px solid ${theme.colors.border}`,
                      opacity: selectedImageIndex === idx ? 1 : 0.6,
                    }}
                    onClick={() => {
                      setSelectedImageIndex(idx);
                      setSelectedImage(img);
                    }}
                  >
                    <Image
                      src={fullImageUrl(img)}
                      alt={`preview ${idx}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div className="space-y-4">
            {/* Title & ID Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-6 rounded-2xl"
              style={{
                backgroundColor: theme.colors.card,
                border: `1px solid ${theme.colors.border}`,
                boxShadow: theme.shadows.md,
              }}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight flex-1"
                  style={{ color: theme.colors.text }}>
                  {product.title}
                </h1>
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg flex-shrink-0"
                  style={{
                    backgroundColor: theme.colors.surface,
                    border: `1px solid ${theme.colors.border}`,
                  }}
                >
                  <Code size={14} style={{ color: theme.colors.textMuted }} />
                  <span className="text-xs font-mono" style={{ color: theme.colors.textMuted }}>
                    #{product.id}
                  </span>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-4">
                <StarRating
                  rating={product.average_rating || 0}
                  onChange={isAuthenticated ? handleRatingChange : undefined}
                  readonly={!isAuthenticated || isSubmittingRating}
                  size={20}
                  value={userRating}
                />
                {(product.ratings_count || 0) > 0 && (
                  <span className="text-sm" style={{ color: theme.colors.textMuted }}>
                    ({product.ratings_count} {product.ratings_count === 1 ? 'оцінка' : 'оцінок'})
                  </span>
                )}
              </div>

              {/* Author */}
              {product.author_id && product.author_name ? (
                <Link
                  href={`/creator/${product.author_id}`}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: theme.colors.surface,
                    border: `1px solid ${theme.colors.border}`,
                  }}
                >
                  <User size={16} style={{ color: theme.colors.primary }} />
                  <span className="text-sm font-medium" style={{ color: theme.colors.primary }}>
                    {product.author_name}
                  </span>
                </Link>
              ) : (
                <div
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{
                    backgroundColor: theme.colors.accentLight,
                  }}
                >
                  <Star size={16} style={{ color: theme.colors.accent }} fill={theme.colors.accent} />
                  <span className="text-sm font-bold" style={{ color: theme.colors.accent }}>
                    OhMyRevit
                  </span>
                </div>
              )}
            </motion.div>

            {/* Price & Actions Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-2xl"
              style={{
                backgroundColor: theme.colors.card,
                border: `1px solid ${theme.colors.border}`,
                boxShadow: theme.shadows.md,
              }}
            >
              {/* Price */}
              <div className="mb-6">
                {product.is_on_sale && salePrice ? (
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-bold" style={{ color: theme.colors.accent }}>
                        {Math.round(salePrice * 100)} OMR
                      </span>
                      <span className="text-xl line-through" style={{ color: theme.colors.textMuted }}>
                        {Math.round(price * 100)} OMR
                      </span>
                    </div>
                    <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                      ${salePrice.toFixed(2)} USD • Економія {Math.round(((price - salePrice) / price) * 100)}%
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {price === 0 ? (
                      <span className="text-4xl font-bold" style={{ color: theme.colors.success }}>
                        БЕЗКОШТОВНО
                      </span>
                    ) : (
                      <>
                        <div className="text-4xl font-bold" style={{ color: theme.colors.text }}>
                          {Math.round(price * 100)} OMR
                        </div>
                        <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                          ${price.toFixed(2)} USD
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {isOwnProduct ? (
                  <button
                    onClick={() => router.push(`/creator/products/${product.id}/edit`)}
                    className="flex-1 py-4 font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] rounded-xl"
                    style={{
                      backgroundColor: theme.colors.blue,
                      color: '#FFF',
                      boxShadow: theme.shadows.md,
                    }}
                  >
                    <User size={20} />
                    <span>Редагувати товар</span>
                  </button>
                ) : hasAccess ? (
                  <button
                    onClick={handleDownload}
                    className="flex-1 py-4 font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] rounded-xl"
                    style={{
                      backgroundColor: theme.colors.success,
                      color: '#FFF',
                      boxShadow: theme.shadows.md,
                    }}
                  >
                    <Download size={20} />
                    <span>Завантажити</span>
                  </button>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 py-4 font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] rounded-xl"
                    style={{
                      background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`,
                      color: '#FFF',
                      boxShadow: theme.shadows.md,
                    }}
                  >
                    <ShoppingCart size={20} />
                    <span>Додати в кошик</span>
                  </button>
                )}

                {/* Add to Collection */}
                <button
                  onClick={handleFavoriteClick}
                  className="w-14 h-14 flex items-center justify-center rounded-xl transition-all active:scale-95"
                  style={{
                    backgroundColor: isFavorited ? theme.colors.errorLight : theme.colors.surface,
                    border: `1px solid ${isFavorited ? theme.colors.error : theme.colors.border}`,
                    color: isFavorited ? theme.colors.error : theme.colors.textMuted,
                  }}
                >
                  <Heart size={22} fill={isFavorited ? 'currentColor' : 'none'} />
                </button>

                {/* Share */}
                <button
                  onClick={handleShare}
                  className="w-14 h-14 flex items-center justify-center rounded-xl transition-all active:scale-95"
                  style={{
                    backgroundColor: theme.colors.surface,
                    border: `1px solid ${theme.colors.border}`,
                    color: theme.colors.textMuted,
                  }}
                >
                  <Share2 size={22} />
                </button>
              </div>
            </motion.div>

            {/* Stats Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 gap-3 p-4 rounded-2xl"
              style={{
                backgroundColor: theme.colors.card,
                border: `1px solid ${theme.colors.border}`,
                boxShadow: theme.shadows.md,
              }}
            >
              <div className="flex items-center gap-3 p-3 rounded-xl"
                style={{ backgroundColor: theme.colors.surface }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: theme.colors.blueLight }}>
                  <Eye size={20} style={{ color: theme.colors.blue }} />
                </div>
                <div>
                  <div className="text-lg font-bold" style={{ color: theme.colors.text }}>
                    {(product.views_count || 0).toLocaleString()}
                  </div>
                  <div className="text-xs" style={{ color: theme.colors.textMuted }}>
                    Переглядів
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl"
                style={{ backgroundColor: theme.colors.surface }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: theme.colors.successLight }}>
                  <Download size={20} style={{ color: theme.colors.success }} />
                </div>
                <div>
                  <div className="text-lg font-bold" style={{ color: theme.colors.text }}>
                    {(product.downloads_count || 0).toLocaleString()}
                  </div>
                  <div className="text-xs" style={{ color: theme.colors.textMuted }}>
                    Завантажень
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Description Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-8 rounded-2xl"
          style={{
            backgroundColor: theme.colors.card,
            border: `1px solid ${theme.colors.border}`,
            boxShadow: theme.shadows.md,
          }}
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"
            style={{ color: theme.colors.text }}>
            <Package size={24} style={{ color: theme.colors.primary }} />
            Опис
          </h2>
          <p className="text-base leading-relaxed whitespace-pre-line"
            style={{ color: theme.colors.textSecondary }}>
            {product.description}
          </p>

          {product.compatibility && (
            <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: theme.colors.surface }}>
              <div className="text-sm font-semibold mb-2" style={{ color: theme.colors.text }}>
                Сумісність:
              </div>
              <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                {product.compatibility}
              </div>
            </div>
          )}
        </motion.div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"
              style={{ color: theme.colors.text }}>
              <Star size={24} style={{ color: theme.colors.accent }} />
              Схожі товари
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {similarProducts.map((similarProduct) => (
                <ProductCard key={similarProduct.id} product={similarProduct} />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Add to Collection Modal */}
      <AddToCollectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productId={product.id}
      />
    </div>
  );
}
