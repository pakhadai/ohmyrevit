// frontend/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { TrendingUp, Sparkles, ArrowRight, Check, Crown, Star, Send, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import DailyBonus from '@/components/home/DailyBonus';
import { useAuthStore } from '@/store/authStore';
import { productsAPI } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import { useTranslation } from 'react-i18next';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [newProducts, setNewProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

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

  const openTelegramChannel = () => {
    const url = 'https://t.me/ohmyrevit';
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.openTelegramLink(url);
    } else {
        window.open(url, '_blank');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 pb-28">

      {/* 1. Привітання */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-5 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between relative overflow-hidden"
      >
         <div className="relative z-10 pr-4">
            <h1 className="text-lg font-bold text-slate-800 dark:text-white mb-0.5">
              {t('home.welcome')}{user ? `, ${user.first_name}` : ''} 👋
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t('home.heroSubtitle')}
            </p>
         </div>

         <div className="relative z-10 flex-shrink-0">
            <div className="w-10 h-10 rounded-full p-0.5 bg-slate-100 dark:bg-slate-600">
                <img
                    src={user?.photo_url || `https://avatar.vercel.sh/${user?.username || 'user'}.png`}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                />
            </div>
         </div>
      </motion.div>

      {/* 2. Hero Section: Premium */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-800 dark:to-black rounded-3xl p-6 mb-8 text-white shadow-xl shadow-slate-400/20"
      >
        {/* Фон */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>

        <div className="relative z-10">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-full mb-2">
                        <Crown size={12} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Premium</span>
                    </div>
                    <h2 className="text-2xl font-bold leading-tight">
                        {t('subscription.premiumTitle')}
                    </h2>
                </div>
                <Star className="text-white/10 w-12 h-12 rotate-12" strokeWidth={1} />
            </div>

            <p className="text-slate-300 mb-6 text-sm leading-relaxed max-w-xs">
                {t('subscription.pageSubtitle')}
            </p>

            <div className="space-y-2.5 mb-6">
                <div className="flex items-start gap-3">
                    <Check size={16} className="text-green-400 mt-0.5 flex-shrink-0" strokeWidth={3} />
                    <span className="text-sm font-medium text-slate-100" dangerouslySetInnerHTML={{ __html: t('subscription.feature1') }} />
                </div>
                <div className="flex items-start gap-3">
                    <Check size={16} className="text-green-400 mt-0.5 flex-shrink-0" strokeWidth={3} />
                    <span className="text-sm font-medium text-slate-100" dangerouslySetInnerHTML={{ __html: t('subscription.feature2') }} />
                </div>
            </div>

            <button
                onClick={() => router.push('/subscription')}
                className="w-full bg-white text-slate-900 px-4 py-3.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
            >
                <span>{t('subscription.checkoutButton')}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span>$5 / міс</span>
            </button>
        </div>
      </motion.div>

      {/* 3. РЕКЛАМНИЙ БЛОК (Telegram Channel) - ОНОВЛЕНО ДИЗАЙН */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onClick={openTelegramChannel}
        className="mb-8 cursor-pointer group"
      >
        {/* Змінено на білий фон з синіми акцентами */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-blue-100 dark:border-blue-900/30 p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                    {/* Іконка в синьому кружечку */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-xl text-[#229ED9]">
                        <Send size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-slate-800 dark:text-white">Канал OhMyRevit</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Новини та оновлення</p>
                    </div>
                </div>
                <div className="text-slate-300 group-hover:text-[#229ED9] transition-colors">
                    <ExternalLink size={18} />
                </div>
            </div>
        </div>
      </motion.div>

      {/* 4. Віджет бонусів */}
      {isAuthenticated && (
        <div className="mb-8">
             <DailyBonus />
        </div>
      )}

      {/* 5. Новинки */}
      <div className="mb-4 flex items-center justify-between px-1">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-white">
            <div className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-md text-blue-600 dark:text-blue-400">
                <Sparkles size={14} />
            </div>
            {t('home.newArrivals')}
          </h2>
          <Link href="/marketplace" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1">
            {t('home.allProducts')}
            <ArrowRight size={12} />
          </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse h-48" />
          ))}
        </div>
      ) : newProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {newProducts.slice(0, 8).map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center text-slate-400 py-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          {t('home.loadingProducts')}
        </div>
      )}
    </div>
  );
}