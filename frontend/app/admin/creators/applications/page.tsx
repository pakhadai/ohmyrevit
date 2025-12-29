'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminCreatorsAPI } from '@/lib/api';
import { MARKETPLACE_ENABLED } from '@/lib/features';

interface Application {
  id: number;
  user_id: number;
  user_email: string | null;
  user_name: string;
  portfolio_url: string | null;
  motivation: string | null;
  applied_at: string;
}

export default function AdminApplicationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!MARKETPLACE_ENABLED) {
      router.push('/admin');
      return;
    }
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const data = await adminCreatorsAPI.getPendingApplications({ limit: 100 });
      setApplications(data);
    } catch (err: any) {
      setError('Не вдалося завантажити заявки');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (app: Application) => {
    if (!confirm(`Схвалити заявку від ${app.user_name}?`)) return;

    setProcessing(true);
    setError('');

    try {
      await adminCreatorsAPI.reviewApplication(app.id, { action: 'approve' });
      setApplications(applications.filter((a) => a.id !== app.id));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не вдалося схвалити заявку');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp || !rejectionReason.trim()) {
      setError('Введіть причину відхилення');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      await adminCreatorsAPI.reviewApplication(selectedApp.id, {
        action: 'reject',
        rejection_reason: rejectionReason,
      });
      setApplications(applications.filter((a) => a.id !== selectedApp.id));
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedApp(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не вдалося відхилити заявку');
    } finally {
      setProcessing(false);
    }
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
            Заявки на статус креатора
          </h1>
          <p className="text-slate-400">
            {applications.length} заявок на розгляді
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Applications List */}
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-12 text-center">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-slate-300 text-lg">Немає заявок на розгляді</p>
            </div>
          ) : (
            applications.map((app) => (
              <div
                key={app.id}
                className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {app.user_name}
                    </h3>
                    <div className="flex gap-4 text-sm text-slate-400">
                      <span>ID: {app.user_id}</span>
                      {app.user_email && <span>📧 {app.user_email}</span>}
                      <span>
                        📅{' '}
                        {new Date(app.applied_at).toLocaleDateString('uk-UA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 rounded-lg text-sm">
                    На розгляді
                  </span>
                </div>

                {app.portfolio_url && (
                  <div className="mb-4">
                    <div className="text-slate-400 text-sm mb-1">Портфоліо:</div>
                    <a
                      href={app.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 break-all"
                    >
                      {app.portfolio_url}
                    </a>
                  </div>
                )}

                {app.motivation && (
                  <div className="mb-4">
                    <div className="text-slate-400 text-sm mb-1">
                      Мотиваційний лист:
                    </div>
                    <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 text-slate-300 whitespace-pre-wrap">
                      {app.motivation}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(app)}
                    disabled={processing}
                    className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    ✅ Схвалити
                  </button>
                  <button
                    onClick={() => {
                      setSelectedApp(app);
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

      {/* Reject Modal */}
      {showRejectModal && selectedApp && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50">
          <div className="bg-slate-800 border border-red-500/20 rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-4">
              Відхилити заявку
            </h2>
            <p className="text-slate-300 mb-4">
              Заявка від: <strong>{selectedApp.user_name}</strong>
            </p>

            <div className="mb-6">
              <label className="block text-slate-300 mb-2 font-medium">
                Причина відхилення
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                placeholder="Наприклад: недостатньо досвіду..."
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors resize-none"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setSelectedApp(null);
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
