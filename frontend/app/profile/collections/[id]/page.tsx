'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Trash2, Loader, Package } from 'lucide-react';
import { useCollectionStore } from '@/store/collectionStore';
import { useTranslation } from 'react-i18next';
import ProductCard from '@/components/product/ProductCard';
import { useTheme } from '@/lib/theme';

export default function CollectionDetailPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const { collections, fetchCollections, isLoading } = useCollectionStore();

  const collectionId = Number(params.id);
  const collection = collections.find(c => c.id === collectionId);

  useEffect(() => {
    if (collections.length === 0) {
      fetchCollections();
    }
  }, [collections.length, fetchCollections]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: theme.colors.bgGradient }}>
        <Loader className="animate-spin" size={32} style={{ color: theme.colors.primary }} />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5" style={{ background: theme.colors.bgGradient }}>
        <Package size={48} className="mb-4" style={{ color: theme.colors.textMuted, opacity: 0.5 }} />
        <h2 className="text-xl font-bold mb-2" style={{ color: theme.colors.text }}>
          {t('collections.notFound')}
        </h2>
        <button
          onClick={() => router.push('/profile/collections')}
          className="mt-4 px-6 py-2.5 font-medium"
          style={{
            backgroundColor: theme.colors.primary,
            color: '#FFF',
            borderRadius: theme.radius.xl,
          }}
        >
          {t('common.back')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-2" style={{ background: theme.colors.bgGradient }}>
      <div className="max-w-4xl mx-auto px-5 pt-6">
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
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate" style={{ color: theme.colors.text }}>
              {collection.name}
            </h1>
            <p className="text-sm" style={{ color: theme.colors.textMuted }}>
              {collection.products?.length || 0} {t('collections.items')}
            </p>
          </div>
        </div>

        {!collection.products || collection.products.length === 0 ? (
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
              {t('collections.emptyCollection')}
            </h3>
            <p className="text-sm mb-6" style={{ color: theme.colors.textMuted }}>
              {t('collections.addProducts')}
            </p>
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
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {collection.products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}