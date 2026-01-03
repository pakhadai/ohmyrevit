'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Crown, Sparkles, ArrowRight, Gift, Download,
  Users, Package, Zap, Shield, Clock, Star, ChevronRight,
  Flame, Award, CheckCircle2, ArrowUpRight, User, Send
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { productsAPI, profileAPI, subscriptionsAPI } from '@/lib/api';
import { Product } from '@/types';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useTheme } from '@/lib/theme';
import { SUBSCRIPTION_ENABLED } from '@/lib/features';

// Stats interface
interface PlatformStats {
  totalDownloads: number;
  totalUsers: number;
  totalProducts: number;
  freeProducts: number;
}

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [products, setProducts] = useState<Product[]>([]);
  const [trendingProduct, setTrendingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [bonusInfo, setBonusInfo] = useState<any>(null);
  const [subStatus, setSubStatus] = useState<any>(null);
  const [stats, setStats] = useState<PlatformStats>({
    totalDownloads: 0,
    totalUsers: 0,
    totalProducts: 0,
    freeProducts: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all data in parallel including real platform stats
        const [newestData, popularData, bonusData, subData, platformStats] = await Promise.all([
          productsAPI.getProducts({ sort_by: 'newest', limit: 6 }),
          productsAPI.getProducts({ sort_by: 'popular', limit: 1 }),
          isAuthenticated ? profileAPI.getBonusInfo() : Promise.resolve(null),
          (isAuthenticated && SUBSCRIPTION_ENABLED) ? subscriptionsAPI.getStatus() : Promise.resolve(null),
          productsAPI.getPlatformStats()
        ]);

        setProducts(newestData.products || []);
        setTrendingProduct(popularData.products?.[0] || null);
        setBonusInfo(bonusData);
        setSubStatus(subData);

        // Set real stats from backend
        setStats({
          totalDownloads: platformStats.total_downloads || 0,
          totalUsers: platformStats.total_users || 0,
          totalProducts: platformStats.total_products || 0,
          freeProducts: platformStats.free_products || 0
        });

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated]);

  const handleClaimBonus = async () => {
    if (!bonusInfo?.can_claim_today) return;
    try {
      const res = await profileAPI.claimDailyBonus();
      if (res.success) {
        toast.success(`+${res.bonus_amount} OMR`);
        setBonusInfo({ ...bonusInfo, can_claim_today: false, balance: res.new_balance });
      }
    } catch {
      toast.error(t('bonus.toasts.claimError'));
    }
  };

  const isActive = subStatus?.has_active_subscription;

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return t('home.greeting.morning', 'Доброго ранку');
    if (hour >= 12 && hour < 18) return t('home.greeting.afternoon', 'Доброго дня');
    if (hour >= 18 && hour < 22) return t('home.greeting.evening', 'Доброго вечора');
    return t('home.greeting.night', 'Доброї ночі');
  };

  // Benefits data
  const benefits = [
    {
      icon: Zap,
      title: t('home.benefits.speed.title', 'Миттєвий доступ'),
      desc: t('home.benefits.speed.desc', 'Завантажуйте файли одразу після покупки. Без очікування.'),
      color: theme.colors.orange
    },
    {
      icon: Shield,
      title: t('home.benefits.quality.title', 'Перевірена якість'),
      desc: t('home.benefits.quality.desc', 'Кожен файл проходить модерацію. Тільки якісний контент.'),
      color: theme.colors.green
    },
    {
      icon: Clock,
      title: t('home.benefits.updates.title', 'Регулярні оновлення'),
      desc: t('home.benefits.updates.desc', 'Нові файли щотижня. Завжди актуальна бібліотека.'),
      color: theme.colors.blue
    },
    {
      icon: Users,
      title: t('home.benefits.community.title', 'Спільнота'),
      desc: t('home.benefits.community.desc', 'Приєднуйтесь до тисяч Revit-спеціалістів.'),
      color: theme.colors.purple
    }
  ];

  // Format number with K suffix
  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="min-h-screen" style={{ background: theme.colors.bgGradient }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 pt-6 sm:pt-10 pb-36">

        {/* Hero Section */}
        <section className="relative mb-10 sm:mb-16">
          {/* Decorative gradient orb */}
          <div
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})` }}
          />

          <div className="relative">
            {/* Header with greeting, avatar and wallet */}
            <header className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3 sm:gap-4">
                <Link href="/profile">
                  <div className="relative group">
                    <div
                      className="w-12 h-12 sm:w-14 sm:h-14 overflow-hidden flex items-center justify-center transition-all duration-300 group-hover:shadow-md"
                      style={{
                        backgroundColor: theme.colors.card,
                        boxShadow: theme.shadows.md,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.radius.xl,
                      }}
                    >
                      {user?.photoUrl ? (
                        <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: theme.colors.surface }}
                        >
                          <User size={22} style={{ color: theme.colors.textMuted }} />
                        </div>
                      )}
                    </div>
                    {isActive && (
                      <div
                        className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center"
                        style={{
                          backgroundColor: theme.colors.accent,
                          boxShadow: theme.shadows.sm,
                          borderRadius: theme.radius.md,
                        }}
                      >
                        <Crown size={10} color="#FFF" />
                      </div>
                    )}
                  </div>
                </Link>
                <div>
                  <p className="text-xs sm:text-sm font-medium" style={{ color: theme.colors.textMuted }}>
                    {getGreeting()}
                  </p>
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight" style={{ color: theme.colors.text }}>
                    {user?.firstName || t('home.guest', 'Гість')}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* Daily bonus button */}
                {isAuthenticated && bonusInfo?.can_claim_today && (
                  <button
                    onClick={handleClaimBonus}
                    className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 transition-all duration-300 hover:scale-105 active:scale-95"
                    style={{
                      backgroundColor: theme.colors.accent,
                      borderRadius: theme.radius.lg,
                      boxShadow: theme.shadows.md
                    }}
                  >
                    <Gift size={18} color="#FFF" />
                  </button>
                )}

                {/* Wallet balance */}
                <Link href="/profile/wallet">
                  <div
                    className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 transition-all duration-300 hover:scale-[1.02]"
                    style={{
                      backgroundColor: theme.colors.card,
                      boxShadow: theme.shadows.md,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.radius.xl,
                    }}
                  >
                    <Image src="/omr_coin.png" alt="" width={20} height={20} className="sm:w-6 sm:h-6 opacity-90" />
                    <span className="text-sm sm:text-base font-bold" style={{ color: theme.colors.text }}>
                      {user?.balance?.toLocaleString() || 0}
                    </span>
                  </div>
                </Link>
              </div>
            </header>

            {/* Main Hero */}
            <div className="text-center mb-10">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 mb-6"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radius.full,
                  border: `1px solid ${theme.colors.border}`
                }}
              >
                <Sparkles size={14} style={{ color: theme.colors.accent }} />
                <span className="text-xs font-semibold" style={{ color: theme.colors.textSecondary }}>
                  {t('home.hero.badge', 'Найбільша бібліотека для Revit')}
                </span>
              </div>

              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight"
                style={{ color: theme.colors.text }}
              >
                {t('home.hero.title', 'Професійні файли')}
                <br />
                <span style={{ color: theme.colors.primary }}>
                  {t('home.hero.titleHighlight', 'для Revit')}
                </span>
              </h1>

              <p
                className="text-base sm:text-lg max-w-md mx-auto mb-8 leading-relaxed"
                style={{ color: theme.colors.textSecondary }}
              >
                {t('home.hero.subtitle', 'Сімейства, шаблони, плагіни та скрипти. Економте години роботи з готовими рішеннями.')}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/marketplace">
                  <button
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    style={{
                      backgroundColor: theme.colors.primary,
                      borderRadius: theme.radius.xl,
                      boxShadow: theme.shadows.lg
                    }}
                  >
                    <span className="text-base font-bold text-white">
                      {t('home.hero.cta', 'Переглянути каталог')}
                    </span>
                    <ArrowRight size={18} color="#FFF" />
                  </button>
                </Link>

                {stats.freeProducts > 0 && (
                  <Link href="/marketplace?product_type=free">
                    <button
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 transition-all duration-300 hover:scale-105"
                      style={{
                        backgroundColor: theme.colors.card,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.radius.xl
                      }}
                    >
                      <Download size={18} style={{ color: theme.colors.text }} />
                      <span className="text-base font-semibold" style={{ color: theme.colors.text }}>
                        {stats.freeProducts} {t('home.hero.freeFiles', 'безкоштовних')}
                      </span>
                    </button>
                  </Link>
                )}
              </div>
            </div>

            {/* Stats Row */}
            <div
              className="grid grid-cols-3 gap-4 p-4 sm:p-6"
              style={{
                backgroundColor: theme.colors.card,
                borderRadius: theme.radius['2xl'],
                border: `1px solid ${theme.colors.border}`,
                boxShadow: theme.shadows.md
              }}
            >
              {[
                { value: formatNumber(stats.totalDownloads), label: t('home.stats.downloads', 'Завантажень'), icon: Download },
                { value: stats.totalProducts.toString(), label: t('home.stats.files', 'Файлів'), icon: Package },
                { value: formatNumber(stats.totalUsers), label: t('home.stats.users', 'Користувачів'), icon: Users }
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <stat.icon size={16} style={{ color: theme.colors.primary }} />
                    <span className="text-xl sm:text-2xl font-bold" style={{ color: theme.colors.text }}>
                      {stat.value}
                    </span>
                  </div>
                  <p className="text-xs font-medium" style={{ color: theme.colors.textMuted }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trending Product - Product of the Week */}
        {trendingProduct && (
          <section className="mb-10 sm:mb-16">
            <div className="flex items-center gap-2 mb-5">
              <div
                className="p-2"
                style={{
                  backgroundColor: `${theme.colors.orange}20`,
                  borderRadius: theme.radius.lg
                }}
              >
                <Flame size={20} style={{ color: theme.colors.orange }} />
              </div>
              <h2 className="text-lg sm:text-xl font-bold" style={{ color: theme.colors.text }}>
                {t('home.trending.title', 'Хіт тижня')}
              </h2>
              <div
                className="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase"
                style={{
                  backgroundColor: theme.colors.orange,
                  color: '#FFF',
                  borderRadius: theme.radius.full
                }}
              >
                TOP
              </div>
            </div>

            <Link href={`/product/${trendingProduct.id}`}>
              <div
                className="relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:shadow-xl group"
                style={{
                  backgroundColor: theme.colors.card,
                  borderRadius: theme.radius['2xl'],
                  border: `1px solid ${theme.colors.border}`,
                  boxShadow: theme.shadows.lg
                }}
              >
                {/* Gradient overlay */}
                <div
                  className="absolute inset-0 opacity-5"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.orange}, transparent)`
                  }}
                />

                <div className="relative flex flex-col sm:flex-row">
                  {/* Image */}
                  <div
                    className="relative w-full sm:w-2/5 aspect-video sm:aspect-square overflow-hidden"
                    style={{ backgroundColor: theme.colors.surface }}
                  >
                    <Image
                      src={trendingProduct.main_image_url}
                      alt={trendingProduct.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Badge */}
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      {trendingProduct.product_type === 'premium' && (
                        <span
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold"
                          style={{
                            backgroundColor: theme.colors.accent,
                            borderRadius: theme.radius.full
                          }}
                        >
                          <Star size={12} fill="#FFF" color="#FFF" /> PRO
                        </span>
                      )}
                      {trendingProduct.product_type === 'free' && (
                        <span
                          className="px-3 py-1.5 text-xs font-bold"
                          style={{
                            backgroundColor: theme.colors.green,
                            color: '#FFF',
                            borderRadius: theme.radius.full
                          }}
                        >
                          FREE
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6 sm:p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-3">
                      <Award size={16} style={{ color: theme.colors.orange }} />
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.colors.orange }}>
                        {t('home.trending.mostDownloaded', 'Найбільше завантажень')}
                      </span>
                    </div>

                    <h3
                      className="text-xl sm:text-2xl font-bold mb-3 line-clamp-2"
                      style={{ color: theme.colors.text }}
                    >
                      {trendingProduct.title}
                    </h3>

                    <p
                      className="text-sm mb-4 line-clamp-2 leading-relaxed"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {trendingProduct.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-5">
                      <div className="flex items-center gap-1.5">
                        <Download size={14} style={{ color: theme.colors.textMuted }} />
                        <span className="text-sm font-semibold" style={{ color: theme.colors.text }}>
                          {trendingProduct.downloads_count || 0}
                        </span>
                      </div>
                      {trendingProduct.average_rating && (
                        <div className="flex items-center gap-1.5">
                          <Star size={14} fill={theme.colors.orange} color={theme.colors.orange} />
                          <span className="text-sm font-semibold" style={{ color: theme.colors.text }}>
                            {trendingProduct.average_rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                      <span
                        className="text-xs px-2 py-1"
                        style={{
                          backgroundColor: theme.colors.surface,
                          color: theme.colors.textSecondary,
                          borderRadius: theme.radius.full
                        }}
                      >
                        {trendingProduct.file_size_mb} MB
                      </span>
                    </div>

                    {/* Price & CTA */}
                    <div className="flex items-center justify-between">
                      <div>
                        {trendingProduct.product_type === 'free' ? (
                          <span className="text-2xl font-bold" style={{ color: theme.colors.green }}>
                            {t('product.free', 'Безкоштовно')}
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Image src="/omr_coin.png" alt="OMR" width={24} height={24} />
                            <span className="text-2xl font-bold" style={{ color: theme.colors.text }}>
                              {trendingProduct.is_on_sale ? trendingProduct.sale_price : trendingProduct.price}
                            </span>
                            {trendingProduct.is_on_sale && (
                              <span className="text-lg line-through" style={{ color: theme.colors.textMuted }}>
                                {trendingProduct.price}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div
                        className="flex items-center gap-2 px-5 py-3 transition-all group-hover:translate-x-1"
                        style={{
                          backgroundColor: theme.colors.primary,
                          borderRadius: theme.radius.lg
                        }}
                      >
                        <span className="text-sm font-bold text-white">
                          {t('home.trending.viewDetails', 'Детальніше')}
                        </span>
                        <ArrowUpRight size={16} color="#FFF" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* Benefits Section */}
        <section className="mb-10 sm:mb-16">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: theme.colors.text }}>
              {t('home.benefits.title', 'Чому обирають нас')}
            </h2>
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
              {t('home.benefits.subtitle', 'Переваги для професіоналів')}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {benefits.map((benefit, i) => (
              <div
                key={i}
                className="p-5 sm:p-6 transition-all duration-300 hover:scale-[1.02]"
                style={{
                  backgroundColor: theme.colors.card,
                  borderRadius: theme.radius.xl,
                  border: `1px solid ${theme.colors.border}`,
                  boxShadow: theme.shadows.sm
                }}
              >
                <div
                  className="w-12 h-12 flex items-center justify-center mb-4"
                  style={{
                    backgroundColor: `${benefit.color}15`,
                    borderRadius: theme.radius.lg
                  }}
                >
                  <benefit.icon size={24} style={{ color: benefit.color }} />
                </div>
                <h3 className="text-sm sm:text-base font-bold mb-2" style={{ color: theme.colors.text }}>
                  {benefit.title}
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed" style={{ color: theme.colors.textSecondary }}>
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Premium Banner (if enabled) */}
        {SUBSCRIPTION_ENABLED && !isActive && (
          <section className="mb-10 sm:mb-16">
            <div
              onClick={() => router.push('/subscription')}
              className="relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.01]"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.primary})`,
                borderRadius: theme.radius['2xl'],
                boxShadow: theme.shadows.xl
              }}
            >
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                <Crown size={128} color="#FFF" strokeWidth={1} />
              </div>

              <div className="relative p-6 sm:p-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 bg-white/20 rounded-full">
                      <Crown size={14} color="#FFF" />
                      <span className="text-xs font-bold text-white uppercase tracking-wide">
                        Premium Club
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                      {t('home.premium.title', 'Отримай повний доступ')}
                    </h2>

                    <p className="text-sm sm:text-base text-white/80 max-w-md mb-4">
                      {t('home.premium.desc', 'Необмежений доступ до всіх преміум файлів, пріоритетна підтримка та ексклюзивний контент.')}
                    </p>

                    <div className="flex items-center gap-3 flex-wrap">
                      {[
                        t('home.premium.feature1', '100+ файлів'),
                        t('home.premium.feature2', 'Щотижневі оновлення'),
                        t('home.premium.feature3', 'Підтримка 24/7')
                      ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-white/90">
                          <CheckCircle2 size={14} />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-3 px-6 py-4 bg-white transition-all hover:scale-105"
                    style={{ borderRadius: theme.radius.xl }}
                  >
                    <span className="text-base font-bold" style={{ color: theme.colors.primary }}>
                      {t('home.premium.cta', 'Дізнатись більше')}
                    </span>
                    <ArrowRight size={18} style={{ color: theme.colors.primary }} />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* New Arrivals */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div
                className="p-2"
                style={{
                  backgroundColor: `${theme.colors.primary}20`,
                  borderRadius: theme.radius.lg
                }}
              >
                <Sparkles size={20} style={{ color: theme.colors.primary }} />
              </div>
              <h2 className="text-lg sm:text-xl font-bold" style={{ color: theme.colors.text }}>
                {t('home.newArrivals', 'Нові надходження')}
              </h2>
            </div>

            <Link href="/marketplace">
              <div
                className="flex items-center gap-1.5 px-4 py-2 transition-all hover:scale-105"
                style={{
                  backgroundColor: theme.colors.card,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.full
                }}
              >
                <span className="text-xs sm:text-sm font-semibold" style={{ color: theme.colors.text }}>
                  {t('home.allProducts', 'Всі файли')}
                </span>
                <ChevronRight size={16} style={{ color: theme.colors.textMuted }} />
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-5">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] animate-pulse"
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.radius.xl,
                  }}
                />
              ))
            ) : (
              products.map((product) => (
                <Link key={product.id} href={`/product/${product.id}`}>
                  <div
                    className="group overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                    style={{
                      backgroundColor: theme.colors.card,
                      boxShadow: theme.shadows.md,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.radius.xl,
                    }}
                  >
                    <div
                      className="relative aspect-square overflow-hidden"
                      style={{ backgroundColor: theme.colors.surface }}
                    >
                      <Image
                        src={product.main_image_url}
                        alt={product.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                        {product.product_type === 'free' ? (
                          <span
                            className="text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-1"
                            style={{
                              backgroundColor: theme.colors.green,
                              color: '#FFF',
                              borderRadius: theme.radius.full,
                            }}
                          >
                            FREE
                          </span>
                        ) : (
                          <span
                            className="text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 flex items-center gap-0.5"
                            style={{
                              backgroundColor: theme.colors.accent,
                              color: '#FFF',
                              borderRadius: theme.radius.full,
                            }}
                          >
                            <Star size={10} fill="currentColor" /> PRO
                          </span>
                        )}
                      </div>
                      {product.is_on_sale && (
                        <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
                          <span
                            className="text-[10px] sm:text-xs font-bold px-2 py-1"
                            style={{
                              backgroundColor: theme.colors.orange,
                              color: '#FFF',
                              borderRadius: theme.radius.full,
                            }}
                          >
                            SALE
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 sm:p-4">
                      <h4
                        className="text-sm sm:text-base font-semibold line-clamp-1 mb-2"
                        style={{ color: theme.colors.text }}
                      >
                        {product.title}
                      </h4>
                      <div className="flex items-center justify-between">
                        {product.product_type === 'free' ? (
                          <span className="text-sm font-bold" style={{ color: theme.colors.green }}>
                            {t('product.free', 'Free')}
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Image src="/omr_coin.png" alt="OMR" width={14} height={14} />
                            <span className="text-sm font-bold" style={{ color: theme.colors.text }}>
                              {product.is_on_sale ? product.sale_price : product.price}
                            </span>
                          </div>
                        )}
                        <span
                          className="text-[10px] font-medium px-2 py-0.5"
                          style={{
                            backgroundColor: theme.colors.surface,
                            color: theme.colors.textMuted,
                            borderRadius: theme.radius.full,
                          }}
                        >
                          {product.file_size_mb} MB
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Telegram Channel Banner */}
        <section>
          <a
            href="https://t.me/ohmyrevit"
            target="_blank"
            rel="noopener noreferrer"
            className="block transition-all duration-300 hover:scale-[1.01]"
          >
            <div
              className="relative overflow-hidden p-6 sm:p-8"
              style={{
                background: 'linear-gradient(135deg, #0088cc, #00a0dc)',
                borderRadius: theme.radius['2xl'],
                boxShadow: theme.shadows.lg
              }}
            >
              {/* Decorative circles */}
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10" />
              <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-white/10" />

              <div className="relative flex items-center gap-4 sm:gap-6">
                {/* Telegram Icon */}
                <div
                  className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center bg-white/20 backdrop-blur-sm"
                  style={{ borderRadius: theme.radius.xl }}
                >
                  <Send size={28} color="#FFF" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">
                      {t('home.telegram.label', 'Наш')} Telegram
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
                    {t('home.telegram.title', 'Канал OhMyRevit')}
                  </h3>
                  <p className="text-sm text-white/80 line-clamp-1">
                    {t('home.telegram.description', 'Новини, оновлення та ексклюзивний контент')}
                  </p>
                </div>

                {/* Arrow */}
                <div
                  className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/20"
                  style={{ borderRadius: theme.radius.lg }}
                >
                  <ArrowUpRight size={20} color="#FFF" />
                </div>
              </div>
            </div>
          </a>
        </section>

      </div>
    </div>
  );
}
