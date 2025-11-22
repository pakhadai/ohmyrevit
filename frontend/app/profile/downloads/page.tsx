// frontend/app/profile/downloads/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { profileAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Download, Package, Crown, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface DownloadableProduct {
  id: number;
  title: string;
  description: string;
  main_image_url: string;
  zip_file_path: string;
}

function DownloadItem({ product }: { product: DownloadableProduct }) {
    const { token } = useAuthStore.getState();
    const { t } = useTranslation();

    const handleDownload = (e: React.MouseEvent) => {
        e.preventDefault();
        if (product && token) {
            const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
            const downloadUrl = `${baseUrl}/api/v1/profile/download/${product.id}?token=${token}`;
            window.location.href = downloadUrl;
            toast.success(t('toasts.downloadStarted', { title: product.title }));
        } else {
            toast.error(t('toasts.loginToDownload'));
        }
    };

    const fullImageUrl = (path: string) => {
        if (!path) return '/placeholder.jpg';
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
        if (path.startsWith('http')) {
            return path;
        }
        return `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    };

    return (
        <motion.div
            className="bg-white dark:bg-slate-800 rounded-lg p-4 flex items-center gap-4 shadow-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <img src={fullImageUrl(product.main_image_url)} alt={product.title} className="w-20 h-20 object-cover rounded-md flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{product.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">{product.description}</p>
            </div>
            <button
                onClick={handleDownload}
                className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                title={t('productPage.download')}
            >
                <Download size={20} />
            </button>
        </motion.div>
    );
}

export default function DownloadsPage() {
  // Видалено router, оскільки кнопки "назад" більше немає
  const [activeTab, setActiveTab] = useState('premium');
  const [premiumProducts, setPremiumProducts] = useState<DownloadableProduct[]>([]);
  const [freeProducts, setFreeProducts] = useState<DownloadableProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchDownloads = async () => {
      try {
        setLoading(true);
        const data = await profileAPI.getDownloads();
        setPremiumProducts(data.premium || []);
        setFreeProducts(data.free || []);
      } catch (error) {
        toast.error(t('profilePages.downloads.toasts.loadError'));
        console.error("Failed to fetch downloads:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDownloads();
  }, [t]);

  const ProductList = ({ products }: { products: DownloadableProduct[] }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {products.map(product => <DownloadItem key={product.id} product={product} />)}
    </div>
  );

  const EmptyState = ({ message, cta, ctaLabel }: { message: string, cta?: boolean, ctaLabel?: string }) => (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Package size={48} className="mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold mb-2">{message}</h2>
          {cta && (
              <Link href="/marketplace" className="mt-2 inline-block px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  {ctaLabel}
              </Link>
          )}
      </div>
  );

  return (
    // Адаптуємо контейнер: -mt-4 для компенсації глобального відступу, pb-20 для скролу знизу
    <div className="container mx-auto px-4 -mt-4 pb-20">

      {/* Sticky Tabs - Вкладки тепер прилипають до верху */}
      <div className="flex border-b dark:border-slate-700 mb-6 sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pt-4 -mx-4 px-4 transition-all">
        <button
            onClick={() => setActiveTab('premium')}
            className={`flex items-center gap-2 px-4 py-3 font-semibold transition-colors border-b-2 -mb-[1px] ${activeTab === 'premium' ? 'border-purple-500 text-purple-500' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
           <Crown size={18} /> {t('profilePages.downloads.premium')} ({premiumProducts.length})
        </button>
        <button
            onClick={() => setActiveTab('free')}
            className={`flex items-center gap-2 px-4 py-3 font-semibold transition-colors border-b-2 -mb-[1px] ${activeTab === 'free' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          <Package size={18} /> {t('profilePages.downloads.free')} ({freeProducts.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
            <Loader className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
        </div>
      ) : (
        <div>
          {activeTab === 'premium' && (
            premiumProducts.length > 0
              ? <ProductList products={premiumProducts} />
              : <EmptyState message={t('profilePages.downloads.empty.premium')} cta={true} ctaLabel={t('profilePages.downloads.empty.goToMarket')}/>
          )}
          {activeTab === 'free' && (
            freeProducts.length > 0
              ? <ProductList products={freeProducts} />
              : <EmptyState message={t('profilePages.downloads.empty.free')} />
          )}
        </div>
      )}
    </div>
  );
}