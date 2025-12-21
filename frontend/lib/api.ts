import axios, { AxiosInstance } from 'axios';
import { useAuthStore } from '@/store/authStore';
import {
  CoinPack,
  WalletInfo,
  TransactionListResponse,
  CheckoutResponse,
  ApplyDiscountResponse,
  SubscriptionCheckoutResponse,
  SubscriptionPriceInfo,
  SubscriptionStatus,
  AuthResponse
} from '@/types';

// Типи для продуктів та категорій (можна винести в types/index.ts, але залишаємо тут для сумісності)
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
  productType: 'free' | 'premium';
  mainImageUrl: string;
  galleryImageUrls: string[];
  zipFilePath?: string;
  fileSizeMb: number;
  compatibility?: string;
  isOnSale: boolean;
  salePrice?: number;
  actualPrice?: number;
  categories: Category[];
  viewsCount: number;
  downloadsCount: number;
  createdAt?: string;
}

// Черга для запитів, що не вдалися (поки що проста реалізація)
let failedQueue: any[] = [];

const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
if (!envApiUrl && process.env.NODE_ENV === 'production') {
  console.error("CRITICAL: NEXT_PUBLIC_API_URL is not defined!");
}

const API_URL = envApiUrl || 'http://localhost:8000/api/v1';

const createAPIClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request Interceptor: Додає токен та мову
  instance.interceptors.request.use(
    (config) => {
      const token = useAuthStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      try {
        const languageStorage = localStorage.getItem('language-storage');
        if (languageStorage) {
          let lang: string | undefined;
          try {
            const persistedState = JSON.parse(languageStorage);
            lang = persistedState?.state?.language;
          } catch (jsonError) {
            const rawValue = languageStorage.replace(/"/g, '');
            if (['uk', 'en', 'ru', 'de', 'es'].includes(rawValue)) {
              lang = rawValue;
            }
          }

          if (lang) {
            config.headers['Accept-Language'] = lang;
          }
        }
      } catch (e) {
        console.error('Could not determine language from localStorage', e);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response Interceptor: Обробка 401 (Logout)
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (axios.isCancel(error)) {
        return Promise.reject(error);
      }

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

const api = createAPIClient();

// Helper для отримання даних з відповіді
export const getData = (response: any) => response.data;

export default api;

// ============ Auth API ============
export const authAPI = {
  // Telegram Mini App Login
  loginTelegram: async (initData: object): Promise<AuthResponse> => {
    return getData(await api.post('/auth/telegram', initData));
  },
  // Web Login
  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    return getData(await api.post('/auth/login', data));
  },
  // Web Register
  register: async (data: { email: string }) => {
    return getData(await api.post('/auth/register', data));
  },
  // Password Reset Request
  forgotPassword: async (data: { email: string }) => {
    return getData(await api.post('/auth/forgot-password', data));
  },
  // Verify Email Token
  verifyEmail: async (data: { token: string }): Promise<AuthResponse> => {
    return getData(await api.post('/auth/verify', data));
  },
  // Complete Telegram Registration (Onboarding)
  completeRegistration: async (data: { email: string }) => {
    return getData(await api.post('/auth/complete-registration', data));
  }
};

// ============ Products API ============
export const productsAPI = {
  getProducts: async (params?: {
    category?: string;
    product_type?: string;
    search?: string;
    sort_by?: string;
    limit?: number;
    offset?: number;
    category_id?: number;
    is_on_sale?: boolean;
    min_price?: number;
    max_price?: number;
  }) => {
    return getData(await api.get('/products', { params }));
  },
  getProductById: async (id: number | string, language?: string) => {
    const config = language ? { headers: { 'Accept-Language': language } } : {};
    return getData(await api.get(`/products/${id}`, config));
  },
  getCategories: async () => {
    return getData(await api.get('/products/categories'));
  },
};

// ============ Orders API ============
export const ordersAPI = {
  checkout: async (data: {
    product_ids: number[];
    promo_code?: string | null;
  }): Promise<CheckoutResponse> => {
    return getData(await api.post('/orders/checkout', data));
  },
  applyDiscount: async (data: {
    product_ids: number[];
    promo_code?: string | null;
  }): Promise<ApplyDiscountResponse> => {
    return getData(await api.post('/orders/promo/apply', data));
  },
  preview: async (productIds: number[], promoCode?: string) => {
    const params: any = { product_ids: productIds.join(',') };
    if (promoCode) params.promo_code = promoCode;
    return getData(await api.get('/orders/preview', { params }));
  },
};

// ============ Wallet API ============
export const walletAPI = {
  getBalance: async (): Promise<{ balance: number; balanceUsd: number }> => {
    return getData(await api.get('/wallet/balance'));
  },
  getInfo: async (): Promise<WalletInfo> => {
    return getData(await api.get('/wallet/info'));
  },
  getCoinPacks: async (): Promise<CoinPack[]> => {
    return getData(await api.get('/wallet/coin-packs'));
  },
  getTransactions: async (params?: {
    page?: number;
    size?: number;
    type?: string;
  }): Promise<TransactionListResponse> => {
    return getData(await api.get('/wallet/transactions', { params }));
  },
};

// ============ Profile API ============
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
  getReferralInfo: async () => {
    return getData(await api.get('/profile/referrals'));
  },
};

// ============ Subscriptions API ============
export const subscriptionsAPI = {
  getPrice: async (): Promise<SubscriptionPriceInfo> => {
    return getData(await api.get('/subscriptions/price'));
  },
  checkout: async (): Promise<SubscriptionCheckoutResponse> => {
    return getData(await api.post('/subscriptions/checkout'));
  },
  cancel: async () => {
    return getData(await api.delete('/subscriptions/cancel'));
  },
  enableAutoRenewal: async () => {
    return getData(await api.post('/subscriptions/auto-renewal/enable'));
  },
  getStatus: async (): Promise<SubscriptionStatus> => {
    return getData(await api.get('/subscriptions/status'));
  },
};

// ============ Admin API ============
export const adminAPI = {
  getDashboardStats: async () => {
    return getData(await api.get('/admin/dashboard/stats'));
  },
  getUsers: async (params?: { search?: string; skip?: number; limit?: number }) => {
    return getData(await api.get('/admin/users', { params }));
  },
  getUserDetails: async (id: number) => {
    return getData(await api.get(`/admin/users/${id}`));
  },
  toggleUserAdmin: async (userId: number) => {
    return getData(await api.patch(`/admin/users/${userId}/toggle-admin`));
  },
  toggleUserActive: async (userId: number) => {
    // Note: Assuming endpoint exists in backend or handled via user update
    // If not, this might need adjustment based on specific backend implementation
    return getData(await api.patch(`/admin/users/${userId}/toggle-active`));
  },
  addUserBonus: async (userId: number, amount: number, reason: string) => {
    return getData(await api.post(`/admin/users/${userId}/add-coins`, { amount, reason }));
  },
  giveSubscription: async (userId: number, days: number) => {
    return getData(await api.post(`/admin/users/${userId}/subscription`, { days }));
  },
  // CoinPacks
  getCoinPacks: async (includeInactive = false) => {
    return getData(await api.get('/admin/coin-packs', { params: { include_inactive: includeInactive } }));
  },
  createCoinPack: async (data: any) => {
    return getData(await api.post('/admin/coin-packs', data));
  },
  updateCoinPack: async (id: number, data: any) => {
    return getData(await api.put(`/admin/coin-packs/${id}`, data));
  },
  deleteCoinPack: async (id: number, hardDelete = false) => {
    return getData(await api.delete(`/admin/coin-packs/${id}`, { params: { hard_delete: hardDelete } }));
  },
  // Products
  createProduct: async (data: any) => {
    return getData(await api.post('/admin/products', data));
  },
  updateProduct: async (id: string | number, data: any) => {
    return getData(await api.put(`/admin/products/${id}`, data));
  },
  deleteProduct: async (id: string | number) => {
    return getData(await api.delete(`/admin/products/${id}`));
  },
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
  getCategories: async () => {
    return getData(await api.get('/admin/categories'));
  },
  createCategory: async (name: string, slug: string) => {
    return getData(await api.post('/admin/categories', { name, slug }));
  },
  updateCategory: async (id: number, name?: string, slug?: string) => {
    return getData(await api.put(`/admin/categories/${id}`, { name, slug }));
  },
  deleteCategory: async (id: number) => {
    return getData(await api.delete(`/admin/categories/${id}`));
  },
  getPromoCodes: async () => {
    return getData(await api.get('/admin/promo-codes'));
  },
  getPromoCodeDetails: async (id: number) => {
    return getData(await api.get(`/admin/promo-codes/${id}`));
  },
  createPromoCode: async (data: any) => {
    return getData(await api.post('/admin/promo-codes', data));
  },
  updatePromoCode: async (id: number, data: any) => {
    return getData(await api.put(`/admin/promo-codes/${id}`, data));
  },
  togglePromoCode: async (id: number) => {
    return getData(await api.patch(`/admin/promo-codes/${id}/toggle`));
  },
  deletePromoCode: async (id: number) => {
    return getData(await api.delete(`/admin/promo-codes/${id}`));
  },
  getOrders: async (params?: { skip?: number; limit?: number; status?: string }) => {
    return getData(await api.get('/admin/orders', { params }));
  },
  getOrderDetails: async (id: number) => {
    return getData(await api.get(`/admin/orders/${id}`));
  },
  updateOrderStatus: async (id: number, status: string) => {
    const formData = new FormData();
    formData.append('status', status);
    return getData(await api.patch(`/admin/orders/${id}/status`, formData));
  },
};