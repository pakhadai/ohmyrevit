'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { useTheme } from '@/lib/theme';

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface SelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  fullWidth?: boolean;
}

export default function Select({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  label,
  error,
  disabled = false,
  fullWidth = true,
}: SelectProps) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ width: fullWidth ? '100%' : 'auto' }}
    >
      {label && (
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: theme.colors.textSecondary }}
        >
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full flex items-center justify-between gap-2 transition-all"
        style={{
          padding: '0.75rem 1rem',
          backgroundColor: theme.colors.surface,
          color: selectedOption ? theme.colors.text : theme.colors.textMuted,
          border: `1px solid ${error ? theme.colors.error : isOpen ? theme.colors.primary : theme.colors.border}`,
          borderRadius: theme.radius.lg,
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <span className="flex items-center gap-2 truncate text-sm">
          {selectedOption?.icon}
          {selectedOption?.label || placeholder}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={18} style={{ color: theme.colors.textMuted }} />
        </motion.div>
      </button>

      {error && (
        <p className="mt-1.5 text-xs" style={{ color: theme.colors.error }}>
          {error}
        </p>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 py-1 max-h-60 overflow-y-auto"
            style={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.lg,
              boxShadow: theme.shadows.lg,
            }}
          >
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => !option.disabled && handleSelect(option.value)}
                disabled={option.disabled}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors"
                style={{
                  backgroundColor: value === option.value ? theme.colors.primaryLight : 'transparent',
                  color: option.disabled ? theme.colors.textMuted : theme.colors.text,
                  opacity: option.disabled ? 0.5 : 1,
                  cursor: option.disabled ? 'not-allowed' : 'pointer',
                }}
              >
                <span className="flex items-center gap-2">
                  {option.icon}
                  {option.label}
                </span>
                {value === option.value && (
                  <Check size={16} style={{ color: theme.colors.primary }} />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}