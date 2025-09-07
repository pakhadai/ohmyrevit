// ЗАМІНА БЕЗ ВИДАЛЕНЬ: старі рядки — закоментовано, нові — додано нижче
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { profileAPI } from '@/lib/api';
import { CollectionDetail, ProductInCollection } from '@/types';
import { ArrowLeft, Loader, Download, Trash2, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useTranslation } from 'react-i18next'; // ДОДАНО

export default function CollectionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { t } = useTranslation(); // ДОДАНО

  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCollectionDetails();
    }
  }, [id]);

  const fetchCollectionDetails = async () => {
    setLoading(true);
    try {
      const data = await profileAPI.getCollectionDetails(Number(id));
      setCollection(data);
    } catch (error) {
      // OLD: toast.error('Не вдалося завантажити деталі колекції.');
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
        // OLD: toast.success('Товар видалено з колекції');
        toast.success(t('profilePages.collections.toasts.productRemoved'));
        // Оновлюємо список товарів локально
        setCollection(prev => prev ? ({
            ...prev,
            products: prev.products.filter(p => p.id !== productId),
            products_count: prev.products_count - 1
        }) : null);
    } catch (error) {
        // OLD: toast.error('Помилка видалення товару з колекції.');
        toast.error(t('profilePages.collections.toasts.productRemoveError'));
    }
  };

  const handleDownload = (product: ProductInCollection) => {
    console.log("Download:", product.title);
    // OLD: toast.success(`Завантаження ${product.title} почнеться...`);
    toast.success(t('toasts.downloadStarting', { title: product.title }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-60">
        <Loader className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (!collection) {
    // OLD: return <div>Колекцію не знайдено.</div>;
    return <div>{t('profilePages.collections.detail.notFound')}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.push('/profile/collections')} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">{collection.name}</h1>
      </div>

      {collection.products.length === 0 ? (
         <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Package size={48} className="mx-auto mb-4 opacity-50" />
          {/* OLD: <h2 className="text-xl font-semibold mb-2">Ця колекція порожня</h2> */}
          <h2 className="text-xl font-semibold mb-2">{t('profilePages.collections.detail.empty.title')}</h2>
          <Link href="/marketplace" className="mt-2 inline-block px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              {/* OLD: Додати товари */}
              {t('profilePages.collections.detail.empty.cta')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {collection.products.map(product => (
            <div key={product.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg flex items-center gap-4 shadow-sm">
                <Link href={`/product/${product.id}`}>
                    <img src={product.main_image_url} alt={product.title} className="w-20 h-20 object-cover rounded-md flex-shrink-0" />
                </Link>
                <div className="flex-1 min-w-0">
                    <Link href={`/product/${product.id}`}>
                        <h3 className="font-semibold truncate hover:text-purple-500">{product.title}</h3>
                    </Link>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => handleDownload(product)} className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"><Download size={18} /></button>
                    <button onClick={() => handleRemoveProduct(product.id)} className="p-2 bg-red-500 text-white rounded hover:bg-red-600"><Trash2 size={18} /></button>
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}