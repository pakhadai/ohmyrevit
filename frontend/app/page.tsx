'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, Sparkles, ArrowRight, Gift, Send, Folder, User, Star, Check } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { productsAPI, profileAPI, subscriptionsAPI } from '@/lib/api';
import { Product } from '@/types';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useTheme } from '@/lib/theme';

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [bonusInfo, setBonusInfo] = useState<any>(null);
  const [subStatus, setSubStatus] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsData, bonusData, subData] = await Promise.all([
          productsAPI.getProducts({ sort_by: 'newest', limit: 6 }),
          isAuthenticated ? profileAPI.getBonusInfo() : Promise.resolve(null),
          isAuthenticated ? subscriptionsAPI.getStatus() : Promise.resolve(null)
        ]);
        setProducts(productsData.products || []);
        setBonusInfo(bonusData);
        setSubStatus(subData);
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

  const openTelegram = () => {
    const url = 'https://t.me/ohmyrevit';
    if ((window as any).Telegram?.WebApp) {
      (window as any).Telegram.WebApp.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return t('home.greeting.morning', 'Доброго ранку');
    if (hour >= 12 && hour < 18) return t('home.greeting.afternoon', 'Доброго дня');
    if (hour >= 18 && hour < 22) return t('home.greeting.evening', 'Доброго вечора');
    return t('home.greeting.night', 'Доброї ночі');
  };

  const isActive = subStatus?.has_active_subscription;

  return (
    <div className="min-h-screen" style={{ background: theme.colors.bgGradient }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 pt-8 sm:pt-12 pb-36">

        <header className="flex items-center justify-between mb-8 sm:mb-12">
          <div className="flex items-center gap-4 sm:gap-5">
            <Link href="/profile">
              <div className="relative group">
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 overflow-hidden flex items-center justify-center transition-all duration-300 group-hover:shadow-md"
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
                      <User size={24} style={{ color: theme.colors.textMuted }} />
                    </div>
                  )}
                </div>
                {isActive && (
                  <div
                    className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center"
                    style={{
                      backgroundColor: theme.colors.accent,
                      boxShadow: theme.shadows.md,
                      borderRadius: theme.radius.md,
                    }}
                  >
                    <Crown size={12} color="#FFF" />
                  </div>
                )}
              </div>
            </Link>
            <div>
              <p className="text-sm sm:text-base font-medium" style={{ color: theme.colors.textMuted }}>
                {getGreeting()}
              </p>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight" style={{ color: theme.colors.text }}>
                {user?.firstName || t('home.guest', 'Гість')}
              </h1>
            </div>
          </div>

          <Link href="/profile/wallet">
            <div
              className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 transition-all duration-300 hover:scale-[1.02]"
              style={{
                backgroundColor: theme.colors.card,
                boxShadow: theme.shadows.md,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.xl,
              }}
            >
              <div className="text-right">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>
                  {t('wallet.yourBalance', 'Баланс')}
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold" style={{ color: theme.colors.text }}>
                  {user?.balance?.toLocaleString() || 0}
                  <span className="text-sm sm:text-base font-medium ml-1" style={{ color: theme.colors.textSecondary }}>
                    OMR
                  </span>
                </p>
              </div>
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radius.lg,
                }}
              >
                <Image src="/omr_coin.png" alt="" width={28} height={28} className="sm:w-8 sm:h-8 opacity-90" />
              </div>
            </div>
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 mb-8 sm:mb-10">

          <div
            onClick={() => router.push('/subscription')}
            className="lg:col-span-2 cursor-pointer transition-all duration-300 hover:translate-y-[-2px]"
            style={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
              boxShadow: theme.shadows.lg,
              borderRadius: theme.radius['3xl'],
            }}
          >
            <div className="p-6 sm:p-8 lg:p-10 min-h-[200px] sm:min-h-[240px] flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div
                    className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 mb-4"
                    style={{
                      backgroundColor: theme.colors.accent,
                      borderRadius: theme.radius.full,
                    }}
                  >
                    <Crown size={14} color="#FFF" />
                    <span className="text-xs font-bold uppercase tracking-wide text-white">
                      {isActive ? t('subscription.premiumActive', 'Активний') : 'Premium Club'}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3" style={{ color: theme.colors.text }}>
                    {isActive
                      ? t('home.premium.clubTitle', 'Ваша підписка')
                      : t('subscription.premiumTitle', 'Отримай Premium')}
                  </h2>
                  <p className="text-sm sm:text-base max-w-xs leading-relaxed font-medium" style={{ color: theme.colors.textSecondary }}>
                    {isActive
                      ? t('subscription.daysRemaining', 'Залишилось') + ` ${subStatus?.subscription?.days_remaining || 0} ` + t('profilePages.bonuses.days', 'днів')
                      : t('subscription.pageSubtitle', 'Повний доступ до всього контенту та ексклюзивні можливості.')}
                  </p>
                </div>
                <div className="w-20 h-20 sm:w-32 sm:h-32 flex items-center justify-center flex-shrink-0">
                  <Crown
                    size={64}
                    className="sm:hidden"
                    style={{ color: theme.colors.accent, opacity: 0.9 }}
                    strokeWidth={1.2}
                    fill={theme.colors.surface}
                  />
                  <Crown
                    size={96}
                    className="hidden sm:block"
                    style={{ color: theme.colors.accent, opacity: 0.9 }}
                    strokeWidth={1.2}
                    fill={theme.colors.surface}
                  />
                </div>
              </div>

              {!isActive && (
                <div className="flex items-center justify-between mt-6 sm:mt-8">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {[
                      t('subscription.feature1Short', '100+ файлів'),
                      t('subscription.feature2Short', 'Оновлення'),
                      t('subscription.feature3Short', 'Підтримка')
                    ].map((text, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5"
                        style={{
                          backgroundColor: theme.colors.surface,
                          borderRadius: theme.radius.full,
                        }}
                      >
                        <Check size={12} style={{ color: theme.colors.accent }} strokeWidth={3} />
                        <span
                          className="text-[10px] sm:text-xs font-semibold hidden sm:inline"
                          style={{ color: theme.colors.accent }}
                        >
                          {text}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div
                    className="w-11 h-11 sm:w-14 sm:h-14 flex items-center justify-center transition-all hover:scale-105"
                    style={{
                      backgroundColor: theme.colors.accent,
                      borderRadius: theme.radius.lg,
                    }}
                  >
                    <ArrowRight size={20} color="#FFF" className="sm:w-6 sm:h-6" />
                  </div>
                </div>
              )}

              {isActive && (
                <div className="flex items-center gap-3 mt-6">
                  <div
                    className="flex-1 px-4 py-3"
                    style={{
                      background: theme.colors.bgGradient,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.radius.lg,
                    }}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: theme.colors.textMuted }}>
                      {t('subscription.activeUntil', 'Активний до')}
                    </p>
                    <p className="text-sm sm:text-base font-bold" style={{ color: theme.colors.text }}>
                      {subStatus?.subscription?.end_date
                        ? new Date(subStatus.subscription.end_date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })
                        : '—'}
                    </p>
                  </div>
                  <div
                    className="w-11 h-11 sm:w-14 sm:h-14 flex items-center justify-center transition-transform hover:scale-105"
                    style={{
                      backgroundColor: theme.colors.card,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.radius.lg,
                    }}
                  >
                    <ArrowRight size={20} style={{ color: theme.colors.text }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 lg:grid-cols-1 gap-3 sm:gap-4">
            {isAuthenticated && (
              <button
                onClick={handleClaimBonus}
                className="p-4 sm:p-5 text-left transition-all duration-300 hover:scale-[1.02] active:scale-95"
                style={{
                  backgroundColor: bonusInfo?.can_claim_today ? theme.colors.accent : theme.colors.card,
                  border: `1px solid ${bonusInfo?.can_claim_today ? theme.colors.accent : theme.colors.border}`,
                  boxShadow: theme.shadows.md,
                  borderRadius: theme.radius.xl,
                }}
              >
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mb-3"
                  style={{
                    backgroundColor: bonusInfo?.can_claim_today ? 'rgba(255,255,255,0.2)' : theme.colors.surface,
                    borderRadius: theme.radius.lg,
                  }}
                >
                  <Gift size={20} style={{ color: bonusInfo?.can_claim_today ? '#FFF' : theme.colors.orange }} />
                </div>
                <p
                  className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider"
                  style={{ color: bonusInfo?.can_claim_today ? '#FFF' : theme.colors.textMuted }}
                >
                  {t('bonus.dailyBonus', 'Бонус')}
                </p>
                <p className="text-sm sm:text-base font-bold" style={{ color: bonusInfo?.can_claim_today ? '#FFF' : theme.colors.text }}>
                  {bonusInfo?.can_claim_today ? t('bonus.claimButton', 'Забрати') : t('bonus.claimed', 'Готово ✓')}
                </p>
              </button>
            )}

            <Link href="/profile/collections" className="block">
              <div
                className="h-full p-4 sm:p-5 transition-all duration-300 hover:scale-[1.02]"
                style={{
                  backgroundColor: theme.colors.card,
                  boxShadow: theme.shadows.md,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.xl,
                }}
              >
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mb-3"
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.radius.lg,
                  }}
                >
                  <Folder size={20} style={{ color: theme.colors.purple }} />
                </div>
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>
                  {t('profilePages.main.menu.myLabel', 'Мої')}
                </p>
                <p className="text-sm sm:text-base font-bold" style={{ color: theme.colors.text }}>
                  {t('profilePages.main.menu.collections', 'Збережені')}
                </p>
              </div>
            </Link>

            <div
              onClick={openTelegram}
              className="p-4 sm:p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-95"
              style={{
                backgroundColor: theme.colors.card,
                boxShadow: theme.shadows.md,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.xl,
              }}
            >
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mb-3"
                style={{
                  backgroundColor: theme.colors.blueLight,
                  borderRadius: theme.radius.lg,
                }}
              >
                <Send size={20} style={{ color: theme.colors.blue }} />
              </div>
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>
                {t('home.telegram.label', 'Наш')}
              </p>
              <p className="text-sm sm:text-base font-bold" style={{ color: theme.colors.text }}>
                Telegram
              </p>
            </div>
          </div>
        </div>

        <section>
          <div className="flex items-center justify-between mb-5 sm:mb-6">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
              <Sparkles size={20} style={{ color: theme.colors.primary }} />
              {t('home.newArrivals', 'Нові надходження')}
            </h3>
            <Link href="/marketplace">
              <span
                className="text-xs sm:text-sm font-semibold px-4 py-2 transition-all hover:scale-105"
                style={{
                  backgroundColor: theme.colors.card,
                  color: theme.colors.text,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.full,
                }}
              >
                {t('home.allProducts', 'Переглянути всі')} →
              </span>
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
                    className="group overflow-hidden transition-all duration-300 hover:scale-[1.02]"
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
                            className="text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 backdrop-blur-md"
                            style={{
                              backgroundColor: 'rgba(255,255,255,0.85)',
                              color: theme.colors.textSecondary,
                              borderRadius: theme.radius.full,
                            }}
                          >
                            {t('product.free', 'FREE')}
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
                    </div>
                    <div className="p-3 sm:p-4">
                      <h4
                        className="text-sm sm:text-base font-semibold line-clamp-1 mb-1.5"
                        style={{ color: theme.colors.text }}
                      >
                        {product.title}
                      </h4>
                      <span
                        className="text-[10px] sm:text-xs font-semibold px-2 py-0.5"
                        style={{
                          backgroundColor: theme.colors.surface,
                          color: theme.colors.textSecondary,
                          borderRadius: theme.radius.full,
                        }}
                      >
                        {product.file_size_mb} MB
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

      </div>
    </div>
  );
}