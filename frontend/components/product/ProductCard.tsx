'use client';

import { Product } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, Download, Check } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useTranslation } from 'react-i18next';
import { useAccessStore } from '@/store/accessStore';
import { useAuthStore } from '@/store/authStore';
import { useCollectionStore } from '@/store/collectionStore';
import toast from 'react-hot-toast';
import { useState } from 'react';
import AddToCollectionModal from '@/components/collections/AddToCollectionModal';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem, removeItem, items } = useCartStore();
  const { t } = useTranslation();
  const { checkAccess } = useAccessStore();
  const { favoritedProductIds } = useCollectionStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const hasAccess = checkAccess(product.id) || product.product_type === 'free';

  const isFavorited = favoritedProductIds.has(product.id);
  const isInCart = items.some(item => item.id === product.id);

  const handleCartAction = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.product_type === 'free') {
        handleDownload(e);
        return;
    }

    if (isInCart) {
      removeItem(product.id);
    } else {
      addItem(product);
      toast.success(t('toasts.addedToCart', { title: product.title }));
    }
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
      const url = `${process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL}/profile/download/${product.id}?token=${token}`;
      window.open(url, '_blank');
    } else {
      toast.error(t('toasts.loginToDownload'));
    }
  };

  const price = Number(product.price);
  const salePrice = product.sale_price ? Number(product.sale_price) : null;

  const discountPercentage = product.is_on_sale && salePrice
    ? Math.round(((price - salePrice) / price) * 100)
    : 0;

  const fullImageUrl = (path: string) => {
    if (!path) return '/placeholder.jpg';
    if (path.startsWith('http')) return path;

    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://ohmyrevit.pp.ua';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

    if (path.startsWith('/uploads/')) {
        return `${cleanBase}${path}`;
    }

    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
  };

  const imageUrl = fullImageUrl(product.main_image_url);

  return (
    <div className="relative bg-card text-card-foreground rounded-2xl overflow-hidden border border-border flex flex-col">
      {isModalOpen && <AddToCollectionModal product={product} onClose={() => setIsModalOpen(false)} />}

      <Link href={`/product/${product.id}`} passHref className="flex flex-col h-full">
        <div className="relative aspect-square overflow-hidden bg-muted/30">
          <Image
            src={imageUrl}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = '/placeholder.jpg';
            }}
          />
          <div className="absolute top-2 left-2 flex flex-col gap-2">
            {product.product_type === 'free' && (
              <span className="px-2.5 py-1 bg-green-600 text-white text-xs font-bold rounded-full">
                {t('product.free')}
              </span>
            )}
            {product.is_on_sale && (
              <span className="px-2.5 py-1 bg-pink-soft text-slate-900 text-xs font-bold rounded-full">
                -{discountPercentage}%
              </span>
            )}
          </div>
          <div className="absolute top-2 right-2">
            <button
              onClick={handleFavoriteClick}
              className="p-2 bg-white dark:bg-slate-800 rounded-full"
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
              {product.is_on_sale && salePrice ? (
                <>
                  <span className="text-lg font-bold text-primary">
                    ${salePrice.toFixed(2)}
                  </span>
                  <span className="text-sm line-through text-muted-foreground">
                    ${price.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold text-foreground">
                  {price === 0 ? <span className="text-green-500">FREE</span> : `$${price.toFixed(2)}`}
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
              className="w-full mt-auto py-2.5 bg-green-600 text-white rounded-xl flex items-center justify-center gap-2 font-medium text-sm active:opacity-80"
            >
              <Download className="w-4 h-4" />
              <span>{t('productPage.download')}</span>
            </button>
          ) : (
            <button
              onClick={handleCartAction}
              className={`w-full mt-auto py-2.5 rounded-xl flex items-center justify-center gap-2 font-medium text-sm active:opacity-80 transition-colors ${
                isInCart
                  ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {isInCart ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{t('product.inCart')}</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>{t('product.addToCart')}</span>
                </>
              )}
            </button>
          )}
        </div>
      </Link>
    </div>
  );
}