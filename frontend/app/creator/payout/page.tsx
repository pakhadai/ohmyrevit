'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { creatorsAPI } from '@/lib/api';
import { MARKETPLACE_ENABLED } from '@/lib/features';
import { useTheme } from '@/lib/theme';

interface CreatorBalance {
  balance_coins: number;
  balance_usd: number;
}

export default function CreatorPayoutPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [balance, setBalance] = useState<CreatorBalance | null>(null);
  const [amountCoins, setAmountCoins] = useState('');
  const [usdtAddress, setUsdtAddress] = useState('');
  const [usdtNetwork, setUsdtNetwork] = useState<'TRC20' | 'ERC20' | 'BEP20'>('TRC20');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const MIN_PAYOUT = 3000; // $30 = 3000 coins

  useEffect(() => {
    if (!MARKETPLACE_ENABLED) {
      router.push('/');
      return;
    }
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      const data = await creatorsAPI.getBalance();
      setBalance(data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        router.push('/become-creator');
      } else {
        setError('Не вдалося завантажити баланс');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const amount = parseInt(amountCoins);

    if (!amount || amount < MIN_PAYOUT) {
      setError(`Мінімальна сума для виплати: ${MIN_PAYOUT} монет ($30)`);
      return;
    }

    if (amount > (balance?.balance_coins || 0)) {
      setError('Недостатньо коштів на балансі');
      return;
    }

    if (!usdtAddress || usdtAddress.length < 10) {
      setError('Введіть коректну USDT адресу');
      return;
    }

    setSubmitting(true);

    try {
      await creatorsAPI.requestPayout({
        amount_coins: amount,
        usdt_address: usdtAddress,
        usdt_network: usdtNetwork,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push('/creator/dashboard');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не вдалося створити запит на виплату');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateUsd = (coins: number) => {
    return (coins / 100).toFixed(2);
  };

  if (!MARKETPLACE_ENABLED || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: theme.colors.bgGradient }}>
        <div style={{ color: theme.colors.text }} className="text-xl">Завантаження...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 pb-28" style={{ background: theme.colors.bgGradient }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push('/creator/dashboard')}
          className="mb-6 flex items-center gap-2 transition-colors hover:opacity-80"
          style={{ color: theme.colors.purple }}
        >
          ← Назад до дашборду
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Запит на виплату
          </h1>
          <p style={{ color: theme.colors.textSecondary }}>Виведіть свій заробіток у USDT</p>
        </div>

        {/* Balance Card */}
        <div
          className="backdrop-blur-sm p-6 mb-8"
          style={{
            background: `linear-gradient(to bottom right, ${theme.colors.green}50, ${theme.colors.card}80)`,
            border: `1px solid ${theme.colors.green}30`,
            borderRadius: theme.radius['2xl']
          }}
        >
          <div style={{ color: theme.colors.textSecondary }} className="mb-2">Доступний баланс</div>
          <div className="text-4xl font-bold mb-1" style={{ color: theme.colors.text }}>
            {balance?.balance_coins.toLocaleString('uk-UA')} 💎
          </div>
          <div className="text-2xl" style={{ color: theme.colors.green }}>
            ${balance?.balance_usd.toFixed(2)}
          </div>
        </div>

        {/* Form */}
        <div
          className="backdrop-blur-sm p-8"
          style={{
            backgroundColor: theme.colors.card + '80',
            border: `1px solid ${theme.colors.purple}30`,
            borderRadius: theme.radius['2xl']
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount */}
            <div>
              <label className="block mb-2 font-medium" style={{ color: theme.colors.text }}>
                Сума виплати (в монетах)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amountCoins}
                  onChange={(e) => setAmountCoins(e.target.value)}
                  placeholder="3000"
                  min={MIN_PAYOUT}
                  max={balance?.balance_coins || 0}
                  className="w-full px-4 py-3 focus:outline-none transition-colors"
                  style={{
                    backgroundColor: theme.colors.surface + '80',
                    border: `1px solid ${theme.colors.textMuted}40`,
                    borderRadius: theme.radius.lg,
                    color: theme.colors.text
                  }}
                  required
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: theme.colors.textMuted }}>
                  💎
                </div>
              </div>
              {amountCoins && parseInt(amountCoins) >= MIN_PAYOUT && (
                <div className="mt-2 text-sm" style={{ color: theme.colors.green }}>
                  ≈ ${calculateUsd(parseInt(amountCoins))} USDT
                </div>
              )}
              <p className="text-sm mt-2" style={{ color: theme.colors.textMuted }}>
                Мінімум: {MIN_PAYOUT.toLocaleString('uk-UA')} монет ($30)
              </p>
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setAmountCoins('3000')}
                disabled={(balance?.balance_coins || 0) < 3000}
                className="py-2 transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderRadius: theme.radius.lg
                }}
              >
                $30
              </button>
              <button
                type="button"
                onClick={() => setAmountCoins('5000')}
                disabled={(balance?.balance_coins || 0) < 5000}
                className="py-2 transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderRadius: theme.radius.lg
                }}
              >
                $50
              </button>
              <button
                type="button"
                onClick={() => setAmountCoins(String(balance?.balance_coins || 0))}
                disabled={(balance?.balance_coins || 0) < MIN_PAYOUT}
                className="py-2 transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderRadius: theme.radius.lg
                }}
              >
                Все
              </button>
            </div>

            {/* USDT Address */}
            <div>
              <label className="block mb-2 font-medium" style={{ color: theme.colors.text }}>
                USDT адреса гаманця
              </label>
              <input
                type="text"
                value={usdtAddress}
                onChange={(e) => setUsdtAddress(e.target.value)}
                placeholder="T..."
                className="w-full px-4 py-3 focus:outline-none transition-colors font-mono text-sm"
                style={{
                  backgroundColor: theme.colors.surface + '80',
                  border: `1px solid ${theme.colors.textMuted}40`,
                  borderRadius: theme.radius.lg,
                  color: theme.colors.text
                }}
                required
              />
              <p className="text-sm mt-2" style={{ color: theme.colors.textMuted }}>
                Введіть адресу вашого USDT гаманця
              </p>
            </div>

            {/* Network Selection */}
            <div>
              <label className="block mb-2 font-medium" style={{ color: theme.colors.text }}>
                Мережа
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['TRC20', 'ERC20', 'BEP20'] as const).map((network) => (
                  <button
                    key={network}
                    type="button"
                    onClick={() => setUsdtNetwork(network)}
                    className="py-3 font-medium transition-all"
                    style={{
                      background: usdtNetwork === network
                        ? `linear-gradient(to right, ${theme.colors.purple}, ${theme.colors.pink})`
                        : theme.colors.surface,
                      color: usdtNetwork === network ? '#FFFFFF' : theme.colors.textSecondary,
                      borderRadius: theme.radius.lg
                    }}
                  >
                    {network}
                  </button>
                ))}
              </div>
              <div
                className="mt-3 p-3"
                style={{
                  backgroundColor: theme.colors.blueLight,
                  border: `1px solid ${theme.colors.blue}30`,
                  borderRadius: theme.radius.lg
                }}
              >
                <p className="text-sm" style={{ color: theme.colors.blue }}>
                  {usdtNetwork === 'TRC20' && '⚡ TRON - Низькі комісії, швидко'}
                  {usdtNetwork === 'ERC20' && '🔷 Ethereum - Високі комісії'}
                  {usdtNetwork === 'BEP20' && '🟡 BSC - Середні комісії'}
                </p>
              </div>
            </div>

            {error && (
              <div
                className="p-4"
                style={{
                  backgroundColor: theme.colors.errorLight,
                  border: `1px solid ${theme.colors.error}30`,
                  borderRadius: theme.radius.lg
                }}
              >
                <p className="text-sm" style={{ color: theme.colors.error }}>{error}</p>
              </div>
            )}

            {success && (
              <div
                className="p-4"
                style={{
                  backgroundColor: theme.colors.successLight,
                  border: `1px solid ${theme.colors.success}30`,
                  borderRadius: theme.radius.lg
                }}
              >
                <p className="text-sm" style={{ color: theme.colors.success }}>
                  ✅ Запит на виплату успішно створено! Очікуйте обробки адміністратором.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || success || (balance?.balance_coins || 0) < MIN_PAYOUT}
              className="w-full py-4 font-bold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(to right, ${theme.colors.green}, #10B981)`,
                color: '#FFFFFF',
                borderRadius: theme.radius.lg,
                boxShadow: theme.shadows.lg
              }}
            >
              {submitting ? 'Відправка...' : '💸 Запитати виплату'}
            </button>
          </form>

          <div
            className="mt-6 pt-6"
            style={{ borderTop: `1px solid ${theme.colors.textMuted}30` }}
          >
            <h3 className="font-bold mb-3" style={{ color: theme.colors.text }}>Важлива інформація:</h3>
            <ul className="space-y-2 text-sm" style={{ color: theme.colors.text }}>
              <li className="flex items-start">
                <span className="mr-2" style={{ color: theme.colors.purple }}>•</span>
                <span>Виплати обробляються вручну адміністратором протягом 24-48 годин</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2" style={{ color: theme.colors.purple }}>•</span>
                <span>Мінімальна сума для виплати: $30 (3000 монет)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2" style={{ color: theme.colors.purple }}>•</span>
                <span>Перевірте правильність адреси - транзакції необоротні!</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2" style={{ color: theme.colors.purple }}>•</span>
                <span>Рекомендуємо TRC20 (TRON) для найнижчих комісій</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2" style={{ color: theme.colors.purple }}>•</span>
                <span>Комісія блокчейну сплачується платформою</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
