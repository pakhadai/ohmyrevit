'use client';

import { Product } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cartStore';
import { useTranslation } from 'react-i18next';
import { useAccessStore } from '@/store/accessStore';
import { useAuthStore } from '@/store/authStore';
import { useCollectionStore } from '@/store/collectionStore';
import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import AddToCollectionModal from '@/components/collections/AddToCollectionModal';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addToCart = useCartStore((state) => state.addItem);
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const { checkAccess, fetchAccessStatus } = useAccessStore();
  const { favoritedProductIds } = useCollectionStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const hasAccess = checkAccess(product.id);
  const isFavorited = favoritedProductIds.has(product.id);

  useEffect(() => {
    if (isAuthenticated && !hasAccess) {
      fetchAccessStatus([product.id]);
    }
  }, [product.id, hasAccess, fetchAccessStatus, isAuthenticated]);


  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product);
    toast.success(`'${product.title}' додано до кошика!`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    const token = useAuthStore.getState().token;
    if (token) {
        const url = `${process.env.NEXT_PUBLIC_API_URL}/profile/download/${product.id}?token=${token}`;
        window.open(url, '_blank');
    } else {
        toast.error("Будь ласка, увійдіть, щоб завантажити файл.");
    }
  };

  const discountPercentage = product.is_on_sale && product.sale_price
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : 0;

  const imageUrl = product.main_image_url || '/placeholder.jpg';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      // ОНОВЛЕНО: Використовуємо bg-card, border, і нову тінь
      className="group relative bg-card text-card-foreground rounded-2xl overflow-hidden border border-border shadow-soft dark:shadow-none hover:border-primary/30 hover:shadow-lg transition-all duration-300 flex flex-col"
    >
      <AnimatePresence>
        {isModalOpen && <AddToCollectionModal product={product} onClose={() => setIsModalOpen(false)} />}
      </AnimatePresence>

      <Link href={`/product/${product.id}`} passHref className="flex flex-col h-full">
        <div className="relative aspect-square overflow-hidden bg-muted/30">
          <Image
            src={imageUrl}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = '/placeholder.jpg';
            }}
          />
          <div className="absolute top-2 left-2 flex flex-col gap-2">
            {product.product_type === 'free' && (
              <span className="px-2.5 py-1 bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-full shadow-sm">
                FREE
              </span>
            )}
            {product.is_on_sale && (
              <span className="px-2.5 py-1 bg-pink-soft text-white dark:text-slate-900 text-xs font-bold rounded-full shadow-sm">
                -{discountPercentage}%
              </span>
            )}
          </div>
          <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleFavoriteClick}
              className="p-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-full hover:bg-white dark:hover:bg-slate-800 shadow-sm transition-colors"
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'text-red-500 fill-current' : 'text-gray-600 dark:text-gray-300'}`} />
            </button>
          </div>
        </div>

        <div className="p-4 flex flex-col flex-grow">
          <h3 className="font-semibold text-sm leading-tight mb-2 text-foreground line-clamp-2">
            {product.title}
          </h3>

          <div className="flex-grow"></div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {product.is_on_sale && product.sale_price ? (
                <>
                  <span className="text-lg font-bold text-primary">
                    ${product.sale_price.toFixed(2)}
                  </span>
                  <span className="text-sm line-through text-muted-foreground">
                    ${product.price.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold text-foreground">
                  {product.price === 0 ? 'FREE' : `$${product.price.toFixed(2)}`}
                </span>
              )}
            </div>
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
              {product.file_size_mb} MB
            </span>
          </div>

          {hasAccess ? (
             <button
                onClick={handleDownload}
                className="w-full mt-auto py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 font-medium text-sm active:scale-[0.98]"
            >
                <Download className="w-4 h-4" />
                <span>Завантажити</span>
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              // ОНОВЛЕНО: Використовуємо primary колір теми
              className="w-full mt-auto py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 font-medium text-sm active:scale-[0.98]"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{t('product.addToCart')}</span>
            </button>
          )}
        </div>
      </Link>
    </motion.div>
  );
}