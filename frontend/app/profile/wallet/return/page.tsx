'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { walletAPI } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { CheckCircle2, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function WalletReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const { user, updateBalance, refreshUser } = useAuthStore();
  const { t } = useTranslation();
  
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Перевіряємо, чи є параметри від Gumroad
    const saleId = searchParams.get('sale_id');
    const permalink = searchParams.get('permalink');
    
    if (saleId || permalink) {
      // Якщо є параметри від Gumroad, вважаємо, що покупка успішна
      setStatus('success');
      
      // Відразу показуємо лоадер та почекаємо 2 секунди перед оновленням
      // (даємо час webhook'у обробитись на сервері)
      setTimeout(async () => {
        try {
          // Оновлюємо дані користувача
          await refreshUser();

          // Отримуємо актуальний баланс
          const info = await walletAPI.getInfo();
          updateBalance(info.balance);

          // Показуємо успішне повідомлення
          toast.success(
            t('wallet.paymentSuccess') || 'Оплата успішна! Баланс оновлено.',
            { duration: 3000 }
          );
        } catch (error) {
          console.error('Failed to update balance:', error);
          // Якщо не вдалося оновити баланс, показуємо повідомлення
          toast.error(
            t('wallet.balanceUpdateError') || 'Не вдалося оновити баланс. Спробуйте пізніше.',
            { duration: 3000 }
          );
        } finally {
          // Перенаправляємо на сторінку гаманця
          router.push('/profile/wallet');
        }
      }, 3000);

      // Запускаємо таймер зворотного відліку
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
      // Якщо немає параметрів, можливо це не повернення з Gumroad
      // Перенаправляємо на сторінку гаманця
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
            <p className="text-sm" style={{ color: theme.colors.textMuted }}>
              {t('wallet.redirectingIn', { seconds: countdown }) || `Перенаправлення через ${countdown} секунд...`}
            </p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: theme.colors.errorLight }}>
              <CheckCircle2 size={32} style={{ color: theme.colors.error }} />
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

