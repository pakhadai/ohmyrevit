'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Gift, Gem, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const { t } = useTranslation();

  const steps = [
    {
      icon: Gem,
      title: t('onboarding.step1.title'),
      description: t('onboarding.step1.description'),
    },
    {
      icon: Award,
      title: t('onboarding.step2.title'),
      description: t('onboarding.step2.description'),
    },
    {
      icon: Gift,
      title: t('onboarding.step3.title'),
      description: t('onboarding.step3.description'),
    },
    {
      icon: CheckCircle,
      title: t('onboarding.step4.title'),
      description: t('onboarding.step4.description'),
    },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const CurrentIcon = steps[step].icon;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        key={step}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-8 text-center"
      >
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full mx-auto flex items-center justify-center mb-6">
          <CurrentIcon className="w-8 h-8 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{steps[step].title}</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8">{steps[step].description}</p>

        <div className="flex justify-center items-center gap-3 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === step ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
        >
          {step < steps.length - 1 ? t('common.next') : t('common.start')}
        </button>
      </motion.div>
    </div>
  );
}