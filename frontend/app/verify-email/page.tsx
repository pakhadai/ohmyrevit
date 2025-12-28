'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { useTheme } from '@/lib/theme';

export default function VerifyEmailPage() {
  const { theme } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Токен підтвердження не знайдено');
        return;
      }

      try {
        const response = await authAPI.verifyEmail(token);

        setStatus('success');
        setMessage(response.message || 'Email успішно підтверджено!');

        // Перенаправляємо на профіль через 3 секунди
        setTimeout(() => {
          router.push('/profile/settings');
        }, 3000);
      } catch (error: any) {
        setStatus('error');
        setMessage(error?.response?.data?.detail || 'Помилка підтвердження email');
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: theme.colors.bgGradient }}>
      <div className="max-w-md w-full rounded-3xl p-8 text-center" style={{
        backgroundColor: theme.colors.card,
        border: `1px solid ${theme.colors.border}`,
        boxShadow: theme.shadows.xl
      }}>
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4" style={{ borderColor: theme.colors.primary }}></div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: theme.colors.text }}>
              Підтвердження email...
            </h1>
            <p style={{ color: theme.colors.textSecondary }}>
              Зачекайте, будь ласка
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: theme.colors.successLight }}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: theme.colors.success }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: theme.colors.text }}>
              Успішно!
            </h1>
            <p className="mb-4" style={{ color: theme.colors.textSecondary }}>
              {message}
            </p>
            <p className="text-sm" style={{ color: theme.colors.textMuted }}>
              Перенаправляємо вас до профілю...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: theme.colors.errorLight }}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: theme.colors.error }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: theme.colors.text }}>
              Помилка
            </h1>
            <p className="mb-6" style={{ color: theme.colors.textSecondary }}>
              {message}
            </p>
            <button
              onClick={() => router.push('/profile/settings')}
              className="px-6 py-3 rounded-2xl font-medium transition-all active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`,
                color: '#FFFFFF',
                boxShadow: theme.shadows.md
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Повернутись до налаштувань
            </button>
          </>
        )}
      </div>
    </div>
  );
}
