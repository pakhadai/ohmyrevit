'use client';

import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTheme } from '@/lib/theme';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  showClose?: boolean;
  closeOnBackdrop?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true,
  closeOnBackdrop = true,
}: ModalProps) {
  const { theme } = useTheme();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { maxWidth: '320px' };
      case 'md':
        return { maxWidth: '420px' };
      case 'lg':
        return { maxWidth: '560px' };
      case 'full':
        return { maxWidth: '100%', margin: '0', height: '100%', borderRadius: 0 };
      default:
        return { maxWidth: '420px' };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={closeOnBackdrop ? onClose : undefined}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full"
            style={{
              ...getSizeStyles(),
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: size === 'full' ? 0 : theme.radius['2xl'],
              boxShadow: theme.shadows.xl,
            }}
          >
            {(title || showClose) && (
              <div
                className="flex items-center justify-between p-5"
                style={{ borderBottom: `1px solid ${theme.colors.border}` }}
              >
                {title && (
                  <h2 className="text-lg font-bold" style={{ color: theme.colors.text }}>
                    {title}
                  </h2>
                )}
                {showClose && (
                  <button
                    onClick={onClose}
                    className="p-2 transition-colors ml-auto"
                    style={{
                      color: theme.colors.textMuted,
                      borderRadius: theme.radius.md,
                    }}
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            )}
            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}