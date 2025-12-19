'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';

const slideVariants = {
  hidden: { opacity: 0, x: 300 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -300 },
};

const Onboarding = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(0);
  const { t } = useTranslation();
  const router = useRouter();

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
      icon: '💳',
      title: t('onboarding.topup.title'),
      description: t('onboarding.topup.description'),
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
    onComplete();
    // Після онбордингу можна перекинути на гаманець, щоб юзер одразу побачив нову систему
    router.push('/profile/wallet');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[60] flex flex-col justify-between bg-white dark:bg-[#1A1A23] p-6"
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
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="text-7xl mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-full"
          >
            {slides[step].icon}
          </motion.div>

          <h2 className="text-3xl font-bold mb-4 text-zinc-900 dark:text-white leading-tight">
            {slides[step].title}
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-sm text-lg leading-relaxed">
            {slides[step].description}
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="flex flex-col items-center w-full">
        {/* Індикатор прогресу */}
        <div className="flex justify-center space-x-3 mb-8">
            {slides.map((_, i) => (
            <motion.div
                key={i}
                animate={{
                    scale: i === step ? 1.2 : 1,
                    backgroundColor: i === step ? '#2563EB' : 'var(--muted-bg, #E4E4E7)'
                }}
                className={`h-2.5 rounded-full transition-colors ${i === step ? 'w-8' : 'w-2.5 dark:bg-zinc-700'}`}
            />
            ))}
        </div>

        <div className="w-full space-y-3">
            <button
                onClick={handleNext}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30 text-lg"
            >
                {step === slides.length - 1 ? t('onboarding.buttons.finish') : t('onboarding.buttons.next')}
            </button>

            {step < slides.length - 1 && (
                <button
                    onClick={handleFinish}
                    className="w-full text-zinc-500 dark:text-zinc-400 font-medium py-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                    {t('onboarding.buttons.skip')}
                </button>
            )}
        </div>
      </div>
    </motion.div>
  );
};

export default Onboarding;