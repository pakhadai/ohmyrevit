// frontend/app/marketplace/page.tsx
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { productsAPI } from '@/lib/api';
import { Product } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import { Filter, Grid3x3, List, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccessStore } from '@/store/accessStore';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [filterOpen, setFilterOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

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
    // ВИКОРИСТОВУЄМО py-6, ЯК НА ГОЛОВНІЙ СТОРІНЦІ, для ідентичних відступів
    <div className="container mx-auto px-4 py-6">

      {/* Панель інструментів */}
      {/* sticky top-0 забезпечує прилипання до самого верху скрол-зони при прокручуванні */}
      <div className="flex items-center gap-2 mb-6 sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md py-3 -mx-4 px-4 transition-all border-b border-gray-100 dark:border-slate-800/50 shadow-sm">

        {/* 1. Сортування (Зліва) */}
        <div className={`relative min-w-[130px] transition-all duration-300 ${isSearchOpen ? 'hidden sm:block' : 'block'}`}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full appearance-none px-3 py-2 bg-gray-100 dark:bg-slate-800 rounded-lg border border-transparent hover:border-gray-300 dark:hover:border-slate-600 focus:border-blue-500 focus:outline-none cursor-pointer font-medium text-sm transition-all pr-8"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
        </div>

        {/* 2. Пошук (Іконка -> Інпут) */}
        <div className={`relative transition-all duration-300 ease-in-out ${isSearchOpen ? 'flex-grow' : ''}`}>
            {isSearchOpen ? (
                <div className="relative w-full animate-in fade-in zoom-in duration-200">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onBlur={() => !searchQuery && setIsSearchOpen(false)}
                        placeholder={t('search.placeholder')}
                        className="w-full pl-9 pr-9 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 border border-blue-500 focus:outline-none text-sm"
                    />
                    <button
                        onClick={() => {
                            setSearchQuery('');
                            setIsSearchOpen(false);
                        }}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full"
                    >
                        <X size={14} />
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setIsSearchOpen(true)}
                    className="p-2.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors border border-transparent"
                    title="Пошук"
                >
                    <Search size={18} />
                </button>
            )}
        </div>

        {/* 3. Фільтр (Іконка) */}
        <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`p-2.5 rounded-lg transition-colors border ${
              filterOpen
                ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                : 'bg-gray-100 text-gray-600 dark:text-gray-300 border-transparent hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700'
            }`}
            title={t('marketplace.filters')}
        >
            <Filter size={18} />
        </button>

        {/* Розділювач */}
        <div className="w-px h-6 bg-gray-200 dark:bg-slate-700 mx-1"></div>

        {/* 4. Вигляд (Іконки) */}
        <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-lg border border-transparent">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-white'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <Grid3x3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-white'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <List size={18} />
            </button>
        </div>

      </div>

      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="p-5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700">
              <p className="text-center text-gray-500">{t('marketplace.filtersComingSoon')}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center text-gray-500">
                  <Search size={48} className="mb-4 opacity-20" />
                  <p className="text-lg font-medium">Нічого не знайдено</p>
                  <p className="text-sm">Спробуйте змінити запит "{searchQuery}"</p>
              </div>
          )}
        </div>
      )}
    </div>
  );
}