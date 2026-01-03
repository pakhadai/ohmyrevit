'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { walletAPI } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { CheckCircle2, Loader, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

export default function WalletReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const { updateBalance, refreshUser } = useAuthStore();
  const { t } = useTranslation();

  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [countdown, setCountdown] = useState(3);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    // Check for Stripe session_id parameter
    const sessionId = searchParams.get('session_id');

    if (sessionId) {
      // Stripe payment completed, wait for webhook to process
      setStatus('success');

      // Wait 2 seconds for webhook to process, then update balance
      setTimeout(async () => {
        try {
          // Refresh user data
          await refreshUser();

          // Get updated balance
          const info = await walletAPI.getInfo();
          setBalance(info.balance);
          updateBalance(info.balance);

          // Show success message
          toast.success(
            t('wallet.paymentSuccess') || 'Оплата успішна! Баланс оновлено.',
            { duration: 3000 }
          );
        } catch (error) {
          console.error('Failed to update balance:', error);
          toast.error(
            t('wallet.balanceUpdateError') || 'Не вдалося оновити баланс. Спробуйте пізніше.',
            { duration: 3000 }
          );
        } finally {
          // Redirect to wallet page
          router.push('/profile/wallet');
        }
      }, 3000);

      // Start countdown timer
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      // No session_id, redirect to wallet
      setTimeout(() => {
        router.push('/profile/wallet');
      }, 2000);
    }
  }, [searchParams, router, updateBalance, refreshUser, t]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: theme.colors.bgGradient }}>
      <div className="text-center p-6 max-w-md mx-auto">
        {status === 'checking' && (
          <>
            <Loader className="w-16 h-16 mx-auto mb-4 animate-spin" style={{ color: theme.colors.primary }} />
            <h2 className="text-2xl font-bold mb-2" style={{ color: theme.colors.text }}>
              {t('wallet.processingPayment') || 'Обробка оплати...'}
            </h2>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: theme.colors.successLight }}>
              <CheckCircle2 size={32} style={{ color: theme.colors.success }} />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: theme.colors.text }}>
              {t('wallet.paymentSuccess') || 'Оплата успішна!'}
            </h2>
            <p className="text-lg mb-4" style={{ color: theme.colors.textSecondary }}>
              {t('wallet.updatingBalance') || 'Оновлення балансу...'}
            </p>
            {balance !== null && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <Image
                  src="/omr_coin.png"
                  alt="OMR Coin"
                  width={32}
                  height={32}
                />
                <span className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                  {balance.toLocaleString()} OMR
                </span>
              </div>
            )}
            <p className="text-sm" style={{ color: theme.colors.textMuted }}>
              {t('wallet.redirectingIn', { seconds: countdown }) || `Перенаправлення через ${countdown} секунд...`}
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: theme.colors.errorLight }}>
              <XCircle size={32} style={{ color: theme.colors.error }} />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: theme.colors.text }}>
              {t('wallet.paymentError') || 'Помилка обробки оплати'}
            </h2>
            <p className="text-sm mb-4" style={{ color: theme.colors.textSecondary }}>
              {t('wallet.redirectingToWallet') || 'Перенаправлення на сторінку гаманця...'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
