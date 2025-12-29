'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { creatorsAPI } from '@/lib/api';
import { MARKETPLACE_ENABLED } from '@/lib/features';

export default function BecomeCreatorPage() {
  const router = useRouter();
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [motivation, setMotivation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    if (!MARKETPLACE_ENABLED) {
      router.push('/');
      return;
    }
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const data = await creatorsAPI.getStatus();
      setStatus(data);

      if (data.is_creator) {
        // Вже є креатором - редирект на дашборд
        router.push('/creator/dashboard');
      }
    } catch (err: any) {
      console.error('Failed to check creator status:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      await creatorsAPI.applyToBeCreator({
        portfolio_url: portfolioUrl || undefined,
        motivation: motivation || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не вдалося подати заявку');
    } finally {
      setLoading(false);
    }
  };

  if (!MARKETPLACE_ENABLED) {
    return null;
  }

  if (status?.has_pending_application) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Заявка на розгляді
            </h1>
            <p className="text-slate-300 text-lg mb-6">
              Ваша заявка на статус креатора зараз розглядається адміністрацією.
              Ми повідомимо вас про результат найближчим часом.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              Повернутися на головну
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Стати креатором
          </h1>
          <p className="text-slate-300 text-lg">
            Продавайте свої плагіни та заробляйте 85% від кожного продажу
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 text-center">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="font-bold text-white mb-2">85% доходу</h3>
            <p className="text-slate-400 text-sm">
              Ви отримуєте 85% від кожного продажу
            </p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 text-center">
            <div className="text-4xl mb-3">🌍</div>
            <h3 className="font-bold text-white mb-2">Глобальна аудиторія</h3>
            <p className="text-slate-400 text-sm">
              Доступ до тисяч користувачів Revit
            </p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 text-center">
            <div className="text-4xl mb-3">💳</div>
            <h3 className="font-bold text-white mb-2">USDT виплати</h3>
            <p className="text-slate-400 text-sm">
              Швидкі виплати в криптовалюті
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Заявка на статус креатора</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-slate-300 mb-2 font-medium">
                Портфоліо (необов'язково)
              </label>
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://your-portfolio.com"
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
              <p className="text-slate-500 text-sm mt-2">
                Посилання на ваше портфоліо, GitHub, Behance тощо
              </p>
            </div>

            <div>
              <label className="block text-slate-300 mb-2 font-medium">
                Мотиваційний лист (необов'язково)
              </label>
              <textarea
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                rows={6}
                placeholder="Розкажіть про свій досвід розробки плагінів для Revit..."
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
              />
              <p className="text-slate-500 text-sm mt-2">
                Опишіть свій досвід та чому ви хочете стати креатором
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <p className="text-green-400 text-sm">
                  ✅ Заявку успішно подано! Перенаправляємо на головну...
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/50"
            >
              {loading ? 'Відправка...' : 'Подати заявку'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <h3 className="font-bold text-white mb-3">Вимоги:</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                <span>Мінімальна ціна товару: $2 (200 монет)</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                <span>Максимальний розмір файлу: 10 MB</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                <span>Мінімальна сума для виплати: $30</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                <span>Комісія платформи: 15%</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
