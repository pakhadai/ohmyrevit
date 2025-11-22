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
    // ОНОВЛЕНО: Відступи як на головній (pt-14 pb-24) та px-5 для єдиного стилю
    <div className="container mx-auto px-5 pt-12 pb-20 min-h-screen">

      {/* Панель інструментів */}
      <div className="flex items-center gap-3 mb-6 sticky top-0 z-30 bg-background/95 backdrop-blur-xl py-3 -mx-5 px-5 transition-all border-b border-border shadow-sm">

        {/* 1. Сортування */}
        <div className={`relative min-w-[140px] transition-all duration-300 ${isSearchOpen ? 'hidden sm:block' : 'block'}`}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full appearance-none px-3.5 py-2.5 bg-muted text-foreground rounded-xl border-none focus:ring-2 focus:ring-primary/20 font-medium text-sm transition-all pr-8 cursor-pointer outline-none"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-muted-foreground">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
        </div>

        {/* 2. Пошук */}
        <div className={`relative transition-all duration-300 ease-in-out ${isSearchOpen ? 'flex-grow' : ''}`}>
            {isSearchOpen ? (
                <div className="relative w-full animate-in fade-in zoom-in duration-200">
                    <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onBlur={() => !searchQuery && setIsSearchOpen(false)}
                        placeholder={t('search.placeholder')}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-muted text-foreground border-none focus:ring-2 focus:ring-primary/20 outline-none text-sm placeholder:text-muted-foreground/70"
                    />
                    <button
                        onClick={() => {
                            setSearchQuery('');
                            setIsSearchOpen(false);
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground bg-transparent rounded-full"
                    >
                        <X size={16} />
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setIsSearchOpen(true)}
                    className="p-2.5 rounded-xl bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                >
                    <Search size={20} />
                </button>
            )}
        </div>

        {/* 3. Фільтр */}
        <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`p-2.5 rounded-xl transition-colors border ${
              filterOpen
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/80 hover:text-foreground'
            }`}
        >
            <Filter size={20} />
        </button>

        {/* 4. Вигляд (Сітка/Список) */}
        <div className="flex p-1 bg-muted rounded-xl border border-transparent">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-background shadow-sm text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Grid3x3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-background shadow-sm text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List size={18} />
            </button>
        </div>

      </div>

      {/* Панель фільтрів (заглушка) */}
      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="p-5 bg-card rounded-2xl border border-border/50 shadow-sm">
              <p className="text-center text-muted-foreground text-sm">{t('marketplace.filtersComingSoon')}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-muted rounded-2xl animate-pulse h-64" />
          ))}
        </div>
      ) : (
        <div className={`grid gap-4 ${
          viewMode === 'grid'
            ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
            : 'grid-cols-1'
        }`}>
          {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
          ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Search size={32} className="opacity-50" />
                  </div>
                  <p className="text-lg font-medium text-foreground">Нічого не знайдено</p>
                  <p className="text-sm">Спробуйте змінити запит "{searchQuery}"</p>
              </div>
          )}
        </div>
      )}
    </div>
  );
}