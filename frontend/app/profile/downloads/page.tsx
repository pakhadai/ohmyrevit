'use client';

import { useState, useEffect, forwardRef } from 'react';
import { profileAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Download, Package, Crown, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface DownloadableProduct {
  id: number;
  title: string;
  description: string;
  main_image_url: string;
  zip_file_path: string;
}

const DownloadItem = forwardRef<HTMLDivElement, { product: DownloadableProduct }>(({ product }, ref) => {
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

        if (path.startsWith('http')) {
            return path;
        }

        if (path.startsWith('/uploads/')) {
            return path;
        }

        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
        return `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    };

    return (
        <motion.div
            ref={ref}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="card-minimal p-4 flex gap-4 group"
        >
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                <img
                    src={fullImageUrl(product.main_image_url)}
                    alt={product.title}
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
                <div>
                    <h3 className="font-semibold text-base text-foreground line-clamp-1">{product.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">{product.description}</p>
                </div>

                <div className="flex justify-end mt-2">
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-xl text-xs font-bold uppercase tracking-wide hover:brightness-95 transition-all active:scale-95"
                    >
                        <Download size={14} />
                        {t('productPage.download')}
                    </button>
                </div>
            </div>
        </motion.div>
    );
});

DownloadItem.displayName = 'DownloadItem';

export default function DownloadsPage() {
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
    <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
            {products.map(product => <DownloadItem key={product.id} product={product} />)}
        </AnimatePresence>
    </div>
  );

  const EmptyState = ({ message, cta, ctaLabel }: { message: string, cta?: boolean, ctaLabel?: string }) => (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-20 px-6 bg-muted/30 rounded-3xl border border-dashed border-border"
      >
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Package size={32} className="text-muted-foreground opacity-50" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">{message}</h2>
          {cta && (
              <Link
                href="/marketplace"
                className="mt-4 inline-flex items-center gap-2 px-6 py-3 btn-primary text-sm"
              >
                  {ctaLabel}
                  <ArrowRight size={16} />
              </Link>
          )}
      </motion.div>
  );

  return (
    <div className="container mx-auto px-5 pt-14 pb-24 min-h-screen">

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t('profilePages.downloads.pageTitle')}</h1>
      </div>

      <div className="flex p-1 bg-muted rounded-2xl mb-6 relative z-20">
        <button
            onClick={() => setActiveTab('premium')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                activeTab === 'premium'
                ? 'bg-background text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
        >
           <Crown size={16} className={activeTab === 'premium' ? 'text-yellow-500' : ''} />
           {t('profilePages.downloads.premium')}
           <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'premium' ? 'bg-primary/10' : 'bg-background/50'}`}>
             {premiumProducts.length}
           </span>
        </button>
        <button
            onClick={() => setActiveTab('free')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                activeTab === 'free'
                ? 'bg-background text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          <Package size={16} />
          {t('profilePages.downloads.free')}
          <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'free' ? 'bg-primary/10' : 'bg-background/50'}`}>
             {freeProducts.length}
           </span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-60">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <div className="min-h-[300px]">
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