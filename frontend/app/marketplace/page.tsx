// ЗАМІНА БЕЗ ВИДАЛЕНЬ: старі рядки — закоментовано, нові — додано нижче
'use client';

import { useState, useEffect } from 'react';
import { productsAPI } from '@/lib/api';
import { Product } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import { Filter, Grid3x3, List } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAccessStore } from '@/store/accessStore';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next'; // ДОДАНО

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [filterOpen, setFilterOpen] = useState(false);
  const { t } = useTranslation(); // ДОДАНО

  const { fetchAccessStatus } = useAccessStore();
  const { isAuthenticated } = useAuthStore();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productsAPI.getProducts({ sort: sortBy, limit: 50 });
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [sortBy]);

  useEffect(() => {
    if (isAuthenticated && products.length > 0) {
      const productIds = products.map(p => p.id);
      fetchAccessStatus(productIds);
    }
  }, [products, isAuthenticated, fetchAccessStatus]);

  const sortOptions = [
    // OLD: { value: 'newest', label: 'Найновіші' },
    // OLD: { value: 'price_asc', label: 'Ціна: від низької' },
    // OLD: { value: 'price_desc', label: 'Ціна: від високої' },
    // OLD: { value: 'popular', label: 'Популярні' },
    { value: 'newest', label: t('marketplace.sort.newest') },
    { value: 'price_asc', label: t('marketplace.sort.priceAsc') },
    { value: 'price_desc', label: t('marketplace.sort.priceDesc') },
    { value: 'popular', label: t('marketplace.sort.popular') },
  ];

  return (
    <div className="container mx-auto px-4 py-6 pt-20">
      {/* Заголовок та фільтри */}
      <div className="mb-6">
        {/* OLD: <h1 className="text-3xl font-bold mb-4">Маркетплейс</h1> */}
        <h1 className="text-3xl font-bold mb-4">{t('nav.market')}</h1>

        <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-800 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700"
          >
            <Filter className="w-4 h-4" />
            {/* OLD: <span>Фільтри</span> */}
            <span>{t('marketplace.filters')}</span>
          </button>

          <div className="w-full md:w-auto flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-grow px-3 py-2 bg-gray-100 dark:bg-slate-800 rounded-lg focus:outline-none"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow' : ''}`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow' : ''}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {filterOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: '1rem' }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg"
          >
            {/* OLD: <p className="text-center text-sm text-gray-500">Фільтри в розробці...</p> */}
            <p className="text-center text-sm text-gray-500">{t('marketplace.filtersComingSoon')}</p>
          </motion.div>
        )}
      </div>

      {/* Сітка товарів */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-slate-800 rounded-2xl animate-pulse h-80" />
          ))}
        </div>
      ) : (
        <div className={`grid gap-4 ${
          viewMode === 'grid'
            ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
            : 'grid-cols-1'
        }`}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}