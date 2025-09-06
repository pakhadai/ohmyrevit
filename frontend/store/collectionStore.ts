// ЗАМІНА БЕЗ ВИДАЛЕНЬ: старі рядки — закоментовано, нові — додано нижче
import { create } from 'zustand';
import { profileAPI } from '@/lib/api';
import { Collection } from '@/types';
import toast from 'react-hot-toast';

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
      toast.success(`Колекцію "${name}" створено`);
      return newCollection;
    } catch (error: any) {
      toast.error(error.message || "Не вдалося створити колекцію");
      return null;
    }
  },

  deleteCollection: async (id: number) => {
    try {
      await profileAPI.deleteCollection(id);
      set(state => ({
        collections: state.collections.filter(c => c.id !== id)
      }));
      toast.success("Колекцію видалено");
    } catch (error) {
      toast.error("Не вдалося видалити колекцію");
    }
  },

  addProductToCollection: async (collectionId, productId) => {
    await profileAPI.addProductToCollection(collectionId, productId);
    set(state => ({
      favoritedProductIds: new Set(state.favoritedProductIds).add(productId),
      // Оновлюємо лічильник
      collections: state.collections.map(c =>
        c.id === collectionId ? { ...c, products_count: c.products_count + 1 } : c
      ),
    }));
  },

  removeProductFromCollection: async (collectionId, productId) => {
    await profileAPI.removeProductFromCollection(collectionId, productId);
    // Оновлюємо лічильник
    set(state => ({
        collections: state.collections.map(c =>
          c.id === collectionId ? { ...c, products_count: Math.max(0, c.products_count - 1) } : c
        ),
    }));
    // Перезапитуємо ID, щоб коректно оновити статус сердечка
    const favoritedIdsData = await profileAPI.getFavoritedProductIds();
    set({ favoritedProductIds: new Set(favoritedIdsData.favorited_ids) });
  },
}));