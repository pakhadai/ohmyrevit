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

export default function ProductDetailPage() {
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
      const fetchProductAndAccess = async () => {
        try {
          setLoading(true);
          const productData = await productsAPI.getProductById(productId);
          setProduct(productData);
          setSelectedImage(productData.main_image_url);

          if (isAuthenticated) {
            await fetchAccessStatus([Number(productId)]);
          }
        } catch (err) {
          setError(t('productPage.loadError'));
          toast.error(t('toasts.productLoadError'));
        } finally {
          setLoading(false);
        }
      };
      fetchProductAndAccess();
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
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(t('toasts.linkCopied'));
    }
  };

  const fullImageUrl = (path: string) => {
    if (!path) return '/placeholder.jpg';

    // Якщо це зовнішнє посилання або вже починається з http - залишаємо як є
    if (path.startsWith('http')) {
      return path;
    }

    // Якщо це локальне завантаження (/uploads/...), повертаємо як відносний шлях
    // Next.js знайде файл у public/uploads завдяки монтуванню тому
    if (path.startsWith('/uploads/')) {
        return path;
    }

    // Fallback для інших випадків (хоча uploads покриває 99%)
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    return `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  };

  const hasAccess = product ? checkAccess(product.id) || product.product_type === 'free' : false;
  const isFavorited = product ? favoritedProductIds.has(product.id) : false;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-20 px-5">
        <h2 className="text-xl font-semibold text-destructive mb-4">{error || t('productPage.loadError')}</h2>
        <button
          onClick={() => router.push('/marketplace')}
          className="btn-primary"
        >
          {t('cart.empty.goToMarket')}
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-5 pt-14 pb-24 space-y-6">
      <AnimatePresence>
        {isModalOpen && <AddToCollectionModal product={product} onClose={() => setIsModalOpen(false)} />}
      </AnimatePresence>

      {/* Header Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="p-2.5 bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex gap-2">
            <button
                onClick={handleShare}
                className="p-2.5 bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-colors"
            >
                <Share2 size={20} />
            </button>
            <button
                onClick={handleFavoriteClick}
                className={`p-2.5 rounded-xl transition-colors ${
                    isFavorited
                    ? 'bg-pink-soft/20 text-destructive'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
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
        {/* Image Gallery */}
        <div className="space-y-3">
            <div className="relative aspect-square w-full overflow-hidden rounded-[24px] bg-muted border border-border/50 shadow-sm">
              <Image
                src={fullImageUrl(selectedImage)}
                alt={product.title}
                fill
                className="object-cover"
                priority
              />
              {product.is_on_sale && (
                  <div className="absolute top-4 left-4 px-3 py-1 bg-destructive text-white text-xs font-bold rounded-full shadow-md">
                      SALE
                  </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.gallery_image_urls.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {[product.main_image_url, ...product.gallery_image_urls].map((img, idx) => (
                        <div
                        key={idx}
                        className={`relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                            selectedImage === img
                            ? 'border-primary shadow-md scale-105'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                        onClick={() => setSelectedImage(img)}
                        >
                        <Image
                            src={fullImageUrl(img)}
                            alt={`preview ${idx}`}
                            fill
                            className="object-cover"
                        />
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Product Info Card */}
        <div className="card-minimal p-6">
            <div className="flex justify-between items-start gap-4 mb-2">
                <h1 className="text-2xl font-bold text-foreground leading-tight">{product.title}</h1>
            </div>

            <div className="flex items-center gap-3 mb-6">
              {product.is_on_sale && product.sale_price ? (
                <>
                  <span className="text-3xl font-bold text-primary">${product.sale_price.toFixed(2)}</span>
                  <span className="text-lg text-muted-foreground line-through decoration-2">${product.price.toFixed(2)}</span>
                </>
              ) : (
                <span className="text-3xl font-bold text-foreground">
                  {product.price === 0 ? <span className="text-green-500">FREE</span> : `$${product.price.toFixed(2)}`}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-xs font-medium text-muted-foreground">
                    <CheckCircle2 size={14} className="text-green-500" />
                    {product.compatibility || 'Revit 2021+'}
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-xs font-medium text-muted-foreground">
                    <Info size={14} className="text-blue-500" />
                    {product.file_size_mb} MB
                </div>
            </div>

            <div className="prose prose-sm dark:prose-invert text-muted-foreground leading-relaxed">
              <p>{product.description}</p>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="fixed bottom-24 left-0 right-0 px-5 z-20 pointer-events-none">
            <div className="pointer-events-auto shadow-2xl shadow-black/10 rounded-2xl">
                {hasAccess ? (
                    <button
                    onClick={handleDownload}
                    className="w-full py-4 bg-green-500 text-white rounded-2xl font-bold text-base hover:bg-green-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/30"
                    >
                    <Download size={20} />
                    <span>{t('productPage.download')}</span>
                    </button>
                ) : (
                    <button
                    onClick={handleAddToCart}
                    className="btn-primary w-full py-4 rounded-2xl text-base flex items-center justify-center gap-2"
                    >
                    <ShoppingCart size={20} />
                    <span>{t('product.addToCart')}</span>
                    </button>
                )}
            </div>
        </div>
      </motion.div>
    </div>
  );
}