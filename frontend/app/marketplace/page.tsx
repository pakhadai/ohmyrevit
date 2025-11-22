'use client';

import { useState, useEffect, useMemo } from 'react';
import { productsAPI } from '@/lib/api';
import { Product } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import { Filter, Grid3x3, List, Search, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAccessStore } from '@/store/accessStore';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [filterOpen, setFilterOpen] = useState(false);

  // Стан для пошуку
  const [searchQuery, setSearchQuery] = useState('');

  const { t } = useTranslation();

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

  // Логіка фільтрації на клієнті (пошук)
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const lowerQuery = searchQuery.toLowerCase();
    return products.filter(p =>
      p.title.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery)
    );
  }, [products, searchQuery]);

  const sortOptions = [
    { value: 'newest', label: t('marketplace.sort.newest') },
    { value: 'price_asc', label: t('marketplace.sort.priceAsc') },
    { value: 'price_desc', label: t('marketplace.sort.priceDesc') },
    { value: 'popular', label: t('marketplace.sort.popular') },
  ];

  return (
    <div className="container mx-auto px-4 py-2">
      {/* Заголовок та Пошук */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">{t('nav.market')}</h1>

        {/* Рядок пошуку */}
        <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              className="w-full pl-10 pr-10 py-3 rounded-xl bg-gray-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            {searchQuery && (
                <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                    <X size={18} />
                </button>
            )}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-800 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700"
          >
            <Filter className="w-4 h-4" />
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
          {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
          ) : (
              <div className="col-span-full text-center py-10 text-gray-500">
                  Нічого не знайдено за запитом "{searchQuery}"
              </div>
          )}
        </div>
      )}
    </div>
  );
}