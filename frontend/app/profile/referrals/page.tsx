'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Users, Copy, Share2, Gift, CheckCircle2, Loader, UserPlus
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { referralAPI } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useTheme } from '@/lib/theme';

interface Referral {
  id: number;
  username: string;
  joined_at: string;
  bonus_earned: number;
}

export default function ReferralsPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const referralLink = `https://t.me/YourBot?start=ref_${user?.telegram_id || ''}`;
  const referralCode = user?.referral_code || `REF${user?.telegram_id?.toString().slice(-6) || '000000'}`;

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const data = await referralAPI.getReferrals();
      setReferrals(data.referrals || []);
      setTotalEarned(data.total_earned || 0);
    } catch (error) {
      console.error('Failed to fetch referrals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success(t('referrals.linkCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error(t('referrals.copyError'));
    }
  };

  const handleShare = async () => {
    const WebApp = (window as any).Telegram?.WebApp;
    if (WebApp?.openTelegramLink) {
      const text = t('referrals.shareText', { code: referralCode });
      WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`);
    } else if (navigator.share) {
      try {
        await navigator.share({
          title: t('referrals.shareTitle'),
          text: t('referrals.shareText', { code: referralCode }),
          url: referralLink,
        });
      } catch (error) {}
    } else {
      handleCopy();
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: theme.colors.bgGradient }}>
      <div className="max-w-2xl mx-auto px-5 pt-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2.5 transition-colors"
            style={{
              backgroundColor: theme.colors.surface,
              color: theme.colors.textMuted,
              borderRadius: theme.radius.lg,
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold" style={{ color: theme.colors.text }}>
            {t('referrals.title')}
          </h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 mb-6"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.blue}, ${theme.colors.purple})`,
            borderRadius: theme.radius['2xl'],
            boxShadow: theme.shadows.lg,
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: theme.radius.lg }}
              >
                <Users size={24} color="#FFF" />
              </div>
              <div>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {t('referrals.totalEarned')}
                </p>
                <div className="flex items-center gap-2">
                  <Image src="/omr_coin.png" alt="OMR" width={20} height={20} />
                  <span className="text-2xl font-bold text-white">
                    {totalEarned.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
                {t('referrals.invited')}
              </p>
              <p className="text-2xl font-bold text-white">{referrals.length}</p>
            </div>
          </div>

          <div
            className="p-4 mb-4"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: theme.radius.xl }}
          >
            <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {t('referrals.yourCode')}
            </p>
            <p className="text-lg font-mono font-bold text-white tracking-wider">
              {referralCode}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 py-3 font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: '#FFF',
                borderRadius: theme.radius.xl,
              }}
            >
              {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
              {copied ? t('common.copied') : t('common.copy')}
            </button>
            <button
              onClick={handleShare}
              className="flex-1 py-3 font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{
                backgroundColor: '#FFF',
                color: theme.colors.blue,
                borderRadius: theme.radius.xl,
              }}
            >
              <Share2 size={18} />
              {t('common.share')}
            </button>
          </div>
        </motion.div>

        <div
          className="p-5 mb-6"
          style={{
            backgroundColor: theme.colors.card,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.xl,
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Gift size={20} style={{ color: theme.colors.success }} />
            <h3 className="font-bold" style={{ color: theme.colors.text }}>
              {t('referrals.rewards')}
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: theme.colors.textSecondary }}>
                {t('referrals.perFriend')}
              </span>
              <div className="flex items-center gap-1">
                <Image src="/omr_coin.png" alt="OMR" width={16} height={16} />
                <span className="font-bold" style={{ color: theme.colors.success }}>+100</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: theme.colors.textSecondary }}>
                {t('referrals.friendGets')}
              </span>
              <div className="flex items-center gap-1">
                <Image src="/omr_coin.png" alt="OMR" width={16} height={16} />
                <span className="font-bold" style={{ color: theme.colors.success }}>+50</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-4" style={{ color: theme.colors.text }}>
            {t('referrals.yourReferrals')}
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="animate-spin" size={24} style={{ color: theme.colors.primary }} />
            </div>
          ) : referrals.length === 0 ? (
            <div
              className="text-center py-12"
              style={{
                backgroundColor: theme.colors.card,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.xl,
              }}
            >
              <UserPlus size={40} className="mx-auto mb-3" style={{ color: theme.colors.textMuted, opacity: 0.5 }} />
              <p className="font-medium mb-1" style={{ color: theme.colors.text }}>
                {t('referrals.noReferrals')}
              </p>
              <p className="text-sm" style={{ color: theme.colors.textMuted }}>
                {t('referrals.shareToInvite')}
              </p>
            </div>
          ) : (
            <div
              className="divide-y"
              style={{
                backgroundColor: theme.colors.card,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.xl,
                overflow: 'hidden',
              }}
            >
              {referrals.map((ref) => (
                <div
                  key={ref.id}
                  className="flex items-center justify-between p-4"
                  style={{ borderColor: theme.colors.border }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 flex items-center justify-center font-bold"
                      style={{
                        backgroundColor: theme.colors.primaryLight,
                        color: theme.colors.primary,
                        borderRadius: theme.radius.full,
                      }}
                    >
                      {ref.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: theme.colors.text }}>
                        {ref.username || t('referrals.anonymous')}
                      </p>
                      <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                        {new Date(ref.joined_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1" style={{ color: theme.colors.success }}>
                    <span className="font-bold">+{ref.bonus_earned}</span>
                    <Image src="/omr_coin.png" alt="OMR" width={16} height={16} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}