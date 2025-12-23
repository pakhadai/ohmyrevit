'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Gift, CheckCircle2, MessageCircle } from 'lucide-react';

const slideVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
};

const Onboarding = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(0);
  const { t } = useTranslation();
  const router = useRouter();

  // Отримуємо юзернейм бота з ENV
  const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'Eduardi_bot';

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  const slides = [
    {
      icon: '📦',
      title: t('onboarding.welcome.title', 'Ласкаво просимо!'),
      description: t('onboarding.welcome.description', 'Ваше джерело Revit контенту.'),
    },
    {
      icon: '✨',
      title: t('onboarding.features.title', 'Преміум контент'),
      description: t('onboarding.features.description', 'Доступ до ексклюзивних сімейств.'),
    },
    {
      icon: '💎',
      title: t('onboarding.coins.title', 'Система бонусів'),
      description: t('onboarding.coins.description', 'Отримуйте монети за активність.'),
    },
    {
      // Фінальний слайд
      isFinal: true,
      customIcon: (
        <div className="relative inline-block">
          <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 animate-pulse">
            <MessageCircle size={48} />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2 rounded-full border-4 border-white dark:border-[#1A1A23]">
            <CheckCircle2 size={24} />
          </div>
        </div>
      ),
      title: "Останній крок!",
      description: "Щоб зберегти прогрес та завершити реєстрацію, перейдіть до бота.",
    },
  ];

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    onComplete(); // Фіксуємо проходження онбордингу

    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const botUrl = `https://t.me/${botUsername}`;

      // Використовуємо openTelegramLink для явного переходу в чат
      try {
        window.Telegram.WebApp.openTelegramLink(botUrl);
      } catch (e) {
        // Fallback, якщо метод недоступний
        window.open(botUrl, '_blank');
      }
    } else {
      // Fallback для браузера
      router.push('/profile/wallet');
    }
  };

  const currentSlide = slides[step];
  const isLastStep = step === slides.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="fixed inset-0 z-[60] flex flex-col justify-between bg-white dark:bg-[#1A1A23] p-6 pb-10"
    >
      {/* Контент слайду */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={slideVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center text-center flex-grow"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="mb-8"
          >
            {currentSlide.customIcon ? (
              currentSlide.customIcon
            ) : (
              <span className="text-7xl p-6 bg-gray-50 dark:bg-gray-800 rounded-full block">
                {currentSlide.icon}
              </span>
            )}
          </motion.div>

          <h2 className="text-3xl font-bold mb-4 text-zinc-900 dark:text-white leading-tight">
            {currentSlide.title}
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-xs text-lg leading-relaxed mx-auto">
            {currentSlide.description}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Нижня частина: Індикатор + Кнопка */}
      <div className="flex flex-col items-center w-full">
        {/* Індикатор */}
        <div className="flex justify-center space-x-2 mb-8">
          {slides.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                width: i === step ? 32 : 8,
                backgroundColor: i === step ? '#2563EB' : 'var(--muted-bg, #E4E4E7)',
                opacity: i === step ? 1 : 0.4
              }}
              className="h-2 rounded-full transition-all duration-300 dark:bg-zinc-700"
            />
          ))}
        </div>

        {/* Кнопка (Одна на всіх екранах для стабільності) */}
        <div className="w-full pb-4">
          <button
            onClick={handleNext}
            className={`w-full font-bold py-4 rounded-2xl transition-all shadow-lg text-lg active:scale-[0.98] flex items-center justify-center gap-2 ${
              isLastStep
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/30'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
            }`}
          >
            {isLastStep ? (
              <>
                <span>Активувати бота</span>
                <MessageCircle size={20} className="ml-1 opacity-80" />
              </>
            ) : (
              t('onboarding.buttons.next', 'Далі')
            )}
          </button>

          {/* Підказка для останнього кроку замість кнопки пропуску */}
          {isLastStep && (
             <p className="text-xs text-center text-muted-foreground mt-3 animate-pulse">
               Натисніть "Start" у чаті після переходу
             </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Onboarding;