'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { creatorsAPI } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { User, Package, Eye, Download, Calendar, Share2 } from 'lucide-react';
import { MARKETPLACE_ENABLED } from '@/lib/features';
import { useTheme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

interface CreatorProfile {
  creator_id: number;
  username: string;
  full_name: string | null;
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

  // Hooks must be called before any conditional returns
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
        <div style={{ color: theme.colors.text }}>Завантаження...</div>
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
          className="text-center p-8 rounded-2xl max-w-md"
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

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `${profile?.full_name || profile?.username} - OhMyRevit`,
        text: `Переглянути профіль креатора ${profile?.full_name || profile?.username}`,
        url: url
      }).catch(() => {
        copyToClipboard(url);
      });
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Посилання скопійовано!');
    }).catch(() => {
      toast.error('Не вдалося скопіювати посилання');
    });
  };

  const sortOptions = [
    { value: 'newest', label: t('marketplace.sort.newest') || 'Найновіші' },
    { value: 'popular', label: t('marketplace.sort.popular') || 'Популярні' },
    { value: 'downloads', label: 'Найбільше завантажень' },
    { value: 'price_asc', label: t('marketplace.sort.priceAsc') || 'Ціна: низька → висока' },
    { value: 'price_desc', label: t('marketplace.sort.priceDesc') || 'Ціна: висока → низька' },
  ];

  return (
    <div
      className="min-h-screen pb-20"
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

        {/* Creator Header */}
        <div
          className="p-8 rounded-3xl mb-8"
          style={{
            backgroundColor: theme.colors.card,
            border: `1px solid ${theme.colors.border}`,
            boxShadow: theme.shadows.lg,
          }}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`,
              }}
            >
              <User size={48} color="#FFF" />
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1
                  className="text-3xl font-bold"
                  style={{ color: theme.colors.text }}
                >
                  {profile.full_name || profile.username}
                </h1>
                <button
                  onClick={handleShare}
                  className="p-2.5 transition-colors flex-shrink-0"
                  style={{
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.textMuted,
                    borderRadius: theme.radius.lg,
                  }}
                  title="Поділитися"
                >
                  <Share2 size={20} />
                </button>
              </div>
              <p
                className="text-lg mb-4"
                style={{ color: theme.colors.textMuted }}
              >
                @{profile.username}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Package
                    size={20}
                    style={{ color: theme.colors.primary }}
                  />
                  <span style={{ color: theme.colors.text }}>
                    <strong>{profile.total_products}</strong> товарів
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye
                    size={20}
                    style={{ color: theme.colors.primary }}
                  />
                  <span style={{ color: theme.colors.text }}>
                    <strong>{profile.total_views}</strong> переглядів
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Download
                    size={20}
                    style={{ color: theme.colors.primary }}
                  />
                  <span style={{ color: theme.colors.text }}>
                    <strong>{profile.total_downloads}</strong> завантажень
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar
                    size={20}
                    style={{ color: theme.colors.textMuted }}
                  />
                  <span style={{ color: theme.colors.textMuted }}>
                    Креатор з {joinDate}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <h2
            className="text-2xl font-bold"
            style={{ color: theme.colors.text }}
          >
            Товари креатора
          </h2>

          {profile.products.length > 0 && (
            <div className="relative min-w-[180px]">
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
          )}
        </div>

        {/* Products Grid */}
        {profile.products.length === 0 ? (
          <div
            className="text-center p-12 rounded-2xl"
            style={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <div className="text-6xl mb-4">📦</div>
            <h3
              className="text-xl font-bold mb-2"
              style={{ color: theme.colors.text }}
            >
              Поки що немає товарів
            </h3>
            <p style={{ color: theme.colors.textMuted }}>
              Цей креатор ще не додав жодного товару
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
