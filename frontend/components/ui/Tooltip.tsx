'use client';

import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export default function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200,
}: TooltipProps) {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return {
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '8px',
        };
      case 'bottom':
        return {
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '8px',
        };
      case 'left':
        return {
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginRight: '8px',
        };
      case 'right':
        return {
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginLeft: '8px',
        };
      default:
        return {};
    }
  };

  const getAnimationProps = () => {
    switch (position) {
      case 'top':
        return { initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 } };
      case 'bottom':
        return { initial: { opacity: 0, y: -4 }, animate: { opacity: 1, y: 0 } };
      case 'left':
        return { initial: { opacity: 0, x: 4 }, animate: { opacity: 1, x: 0 } };
      case 'right':
        return { initial: { opacity: 0, x: -4 }, animate: { opacity: 1, x: 0 } };
      default:
        return { initial: { opacity: 0 }, animate: { opacity: 1 } };
    }
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            {...getAnimationProps()}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap pointer-events-none"
            style={{
              ...getPositionStyles(),
              backgroundColor: theme.colors.text,
              color: theme.colors.bg,
              borderRadius: theme.radius.md,
              boxShadow: theme.shadows.md,
            }}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}