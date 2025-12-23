'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Loader, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useTheme } from '@/lib/theme';

export default function VerifyPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const { t } = useTranslation();

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every(digit => digit) && newCode.join('').length === 6) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newCode = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
      setCode(newCode);
      if (pastedData.length === 6) {
        handleVerify(pastedData);
      }
    }
  };

  const handleVerify = async (verificationCode: string) => {
    setIsVerifying(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success(t('auth.verificationSuccess'));
      router.push('/');
    } catch (error) {
      toast.error(t('auth.verificationError'));
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setIsResending(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(t('auth.codeSent'));
      setCountdown(60);
    } catch (error) {
      toast.error(t('auth.resendError'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col px-6 pt-12"
      style={{ background: theme.colors.bgGradient }}
    >
      <button
        onClick={() => router.back()}
        className="p-2.5 self-start mb-8 transition-colors"
        style={{
          backgroundColor: theme.colors.surface,
          color: theme.colors.textMuted,
          borderRadius: theme.radius.lg,
        }}
      >
        <ArrowLeft size={20} />
      </button>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm mx-auto"
      >
        <div
          className="p-8"
          style={{
            backgroundColor: theme.colors.card,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius['2xl'],
            boxShadow: theme.shadows.lg,
          }}
        >
          <div
            className="w-16 h-16 mx-auto mb-6 flex items-center justify-center"
            style={{
              backgroundColor: theme.colors.primaryLight,
              borderRadius: theme.radius.full,
            }}
          >
            <ShieldCheck size={28} style={{ color: theme.colors.primary }} />
          </div>

          <h1 className="text-2xl font-bold text-center mb-2" style={{ color: theme.colors.text }}>
            {t('auth.verifyCode')}
          </h1>
          <p className="text-sm text-center mb-8" style={{ color: theme.colors.textSecondary }}>
            {t('auth.codeSentTo', { email: email || 'your email' })}
          </p>

          <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isVerifying}
                className="w-12 h-14 text-center text-xl font-bold outline-none transition-all disabled:opacity-50"
                style={{
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  border: digit ? `2px solid ${theme.colors.primary}` : `2px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.lg,
                }}
              />
            ))}
          </div>

          {isVerifying && (
            <div className="flex items-center justify-center gap-2 mb-6">
              <Loader size={18} className="animate-spin" style={{ color: theme.colors.primary }} />
              <span className="text-sm" style={{ color: theme.colors.textSecondary }}>
                {t('auth.verifying')}
              </span>
            </div>
          )}

          <div className="text-center">
            <p className="text-sm mb-2" style={{ color: theme.colors.textMuted }}>
              {t('auth.didntReceive')}
            </p>
            <button
              onClick={handleResend}
              disabled={countdown > 0 || isResending}
              className="text-sm font-medium flex items-center justify-center gap-1 mx-auto disabled:opacity-50"
              style={{ color: theme.colors.primary }}
            >
              {isResending ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  <span>{t('common.sending')}</span>
                </>
              ) : countdown > 0 ? (
                <span>{t('auth.resendIn', { seconds: countdown })}</span>
              ) : (
                <>
                  <RefreshCw size={14} />
                  <span>{t('auth.resendCode')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}