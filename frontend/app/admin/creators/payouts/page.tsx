'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminCreatorsAPI } from '@/lib/api';
import { MARKETPLACE_ENABLED } from '@/lib/features';

interface Payout {
  id: number;
  creator_id: number;
  creator_email: string | null;
  creator_name: string;
  amount_coins: number;
  amount_usd: number;
  usdt_address: string;
  usdt_network: string;
  requested_at: string;
}

export default function AdminPayoutsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!MARKETPLACE_ENABLED) {
      router.push('/admin');
      return;
    }
    loadPayouts();
  }, []);

  const loadPayouts = async () => {
    try {
      const data = await adminCreatorsAPI.getPendingPayouts({ limit: 100 });
      setPayouts(data);
    } catch (err: any) {
      setError('Не вдалося завантажити виплати');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedPayout || !transactionHash.trim()) {
      setError('Введіть хеш транзакції');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      await adminCreatorsAPI.approvePayout(selectedPayout.id, transactionHash);
      setPayouts(payouts.filter((p) => p.id !== selectedPayout.id));
      setShowApproveModal(false);
      setTransactionHash('');
      setSelectedPayout(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не вдалося підтвердити виплату');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPayout || !rejectionReason.trim()) {
      setError('Введіть причину відхилення');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      await adminCreatorsAPI.rejectPayout(selectedPayout.id, rejectionReason);
      setPayouts(payouts.filter((p) => p.id !== selectedPayout.id));
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedPayout(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не вдалося відхилити виплату');
    } finally {
      setProcessing(false);
    }
  };

  const formatCoins = (coins: number) => {
    return coins.toLocaleString('uk-UA');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push('/admin')}
          className="text-purple-400 hover:text-purple-300 mb-6 flex items-center gap-2"
        >
          ← Назад до адмін-панелі
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Запити на виплату
          </h1>
          <p className="text-slate-400">
            {payouts.length} виплат на розгляді
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Payouts List */}
        <div className="space-y-4">
          {payouts.length === 0 ? (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-12 text-center">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-slate-300 text-lg">Немає виплат на розгляді</p>
            </div>
          ) : (
            payouts.map((payout) => (
              <div
                key={payout.id}
                className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {payout.creator_name}
                    </h3>
                    <div className="flex gap-4 text-sm text-slate-400">
                      <span>ID: {payout.creator_id}</span>
                      {payout.creator_email && <span>📧 {payout.creator_email}</span>}
                      <span>
                        📅{' '}
                        {new Date(payout.requested_at).toLocaleDateString('uk-UA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-400">
                      {formatCoins(payout.amount_coins)} 💎
                    </div>
                    <div className="text-lg text-slate-300">
                      ${(payout.amount_usd / 100).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-slate-400 text-sm mb-1">USDT Адреса:</div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 text-sm break-all">
                        {payout.usdt_address}
                      </code>
                      <button
                        onClick={() => copyToClipboard(payout.usdt_address)}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                        title="Копіювати"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-sm mb-1">Мережа:</div>
                    <div className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2">
                      <span className="text-white font-medium">{payout.usdt_network}</span>
                      <span className="text-slate-400 text-sm ml-2">
                        {payout.usdt_network === 'TRC20' && '⚡ TRON'}
                        {payout.usdt_network === 'ERC20' && '🔷 Ethereum'}
                        {payout.usdt_network === 'BEP20' && '🟡 BSC'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedPayout(payout);
                      setShowApproveModal(true);
                      setError('');
                    }}
                    disabled={processing}
                    className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    ✅ Підтвердити виплату
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPayout(payout);
                      setShowRejectModal(true);
                      setError('');
                    }}
                    disabled={processing}
                    className="flex-1 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-lg hover:from-red-700 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    ❌ Відхилити
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedPayout && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50">
          <div className="bg-slate-800 border border-green-500/20 rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-4">
              Підтвердити виплату
            </h2>
            <div className="mb-4 p-4 bg-slate-900/50 rounded-lg">
              <div className="text-slate-400 text-sm">Креатор:</div>
              <div className="text-white font-medium">{selectedPayout.creator_name}</div>
              <div className="text-slate-400 text-sm mt-2">Сума:</div>
              <div className="text-green-400 text-xl font-bold">
                {formatCoins(selectedPayout.amount_coins)} 💎 (${(selectedPayout.amount_usd / 100).toFixed(2)})
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-slate-300 mb-2 font-medium">
                Хеш транзакції в блокчейні
              </label>
              <input
                type="text"
                value={transactionHash}
                onChange={(e) => setTransactionHash(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-green-500 transition-colors font-mono text-sm"
                required
              />
              <p className="text-slate-500 text-xs mt-2">
                Введіть хеш після відправки USDT на адресу креатора
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setTransactionHash('');
                  setSelectedPayout(null);
                  setError('');
                }}
                disabled={processing}
                className="flex-1 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                Скасувати
              </button>
              <button
                onClick={handleApprove}
                disabled={processing || !transactionHash.trim()}
                className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {processing ? 'Підтвердження...' : 'Підтвердити'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedPayout && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50">
          <div className="bg-slate-800 border border-red-500/20 rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-4">
              Відхилити виплату
            </h2>
            <div className="mb-4 p-4 bg-slate-900/50 rounded-lg">
              <div className="text-slate-400 text-sm">Креатор:</div>
              <div className="text-white font-medium">{selectedPayout.creator_name}</div>
              <div className="text-slate-400 text-sm mt-2">Сума:</div>
              <div className="text-red-400 text-xl font-bold">
                {formatCoins(selectedPayout.amount_coins)} 💎
              </div>
            </div>

            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-400 text-sm">
                ⚠️ Баланс буде повернено креатору
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-slate-300 mb-2 font-medium">
                Причина відхилення
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                placeholder="Наприклад: некоректна адреса..."
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors resize-none"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setSelectedPayout(null);
                  setError('');
                }}
                disabled={processing}
                className="flex-1 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                Скасувати
              </button>
              <button
                onClick={handleReject}
                disabled={processing || !rejectionReason.trim()}
                className="flex-1 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-lg hover:from-red-700 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {processing ? 'Відхилення...' : 'Відхилити'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
