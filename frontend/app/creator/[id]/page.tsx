'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { creatorsAPI } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import {
  User, Package, Eye, Download, Calendar, Share2,
  MessageCircle, Star, TrendingUp, ExternalLink, Copy, Check
} from 'lucide-react';
import { MARKETPLACE_ENABLED } from '@/lib/features';
import { useTheme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface CreatorProfile {
  creator_id: number;
  username: string;
  full_name: string | null;
  photo_url: string | null;
  telegram_username: string | null;
  created_at: string;
  total_products: number;
  total_views: number;
  total_downloads: number;
  products: any[];
}

export default function CreatorPublicProfilePage() {
  const router = useRouter();
  const params = useParams();
  const creatorId = parseInt(params.id as string);
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!MARKETPLACE_ENABLED) {
      router.push('/');
      return;
    }
    loadProfile();
  }, [creatorId]);

  const loadProfile = async () => {
    try {
      const data = await creatorsAPI.getCreatorPublicProfile(creatorId);
      setProfile(data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Креатор не знайдено');
      } else {
        setError('Не вдалося завантажити профіль креатора');
      }
    } finally {
      setLoading(false);
    }
  };

  const sortedProducts = useMemo(() => {
    if (!profile?.products) return [];

    const products = [...profile.products];

    switch (sortBy) {
      case 'newest':
        return products.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case 'popular':
        return products.sort((a, b) =>
          (b.views_count || 0) - (a.views_count || 0)
        );
      case 'price_asc':
        return products.sort((a, b) => a.price - b.price);
      case 'price_desc':
        return products.sort((a, b) => b.price - a.price);
      case 'downloads':
        return products.sort((a, b) =>
          (b.downloads_count || 0) - (a.downloads_count || 0)
        );
      default:
        return products;
    }
  }, [profile?.products, sortBy]);

  if (!MARKETPLACE_ENABLED || loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: theme.colors.bgGradient }}
      >
        <div
          className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent"
          style={{ borderColor: theme.colors.accent }}
        />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: theme.colors.bgGradient }}
      >
        <div
          className="text-center p-8 rounded-3xl max-w-md"
          style={{
            backgroundColor: theme.colors.card,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <div className="text-6xl mb-4">😕</div>
          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: theme.colors.text }}
          >
            {error || 'Креатор не знайдено'}
          </h2>
          <p
            className="mb-6"
            style={{ color: theme.colors.textMuted }}
          >
            Можливо, цей креатор ще не додав жодного товару
          </p>
          <button
            onClick={() => router.push('/marketplace')}
            className="px-6 py-3 rounded-xl font-medium transition-colors"
            style={{
              backgroundColor: theme.colors.primary,
              color: '#FFF',
            }}
          >
            До маркетплейсу
          </button>
        </div>
      </div>
    );
  }

  const joinDate = new Date(profile.created_at).toLocaleDateString('uk-UA', {
    year: 'numeric',
    month: 'long'
  });

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.full_name || profile?.username} - OhMyRevit`,
          text: `Переглянути профіль креатора ${profile?.full_name || profile?.username}`,
          url: url
        });
      } catch {
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setLinkCopied(true);
      toast.success('Посилання скопійовано!');
      setTimeout(() => setLinkCopied(false), 2000);
    }).catch(() => {
      toast.error('Не вдалося скопіювати посилання');
    });
  };

  const handleContact = () => {
    if (profile?.telegram_username) {
      window.open(`https://t.me/${profile.telegram_username}`, '_blank');
    } else {
      toast.error('Контактні дані недоступні');
    }
  };

  const sortOptions = [
    { value: 'newest', label: t('marketplace.sort.newest') || 'Найновіші' },
    { value: 'popular', label: t('marketplace.sort.popular') || 'Популярні' },
    { value: 'downloads', label: 'Найбільше завантажень' },
    { value: 'price_asc', label: t('marketplace.sort.priceAsc') || 'Ціна ↑' },
    { value: 'price_desc', label: t('marketplace.sort.priceDesc') || 'Ціна ↓' },
  ];

  const stats = [
    {
      icon: Package,
      value: profile.total_products,
      label: 'Товарів',
      color: theme.colors.primary,
      bgColor: theme.colors.primaryLight,
    },
    {
      icon: Eye,
      value: profile.total_views.toLocaleString(),
      label: 'Переглядів',
      color: theme.colors.blue,
      bgColor: theme.colors.blueLight,
    },
    {
      icon: Download,
      value: profile.total_downloads.toLocaleString(),
      label: 'Завантажень',
      color: theme.colors.success,
      bgColor: theme.colors.successLight,
    },
  ];

  return (
    <div
      className="min-h-screen pb-24"
      style={{ background: theme.colors.bgGradient }}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 pt-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Маркетплейс', href: '/marketplace' },
            { label: profile.full_name || profile.username },
          ]}
        />

        {/* Creator Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl overflow-hidden mb-8"
          style={{
            backgroundColor: theme.colors.card,
            border: `1px solid ${theme.colors.border}`,
            boxShadow: theme.shadows.lg,
          }}
        >
          {/* Header with gradient background */}
          <div
            className="h-32 sm:h-40 relative"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`,
            }}
          >
            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/4" />
            </div>
          </div>

          {/* Profile Content */}
          <div className="px-6 pb-6">
            {/* Avatar - positioned to overlap header */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-14 sm:-mt-16 mb-6">
              <div
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden flex-shrink-0 ring-4"
                style={{
                  backgroundColor: theme.colors.surface,
                  ringColor: theme.colors.card,
                }}
              >
                {profile.photo_url ? (
                  <Image
                    src={profile.photo_url}
                    alt={profile.full_name || profile.username}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`,
                    }}
                  >
                    <User size={48} color="#FFF" />
                  </div>
                )}
              </div>

              {/* Name and username - centered on mobile, left-aligned on desktop */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                  <h1
                    className="text-2xl sm:text-3xl font-bold"
                    style={{ color: theme.colors.text }}
                  >
                    {profile.full_name || profile.username}
                  </h1>
                  <div
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium self-center sm:self-auto"
                    style={{
                      backgroundColor: theme.colors.accentLight,
                      color: theme.colors.accent,
                    }}
                  >
                    <Star size={12} fill="currentColor" />
                    Креатор
                  </div>
                </div>
                <p
                  className="text-base"
                  style={{ color: theme.colors.textMuted }}
                >
                  @{profile.username}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                {profile.telegram_username && (
                  <button
                    onClick={handleContact}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`,
                      color: '#FFF',
                      boxShadow: theme.shadows.md,
                    }}
                  >
                    <MessageCircle size={18} />
                    <span>Написати</span>
                  </button>
                )}
                <button
                  onClick={handleShare}
                  className="p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.textMuted,
                    border: `1px solid ${theme.colors.border}`,
                  }}
                  title="Поділитися"
                >
                  {linkCopied ? <Check size={20} /> : <Share2 size={20} />}
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="flex flex-col items-center p-4 rounded-2xl"
                  style={{
                    backgroundColor: theme.colors.surface,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                    style={{ backgroundColor: stat.bgColor }}
                  >
                    <stat.icon size={20} style={{ color: stat.color }} />
                  </div>
                  <span
                    className="text-xl sm:text-2xl font-bold"
                    style={{ color: theme.colors.text }}
                  >
                    {stat.value}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: theme.colors.textMuted }}
                  >
                    {stat.label}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Member Since */}
            <div
              className="flex items-center justify-center gap-2 py-3 rounded-xl"
              style={{ backgroundColor: theme.colors.surface }}
            >
              <Calendar size={16} style={{ color: theme.colors.textMuted }} />
              <span
                className="text-sm"
                style={{ color: theme.colors.textMuted }}
              >
                Креатор з <strong style={{ color: theme.colors.text }}>{joinDate}</strong>
              </span>
            </div>
          </div>
        </motion.div>

        {/* Products Section */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <h2
            className="text-xl sm:text-2xl font-bold flex items-center gap-2"
            style={{ color: theme.colors.text }}
          >
            <Package size={24} style={{ color: theme.colors.primary }} />
            Товари креатора
            <span
              className="text-base font-normal px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.textMuted,
              }}
            >
              {profile.total_products}
            </span>
          </h2>

          {profile.products.length > 0 && (
            <div className="relative min-w-[160px]">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full appearance-none px-3.5 py-2.5 font-medium text-sm pr-8 cursor-pointer outline-none"
                style={{
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderRadius: theme.radius.lg,
                  border: `1px solid ${theme.colors.border}`,
                }}
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div
                className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
                style={{ color: theme.colors.textMuted }}
              >
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Products Grid */}
        {profile.products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-12 rounded-3xl"
            style={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: theme.colors.surface }}
            >
              <Package size={40} style={{ color: theme.colors.textMuted, opacity: 0.5 }} />
            </div>
            <h3
              className="text-xl font-bold mb-2"
              style={{ color: theme.colors.text }}
            >
              Поки що немає товарів
            </h3>
            <p style={{ color: theme.colors.textMuted }}>
              Цей креатор ще не додав жодного товару
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
