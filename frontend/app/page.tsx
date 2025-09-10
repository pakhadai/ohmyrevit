// frontend/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShoppingBag, Gift, TrendingUp, Users, Sparkles } from 'lucide-react';
import Link from 'next/link';
import DailyBonus from '@/components/home/DailyBonus';
import { useAuthStore } from '@/store/authStore';
import { productsAPI } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import { useTranslation } from 'react-i18next'; // ДОДАНО

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [newProducts, setNewProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation(); // ДОДАНО

  useEffect(() => {
    fetchNewProducts();
  }, []);

  const fetchNewProducts = async () => {
    try {
      const data = await productsAPI.getProducts({
        sort: 'newest',
        limit: 8
      });
      setNewProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // ДОДАНО: Масив для рендерингу функцій
  const features = [
    {
      icon: ShoppingBag,
      title: t('nav.market'),
      description: t('home.features.market.description'),
      color: 'from-blue-500 to-cyan-500',
      link: '/marketplace'
    },
    {
      icon: Gift,
      title: t('home.features.bonuses.title'),
      description: t('home.features.bonuses.description'),
      color: 'from-yellow-500 to-orange-500',
      link: '/profile/bonuses'
    },
    {
      icon: TrendingUp,
      title: t('subscription.premiumTitle'),
      description: t('home.features.subscription.description'),
      color: 'from-green-500 to-emerald-500',
      link: '/subscription'
    },
    {
      icon: Users,
      title: t('home.features.community.title'),
      description: t('home.features.community.description'),
      color: 'from-purple-500 to-pink-500',
      link: '/profile/referrals'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Hero секція */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-8 mb-8 text-white"
      >
        {/* OLD: <h1 className="text-4xl font-bold mb-4">Ласкаво просимо до OhMyRevit</h1> */}
        <h1 className="text-4xl font-bold mb-4">{t('home.welcome')}</h1>
        {/* OLD: <p className="text-xl mb-6 opacity-90">Найкращий маркетплейс Revit контенту</p> */}
        <p className="text-xl mb-6 opacity-90">{t('home.heroSubtitle')}</p>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 bg-white text-purple-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
        >
          <ShoppingBag size={20} />
          {/* OLD: Перейти до маркету */}
          {t('home.goToMarket')}
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Блок щоденного бонусу (2/3 ширини на десктопі) */}
        <div className="lg:col-span-2">
          {isAuthenticated && <DailyBonus />}
        </div>

        {/* Швидкі дії (1/3 ширини на десктопі) */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => router.push('/subscription')}
          >
            <div className="flex items-center justify-between">
              <div>
                {/* OLD: <h3 className="font-bold text-lg mb-1">Premium Підписка</h3> */}
                <h3 className="font-bold text-lg mb-1">{t('subscription.premiumTitle')}</h3>
                {/* OLD: <p className="text-sm opacity-90">Необмежений доступ</p> */}
                <p className="text-sm opacity-90">{t('home.subscription.subtitle')}</p>
              </div>
              <TrendingUp size={32} className="opacity-80" />
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold">$5</span>
              {/* OLD: <span className="text-sm">/місяць</span> */}
              <span className="text-sm">{t('subscription.perMonth')}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => router.push('/profile/referrals')}
          >
            <div className="flex items-center justify-between">
              <div>
                {/* OLD: <h3 className="font-bold text-lg mb-1">Реферальна програма</h3> */}
                <h3 className="font-bold text-lg mb-1">{t('home.referral.title')}</h3>
                {/* OLD: <p className="text-sm opacity-90">Запрошуй друзів</p> */}
                <p className="text-sm opacity-90">{t('home.referral.subtitle')}</p>
              </div>
              <Users size={32} className="opacity-80" />
            </div>
            <div className="mt-4">
              {/* OLD: <p className="text-sm">+100 бонусів за друга</p> */}
              <p className="text-sm">{t('home.referral.bonusInfo')}</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Функції */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {features.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="relative overflow-hidden rounded-2xl p-4 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all cursor-pointer"
              onClick={() => router.push(item.link)}
            >
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${item.color} opacity-10 rounded-full -mr-12 -mt-12`} />
              <Icon className="w-8 h-8 mb-2 text-gray-700 dark:text-gray-300" />
              <h3 className="font-semibold mb-1">{item.title}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {item.description}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Новинки */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="text-yellow-500" />
            {/* OLD: Останні новинки */}
            {t('home.newArrivals')}
          </h2>
          {/* OLD: <Link href="/marketplace" className="text-blue-500 hover:underline">Всі товари →</Link> */}
          <Link href="/marketplace" className="text-blue-500 hover:underline">{t('home.allProducts')}</Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-slate-700 rounded-xl animate-pulse h-64" />
            ))}
          </div>
        ) : newProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {newProducts.slice(0, 8).map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            {/* OLD: Товари завантажуються... */}
            {t('home.loadingProducts')}
          </div>
        )}
      </div>
    </div>
  );
}