'use client';

import { useState, useEffect, forwardRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Download, Package, Crown, Loader
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { profileAPI } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useTheme } from '@/lib/theme';

interface DownloadableProduct {
  id: number;
  title: string;
  description: string;
  main_image_url: string;
  zip_file_path: string;
}

const DownloadItem = forwardRef<HTMLDivElement, { product: DownloadableProduct }>(
  ({ product }, ref) => {
    const { theme } = useTheme();
    const { token } = useAuthStore();
    const { t } = useTranslation();

    const handleDownload = async (e: React.MouseEvent) => {
      e.preventDefault();
      if (!product || !token) {
        toast.error(t('toasts.loginToDownload'));
        return;
      }

      try {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
        const downloadUrl = `${baseUrl}/api/v1/profile/download/${product.id}`;

        // Use fetch with Authorization header
        const response = await fetch(downloadUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Download failed');
        }

        // Get blob and create download link
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        // Extract filename from Content-Disposition header or use product title
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `${product.title}.zip`;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }

        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success(t('toasts.downloadStarted', { title: product.title }));
      } catch (error) {
        console.error('Download error:', error);
        toast.error(t('toasts.downloadError'));
      }
    };

    const fullImageUrl = (path: string) => {
      if (!path) return '/placeholder.jpg';
      if (path.startsWith('http')) return path;
      if (path.startsWith('/uploads/')) return path;
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
      return `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}${
        path.startsWith('/') ? path : `/${path}`
      }`;
    };

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="p-4 flex gap-4 group"
        style={{
          backgroundColor: theme.colors.card,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.xl,
        }}
      >
        <div
          className="w-20 h-20 flex-shrink-0 overflow-hidden"
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
          }}
        >
          <Image
            src={fullImageUrl(product.main_image_url)}
            alt={product.title}
            width={80}
            height={80}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
          <div>
            <h3
              className="font-semibold text-base line-clamp-1"
              style={{ color: theme.colors.text }}
            >
              {product.title}
            </h3>
            <p
              className="text-xs line-clamp-2 mt-1 leading-relaxed"
              style={{ color: theme.colors.textMuted }}
            >
              {product.description}
            </p>
          </div>

          <div className="flex justify-end mt-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all active:scale-95"
              style={{
                backgroundColor: theme.colors.success,
                color: '#FFF',
                borderRadius: theme.radius.xl,
              }}
            >
              <Download size={14} />
              {t('productPage.download')}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }
);

DownloadItem.displayName = 'DownloadItem';

export default function DownloadsPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState('premium');
  const [premiumProducts, setPremiumProducts] = useState<DownloadableProduct[]>([]);
  const [freeProducts, setFreeProducts] = useState<DownloadableProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDownloads = async () => {
      try {
        setLoading(true);
        const data = await profileAPI.getDownloads();
        setPremiumProducts(data.premium || []);
        setFreeProducts(data.free || []);
      } catch (error) {
        toast.error(t('profilePages.downloads.toasts.loadError'));
        console.error('Failed to fetch downloads:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDownloads();
  }, [t]);

  const ProductList = ({ products }: { products: DownloadableProduct[] }) => (
    <div className="grid grid-cols-1 gap-3">
      <AnimatePresence mode="popLayout">
        {products.map((product) => (
          <DownloadItem key={product.id} product={product} />
        ))}
      </AnimatePresence>
    </div>
  );

  const EmptyState = ({
    message,
    cta,
    ctaLabel,
  }: {
    message: string;
    cta?: boolean;
    ctaLabel?: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-16 px-6"
      style={{
        backgroundColor: theme.colors.surface,
        border: `2px dashed ${theme.colors.border}`,
        borderRadius: theme.radius['2xl'],
      }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ backgroundColor: theme.colors.card }}
      >
        <Package size={32} style={{ color: theme.colors.textMuted, opacity: 0.5 }} />
      </div>
      <h2 className="text-lg font-semibold mb-2" style={{ color: theme.colors.text }}>
        {message}
      </h2>
      {cta && (
        <button
          onClick={() => router.push('/marketplace')}
          className="mt-4 inline-flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all active:scale-95"
          style={{
            backgroundColor: theme.colors.primary,
            color: '#FFF',
            borderRadius: theme.radius.xl,
          }}
        >
          {ctaLabel}
        </button>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen" style={{ background: theme.colors.bgGradient }}>
      <div className="max-w-2xl mx-auto px-5 py-6">
        <div className="flex items-center gap-4 mb-6">
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
          <h1 className="text-xl font-bold" style={{ color: theme.colors.text }}>
            {t('profilePages.downloads.pageTitle')}
          </h1>
        </div>

        {/* Tabs */}
        <div
          className="flex p-1 mb-6 relative"
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.xl,
          }}
        >
          <button
            onClick={() => setActiveTab('premium')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-all duration-200`}
            style={{
              backgroundColor: activeTab === 'premium' ? theme.colors.card : 'transparent',
              color: activeTab === 'premium' ? theme.colors.primary : theme.colors.textMuted,
              borderRadius: theme.radius.lg,
              boxShadow: activeTab === 'premium' ? theme.shadows.sm : 'none',
            }}
          >
            <Crown size={16} className={activeTab === 'premium' ? 'text-yellow-500' : ''} />
            {t('profilePages.downloads.premium')}
            <span
              className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor:
                  activeTab === 'premium'
                    ? `${theme.colors.primary}20`
                    : `${theme.colors.surface}`,
              }}
            >
              {premiumProducts.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('free')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-all duration-200`}
            style={{
              backgroundColor: activeTab === 'free' ? theme.colors.card : 'transparent',
              color: activeTab === 'free' ? theme.colors.primary : theme.colors.textMuted,
              borderRadius: theme.radius.lg,
              boxShadow: activeTab === 'free' ? theme.shadows.sm : 'none',
            }}
          >
            <Package size={16} />
            {t('profilePages.downloads.free')}
            <span
              className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor:
                  activeTab === 'free' ? `${theme.colors.primary}20` : `${theme.colors.surface}`,
              }}
            >
              {freeProducts.length}
            </span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader className="animate-spin" size={32} style={{ color: theme.colors.primary }} />
          </div>
        ) : (
          <div className="min-h-[300px]">
            {activeTab === 'premium' &&
              (premiumProducts.length > 0 ? (
                <ProductList products={premiumProducts} />
              ) : (
                <EmptyState
                  message={t('profilePages.downloads.empty.premium')}
                  cta={true}
                  ctaLabel={t('profilePages.downloads.empty.goToMarket')}
                />
              ))}
            {activeTab === 'free' &&
              (freeProducts.length > 0 ? (
                <ProductList products={freeProducts} />
              ) : (
                <EmptyState message={t('profilePages.downloads.empty.free')} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
