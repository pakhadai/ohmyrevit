// frontend/app/product/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { productsAPI } from '@/lib/api';
import { Product } from '@/types';
// OLD: import { ArrowLeft, ShoppingCart, CheckCircle, Info, Loader } from 'lucide-react';
import { ArrowLeft, ShoppingCart, CheckCircle, Info, Loader, Download } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useAccessStore } from '@/store/accessStore';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const productId = Array.isArray(id) ? id[0] : id;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');

  const addItemToCart = useCartStore((state) => state.addItem);
  const { isAuthenticated } = useAuthStore();
  const { checkAccess, fetchAccessStatus } = useAccessStore();

  useEffect(() => {
    if (productId) {
      const fetchProductAndAccess = async () => {
        try {
          setLoading(true);
          const productData = await productsAPI.getProductById(productId);
          setProduct(productData);
          setSelectedImage(productData.main_image_url); // Встановлюємо головне зображення як активне

          if (isAuthenticated) {
            await fetchAccessStatus([Number(productId)]);
          }
        } catch (err) {
          setError('Не вдалося завантажити товар. Можливо, його не існує.');
          toast.error('Помилка завантаження товару.');
        } finally {
          setLoading(false);
        }
      };
      fetchProductAndAccess();
    }
  }, [productId, isAuthenticated, fetchAccessStatus]);

  const handleAddToCart = () => {
    if (product) {
      addItemToCart(product);
      toast.success(`'${product.title}' додано до кошика!`);
    }
  };

  const handleDownload = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const token = useAuthStore.getState().token;
    if (product && token) {
      const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL}/profile/download/${product.id}?token=${token}`;
      window.location.href = downloadUrl;
      toast.success('Завантаження почалось...');
    } else {
      toast.error("Для завантаження потрібно авторизуватися.");
    }
  };

  const fullImageUrl = (path: string) => {
    if (!path) return '/placeholder.jpg';
    // OLD: return path.startsWith('http') ? path : `${process.env.NEXT_PUBLIC_BACKEND_URL}${path}`;
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    if (path.startsWith('http')) {
      return path;
    }
    // Переконуємось, що не додаємо подвійний слеш
    return `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}/${path.startsWith('/') ? path.slice(1) : path}`;
  };

  const hasAccess = product ? checkAccess(product.id) || product.product_type === 'free' : false;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="w-12 h-12 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-red-500">{error}</h2>
        <button
          onClick={() => router.push('/marketplace')}
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Повернутися до маркетплейсу
        </button>
      </div>
    );
  }

  if (!product) {
    return null; // Або інший стан, якщо товар не знайдено
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-20">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Кнопка "Назад" */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 mb-6"
        >
          <ArrowLeft size={20} />
          <span>Назад до товарів</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Галерея зображень */}
          <div>
            <motion.div
              key={selectedImage}
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
              className="relative aspect-square rounded-2xl overflow-hidden shadow-lg"
            >
              <Image
                src={fullImageUrl(selectedImage)}
                alt={product.title}
                fill
                className="object-cover"
              />
            </motion.div>
            <div className="flex gap-2 mt-4">
              {[product.main_image_url, ...product.gallery_image_urls].map((img, idx) => (
                <div
                  key={idx}
                  className={`w-20 h-20 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${selectedImage === img ? 'border-blue-500 scale-105' : 'border-transparent'}`}
                  onClick={() => setSelectedImage(img)}
                >
                  <Image
                    src={fullImageUrl(img)}
                    alt={`${product.title} preview ${idx + 1}`}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Інформація про товар */}
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold mb-4">{product.title}</h1>

            <div className="flex items-baseline gap-4 mb-6">
              {product.is_on_sale && product.sale_price ? (
                <>
                  <span className="text-4xl font-bold text-blue-500">${product.sale_price.toFixed(2)}</span>
                  <span className="text-2xl line-through text-gray-400">${product.price.toFixed(2)}</span>
                </>
              ) : (
                <span className="text-4xl font-bold">
                  {product.price === 0 ? 'Безкоштовно' : `$${product.price.toFixed(2)}`}
                </span>
              )}
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              {product.description}
            </p>

            <div className="mt-auto pt-6 border-t dark:border-gray-700">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle size={18} className="text-green-500" />
                  <span>Сумісність: <strong>{product.compatibility}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Info size={18} className="text-blue-500" />
                  <span>Розмір: <strong>{product.file_size_mb} MB</strong></span>
                </div>
              </div>

              {hasAccess ? (
                <button
                  onClick={handleDownload}
                  className="w-full py-4 bg-green-500 text-white rounded-xl font-bold text-lg hover:bg-green-600 transition-transform hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-center gap-3">
                    <Download size={24} />
                    <span>Завантажити</span>
                  </div>
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className="w-full py-4 bg-blue-500 text-white rounded-xl font-bold text-lg hover:bg-blue-600 transition-transform hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-center gap-3">
                    <ShoppingCart size={24} />
                    <span>Додати в кошик</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}