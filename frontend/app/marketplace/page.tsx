'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { productsAPI } from '@/lib/api';
import { Product, Category } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import { Filter, Grid3x3, List, Search, X, Loader, Check, RotateCcw } from 'lucide-react';
import { useAccessStore } from '@/store/accessStore';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import { useInView } from 'react-intersection-observer';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const LIMIT = 12;

export default function MarketplacePage() {
  // --- Основний стан ---
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  // --- Стан UI ---
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterOpen, setFilterOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // --- Стан фільтрів та сортування ---
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');

  // Значення фільтрів
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [productType, setProductType] = useState<'all' | 'premium' | 'free'>('all');
  const [onlySale, setOnlySale] = useState(false);

  // --- Хуки ---
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const { fetchAccessStatus } = useAccessStore();
  const { isAuthenticated } = useAuthStore();

  // Хук для нескінченного скролу
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '200px',
  });

  // 1. Завантаження категорій при старті
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await productsAPI.getCategories();
        setCategories(data || []);
      } catch (error) {
        console.error('Failed to load categories', error);
      }
    };
    loadCategories();
  }, []);

  // 2. Основна функція завантаження товарів
  const fetchProducts = useCallback(async (currentOffset: number, isReset: boolean) => {
    if (!isReset) setLoadingMore(true);
    else setLoading(true);

    try {
      // Параметри запиту
      const params: any = {
        sort_by: sortBy,
        limit: LIMIT,
        offset: currentOffset,
      };

      // Додаємо фільтри
      if (selectedCategory) params.category_id = selectedCategory;
      if (productType !== 'all') params.product_type = productType;
      if (onlySale) params.is_on_sale = true;
      if (priceRange.min) params.min_price = Number(priceRange.min);
      if (priceRange.max) params.max_price = Number(priceRange.max);

      const data = await productsAPI.getProducts(params);
      const newProducts = data.products || [];

      if (newProducts.length < LIMIT) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      setProducts(prev => isReset ? newProducts : [...prev, ...newProducts]);

      // Перевірка доступу для нових товарів
      if (isAuthenticated && newProducts.length > 0) {
        const productIds = newProducts.map((p: Product) => p.id);
        fetchAccessStatus(productIds);
      }

    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error(t('toasts.productLoadError'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [sortBy, selectedCategory, productType, onlySale, priceRange, isAuthenticated, fetchAccessStatus, t]);

  // 3. Функція застосування фільтрів
  const applyFilters = () => {
    setOffset(0);
    setHasMore(true);
    setProducts([]);
    fetchProducts(0, true);
  };

  // Скидання всіх фільтрів
  const resetFilters = () => {
    setSelectedCategory(null);
    setPriceRange({ min: '', max: '' });
    setProductType('all');
    setOnlySale(false);

    setTimeout(() => {
        setOffset(0);
        setHasMore(true);
        setProducts([]);
        fetchProducts(0, true);
    }, 0);
  };

  // Перезавантаження при зміні сортування
  useEffect(() => {
    applyFilters();
  }, [sortBy]);

  // Нескінченний скрол
  useEffect(() => {
    if (inView && hasMore && !loading && !loadingMore && products.length > 0) {
      const newOffset = offset + LIMIT;
      setOffset(newOffset);
      fetchProducts(newOffset, false);
    }
  }, [inView, hasMore, loading, loadingMore, products.length]);

  // Фокус на пошук
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Клієнтський пошук
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
    <div className="container mx-auto px-5 pt-12 pb-20 min-h-screen">

      {/* --- Панель інструментів (Sticky) --- */}
      <div className="flex items-center gap-3 mb-6 sticky top-0 z-30 bg-background/95 backdrop-blur-sm py-3 -mx-5 px-5 border-b border-border/50 shadow-sm transition-all">

        {/* Сортування */}
        <div className={`relative min-w-[140px] transition-all duration-300 ${isSearchOpen ? 'hidden sm:block w-0 opacity-0 overflow-hidden' : 'block w-auto opacity-100'}`}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full appearance-none px-3.5 py-2.5 bg-muted text-foreground rounded-xl border-none focus:ring-2 focus:ring-primary/20 font-medium text-sm pr-8 cursor-pointer outline-none"
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

        {/* Пошук */}
        <div className={`relative transition-all duration-300 ${isSearchOpen ? 'flex-grow' : ''}`}>
            {isSearchOpen ? (
                <div className="relative w-full">
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

        {/* Кнопка Фільтрів */}
        <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`p-2.5 rounded-xl transition-colors border relative ${
              filterOpen || selectedCategory || onlySale || productType !== 'all' || priceRange.min || priceRange.max
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/80 hover:text-foreground'
            }`}
        >
            <Filter size={20} />
            {(selectedCategory || onlySale || productType !== 'all' || priceRange.min || priceRange.max) && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background"></span>
            )}
        </button>

        {/* Вигляд */}
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

      {/* --- Панель фільтрів --- */}
      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="p-5 bg-card rounded-2xl border border-border/50 shadow-sm space-y-5">

              {/* Тип продукту */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">{t('marketplace.filters.productType')}</label>
                <div className="flex p-1 bg-muted rounded-xl">
                    {['all', 'premium', 'free'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setProductType(type as any)}
                            className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                                productType === type
                                ? 'bg-background text-primary shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {t(`marketplace.filters.${type}`)}
                        </button>
                    ))}
                </div>
              </div>

              {/* Категорії (Динамічні) */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">{t('marketplace.filters.categories')}</label>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                            selectedCategory === null
                            ? 'bg-primary/10 border-primary/20 text-primary font-medium'
                            : 'bg-muted/30 border-transparent text-foreground hover:bg-muted'
                        }`}
                    >
                        {t('marketplace.filters.all')}
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                                selectedCategory === cat.id
                                ? 'bg-primary/10 border-primary/20 text-primary font-medium'
                                : 'bg-muted/30 border-transparent text-foreground hover:bg-muted'
                            }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
              </div>

              {/* Ціна та Знижки */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">{t('marketplace.filters.price')}</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            placeholder={t('marketplace.filters.priceFrom')}
                            value={priceRange.min}
                            onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                            className="w-full px-3 py-2 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <span className="text-muted-foreground">-</span>
                        <input
                            type="number"
                            placeholder={t('marketplace.filters.priceTo')}
                            value={priceRange.max}
                            onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                            className="w-full px-3 py-2 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center gap-3 w-full p-3 bg-muted/30 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${onlySale ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30 bg-background'}`}>
                            {onlySale && <Check size={14} />}
                        </div>
                        <input
                            type="checkbox"
                            checked={onlySale}
                            onChange={(e) => setOnlySale(e.target.checked)}
                            className="hidden"
                        />
                        <span className="text-sm font-medium">{t('marketplace.filters.onlySale')}</span>
                    </label>
                  </div>
              </div>

              {/* Дії */}
              <div className="flex gap-3 pt-2 border-t border-border/50">
                  <button
                    onClick={resetFilters}
                    className="flex-1 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={16} />
                    {t('marketplace.filters.reset')}
                  </button>
                  <button
                    onClick={applyFilters}
                    className="flex-[2] btn-primary py-3 text-sm font-bold"
                  >
                    {t('marketplace.filters.apply')}
                  </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Список товарів --- */}
      <div className={`grid gap-4 ${
        viewMode === 'grid'
          ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
          : 'grid-cols-1'
      }`}>
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}

        {loading && [...Array(4)].map((_, i) => (
           <div key={`skeleton-${i}`} className="bg-muted rounded-2xl animate-pulse h-64" />
        ))}
      </div>

      {/* Елемент для відстеження скролу */}
      {hasMore && !loading && products.length > 0 && (
        <div ref={ref} className="flex justify-center py-8">
           {loadingMore && <Loader className="animate-spin text-primary w-8 h-8" />}
        </div>
      )}

      {!hasMore && products.length > 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          {t('marketplace.endOfList')}
        </div>
      )}

      {!loading && filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Search size={32} className="opacity-50" />
              </div>
              <p className="text-lg font-medium text-foreground">{t('marketplace.empty.title')}</p>
              <p className="text-sm mb-4">{t('marketplace.empty.subtitle')}</p>
              <button onClick={resetFilters} className="text-primary text-sm font-medium hover:underline">
                  {t('marketplace.empty.resetFilters')}
              </button>
          </div>
      )}
    </div>
  );
}