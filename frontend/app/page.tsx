'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Crown, Send, ExternalLink, CheckCircle2 } from 'lucide-react';
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
    // ДОДАНО pt-14: Великий відступ зверху, щоб не перекривати кнопку "Назад" в Telegram
    <div className="container mx-auto px-5 space-y-8 pt-14 pb-20">

      {/* 1. Привітання (Відновлено) */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
         <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight leading-tight">
              {t('home.welcome')}{user ? `, ${user.first_name}` : ''} 👋
            </h1>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              {t('home.heroSubtitle')}
            </p>
         </div>
         <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 shadow-sm flex-shrink-0">
            <img
                src={user?.photo_url || `https://avatar.vercel.sh/${user?.username || 'user'}.png`}
                alt="Profile"
                className="w-full h-full object-cover"
            />
         </div>
      </motion.div>

      {/* 2. Premium Banner (Виправлено: Додано текст та корону) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        // Темний фон (#1A1A23), як ви хотіли
        className="relative overflow-hidden bg-[#1A1A23] rounded-[24px] p-6 text-white shadow-xl shadow-slate-300/20 dark:shadow-none border border-white/5"
      >
        {/* Фоновий ефект */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none"></div>

        <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full mb-3 border border-white/10">
                        <Crown size={14} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-white/90">Premium</span>
                    </div>
                    <h2 className="text-2xl font-bold leading-tight mb-2">
                        {t('subscription.premiumTitle')}
                    </h2>
                    <p className="text-sm text-gray-400">
                        {t('subscription.pageSubtitle')}
                    </p>
                </div>
                {/* Велика корона */}
                <Crown size={48} className="text-yellow-400/20 rotate-12 absolute right-0 top-2" strokeWidth={1.5} />
            </div>

            {/* Список переваг (Повернуто) */}
            <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-200" dangerouslySetInnerHTML={{ __html: t('subscription.feature1') }} />
                </li>
                <li className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-200" dangerouslySetInnerHTML={{ __html: t('subscription.feature2') }} />
                </li>
            </ul>

            <button
                onClick={() => router.push('/subscription')}
                className="w-full bg-white text-black px-4 py-3.5 rounded-xl font-bold text-sm hover:bg-gray-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg"
            >
                <span>{t('subscription.checkoutButton')}</span>
                <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                <span>$5 / міс</span>
            </button>
        </div>
      </motion.div>

      {/* 3. Сітка: Бонуси + Telegram */}
      <div className="grid grid-cols-1 gap-4">
          {isAuthenticated && <DailyBonus />}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={openTelegramChannel}
            className="card-minimal p-4 flex items-center justify-between cursor-pointer group hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[#229ED9]">
                    <Send size={24} className="ml-0.5 mt-0.5" />
                </div>
                <div>
                    <h3 className="font-bold text-base text-foreground">Канал OhMyRevit</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Новини та оновлення</p>
                </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <ExternalLink size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </motion.div>
      </div>

      {/* 4. Новинки */}
      <div>
          <div className="flex items-center justify-between mb-5 px-1">
              <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                <Sparkles size={20} className="text-primary fill-primary/20" />
                {t('home.newArrivals')}
              </h2>
              <Link href="/marketplace" className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors">
                {t('home.allProducts')}
              </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-muted rounded-[20px] animate-pulse h-56" />
              ))}
            </div>
          ) : newProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {newProducts.slice(0, 6).map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12 bg-card rounded-[24px] border border-dashed border-border">
              {t('home.loadingProducts')}
            </div>
          )}
      </div>
    </div>
  );
}