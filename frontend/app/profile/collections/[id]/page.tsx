'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { profileAPI } from '@/lib/api';
import { CollectionDetail, ProductInCollection } from '@/types';
import { ArrowLeft, Loader, Download, Trash2, Package, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAccessStore } from '@/store/accessStore';
import { useAuthStore } from '@/store/authStore';
import Image from 'next/image';
import { LoadingSpinner } from '@/components/admin/Shared';

export default function CollectionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const { checkAccess, fetchAccessStatus } = useAccessStore();

  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCollectionDetails();
    }
  }, [id]);

  useEffect(() => {
    if (isAuthenticated && collection?.products && collection.products.length > 0) {
      const productIds = collection.products.map(p => p.id);
      fetchAccessStatus(productIds);
    }
  }, [collection, isAuthenticated, fetchAccessStatus]);

  const fetchCollectionDetails = async () => {
    setLoading(true);
    try {
      const data = await profileAPI.getCollectionDetails(Number(id));
      setCollection(data);
    } catch (error) {
      toast.error(t('profilePages.collections.toasts.detailsError'));
      router.push('/profile/collections');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProduct = async (productId: number) => {
    if (!collection) return;
    try {
        await profileAPI.removeProductFromCollection(collection.id, productId);
        toast.success(t('profilePages.collections.toasts.productRemoved'));
        setCollection(prev => prev ? ({
            ...prev,
            products: prev.products.filter(p => p.id !== productId),
            products_count: prev.products_count - 1
        }) : null);
    } catch (error) {
        toast.error(t('profilePages.collections.toasts.productRemoveError'));
    }
  };

  const handleDownload = (product: ProductInCollection) => {
    const token = useAuthStore.getState().token;
    const hasAccess = checkAccess(product.id) || product.product_type === 'free';

    if (hasAccess && token) {
        const url = `${process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/api/v1/profile/download/${product.id}?token=${token}`;
        window.location.href = url;
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

  if (loading) return <LoadingSpinner />;

  if (!collection) {
    return (
        <div className="flex flex-col items-center justify-center h-screen text-muted-foreground">
            <p>{t('profilePages.collections.detail.notFound')}</p>
            <button onClick={() => router.push('/profile/collections')} className="mt-4 text-primary hover:underline">
                {t('common.back')}
            </button>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-5 pt-14 pb-24 space-y-6 min-h-screen">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/profile/collections')} className="p-2 hover:bg-muted rounded-xl transition-colors">
          <ArrowLeft size={24} className="text-muted-foreground hover:text-foreground" />
        </button>
        <h1 className="text-2xl font-bold text-foreground">{collection.name}</h1>
      </div>

      {collection.products.length === 0 ? (
         <div className="text-center py-20 px-6 bg-muted/30 rounded-[24px] border border-dashed border-border">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Package size={32} className="text-muted-foreground opacity-50" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">{t('profilePages.collections.detail.empty.title')}</h2>
          <Link href="/marketplace" className="btn-primary mt-4 inline-flex items-center gap-2">
              {t('profilePages.collections.detail.empty.cta')}
              <ArrowRight size={18} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {collection.products.map(product => (
            <div key={product.id} className="card-minimal p-4 flex gap-4 group hover:border-primary/30 transition-all">
                <Link href={`/product/${product.id}`} className="relative w-20 h-20 flex-shrink-0 bg-muted rounded-xl overflow-hidden">
                    <Image
                        src={fullImageUrl(product.main_image_url)}
                        alt={product.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="80px"
                    />
                </Link>
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    <div>
                        <Link href={`/product/${product.id}`}>
                            <h3 className="font-semibold text-foreground truncate hover:text-primary transition-colors">{product.title}</h3>
                        </Link>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{product.description}</p>
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-2">
                        <button
                            onClick={() => handleDownload(product)}
                            className="p-2 bg-secondary text-secondary-foreground rounded-lg hover:brightness-95 transition-all active:scale-95"
                            title={t('productPage.download')}
                        >
                            <Download size={16} />
                        </button>
                        <button
                            onClick={() => handleRemoveProduct(product.id)}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors active:scale-95"
                            title={t('common.delete')}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}