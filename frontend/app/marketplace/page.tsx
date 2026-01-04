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
import { useTheme } from '@/lib/theme';

const LIMIT = 12;

export default function MarketplacePage() {
  const { theme } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterOpen, setFilterOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [autocompleteResults, setAutocompleteResults] = useState<any[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [productType, setProductType] = useState<'all' | 'premium' | 'free'>('all');
  const [onlySale, setOnlySale] = useState(false);
  const [creatorsOnly, setCreatorsOnly] = useState(false);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<number | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const { fetchAccessStatus } = useAccessStore();
  const { isAuthenticated } = useAuthStore();

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '200px',
  });

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

  const fetchProducts = useCallback(async (currentOffset: number, isReset: boolean) => {
    if (!isReset) setLoadingMore(true);
    else setLoading(true);

    try {
      const params: any = {
        sort_by: sortBy,
        limit: LIMIT,
        offset: currentOffset,
      };

      if (selectedCategory) params.category_id = selectedCategory;
      if (productType !== 'all') params.product_type = productType;
      if (onlySale) params.is_on_sale = true;
      if (creatorsOnly) params.creator_only = true;
      if (priceRange.min) params.min_price = Number(priceRange.min);
      if (priceRange.max) params.max_price = Number(priceRange.max);
      if (minRating) params.min_rating = minRating;
      if (selectedAuthor) params.author_id = selectedAuthor;
      if (searchQuery) params.search = searchQuery;

      const data = await productsAPI.getProducts(params);
      const newProducts = data.products || [];

      if (newProducts.length < LIMIT) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      setProducts(prev => isReset ? newProducts : [...prev, ...newProducts]);

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
  }, [sortBy, selectedCategory, productType, onlySale, creatorsOnly, priceRange, minRating, selectedAuthor, searchQuery, isAuthenticated, fetchAccessStatus, t]);

  const applyFilters = () => {
    setOffset(0);
    setHasMore(true);
    setProducts([]);
    fetchProducts(0, true);
  };

  const resetFilters = () => {
    setSelectedCategory(null);
    setPriceRange({ min: '', max: '' });
    setProductType('all');
    setOnlySale(false);
    setCreatorsOnly(false);
    setMinRating(null);
    setSelectedAuthor(null);
    setSearchQuery('');

    setTimeout(() => {
      setOffset(0);
      setHasMore(true);
      setProducts([]);
      fetchProducts(0, true);
    }, 0);
  };

  useEffect(() => {
    applyFilters();
  }, [sortBy]);

  useEffect(() => {
    if (inView && hasMore && !loading && !loadingMore && products.length > 0) {
      const newOffset = offset + LIMIT;
      setOffset(newOffset);
      fetchProducts(newOffset, false);
    }
  }, [inView, hasMore, loading, loadingMore, products.length]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const fetchAutocomplete = async () => {
      if (searchQuery.length >= 2) {
        try {
          const results = await productsAPI.autocompleteSearch(searchQuery);
          setAutocompleteResults(results || []);
          setShowAutocomplete(true);
        } catch (error) {
          console.error('Autocomplete error:', error);
          setAutocompleteResults([]);
        }
      } else {
        setAutocompleteResults([]);
        setShowAutocomplete(false);
      }
    };

    const debounceTimer = setTimeout(fetchAutocomplete, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const sortOptions = [
    { value: 'newest', label: t('marketplace.sort.newest') },
    { value: 'price_asc', label: t('marketplace.sort.priceAsc') },
    { value: 'price_desc', label: t('marketplace.sort.priceDesc') },
    { value: 'popular', label: t('marketplace.sort.popular') },
  ];

  const hasActiveFilters = selectedCategory || onlySale || creatorsOnly || productType !== 'all' || priceRange.min || priceRange.max || minRating || selectedAuthor;

  return (
    <div className="min-h-screen" style={{ background: theme.colors.bgGradient }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 pt-6 pb-20">

        <div
          className="flex items-center gap-3 mb-6 sticky top-20 sm:top-0 z-30 py-2 -mx-5 px-5"
          style={{
            backgroundColor: theme.colors.bg,
            borderBottom: `1px solid ${theme.colors.border}`,
          }}
        >
          <div className={`relative min-w-[140px] transition-all duration-300 ${isSearchOpen ? 'hidden sm:block w-0 opacity-0 overflow-hidden' : 'block w-auto opacity-100'}`}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full appearance-none px-3.5 py-2.5 font-medium text-sm pr-8 cursor-pointer outline-none"
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                borderRadius: theme.radius.lg,
                border: 'none',
              }}
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" style={{ color: theme.colors.textMuted }}>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          <div className={`relative transition-all duration-300 ${isSearchOpen ? 'flex-grow' : ''}`}>
            {isSearchOpen ? (
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 z-10" style={{ color: theme.colors.textMuted }} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => {
                    setTimeout(() => {
                      setShowAutocomplete(false);
                      if (!searchQuery) setIsSearchOpen(false);
                    }, 200);
                  }}
                  onFocus={() => searchQuery.length >= 2 && setShowAutocomplete(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setShowAutocomplete(false);
                      applyFilters();
                    }
                  }}
                  placeholder={t('search.placeholder')}
                  className="w-full pl-10 pr-10 py-2.5 outline-none text-sm"
                  style={{
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    borderRadius: theme.radius.lg,
                  }}
                />
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setAutocompleteResults([]);
                    setShowAutocomplete(false);
                    setIsSearchOpen(false);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 z-10"
                  style={{ color: theme.colors.textMuted }}
                >
                  <X size={16} />
                </button>

                {showAutocomplete && autocompleteResults.length > 0 && (
                  <div
                    className="absolute top-full left-0 right-0 mt-2 py-2 max-h-80 overflow-y-auto z-50"
                    style={{
                      backgroundColor: theme.colors.card,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.radius.xl,
                      boxShadow: theme.shadows.lg,
                    }}
                  >
                    {autocompleteResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => {
                          window.location.href = `/product/${result.id}`;
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-opacity-50 transition-colors text-left"
                        style={{
                          backgroundColor: 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = theme.colors.surface;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <img
                          src={result.main_image_url}
                          alt={result.title}
                          className="w-12 h-12 object-cover flex-shrink-0"
                          style={{ borderRadius: theme.radius.md }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: theme.colors.text }}>
                            {result.title}
                          </p>
                          <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                            ${result.price}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2.5 transition-colors"
                style={{
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.textMuted,
                  borderRadius: theme.radius.lg,
                }}
              >
                <Search size={20} />
              </button>
            )}
          </div>

          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="p-2.5 relative transition-colors"
            style={{
              backgroundColor: filterOpen || hasActiveFilters ? theme.colors.primaryLight : theme.colors.surface,
              color: filterOpen || hasActiveFilters ? theme.colors.primary : theme.colors.textMuted,
              borderRadius: theme.radius.lg,
            }}
          >
            <Filter size={20} />
            {hasActiveFilters && (
              <span
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                style={{
                  backgroundColor: theme.colors.primary,
                  border: `2px solid ${theme.colors.bg}`,
                }}
              />
            )}
          </button>

          <div
            className="flex p-1 gap-1"
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.lg,
            }}
          >
            <button
              onClick={() => setViewMode('grid')}
              className="p-1.5 transition-all"
              style={{
                backgroundColor: viewMode === 'grid' ? theme.colors.card : 'transparent',
                color: viewMode === 'grid' ? theme.colors.primary : theme.colors.textMuted,
                borderRadius: theme.radius.md,
                boxShadow: viewMode === 'grid' ? theme.shadows.sm : 'none',
              }}
            >
              <Grid3x3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="p-1.5 transition-all"
              style={{
                backgroundColor: viewMode === 'list' ? theme.colors.card : 'transparent',
                color: viewMode === 'list' ? theme.colors.primary : theme.colors.textMuted,
                borderRadius: theme.radius.md,
                boxShadow: viewMode === 'list' ? theme.shadows.sm : 'none',
              }}
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
              <div
                className="p-5 space-y-5"
                style={{
                  backgroundColor: theme.colors.card,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius['2xl'],
                  boxShadow: theme.shadows.sm,
                }}
              >
                <div>
                  <label
                    className="text-xs font-bold uppercase tracking-wider mb-2 block"
                    style={{ color: theme.colors.textMuted }}
                  >
                    {t('marketplace.filters.productType')}
                  </label>
                  <div
                    className="flex p-1"
                    style={{
                      backgroundColor: theme.colors.surface,
                      borderRadius: theme.radius.lg,
                    }}
                  >
                    {['all', 'premium', 'free'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setProductType(type as any)}
                        className="flex-1 py-2 text-xs font-bold uppercase transition-all"
                        style={{
                          backgroundColor: productType === type ? theme.colors.card : 'transparent',
                          color: productType === type ? theme.colors.primary : theme.colors.textMuted,
                          borderRadius: theme.radius.md,
                          boxShadow: productType === type ? theme.shadows.sm : 'none',
                        }}
                      >
                        {t(`marketplace.filters.${type}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    className="text-xs font-bold uppercase tracking-wider mb-2 block"
                    style={{ color: theme.colors.textMuted }}
                  >
                    {t('marketplace.filters.categories')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="px-3 py-1.5 text-sm transition-colors"
                      style={{
                        backgroundColor: selectedCategory === null ? theme.colors.primaryLight : theme.colors.surface,
                        color: selectedCategory === null ? theme.colors.primary : theme.colors.text,
                        borderRadius: theme.radius.md,
                      }}
                    >
                      {t('marketplace.filters.all')}
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                        className="px-3 py-1.5 text-sm transition-colors"
                        style={{
                          backgroundColor: selectedCategory === cat.id ? theme.colors.primaryLight : theme.colors.surface,
                          color: selectedCategory === cat.id ? theme.colors.primary : theme.colors.text,
                          borderRadius: theme.radius.md,
                        }}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      className="text-xs font-bold uppercase tracking-wider mb-2 block"
                      style={{ color: theme.colors.textMuted }}
                    >
                      {t('marketplace.filters.price')}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder={t('marketplace.filters.priceFrom')}
                        value={priceRange.min}
                        onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                        className="w-full px-3 py-2 text-sm outline-none"
                        style={{
                          backgroundColor: theme.colors.surface,
                          color: theme.colors.text,
                          borderRadius: theme.radius.lg,
                        }}
                      />
                      <span style={{ color: theme.colors.textMuted }}>-</span>
                      <input
                        type="number"
                        placeholder={t('marketplace.filters.priceTo')}
                        value={priceRange.max}
                        onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                        className="w-full px-3 py-2 text-sm outline-none"
                        style={{
                          backgroundColor: theme.colors.surface,
                          color: theme.colors.text,
                          borderRadius: theme.radius.lg,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-end">
                    <label
                      className="flex items-center gap-3 w-full p-3 cursor-pointer transition-colors"
                      style={{
                        backgroundColor: theme.colors.surface,
                        borderRadius: theme.radius.lg,
                      }}
                    >
                      <div
                        className="w-5 h-5 flex items-center justify-center transition-colors"
                        style={{
                          backgroundColor: onlySale ? theme.colors.primary : theme.colors.card,
                          border: onlySale ? 'none' : `1px solid ${theme.colors.border}`,
                          borderRadius: theme.radius.sm,
                          color: '#FFF',
                        }}
                      >
                        {onlySale && <Check size={14} />}
                      </div>
                      <input
                        type="checkbox"
                        checked={onlySale}
                        onChange={(e) => setOnlySale(e.target.checked)}
                        className="hidden"
                      />
                      <span className="text-sm font-medium" style={{ color: theme.colors.text }}>
                        {t('marketplace.filters.onlySale')}
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label
                    className="flex items-center gap-3 w-full p-3 cursor-pointer transition-colors"
                    style={{
                      backgroundColor: theme.colors.surface,
                      borderRadius: theme.radius.lg,
                    }}
                  >
                    <div
                      className="w-5 h-5 flex items-center justify-center transition-colors"
                      style={{
                        backgroundColor: creatorsOnly ? theme.colors.primary : theme.colors.card,
                        border: creatorsOnly ? 'none' : `1px solid ${theme.colors.border}`,
                        borderRadius: theme.radius.sm,
                        color: '#FFF',
                      }}
                    >
                      {creatorsOnly && <Check size={14} />}
                    </div>
                    <input
                      type="checkbox"
                      checked={creatorsOnly}
                      onChange={(e) => setCreatorsOnly(e.target.checked)}
                      className="hidden"
                    />
                    <span className="text-sm font-medium" style={{ color: theme.colors.text }}>
                      Тільки товари креаторів
                    </span>
                  </label>
                </div>

                <div>
                  <label
                    className="text-xs font-bold uppercase tracking-wider mb-2 block"
                    style={{ color: theme.colors.textMuted }}
                  >
                    Мінімальний рейтинг
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setMinRating(minRating === rating ? null : rating)}
                        className="flex-1 py-2 text-sm font-medium transition-all"
                        style={{
                          backgroundColor: minRating === rating ? theme.colors.primaryLight : theme.colors.surface,
                          color: minRating === rating ? theme.colors.primary : theme.colors.text,
                          borderRadius: theme.radius.md,
                        }}
                      >
                        ⭐ {rating}+
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className="flex gap-3 pt-4"
                  style={{ borderTop: `1px solid ${theme.colors.border}` }}
                >
                  <button
                    onClick={resetFilters}
                    className="flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                    style={{
                      color: theme.colors.textMuted,
                      borderRadius: theme.radius.lg,
                    }}
                  >
                    <RotateCcw size={16} />
                    {t('marketplace.filters.reset')}
                  </button>
                  <button
                    onClick={applyFilters}
                    className="flex-[2] py-3 text-sm font-bold"
                    style={{
                      backgroundColor: theme.colors.primary,
                      color: '#FFF',
                      borderRadius: theme.radius.lg,
                    }}
                  >
                    {t('marketplace.filters.apply')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`grid gap-4 ${
          viewMode === 'grid'
            ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
            : 'grid-cols-1'
        }`}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}

          {loading && [...Array(4)].map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="animate-pulse h-64"
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.xl,
              }}
            />
          ))}
        </div>

        {hasMore && !loading && products.length > 0 && (
          <div ref={ref} className="flex justify-center py-8">
            {loadingMore && <Loader className="animate-spin w-8 h-8" style={{ color: theme.colors.primary }} />}
          </div>
        )}

        {!hasMore && products.length > 0 && (
          <div className="text-center py-8 text-sm" style={{ color: theme.colors.textMuted }}>
            {t('marketplace.endOfList')}
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div
              className="w-16 h-16 flex items-center justify-center mb-4"
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.full,
              }}
            >
              <Search size={32} style={{ color: theme.colors.textMuted, opacity: 0.5 }} />
            </div>
            <p className="text-lg font-medium" style={{ color: theme.colors.text }}>
              {t('marketplace.empty.title')}
            </p>
            <p className="text-sm mb-4" style={{ color: theme.colors.textMuted }}>
              {t('marketplace.empty.subtitle')}
            </p>
            <button
              onClick={resetFilters}
              className="text-sm font-medium hover:underline"
              style={{ color: theme.colors.primary }}
            >
              {t('marketplace.empty.resetFilters')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}