import { create } from 'zustand';
import { profileAPI } from '@/lib/api';
import { Collection } from '@/types';
import toast from 'react-hot-toast';
import i18n from '@/lib/i18n'; // ДОДАНО

interface CollectionState {
  collections: Collection[];
  favoritedProductIds: Set<number>;
  isInitialized: boolean;
  fetchInitialData: () => Promise<void>;
  addCollection: (name: string, color: string) => Promise<Collection | null>;
  deleteCollection: (id: number) => Promise<void>;
  addProductToCollection: (collectionId: number, productId: number) => Promise<void>;
  removeProductFromCollection: (collectionId: number, productId: number) => Promise<void>;
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  collections: [],
  favoritedProductIds: new Set(),
  isInitialized: false,

  fetchInitialData: async () => {
    if (get().isInitialized) return;
    try {
      const collectionsData = await profileAPI.getCollections();
      const favoritedIdsData = await profileAPI.getFavoritedProductIds();
      set({
        collections: collectionsData,
        favoritedProductIds: new Set(favoritedIdsData.favorited_ids),
        isInitialized: true,
      });
    } catch (error) {
      console.error("Failed to fetch collections initial data:", error);
    }
  },

  addCollection: async (name, color) => {
    try {
      const newCollection = await profileAPI.createCollection({ name, color });
      set(state => ({ collections: [...state.collections, newCollection] }));
      toast.success(i18n.t('toasts.collectionCreated', { name }));
      return newCollection;
    } catch (error: any) {
      toast.error(error.message || i18n.t('toasts.collectionCreateError'));
      return null;
    }
  },

  deleteCollection: async (id: number) => {
    try {
      await profileAPI.deleteCollection(id);
      set(state => ({
        collections: state.collections.filter(c => c.id !== id)
      }));
      toast.success(i18n.t('toasts.collectionDeleted'));
    } catch (error) {
      toast.error(i18n.t('toasts.collectionDeleteError'));
    }
  },

  addProductToCollection: async (collectionId, productId) => {
    await profileAPI.addProductToCollection(collectionId, productId);
    set(state => ({
      favoritedProductIds: new Set(state.favoritedProductIds).add(productId),
      collections: state.collections.map(c =>
        c.id === collectionId ? { ...c, products_count: c.products_count + 1 } : c
      ),
    }));
  },

  removeProductFromCollection: async (collectionId, productId) => {
    await profileAPI.removeProductFromCollection(collectionId, productId);
    set(state => ({
        collections: state.collections.map(c =>
          c.id === collectionId ? { ...c, products_count: Math.max(0, c.products_count - 1) } : c
        ),
    }));
    const favoritedIdsData = await profileAPI.getFavoritedProductIds();
    set({ favoritedProductIds: new Set(favoritedIdsData.favorited_ids) });
  },
}));