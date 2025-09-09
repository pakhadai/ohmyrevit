// ЗАМІНА БЕЗ ВИДАЛЕНЬ: старі рядки — закоментовано, нові — додано нижче
import axios, { AxiosInstance } from 'axios';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

// ===== ІНТЕРФЕЙСИ =====
export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  product_type: 'free' | 'premium';
  main_image_url: string;
  gallery_image_urls: string[];
  zip_file_path?: string; // ДОДАНО - було відсутнє
  file_size_mb: number;
  compatibility?: string;
  is_on_sale: boolean;
  sale_price?: number;
  actual_price?: number;
  categories: Category[];
  views_count: number;
  downloads_count: number;
  created_at?: string;
}

export interface ProductCreate {
  title_uk: string;
  description_uk: string;
  price: number;
  product_type: string;
  main_image_url: string;
  gallery_image_urls: string[];
  zip_file_path: string;
  file_size_mb: number;
  compatibility?: string;
  is_on_sale: boolean;
  sale_price?: number | null;
  category_ids: number[];
}

export interface ProductUpdate extends Partial<ProductCreate> {}

// ===== API CLIENT =====
const createAPIClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://dev.ohmyrevit.pp.ua/api/v1',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor
  instance.interceptors.request.use(
    (config) => {
      const token = useAuthStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // # OLD: Додаємо мову
      // # OLD: try {
      // # OLD:   const languageStorage = localStorage.getItem('language-storage');
      // # OLD:   if (languageStorage) {
      // # OLD:     const langData = JSON.parse(languageStorage);
      // # OLD:     if (langData.state?.language) {
      // # OLD:       config.headers['Accept-Language'] = langData.state.language;
      // # OLD:     }
      // # OLD:   }
      // # OLD: } catch (e) {
      // # OLD:   console.error("Could not parse language from localStorage", e);
      // # OLD: }
      // ВИПРАВЛЕННЯ: Надійна логіка для читання мови з localStorage, що підтримує i18next та Zustand
      try {
        const languageStorage = localStorage.getItem('language-storage');
        if (languageStorage) {
            let lang: string | undefined;
            // Спершу пробуємо парсити як JSON (формат Zustand)
            try {
                const persistedState = JSON.parse(languageStorage);
                lang = persistedState?.state?.language;
            } catch (jsonError) {
                // Якщо не вдалося, можливо це простий рядок (формат i18next-browser-languagedetector)
                // Видаляємо лапки, якщо вони є
                const rawValue = languageStorage.replace(/"/g, '');
                if (['uk', 'en', 'ru'].includes(rawValue)) {
                    lang = rawValue;
                }
            }

            if (lang) {
                config.headers['Accept-Language'] = lang;
            }
        }
      } catch (e) {
          console.error("Could not determine language from localStorage", e);
      }


      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
        return Promise.reject(error);
      }

      if (error.response?.status === 401) {
        useAuthStore.getState().logout();
        toast.error('Сесія закінчилась. Будь ласка, увійдіть знову.');
      } else if (error.response?.status === 403) {
        toast.error('У вас немає доступу до цієї дії');
      } else if (error.response?.status === 500) {
        toast.error('Помилка сервера. Спробуйте пізніше.');
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

const api = createAPIClient();
const getData = (response: any) => response.data;

// ===== AUTH API =====
export const authAPI = {
  loginTelegram: async (initData: any) => {
    const response = await api.post('/auth/telegram', initData);
    return getData(response);
  },
};

// ===== PRODUCTS API =====
export const productsAPI = {
  getProducts: async (params?: {
    category_id?: number;
    product_type?: string;
    is_on_sale?: boolean;
    min_price?: number;
    max_price?: number;
    sort?: string;
    limit?: number;
    offset?: number;
  }) => {
    return getData(await api.get('/products', { params }));
  },

  getProductById: async (id: string | number, lang?: string) => {
    const config: any = {};
    if (lang) {
      config.headers = { 'Accept-Language': lang };
    }
    return getData(await api.get(`/products/${id}`, config));
  },

  getCategories: async () => {
    return getData(await api.get('/products/categories'));
  },
};

// ===== ORDERS API =====
export const ordersAPI = {
  createCheckout: async (data: {
    product_ids: number[];
    promo_code?: string | null;
    use_bonus_points?: number | null;
  }) => {
    return getData(await api.post('/orders/checkout', data));
  },

  applyDiscount: async (data: {
    product_ids: number[];
    promo_code?: string | null;
    use_bonus_points?: number;
  }) => {
    return getData(await api.post('/orders/promo/apply', data));
  },
};

// ===== PROFILE API =====
export const profileAPI = {
  getProfile: async () => {
    return getData(await api.get('/profile/me'));
  },

  updateProfile: async (data: { email?: string; phone?: string }) => {
    return getData(await api.patch('/profile/me', data));
  },

  getDownloads: async () => {
    return getData(await api.get('/profile/downloads'));
  },

  downloadProduct: async (productId: number) => {
    return getData(await api.get(`/profile/download/${productId}`));
  },

  getCollections: async () => {
    return getData(await api.get('/profile/collections'));
  },

  getCollectionDetails: async (id: number) => {
    return getData(await api.get(`/profile/collections/${id}`));
  },

  createCollection: async (data: { name: string; color: string }) => {
    return getData(await api.post('/profile/collections', data));
  },

  deleteCollection: async (id: number) => {
    return getData(await api.delete(`/profile/collections/${id}`));
  },

  addProductToCollection: async (collectionId: number, productId: number) => {
    return getData(await api.post(`/profile/collections/${collectionId}/products/${productId}`));
  },

  removeProductFromCollection: async (collectionId: number, productId: number) => {
    return getData(await api.delete(`/profile/collections/${collectionId}/products/${productId}`));
  },

  getFavoritedProductIds: async () => {
    return getData(await api.get('/profile/collections/product-ids'));
  },

  getBonusInfo: async () => {
    return getData(await api.get('/profile/bonus/info'));
  },

  claimDailyBonus: async () => {
    return getData(await api.post('/profile/bonus/claim'));
  },

  checkAccess: async (productIds: number[]) => {
    return getData(await api.post('/profile/check-access', { product_ids: productIds }));
  },

  // ДОДАНО: Новий метод для реферальної системи
  getReferralInfo: async () => {
    return getData(await api.get('/profile/referrals'));
  },
};

// ===== SUBSCRIPTIONS API =====
export const subscriptionsAPI = {
  checkout: async () => {
    return getData(await api.post('/subscriptions/checkout'));
  },

  getStatus: async () => {
    return getData(await api.get('/subscriptions/status'));
  },
};

// ===== ADMIN API =====
export const adminAPI = {
  getDashboardStats: async () => {
    return getData(await api.get('/admin/dashboard/stats'));
  },

  // Users
  getUsers: async (params?: { search?: string; skip?: number; limit?: number }) => {
    return getData(await api.get('/admin/users', { params }));
  },

  toggleUserAdmin: async (userId: number) => {
    return getData(await api.patch(`/admin/users/${userId}/toggle-admin`));
  },

  toggleUserActive: async (userId: number) => {
    return getData(await api.patch(`/admin/users/${userId}/toggle-active`));
  },

  addUserBonus: async (userId: number, amount: number, reason?: string) => {
    const formData = new FormData();
    formData.append('amount', amount.toString());
    if (reason) formData.append('reason', reason);

    const response = await api.post(`/admin/users/${userId}/add-bonus`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return getData(response);
  },

  giveSubscription: async (userId: number, days: number) => {
    return getData(await api.post(`/admin/users/${userId}/subscription`, { days }));
  },

  // Products - ВИПРАВЛЕНО
  createProduct: async (data: ProductCreate) => {
    return getData(await api.post('/admin/products', data));
  },

  updateProduct: async (id: string | number, data: ProductUpdate) => {
    // ВИПРАВЛЕНО: Правильно відправляємо JSON
    return getData(await api.put(`/admin/products/${id}`, data));
  },

  deleteProduct: async (id: string | number) => {
    return getData(await api.delete(`/admin/products/${id}`));
  },

  // File uploads - НОВІ МЕТОДИ
  uploadImage: async (file: File, oldPath?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (oldPath) formData.append('old_path', oldPath);

    const response = await api.post('/admin/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return getData(response);
  },

  uploadArchive: async (file: File, oldPath?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (oldPath) formData.append('old_path', oldPath);

    const response = await api.post('/admin/upload/archive', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return getData(response);
  },

  // Categories
  getCategories: async () => {
    return getData(await api.get('/admin/categories'));
  },

  createCategory: async (name: string, slug: string) => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('slug', slug);

    const response = await api.post('/admin/categories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return getData(response);
  },

  updateCategory: async (id: number, name?: string, slug?: string) => {
    const formData = new FormData();
    if (name) formData.append('name', name);
    if (slug) formData.append('slug', slug);

    const response = await api.put(`/admin/categories/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return getData(response);
  },

  deleteCategory: async (id: number) => {
    return getData(await api.delete(`/admin/categories/${id}`));
  },

  // Promo codes
  getPromoCodes: async () => {
    return getData(await api.get('/admin/promo-codes'));
  },

  createPromoCode: async (data: any) => {
    return getData(await api.post('/admin/promo-codes', data));
  },

  togglePromoCode: async (id: number) => {
    return getData(await api.patch(`/admin/promo-codes/${id}/toggle`));
  },

  deletePromoCode: async (id: number) => {
    return getData(await api.delete(`/admin/promo-codes/${id}`));
  },

  // Orders
  getOrders: async (params?: { skip?: number; limit?: number; status?: string }) => {
    return getData(await api.get('/admin/orders', { params }));
  },

  updateOrderStatus: async (id: number, status: string) => {
    const formData = new FormData();
    formData.append('status', status);

    const response = await api.patch(`/admin/orders/${id}/status`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return getData(response);
  },

  // Export
  exportUsersCSV: async () => {
    const response = await api.get('/admin/export/users', {
      responseType: 'blob'
    });
    return getData(response);
  },
};

export default api;