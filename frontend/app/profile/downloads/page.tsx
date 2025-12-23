'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Download, Search, Loader, Package, Calendar, FileArchive
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { profileAPI } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useTheme } from '@/lib/theme';

interface PurchasedProduct {
  id: number;
  title: string;
  main_image_url: string;
  file_size_mb: number;
  purchased_at: string;
}

export default function DownloadsPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const { token } = useAuthStore();
  const { t } = useTranslation();

  const [products, setProducts] = useState<PurchasedProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<PurchasedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    fetchPurchases();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      setFilteredProducts(
        products.filter(p =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const fetchPurchases = async () => {
    try {
      const data = await profileAPI.getPurchasedProducts();
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error('Failed to fetch purchases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (product: PurchasedProduct) => {
    if (!token) {
      toast.error(t('toasts.loginToDownload'));
      return;
    }
    setDownloadingId(product.id);
    const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/profile/download/${product.id}?token=${token}`;
    window.location.href = url;
    toast.success(t('toasts.downloadStarted', { title: product.title }));
    setTimeout(() => setDownloadingId(null), 2000);
  };

  const fullImageUrl = (path: string) => {
    if (!path) return '/placeholder.jpg';
    if (path.startsWith('http')) return path;
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${cleanBase}${path.startsWith('/') ? path : `/${path}`}`;
  };

  return (
    <div className="min-h-screen pb-28" style={{ background: theme.colors.bgGradient }}>
      <div className="max-w-2xl mx-auto px-5 pt-6">
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
            {t('downloads.title')}
          </h1>
        </div>

        <div className="relative mb-6">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2"
            style={{ color: theme.colors.textMuted }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('downloads.search')}
            className="w-full pl-11 pr-4 py-3 text-sm outline-none transition-all"
            style={{
              backgroundColor: theme.colors.card,
              color: theme.colors.text,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.xl,
            }}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="animate-spin" size={32} style={{ color: theme.colors.primary }} />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div
            className="text-center py-16"
            style={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.xl,
            }}
          >
            <Package size={48} className="mx-auto mb-4" style={{ color: theme.colors.textMuted, opacity: 0.5 }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.text }}>
              {searchQuery ? t('downloads.noResults') : t('downloads.empty')}
            </h3>
            <p className="text-sm mb-6" style={{ color: theme.colors.textMuted }}>
              {searchQuery ? t('downloads.tryDifferent') : t('downloads.emptySubtitle')}
            </p>
            {!searchQuery && (
              <button
                onClick={() => router.push('/marketplace')}
                className="px-6 py-2.5 font-medium transition-all active:scale-95"
                style={{
                  backgroundColor: theme.colors.primary,
                  color: '#FFF',
                  borderRadius: theme.radius.xl,
                }}
              >
                {t('downloads.goToMarket')}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 flex gap-4"
                  style={{
                    backgroundColor: theme.colors.card,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.radius.xl,
                    boxShadow: theme.shadows.sm,
                  }}
                >
                  <div
                    className="relative w-20 h-20 flex-shrink-0 overflow-hidden"
                    style={{ backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg }}
                  >
                    <Image
                      src={fullImageUrl(product.main_image_url)}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-1 truncate" style={{ color: theme.colors.text }}>
                      {product.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs mb-3" style={{ color: theme.colors.textMuted }}>
                      <span className="flex items-center gap-1">
                        <FileArchive size={12} />
                        {product.file_size_mb} MB
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(product.purchased_at).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDownload(product)}
                      disabled={downloadingId === product.id}
                      className="px-4 py-2 text-sm font-medium flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                      style={{
                        backgroundColor: theme.colors.success,
                        color: '#FFF',
                        borderRadius: theme.radius.lg,
                      }}
                    >
                      {downloadingId === product.id ? (
                        <Loader size={14} className="animate-spin" />
                      ) : (
                        <Download size={14} />
                      )}
                      {t('downloads.download')}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}