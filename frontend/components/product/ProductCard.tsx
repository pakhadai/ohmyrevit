'use client';

import { Product } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCartStore } from '@/store/cartStore';
import { useLanguageStore } from '@/store/languageStore';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addToCart = useCartStore((state) => state.addItem);
  const { t } = useLanguageStore();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product);
    toast.success(t('product.addedToCart'));
  };

  // Розрахунок знижки
  const discountPercentage = product.is_on_sale && product.sale_price
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : 0;

  // ВИПРАВЛЕНО: Визначаємо URL зображення, з плейсхолдером як запасний варіант
  const imageUrl = product.main_image_url || '/placeholder.jpg';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
    >
      <Link href={`/product/${product.id}`} passHref>
        {/* Зображення */}
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={imageUrl} // ВИПРАВЛЕНО: Використовуємо змінну imageUrl
            alt={product.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            // Додаємо обробник помилок, щоб уникнути падіння сторінки, якщо зображення недоступне
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null; // запобігаємо нескінченному циклу
              target.src = '/placeholder.jpg';
            }}
          />

          {/* Бейджі */}
          <div className="absolute top-2 left-2 flex flex-col gap-2">
            {product.product_type === 'free' && (
              <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                FREE
              </span>
            )}
            {product.is_on_sale && (
              <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                -{discountPercentage}%
              </span>
            )}
          </div>

          {/* Кнопки дій */}
          <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-2 bg-white/90 dark:bg-slate-900/90 rounded-full hover:bg-white dark:hover:bg-slate-900 transition-colors">
              <Heart className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Інформація про товар */}
        <div className="p-4">
          <h3 className="font-semibold text-sm line-clamp-2 mb-2">
            {product.title}
          </h3>

          {/* Ціна */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {product.is_on_sale && product.sale_price ? (
                <>
                  <span className="text-lg font-bold text-blue-500">
                    ${product.sale_price}
                  </span>
                  <span className="text-sm line-through text-gray-400">
                    ${product.price}
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold">
                  {product.price === 0 ? 'FREE' : `$${product.price}`}
                </span>
              )}
            </div>

            <span className="text-xs text-gray-500">
              {product.file_size_mb} MB
            </span>
          </div>

          {/* Кнопка додавання в кошик */}
          <button
            onClick={handleAddToCart}
            className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="text-sm">{t('product.addToCart')}</span>
          </button>
        </div>
      </Link>
    </motion.div>
  );
}