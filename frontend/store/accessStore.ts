// frontend/store/accessStore.ts

import { create } from 'zustand';
import { profileAPI } from '@/lib/api';

interface AccessState {
  accessibleProductIds: Set<number>;
  fetchAccessStatus: (productIds: number[]) => Promise<void>;
  checkAccess: (productId: number) => boolean;
}

export const useAccessStore = create<AccessState>((set, get) => ({
  accessibleProductIds: new Set(),

  fetchAccessStatus: async (productIds) => {
    if (productIds.length === 0) return;
    try {
      const currentIds = get().accessibleProductIds;
      const idsToFetch = productIds.filter(id => !currentIds.has(id));

      if (idsToFetch.length === 0) return;

      const response = await profileAPI.checkAccess(idsToFetch);

      set(state => ({
        accessibleProductIds: new Set([...state.accessibleProductIds, ...response.accessible_product_ids])
      }));
    } catch (error) {
      console.error("Failed to fetch product access status:", error);
    }
  },

  checkAccess: (productId: number) => {
    return get().accessibleProductIds.has(productId);
  }
}));