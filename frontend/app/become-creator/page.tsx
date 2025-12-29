'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { creatorsAPI } from '@/lib/api';
import { MARKETPLACE_ENABLED } from '@/lib/features';
import { useTheme } from '@/lib/theme';
import {
  ChevronLeft, ChevronRight, Check, X,
  Sparkles, TrendingUp, DollarSign, Users,
  Shield, FileText, ExternalLink, CheckCircle2,
  Briefcase, Rocket
} from 'lucide-react';
import toast from 'react-hot-toast';

// Типи для форми
interface FormData {
  portfolioUrl: string;
  motivation: string;
  experience: string;
  termsAccepted: boolean;
}

const STEPS = [
  { id: 'welcome', title: 'Вітаємо', icon: Sparkles },
  { id: 'terms', title: 'Правила', icon: Shield },
  { id: 'portfolio', title: 'Портфоліо', icon: Briefcase },
  { id: 'motivation', title: 'Досвід', icon: FileText },
  { id: 'submit', title: 'Завершення', icon: Rocket },
];

export default function BecomeCreatorPage() {
  const router = useRouter();
  const { theme, isDark } = useTheme();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [status, setStatus] = useState<any>(null);

  const [formData, setFormData] = useState<FormData>({
    portfolioUrl: '',
    motivation: '',
    experience: '',
    termsAccepted: false,
  });

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
        router.push('/creator/dashboard');
      }
    } catch (err: any) {
      console.error('Failed to check creator status:', err);
    }
  };

  const handleNext = () => {
    // Валідація перед переходом
    if (currentStep === 1 && !formData.termsAccepted) {
      toast.error('Потрібно погодитись з правилами');
      return;
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      await creatorsAPI.applyToBeCreator({
        portfolio_url: formData.portfolioUrl || undefined,
        motivation: `${formData.motivation}\n\nДосвід: ${formData.experience}` || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push('/profile');
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
      <div className="min-h-screen p-6" style={{ background: theme.colors.bgGradient }}>
        <div className="max-w-2xl mx-auto pt-20">
          <div
            className="rounded-[32px] p-8 text-center"
            style={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
              boxShadow: theme.shadows.lg,
            }}
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: theme.colors.orangeLight }}>
              <Shield size={48} style={{ color: theme.colors.orange }} />
            </div>
            <h1 className="text-3xl font-bold mb-4" style={{ color: theme.colors.text }}>
              Заявка на розгляді
            </h1>
            <p className="text-lg mb-8" style={{ color: theme.colors.textSecondary }}>
              Ваша заявка на статус креатора зараз розглядається адміністрацією.
              Ми повідомимо вас про результат найближчим часом.
            </p>
            <button
              onClick={() => router.push('/profile')}
              className="px-8 py-4 rounded-full font-bold transition-all hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.purple} 0%, ${theme.colors.pink} 100%)`,
                color: '#FFFFFF',
                boxShadow: theme.shadows.md,
              }}
            >
              Повернутися в профіль
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Рендер контенту кроку
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.purple} 0%, ${theme.colors.pink} 100%)`,
                }}>
                <Sparkles size={64} color="#FFFFFF" />
              </div>
              <h1 className="text-4xl font-bold mb-4" style={{ color: theme.colors.text }}>
                Станьте креатором OhMyRevit
              </h1>
              <p className="text-xl" style={{ color: theme.colors.textSecondary }}>
                Продавайте свої плагіни та заробляйте на тому, що вмієте
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: DollarSign, title: '85% доходу', desc: 'Отримуйте більшу частину від продажів' },
                { icon: Users, title: 'Глобальна аудиторія', desc: 'Тисячі користувачів Revit' },
                { icon: TrendingUp, title: 'Зростання', desc: 'Розвивайте свій бізнес' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-[24px] text-center"
                  style={{
                    backgroundColor: theme.colors.surface,
                    border: `1px solid ${theme.colors.border}`,
                  }}
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-[20px] flex items-center justify-center"
                    style={{ backgroundColor: theme.colors.purpleLight }}>
                    <item.icon size={32} style={{ color: theme.colors.purple }} />
                  </div>
                  <h3 className="font-bold mb-2" style={{ color: theme.colors.text }}>
                    {item.title}
                  </h3>
                  <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );

      case 1: // Terms
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: theme.colors.infoLight }}>
                <Shield size={40} style={{ color: theme.colors.info }} />
              </div>
              <h2 className="text-3xl font-bold mb-2" style={{ color: theme.colors.text }}>
                Правила для креаторів
              </h2>
              <p style={{ color: theme.colors.textSecondary }}>
                Перед тим як продовжити, ознайомтесь з правилами
              </p>
            </div>

            <div
              className="p-6 rounded-[24px] max-h-96 overflow-y-auto"
              style={{
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <div className="space-y-4">
                {[
                  { title: 'Мінімальна ціна', text: 'Мінімальна ціна товару — $2 (200 монет)' },
                  { title: 'Максимальний розмір', text: 'Максимальний розмір файлу — 10 MB' },
                  { title: 'Модерація', text: 'Всі товари проходять модерацію перед публікацією' },
                  { title: 'Комісія платформи', text: 'Ми беремо 15%, ви отримуєте 85% від кожного продажу' },
                  { title: 'Виплати', text: 'Мінімальна сума для виплати — $30 в USDT (TRC20/ERC20/BEP20)' },
                  { title: 'Якість', text: 'Товари повинні бути якісними та корисними для користувачів' },
                  { title: 'Підтримка', text: 'Ви зобов\'язані надавати базову підтримку покупцям' },
                  { title: 'Заборони', text: 'Заборонено продавати піратський контент, віруси, та порушувати авторські права' },
                ].map((rule, idx) => (
                  <div key={idx} className="flex gap-3">
                    <CheckCircle2 size={20} style={{ color: theme.colors.success, flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <p className="font-semibold" style={{ color: theme.colors.text }}>
                        {rule.title}
                      </p>
                      <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                        {rule.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <label
              className="flex items-start gap-3 p-4 rounded-[20px] cursor-pointer transition-all"
              style={{
                backgroundColor: formData.termsAccepted ? theme.colors.successLight : theme.colors.surface,
                border: `2px solid ${formData.termsAccepted ? theme.colors.success : theme.colors.border}`,
              }}
            >
              <input
                type="checkbox"
                checked={formData.termsAccepted}
                onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                className="mt-1 w-5 h-5 rounded accent-current"
                style={{ accentColor: theme.colors.success }}
              />
              <div>
                <p className="font-semibold" style={{ color: theme.colors.text }}>
                  Я погоджуюсь з правилами
                </p>
                <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  Я прочитав і приймаю всі умови роботи на платформі
                </p>
              </div>
            </label>
          </div>
        );

      case 2: // Portfolio
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: theme.colors.blueLight }}>
                <Briefcase size={40} style={{ color: theme.colors.blue }} />
              </div>
              <h2 className="text-3xl font-bold mb-2" style={{ color: theme.colors.text }}>
                Ваше портфоліо
              </h2>
              <p style={{ color: theme.colors.textSecondary }}>
                Покажіть свої попередні роботи (необов'язково)
              </p>
            </div>

            <div>
              <label className="block mb-2 font-medium" style={{ color: theme.colors.text }}>
                Посилання на портфоліо
              </label>
              <input
                type="url"
                value={formData.portfolioUrl}
                onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                placeholder="https://your-portfolio.com"
                className="w-full px-6 py-4 rounded-[20px] transition-all focus:outline-none"
                style={{
                  backgroundColor: theme.colors.surface,
                  border: `2px solid ${theme.colors.border}`,
                  color: theme.colors.text,
                }}
                onFocus={(e) => e.target.style.borderColor = theme.colors.purple}
                onBlur={(e) => e.target.style.borderColor = theme.colors.border}
              />
              <p className="text-sm mt-2" style={{ color: theme.colors.textMuted }}>
                GitHub, Behance, особистий сайт, або будь-яке інше посилання
              </p>
            </div>

            <div
              className="p-6 rounded-[24px]"
              style={{
                backgroundColor: theme.colors.infoLight,
                border: `1px solid ${theme.colors.info}20`,
              }}
            >
              <p className="text-sm" style={{ color: theme.colors.text }}>
                💡 <strong>Порада:</strong> Портфоліо допоможе нам краще зрозуміти ваш досвід і швидше розглянути заявку
              </p>
            </div>
          </div>
        );

      case 3: // Motivation
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: theme.colors.purpleLight }}>
                <FileText size={40} style={{ color: theme.colors.purple }} />
              </div>
              <h2 className="text-3xl font-bold mb-2" style={{ color: theme.colors.text }}>
                Розкажіть про себе
              </h2>
              <p style={{ color: theme.colors.textSecondary }}>
                Ваш досвід та мотивація
              </p>
            </div>

            <div>
              <label className="block mb-2 font-medium" style={{ color: theme.colors.text }}>
                Ваш досвід з Revit
              </label>
              <textarea
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                rows={4}
                placeholder="Скільки років працюєте з Revit? Які плагіни розробляли?"
                className="w-full px-6 py-4 rounded-[20px] transition-all focus:outline-none resize-none"
                style={{
                  backgroundColor: theme.colors.surface,
                  border: `2px solid ${theme.colors.border}`,
                  color: theme.colors.text,
                }}
                onFocus={(e) => e.target.style.borderColor = theme.colors.purple}
                onBlur={(e) => e.target.style.borderColor = theme.colors.border}
              />
            </div>

            <div>
              <label className="block mb-2 font-medium" style={{ color: theme.colors.text }}>
                Чому хочете стати креатором?
              </label>
              <textarea
                value={formData.motivation}
                onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                rows={6}
                placeholder="Що вас мотивує? Які плани на майбутнє?"
                className="w-full px-6 py-4 rounded-[20px] transition-all focus:outline-none resize-none"
                style={{
                  backgroundColor: theme.colors.surface,
                  border: `2px solid ${theme.colors.border}`,
                  color: theme.colors.text,
                }}
                onFocus={(e) => e.target.style.borderColor = theme.colors.purple}
                onBlur={(e) => e.target.style.borderColor = theme.colors.border}
              />
              <p className="text-sm mt-2" style={{ color: theme.colors.textMuted }}>
                Поділіться своїми ідеями та планами (необов'язково)
              </p>
            </div>
          </div>
        );

      case 4: // Submit
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.success} 0%, ${theme.colors.green} 100%)`,
                }}>
                <Rocket size={48} color="#FFFFFF" />
              </div>
              <h2 className="text-3xl font-bold mb-4" style={{ color: theme.colors.text }}>
                Все готово!
              </h2>
              <p className="text-lg" style={{ color: theme.colors.textSecondary }}>
                Перевірте вашу інформацію перед відправкою
              </p>
            </div>

            <div
              className="p-6 rounded-[24px] space-y-4"
              style={{
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: theme.colors.textMuted }}>
                  Портфоліо
                </p>
                <p style={{ color: theme.colors.text }}>
                  {formData.portfolioUrl || 'Не вказано'}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: theme.colors.textMuted }}>
                  Досвід
                </p>
                <p style={{ color: theme.colors.text }}>
                  {formData.experience || 'Не вказано'}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: theme.colors.textMuted }}>
                  Мотивація
                </p>
                <p style={{ color: theme.colors.text }}>
                  {formData.motivation || 'Не вказано'}
                </p>
              </div>
            </div>

            {error && (
              <div
                className="p-4 rounded-[20px]"
                style={{
                  backgroundColor: theme.colors.errorLight,
                  border: `1px solid ${theme.colors.error}`,
                }}
              >
                <p style={{ color: theme.colors.error }}>{error}</p>
              </div>
            )}

            {success && (
              <div
                className="p-6 rounded-[20px] text-center"
                style={{
                  backgroundColor: theme.colors.successLight,
                  border: `1px solid ${theme.colors.success}`,
                }}
              >
                <CheckCircle2 size={48} style={{ color: theme.colors.success }} className="mx-auto mb-4" />
                <p className="font-bold text-lg mb-2" style={{ color: theme.colors.success }}>
                  Заявку успішно подано!
                </p>
                <p style={{ color: theme.colors.text }}>
                  Перенаправляємо вас в профіль...
                </p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || success}
              className="w-full py-5 rounded-full font-bold text-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.purple} 0%, ${theme.colors.pink} 100%)`,
                color: '#FFFFFF',
                boxShadow: theme.shadows.lg,
              }}
            >
              {loading ? 'Відправка...' : 'Подати заявку'}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ background: theme.colors.bgGradient }}>
      <div className="max-w-4xl mx-auto pt-8 pb-24">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      idx === currentStep ? 'scale-110' : ''
                    }`}
                    style={{
                      backgroundColor: idx <= currentStep ? theme.colors.purple : theme.colors.surface,
                      border: `2px solid ${idx <= currentStep ? theme.colors.purple : theme.colors.border}`,
                    }}
                  >
                    {idx < currentStep ? (
                      <Check size={20} color="#FFFFFF" />
                    ) : (
                      <step.icon size={20} color={idx === currentStep ? '#FFFFFF' : theme.colors.textMuted} />
                    )}
                  </div>
                  <p
                    className="text-xs mt-2 font-medium hidden md:block"
                    style={{ color: idx <= currentStep ? theme.colors.text : theme.colors.textMuted }}
                  >
                    {step.title}
                  </p>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className="flex-1 h-0.5 mx-2"
                    style={{
                      backgroundColor: idx < currentStep ? theme.colors.purple : theme.colors.border,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div
          className="rounded-[32px] p-8 mb-8"
          style={{
            backgroundColor: theme.colors.card,
            border: `1px solid ${theme.colors.border}`,
            boxShadow: theme.shadows.xl,
          }}
        >
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-6 py-4 rounded-full font-semibold transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
              color: theme.colors.text,
            }}
          >
            <ChevronLeft size={20} />
            <span className="hidden sm:inline">Назад</span>
          </button>

          <div className="flex-1 text-center">
            <p className="text-sm font-medium" style={{ color: theme.colors.textMuted }}>
              Крок {currentStep + 1} з {STEPS.length}
            </p>
          </div>

          {currentStep < STEPS.length - 1 && (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-4 rounded-full font-semibold transition-all hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.purple} 0%, ${theme.colors.pink} 100%)`,
                color: '#FFFFFF',
                boxShadow: theme.shadows.md,
              }}
            >
              <span className="hidden sm:inline">Далі</span>
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
