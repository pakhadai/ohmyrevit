// frontend/components/Onboarding.tsx
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
      title: t('onboarding.subscription.title'),
      description: t('onboarding.subscription.description'),
    },
  ];

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleSubscription = () => {
    onComplete();
    router.push('/subscription');
  };

  const handleFinish = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-white dark:bg-zinc-900 p-6">
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
          <div className="text-7xl mb-6">{slides[step].icon}</div>
          <h2 className="text-3xl font-bold mb-4 text-zinc-900 dark:text-white">
            {slides[step].title}
          </h2>
          <p className="text-zinc-600 dark:text-zinc-300 max-w-sm">
            {slides[step].description}
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-center space-x-2 mb-6">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === step ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-600'
            }`}
          />
        ))}
      </div>

      <div className="flex flex-col items-center w-full">
        {step === slides.length - 1 ? (
          <>
            <button
              onClick={handleSubscription}
              className="w-full max-w-md bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors mb-3"
            >
              {t('onboarding.subscription.cta')}
            </button>
            <button
              onClick={handleFinish}
              className="w-full max-w-md text-zinc-500 font-medium py-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {t('onboarding.buttons.skip')}
            </button>
          </>
        ) : (
          <button
            onClick={handleNext}
            className="w-full max-w-md bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors"
          >
            {t('onboarding.buttons.next')}
          </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;