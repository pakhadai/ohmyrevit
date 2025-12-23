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

// ПАЛІТРА "QUIET LUXURY 2025" (Warm Greige / Soft Minimal)
const THEME = {
  // Фон: Дуже м'який перехід від кольору слонової кістки до світлого "грейж" (сіро-бежевого).
  bg: 'linear-gradient(to bottom, #FDFCFA, #F5F3F0)',
  // Картки: "Порцеляновий" білий, не сліпучий, з краплею тепла.
  card: '#FFFEFD',

  // Основний акцент (для іконок, рамок): Теплий, приглушений сіро-коричневий.
  accent: '#8F8B85',

  // Світлий акцент (фони кнопок): Колір "вівсянки" або світлого піску.
  accentLight: '#F2F0EB',

  // Темний акцент (ПРЕМІУМ елементи): Глибокий колір "мокрого каменю" або "трюфеля". Виглядає дорого.
  accentDark: '#3F3D3A',

  // Основний текст: Не чорний, а глибокий теплий вугільний.
  text: '#2A2826',

  // Другорядний текст: М'який земляний сірий.
  textSecondary: '#6E6B67',

  // Приглушений текст: Світлий теплий сірий.
  textMuted: '#A6A29D',

  // Бордер: Ледь помітний теплий контур.
  border: '#EBE7E1',

  // Тінь: Ключовий елемент "дороговизни". М'яка, багатошарова, теплого відтінку.
  shadow: '0 8px 24px -4px rgba(150, 140, 130, 0.08), 0 2px 6px -2px rgba(150, 140, 130, 0.04)',
};

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { t } = useTranslation();

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
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink(url);
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
    <div className="min-h-screen" style={{ background: THEME.bg }}>
      <style jsx>{`
        @keyframes crownFloat {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-6px) rotate(3deg); }
        }
        .crown-animated {
          animation: crownFloat 4s ease-in-out infinite;
          /* Тінь для корони теж м'якша і тепліша */
          filter: drop-shadow(0 6px 12px rgba(100, 90, 80, 0.15));
        }

        /* НОВИЙ СТИЛЬ PREMIUM КАРТКИ - "QUIET LUXURY" */
        .premium-card {
          position: relative;
          background: ${THEME.card};
          /* Дуже тонкий, елегантний бордюр */
          border: 1px solid ${THEME.border};
          /* М'яка, дорога тінь */
          box-shadow: ${THEME.shadow}, inset 0 0 20px rgba(242, 240, 235, 0.5);
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        /* Ефект при наведенні - картка ніби "піднімається" */
        .premium-card:hover {
            border-color: #DCD8D0;
            box-shadow: 0 14px 32px -6px rgba(150, 140, 130, 0.12), 0 4px 10px -2px rgba(150, 140, 130, 0.06);
            transform: translateY(-2px);
        }

        /* Спеціальний стиль для кнопки Telegram, щоб вона вписувалась в палітру */
        .telegram-btn-bg {
            background-color: #EFF5F9 !important; /* Дуже світлий приглушений синій */
        }
        .telegram-icon-color {
            color: #648BB0 !important; /* Приглушений синьо-сірий */
        }
      `}</style>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 pt-8 sm:pt-12 pb-36">

        <header className="flex items-center justify-between mb-8 sm:mb-12">
          <div className="flex items-center gap-4 sm:gap-5">
            <Link href="/profile">
              <div className="relative group">
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-300 group-hover:shadow-md"
                  style={{ backgroundColor: THEME.card, boxShadow: THEME.shadow, border: `1px solid ${THEME.border}` }}
                >
                  {user?.photoUrl ? (
                    <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: THEME.accentLight }}>
                      <User size={24} style={{ color: THEME.accent }} />
                    </div>
                  )}
                </div>
                {isActive && (
                  <div
                    className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: THEME.accentDark, boxShadow: THEME.shadow }}
                  >
                    <Crown size={12} color="#FFF" />
                  </div>
                )}
              </div>
            </Link>
            <div>
              <p className="text-sm sm:text-base font-medium" style={{ color: THEME.textMuted }}>
                {getGreeting()}
              </p>
              <h1
                className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight"
                style={{ color: THEME.text }}
              >
                {user?.firstName || t('home.guest', 'Гість')}
              </h1>
            </div>
          </div>

          <Link href="/profile/wallet">
            <div
              className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 rounded-2xl sm:rounded-3xl transition-all duration-300 hover:scale-[1.02] hover:shadow-md border"
              style={{ backgroundColor: THEME.card, boxShadow: THEME.shadow, borderColor: THEME.border }}
            >
              <div className="text-right">
                <p
                  className="text-[10px] sm:text-xs font-bold uppercase tracking-wider"
                  style={{ color: THEME.textMuted }}
                >
                  {t('wallet.yourBalance', 'Баланс')}
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold" style={{ color: THEME.text }}>
                  {user?.balance?.toLocaleString() || 0}
                  <span className="text-sm sm:text-base font-medium ml-1" style={{ color: THEME.textSecondary }}>
                    OMR
                  </span>
                </p>
              </div>
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: THEME.accentLight }}
              >
                <Image src="/omr_coin.png" alt="" width={28} height={28} className="sm:w-8 sm:h-8 opacity-90" />
              </div>
            </div>
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 mb-8 sm:mb-10">

          {/* PREMIUM CARD */}
          <div
            onClick={() => router.push('/subscription')}
            className="lg:col-span-2 premium-card rounded-3xl sm:rounded-[32px] cursor-pointer"
          >
            <div className="p-6 sm:p-8 lg:p-10 min-h-[200px] sm:min-h-[240px] flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div
                    className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 transition-transform group-hover:scale-105"
                    // Використовуємо найтемніший акцент для максимального преміум-відчуття
                    style={{ backgroundColor: THEME.accentDark }}
                  >
                    <Crown size={14} style={{ color: '#FFF' }} />
                    <span
                      className="text-xs font-bold uppercase tracking-wide"
                      style={{ color: '#FFF' }}
                    >
                      {isActive ? t('subscription.premiumActive', 'Активний') : 'Premium Club'}
                    </span>
                  </div>
                  <h2
                    className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3"
                    style={{ color: THEME.text }}
                  >
                    {isActive
                      ? t('home.premium.clubTitle', 'Ваша підписка')
                      : t('subscription.premiumTitle', 'Отримай Premium')}
                  </h2>
                  <p className="text-sm sm:text-base max-w-xs leading-relaxed font-medium" style={{ color: THEME.textSecondary }}>
                    {isActive
                      ? t('subscription.daysRemaining', 'Залишилось') + ` ${subStatus?.subscription?.days_remaining || 0} ` + t('profilePages.bonuses.days', 'днів')
                      : t('subscription.pageSubtitle', 'Повний доступ до всього контенту та ексклюзивні можливості.')}
                  </p>
                </div>
                <div className="w-20 h-20 sm:w-32 sm:h-32 flex items-center justify-center flex-shrink-0 crown-animated">
                  {/* Корона тепер має колір "мокрого каменю" і легку прозорість для витонченості */}
                  <Crown
                    size={64}
                    className="sm:hidden"
                    style={{ color: THEME.accentDark, opacity: 0.9 }}
                    strokeWidth={1.2}
                    fill={THEME.accentLight}
                  />
                  <Crown
                    size={96}
                    className="hidden sm:block"
                    style={{ color: THEME.accentDark, opacity: 0.9 }}
                    strokeWidth={1.2}
                    fill={THEME.accentLight}
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
                        className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full"
                        // Використовуємо світлий "вівсяний" фон для тегів
                        style={{ backgroundColor: THEME.accentLight }}
                      >
                        <Check size={12} style={{ color: THEME.accentDark }} strokeWidth={3} />
                        <span
                          className="text-[10px] sm:text-xs font-semibold hidden sm:inline"
                          style={{ color: THEME.accentDark }}
                        >
                          {text}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div
                    className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all hover:scale-105 hover:shadow-lg"
                    // Кнопка дії "Купити" - найтемніша і найпомітніша
                    style={{ backgroundColor: THEME.accentDark }}
                  >
                    <ArrowRight size={20} color="#FFF" className="sm:w-6 sm:h-6" />
                  </div>
                </div>
              )}

              {isActive && (
                <div className="flex items-center gap-3 mt-6">
                  <div
                    className="flex-1 px-4 py-3 rounded-2xl border"
                    style={{ backgroundColor: THEME.bg, borderColor: THEME.border }}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: THEME.textMuted }}>
                      {t('subscription.activeUntil', 'Активний до')}
                    </p>
                    <p className="text-sm sm:text-base font-bold" style={{ color: THEME.text }}>
                      {subStatus?.subscription?.end_date
                        ? new Date(subStatus.subscription.end_date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })
                        : '—'}
                    </p>
                  </div>
                  <div
                    className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center border transition-transform hover:scale-105"
                    style={{ backgroundColor: '#FFF', borderColor: THEME.border }}
                  >
                    <ArrowRight size={20} style={{ color: THEME.text }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SIDE BUTTONS */}
          <div className="grid grid-cols-3 lg:grid-cols-1 gap-3 sm:gap-4">
            {isAuthenticated && (
              <button
                onClick={handleClaimBonus}
                className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-left transition-all duration-300 hover:scale-[1.02] active:scale-95 border hover:shadow-md"
                style={{
                  backgroundColor: bonusInfo?.can_claim_today ? THEME.accentDark : THEME.card,
                  borderColor: bonusInfo?.can_claim_today ? THEME.accentDark : THEME.border,
                  boxShadow: THEME.shadow,
                  color: bonusInfo?.can_claim_today ? '#FFF' : THEME.text
                }}
              >
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: bonusInfo?.can_claim_today ? 'rgba(255,255,255,0.15)' : THEME.accentLight }}
                >
                  <Gift size={20} style={{ color: bonusInfo?.can_claim_today ? '#FFF' : THEME.accent }} />
                </div>
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider" style={{ color: bonusInfo?.can_claim_today ? 'rgba(255,255,255,0.7)' : THEME.textMuted }}>
                  {t('bonus.dailyBonus', 'Бонус')}
                </p>
                <p className="text-sm sm:text-base font-bold">
                  {bonusInfo?.can_claim_today ? t('bonus.claimButton', 'Забрати') : t('bonus.claimed', 'Готово ✓')}
                </p>
              </button>
            )}

            <Link href="/profile/collections" className="block">
              <div
                className="h-full rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all duration-300 hover:scale-[1.02] border hover:shadow-md"
                style={{ backgroundColor: THEME.card, boxShadow: THEME.shadow, borderColor: THEME.border }}
              >
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: THEME.accentLight }}
                >
                  <Folder size={20} style={{ color: THEME.accent }} />
                </div>
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider" style={{ color: THEME.textMuted }}>
                  {t('profilePages.main.menu.myLabel', 'Мої')}
                </p>
                <p className="text-sm sm:text-base font-bold" style={{ color: THEME.text }}>
                  {t('profilePages.main.menu.collections', 'Збережені')}
                </p>
              </div>
            </Link>

            <div
              onClick={openTelegram}
              className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-95 border hover:shadow-md"
              style={{ backgroundColor: THEME.card, boxShadow: THEME.shadow, borderColor: THEME.border }}
            >
              <div
                // Використовуємо спеціальні CSS-класи для Telegram, щоб він був в пастельній гамі
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 telegram-btn-bg"
              >
                <Send size={20} className="telegram-icon-color" />
              </div>
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider" style={{ color: THEME.textMuted }}>
                {t('home.telegram.label', 'Наш')}
              </p>
              <p className="text-sm sm:text-base font-bold" style={{ color: THEME.text }}>
                Telegram
              </p>
            </div>
          </div>
        </div>

        <section>
          <div className="flex items-center justify-between mb-5 sm:mb-6">
            <h3
              className="text-lg sm:text-xl lg:text-2xl font-bold flex items-center gap-2"
              style={{ color: THEME.text }}
            >
              <Sparkles size={20} style={{ color: THEME.accent }} />
              {t('home.newArrivals', 'Нові надходження')}
            </h3>
            <Link href="/marketplace">
              <span
                className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-full transition-all hover:scale-105 border hover:shadow-sm"
                style={{ backgroundColor: THEME.card, color: THEME.text, borderColor: THEME.border }}
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
                  className="aspect-[3/4] rounded-2xl sm:rounded-3xl animate-pulse"
                  style={{ backgroundColor: THEME.accentLight }}
                />
              ))
            ) : (
              products.map((product) => (
                <Link key={product.id} href={`/product/${product.id}`}>
                  <div
                    className="group rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-300 hover:scale-[1.02] border hover:shadow-lg"
                    style={{ backgroundColor: THEME.card, boxShadow: THEME.shadow, borderColor: THEME.border }}
                  >
                    <div
                      className="relative aspect-square overflow-hidden"
                      style={{ backgroundColor: THEME.accentLight }}
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
                            className="text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 rounded-full backdrop-blur-md"
                            style={{ backgroundColor: 'rgba(255,255,255,0.85)', color: THEME.textSecondary }}
                          >
                            {t('product.free', 'FREE')}
                          </span>
                        ) : (
                          <span
                            className="text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 rounded-full flex items-center gap-0.5"
                            // Тег PRO тепер використовує "дорогий" темний акцент
                            style={{ backgroundColor: THEME.accentDark, color: '#FFF' }}
                          >
                            <Star size={10} fill="currentColor" /> PRO
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-3 sm:p-4">
                      <h4
                        className="text-sm sm:text-base font-semibold line-clamp-1 mb-1.5"
                        style={{ color: THEME.text }}
                      >
                        {product.title}
                      </h4>
                      <span
                        className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: THEME.accentLight, color: THEME.textSecondary }}
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