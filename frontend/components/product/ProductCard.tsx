'use client';

import { Product } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, Download, Check, Star } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useTranslation } from 'react-i18next';
import { useAccessStore } from '@/store/accessStore';
import { useAuthStore } from '@/store/authStore';
import { useCollectionStore } from '@/store/collectionStore';
import toast from 'react-hot-toast';
import { useState } from 'react';
import AddToCollectionModal from '@/components/collections/AddToCollectionModal';
import { useTheme } from '@/lib/theme';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { theme } = useTheme();
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
      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/profile/download/${product.id}?token=${token}`;
      window.location.href = url;
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
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${cleanBase}${path.startsWith('/') ? path : `/${path}`}`;
  };

  return (
    <div
      className="relative overflow-hidden flex flex-col group transition-all duration-300 hover:scale-[1.02]"
      style={{
        backgroundColor: theme.colors.card,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.xl,
        boxShadow: theme.shadows.md,
      }}
    >
      {isModalOpen && <AddToCollectionModal product={product} onClose={() => setIsModalOpen(false)} />}

      <Link href={`/product/${product.id}`} className="flex flex-col h-full">
        <div
          className="relative aspect-square overflow-hidden"
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Image
            src={fullImageUrl(product.main_image_url)}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          <div className="absolute top-2 left-2 flex flex-col gap-1.5">
            {product.product_type === 'free' && (
              <span
                className="px-2 py-0.5 text-[10px] font-bold"
                style={{
                  backgroundColor: theme.colors.success,
                  color: '#FFF',
                  borderRadius: theme.radius.full,
                }}
              >
                FREE
              </span>
            )}
            {product.is_on_sale && (
              <span
                className="px-2 py-0.5 text-[10px] font-bold"
                style={{
                  backgroundColor: theme.colors.error,
                  color: '#FFF',
                  borderRadius: theme.radius.full,
                }}
              >
                -{discountPercentage}%
              </span>
            )}
          </div>

          <div className="absolute top-2 right-2 flex flex-col gap-1.5">
            <button
              onClick={handleFavoriteClick}
              className="p-2 backdrop-blur-md transition-transform hover:scale-110"
              style={{
                backgroundColor: isFavorited ? theme.colors.errorLight : 'rgba(255,255,255,0.9)',
                borderRadius: theme.radius.full,
              }}
            >
              <Heart
                size={14}
                style={{ color: isFavorited ? theme.colors.error : theme.colors.textMuted }}
                className={isFavorited ? 'fill-current' : ''}
              />
            </button>
          </div>

          {product.product_type === 'premium' && (
            <div className="absolute bottom-2 right-2">
              <span
                className="px-2 py-0.5 text-[10px] font-bold flex items-center gap-0.5"
                style={{
                  backgroundColor: theme.colors.accentDark,
                  color: '#FFF',
                  borderRadius: theme.radius.full,
                }}
              >
                <Star size={10} fill="currentColor" /> PRO
              </span>
            </div>
          )}
        </div>

        <div className="p-3 flex flex-col flex-grow">
          <h3
            className="font-semibold text-sm leading-tight mb-1 line-clamp-2"
            style={{ color: theme.colors.text }}
          >
            {product.title}
          </h3>

          {product.author_id && product.author_name && (
            <Link
              href={`/creator/${product.author_id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] mb-2 hover:underline"
              style={{ color: theme.colors.textMuted }}
            >
              {product.author_name}
            </Link>
          )}

          {!product.author_id && <div className="mb-2" />}

          <div className="flex-grow" />

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              {product.is_on_sale && salePrice ? (
                <>
                  <span className="text-base font-bold" style={{ color: theme.colors.primary }}>
                    ${salePrice.toFixed(2)}
                  </span>
                  <span className="text-xs line-through" style={{ color: theme.colors.textMuted }}>
                    ${price.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-base font-bold" style={{ color: theme.colors.text }}>
                  {price === 0 ? (
                    <span style={{ color: theme.colors.success }}>FREE</span>
                  ) : (
                    `$${price.toFixed(2)}`
                  )}
                </span>
              )}
            </div>
            <span
              className="text-[10px] font-medium px-1.5 py-0.5"
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.textSecondary,
                borderRadius: theme.radius.sm,
              }}
            >
              {product.file_size_mb} MB
            </span>
          </div>

          {hasAccess ? (
            <button
              onClick={handleDownload}
              className="w-full py-2 flex items-center justify-center gap-1.5 font-medium text-sm transition-all active:scale-95"
              style={{
                backgroundColor: theme.colors.success,
                color: '#FFF',
                borderRadius: theme.radius.lg,
              }}
            >
              <Download size={14} />
              <span>{t('productPage.download')}</span>
            </button>
          ) : (
            <button
              onClick={handleCartAction}
              className="w-full py-2 flex items-center justify-center gap-1.5 font-medium text-sm transition-all active:scale-95"
              style={{
                backgroundColor: isInCart ? theme.colors.surface : theme.colors.primary,
                color: isInCart ? theme.colors.text : '#FFF',
                borderRadius: theme.radius.lg,
              }}
            >
              {isInCart ? (
                <>
                  <Check size={14} />
                  <span>{t('product.inCart')}</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={14} />
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