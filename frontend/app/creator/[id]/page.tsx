'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { creatorsAPI } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import { User, Package, Eye, Download, Calendar } from 'lucide-react';
import { MARKETPLACE_ENABLED } from '@/lib/features';
import { useTheme } from '@/lib/theme';

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

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [error, setError] = useState('');

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

  return (
    <div
      className="min-h-screen pb-20"
      style={{ background: theme.colors.bgGradient }}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 pt-6">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 transition-colors"
          style={{ color: theme.colors.textMuted }}
        >
          <span>←</span>
          <span>Назад</span>
        </button>

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
              <h1
                className="text-3xl font-bold mb-2"
                style={{ color: theme.colors.text }}
              >
                {profile.full_name || profile.username}
              </h1>
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
        <div className="mb-6">
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: theme.colors.text }}
          >
            Товари креатора
          </h2>
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
            {profile.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
