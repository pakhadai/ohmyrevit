'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { creatorsAPI } from '@/lib/api';
import { MARKETPLACE_ENABLED } from '@/lib/features';

interface CreatorBalance {
  balance_coins: number;
  balance_usd: number;
}

export default function CreatorPayoutPage() {
  const router = useRouter();
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
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Завантаження...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 p-6 pb-28">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push('/creator/dashboard')}
          className="text-purple-400 hover:text-purple-300 mb-6 flex items-center gap-2"
        >
          ← Назад до дашборду
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Запит на виплату
          </h1>
          <p className="text-slate-400">Виведіть свій заробіток у USDT</p>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-green-900/50 to-slate-800/50 backdrop-blur-sm border border-green-500/20 rounded-2xl p-6 mb-8">
          <div className="text-slate-400 mb-2">Доступний баланс</div>
          <div className="text-4xl font-bold text-white mb-1">
            {balance?.balance_coins.toLocaleString('uk-UA')} 💎
          </div>
          <div className="text-2xl text-green-400">
            ${balance?.balance_usd.toFixed(2)}
          </div>
        </div>

        {/* Form */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount */}
            <div>
              <label className="block text-slate-300 mb-2 font-medium">
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
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                  💎
                </div>
              </div>
              {amountCoins && parseInt(amountCoins) >= MIN_PAYOUT && (
                <div className="mt-2 text-green-400 text-sm">
                  ≈ ${calculateUsd(parseInt(amountCoins))} USDT
                </div>
              )}
              <p className="text-slate-500 text-sm mt-2">
                Мінімум: {MIN_PAYOUT.toLocaleString('uk-UA')} монет ($30)
              </p>
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setAmountCoins('3000')}
                disabled={(balance?.balance_coins || 0) < 3000}
                className="py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                $30
              </button>
              <button
                type="button"
                onClick={() => setAmountCoins('5000')}
                disabled={(balance?.balance_coins || 0) < 5000}
                className="py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                $50
              </button>
              <button
                type="button"
                onClick={() => setAmountCoins(String(balance?.balance_coins || 0))}
                disabled={(balance?.balance_coins || 0) < MIN_PAYOUT}
                className="py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Все
              </button>
            </div>

            {/* USDT Address */}
            <div>
              <label className="block text-slate-300 mb-2 font-medium">
                USDT адреса гаманця
              </label>
              <input
                type="text"
                value={usdtAddress}
                onChange={(e) => setUsdtAddress(e.target.value)}
                placeholder="T..."
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors font-mono text-sm"
                required
              />
              <p className="text-slate-500 text-sm mt-2">
                Введіть адресу вашого USDT гаманця
              </p>
            </div>

            {/* Network Selection */}
            <div>
              <label className="block text-slate-300 mb-2 font-medium">
                Мережа
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['TRC20', 'ERC20', 'BEP20'] as const).map((network) => (
                  <button
                    key={network}
                    type="button"
                    onClick={() => setUsdtNetwork(network)}
                    className={`py-3 rounded-lg font-medium transition-all ${
                      usdtNetwork === network
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {network}
                  </button>
                ))}
              </div>
              <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-400 text-sm">
                  {usdtNetwork === 'TRC20' && '⚡ TRON - Низькі комісії, швидко'}
                  {usdtNetwork === 'ERC20' && '🔷 Ethereum - Високі комісії'}
                  {usdtNetwork === 'BEP20' && '🟡 BSC - Середні комісії'}
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <p className="text-green-400 text-sm">
                  ✅ Запит на виплату успішно створено! Очікуйте обробки адміністратором.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || success || (balance?.balance_coins || 0) < MIN_PAYOUT}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-500/50"
            >
              {submitting ? 'Відправка...' : '💸 Запитати виплату'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <h3 className="font-bold text-white mb-3">Важлива інформація:</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                <span>Виплати обробляються вручну адміністратором протягом 24-48 годин</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                <span>Мінімальна сума для виплати: $30 (3000 монет)</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                <span>Перевірте правильність адреси - транзакції необоротні!</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                <span>Рекомендуємо TRC20 (TRON) для найнижчих комісій</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                <span>Комісія блокчейну сплачується платформою</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
