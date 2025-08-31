'use client';

import { useState, useEffect } from 'react';
import { productsAPI } from '@/lib/api';
import { Product } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import { Filter, Grid3x3, List, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [sortBy]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productsAPI.getProducts({ sort: sortBy });
      setProducts(data.items);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortOptions = [
    { value: 'newest', label: 'Найновіші' },
    { value: 'price_asc', label: 'Ціна: від низької' },
    { value: 'price_desc', label: 'Ціна: від високої' },
    { value: 'popular', label: 'Популярні' },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Заголовок та фільтри */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Маркетплейс</h1>

        {/* Панель фільтрів */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-800 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700"
          >
            <Filter className="w-4 h-4" />
            <span>Фільтри</span>
          </button>

          <div className="flex items-center gap-3">
            {/* Сортування */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-gray-100 dark:bg-slate-800 rounded-lg focus:outline-none"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Перемикач виду */}
            <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700' : ''}`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white dark:bg-slate-700' : ''}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Панель фільтрів (розгортається) */}
        {filterOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Категорія</label>
                <select className="w-full px-3 py-2 bg-white dark:bg-slate-700 rounded-lg">
                  <option>Всі категорії</option>
                  <option>Меблі</option>
                  <option>Освітлення</option>
                  <option>Декор</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Тип</label>
                <select className="w-full px-3 py-2 bg-white dark:bg-slate-700 rounded-lg">
                  <option>Всі типи</option>
                  <option>Безкоштовні</option>
                  <option>Преміум</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Ціна до</label>
                <input
                  type="number"
                  placeholder="100"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Сумісність</label>
                <select className="w-full px-3 py-2 bg-white dark:bg-slate-700 rounded-lg">
                  <option>Всі версії</option>
                  <option>Revit 2024</option>
                  <option>Revit 2023</option>
                  <option>Revit 2022</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Сітка товарів */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-slate-800 rounded-2xl animate-pulse h-80" />
          ))}
        </div>
      ) : (
        <div className={`grid gap-4 ${
          viewMode === 'grid'
            ? 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5'
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