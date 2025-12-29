/**
 * Feature flags для контролю функціональності додатку
 */

// Чи увімкнена підписка
export const SUBSCRIPTION_ENABLED = process.env.NEXT_PUBLIC_SUBSCRIPTION_ENABLED === 'true';

// Чи увімкнений маркетплейс креаторів
export const MARKETPLACE_ENABLED = process.env.NEXT_PUBLIC_MARKETPLACE_ENABLED === 'true';

// Перевірка чи feature увімкнений
export const isFeatureEnabled = (feature: 'subscription' | 'marketplace'): boolean => {
  switch (feature) {
    case 'subscription':
      return SUBSCRIPTION_ENABLED;
    case 'marketplace':
      return MARKETPLACE_ENABLED;
    default:
      return false;
  }
};
