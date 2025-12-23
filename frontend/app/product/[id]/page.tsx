'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { productsAPI } from '@/lib/api';
import { Product } from '@/types';
import { ArrowLeft, ShoppingCart, CheckCircle2, Info, Loader, Download, Heart, Share2 } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useAccessStore } from '@/store/accessStore';
import { useCollectionStore } from '@/store/collectionStore';
import { useTranslation } from 'react-i18next';
import AddToCollectionModal from '@/components/collections/AddToCollectionModal';
import { useTheme } from '@/lib/theme';

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
          }
          const [productData] = await Promise.all(promises);
          setProduct(productData);
          setSelectedImage(productData.main_image_url);
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

  return (
    <div className="min-h-screen pb-32" style={{ background: theme.colors.bgGradient }}>
      <AnimatePresence>
        {isModalOpen && <AddToCollectionModal product={product} onClose={() => setIsModalOpen(false)} />}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto px-5 pt-6">
        <div className="flex items-center justify-between mb-6">
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