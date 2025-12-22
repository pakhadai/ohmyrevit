'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Gift, CheckCircle2 } from 'lucide-react';

const slideVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
};

const Onboarding = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(0);
  const { t } = useTranslation();
  const router = useRouter();

  // Перевірка наявності Telegram WebApp
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
    }
  }, []);

  const slides = [
    {
      icon: '📦',
      title: t('onboarding.welcome.title'),
      description: t('onboarding.welcome.description'),
    },
    {
      icon: '✨',
      title: t('onboarding.features.title'),
      description: t('onboarding.features.description'),
    },
    {
      icon: '💎',
      title: t('onboarding.coins.title'),
      description: t('onboarding.coins.description'),
    },
    {
      // Фінальний слайд (Варіант А з вашого ТЗ)
      customIcon: <div className="relative">
        <Gift size={80} className="text-orange-500 animate-pulse" />
        <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1 border-4 border-white dark:border-[#1A1A23]">
          <CheckCircle2 size={24} className="text-white" />
        </div>
      </div>,
      title: "Реферал зараховано! +30 💎",
      description: "Щоб монети потрапили на баланс, активуйте бота в чаті.",
      isFinal: true
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
    // Логіка для фінального кроку: закриття Mini App
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      // Спочатку відмічаємо онбординг як пройдений у стані
      onComplete();
      // Закриваємо додаток, щоб користувач потрапив у чат для натискання /start
      window.Telegram.WebApp.close();
    } else {
      // Fallback для вебу (якщо відкрили не в Telegram)
      onComplete();
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
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[60] flex flex-col justify-between bg-white dark:bg-[#1A1A23] p-6 pb-10 safe-area-bottom"
    >
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
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-full"
          >
            {currentSlide.customIcon || <span className="text-7xl">{currentSlide.icon}</span>}
          </motion.div>

          <h2 className="text-3xl font-bold mb-4 text-zinc-900 dark:text-white leading-tight">
            {currentSlide.title}
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-xs text-lg leading-relaxed mx-auto">
            {currentSlide.description}
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="flex flex-col items-center w-full">
        {/* Індикатор прогресу */}
        <div className="flex justify-center space-x-2 mb-8">
            {slides.map((_, i) => (
            <motion.div
                key={i}
                animate={{
                    width: i === step ? 32 : 10,
                    backgroundColor: i === step ? '#2563EB' : 'var(--muted-bg, #E4E4E7)',
                    opacity: i === step ? 1 : 0.5
                }}
                className="h-2.5 rounded-full transition-all duration-300 dark:bg-zinc-700"
            />
            ))}
        </div>

        {/* Фіксований контейнер для кнопок, щоб уникнути стрибків */}
        <div className="w-full flex flex-col gap-3 min-h-[120px] justify-end">
            <button
                onClick={handleNext}
                className={`w-full font-bold py-4 rounded-2xl transition-all shadow-lg text-lg active:scale-[0.98] ${
                  isLastStep
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/30'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
                }`}
            >
                {isLastStep ? 'Забрати бонуси' : t('onboarding.buttons.next')}
            </button>

            {/* Невидимий блок (Spacer) замість кнопки Skip на останньому кроці */}
            {!isLastStep ? (
                <button
                    onClick={handleFinish}
                    className="w-full text-zinc-500 dark:text-zinc-400 font-medium py-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                    {t('onboarding.buttons.skip')}
                </button>
            ) : (
                <div className="h-[52px] w-full flex items-center justify-center">
                   <span className="text-xs text-muted-foreground animate-pulse">
                     Натисніть кнопку вище, щоб повернутися в чат
                   </span>
                </div>
            )}
        </div>
      </div>
    </motion.div>
  );
};

export default Onboarding;