import axios, { AxiosInstance } from 'axios';
import { useAuthStore } from '@/store/authStore';
import {
  CoinPack,
  Transaction,
  WalletInfo,
  TransactionListResponse,
  CheckoutResponse,
  ApplyDiscountResponse,
  SubscriptionCheckoutResponse,
  SubscriptionPriceInfo,
  SubscriptionStatus,
  AuthResponse
} from '@/types';

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
  zip_file_path?: string;
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

// Визначаємо API URL
const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
const envBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

// Формуємо базовий URL
let API_URL = 'http://localhost:8000/api/v1';

if (envApiUrl) {
  API_URL = envApiUrl;
} else if (envBackendUrl) {
  // Видаляємо trailing slash якщо є
  const cleanBackend = envBackendUrl.replace(/\/$/, '');
  API_URL = `${cleanBackend}/api/v1`;
}

// Логуємо тільки в браузері
if (typeof window !== 'undefined') {
  console.log('[API] Configuration:', {
    NEXT_PUBLIC_API_URL: envApiUrl || '(not set)',
    NEXT_PUBLIC_BACKEND_URL: envBackendUrl || '(not set)',
    RESOLVED_API_URL: API_URL
  });
}

const createAPIClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor
  instance.interceptors.request.use(
    (config) => {
      // Отримуємо токен напряму з localStorage
      let token: string | null = null;

      if (typeof window !== 'undefined') {
        try {
          const authStorage = localStorage.getItem('auth-storage');
          if (authStorage) {
            const parsed = JSON.parse(authStorage);
            token = parsed?.state?.token;
          }
        } catch (e) {
          console.warn('[API] Could not read token from localStorage');
        }
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Додаємо мову
      if (typeof window !== 'undefined') {
        try {
          const languageStorage = localStorage.getItem('language-storage');
          if (languageStorage) {
            const parsed = JSON.parse(languageStorage);
            const lang = parsed?.state?.language;
            if (lang && ['uk', 'en', 'ru', 'de', 'es'].includes(lang)) {
              config.headers['Accept-Language'] = lang;
            }
          }
        } catch (e) {
          config.headers['Accept-Language'] = 'uk';
        }
      }

      console.log(`[API] ➡️ ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);

      return config;
    },
    (error) => {
      console.error('[API] Request error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response) => {
      console.log(`[API] ⬅️ ${response.status} ${response.config.url}`, {
        dataType: typeof response.data,
        dataKeys: response.data ? Object.keys(response.data) : null
      });
      return response;
    },
    async (error) => {
      if (axios.isCancel(error)) {
        return Promise.reject(error);
      }

      console.error('[API] ❌ Error:', {
        status: error.response?.status,
        url: error.config?.url,
        data: error.response?.data
      });

      // При 401 - розлогінюємо
      if (error.response?.status === 401 && !error.config._retry) {
        error.config._retry = true;
        console.log('[API] 401 Unauthorized, logging out');

        if (typeof window !== 'undefined') {
          // Очищаємо localStorage напряму, щоб уникнути циклічних залежностей
          localStorage.removeItem('auth-storage');
        }

        return Promise.reject(error);
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

const api = createAPIClient();

// Функція для отримання даних з response
export const getData = (response: any) => response.data;

export default api;

// ============ Auth API ============
export const authAPI = {
  loginTelegram: async (initData: object): Promise<any> => {
    console.log('[API] loginTelegram called with:', {
      keys: Object.keys(initData),
      hasInitData: 'initData' in initData
    });

    const response = await api.post('/auth/telegram', initData);

    // Логуємо повну відповідь
    console.log('[API] loginTelegram raw response:', response);
    console.log('[API] loginTelegram response.data:', response.data);
    console.log('[API] loginTelegram response.data keys:', Object.keys(response.data || {}));

    // ВАЖЛИВО: повертаємо response.data, а не response!
    return response.data;
  },

  loginEmail: async (email: string, password: string): Promise<any> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (email: string): Promise<any> => {
    const response = await api.post('/auth/register', { email });
    return response.data;
  },

  forgotPassword: async (email: string): Promise<any> => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  verifyEmail: async (token: string): Promise<any> => {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  },

  linkEmail: async (email: string): Promise<any> => {
    const response = await api.post('/auth/link-email', { email });
    return response.data;
  },
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
  getBalance: async (): Promise<{ balance: number; balance_usd: number }> => {
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
  updateProfile: async (data: {
    email?: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
    birth_date?: string;
  }) => {
    return getData(await api.patch('/auth/profile', data));
  },
  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    return getData(await api.post('/auth/change-password', {
      old_password: data.currentPassword,
      new_password: data.newPassword
    }));
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
  // Bonus methods
  getBonusInfo: async () => {
    return getData(await api.get('/profile/bonus/info'));
  },
  claimDailyBonus: async () => {
    return getData(await api.post('/profile/bonus/claim'));
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
    return getData(await api.patch(`/admin/users/${userId}/toggle-active`));
  },
  addUserBonus: async (userId: number, amount: number, reason: string) => {
    return getData(await api.post(`/admin/users/${userId}/add-coins`, { amount, reason }));
  },
  giveSubscription: async (userId: number, days: number) => {
    return getData(await api.post(`/admin/users/${userId}/subscription`, { days }));
  },
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

// ============ Creators API ============

export const creatorsAPI = {
  // Submit creator application
  applyToBeCreator: async (data: { portfolio_url?: string; motivation?: string }) => {
    return getData(await api.post('/creators/apply', data));
  },

  // Get creator status
  getStatus: async () => {
    return getData(await api.get('/creators/status'));
  },

  // Get creator balance and stats
  getBalance: async () => {
    return getData(await api.get('/creators/balance'));
  },

  // Request payout
  requestPayout: async (data: {
    amount_coins: number;
    usdt_address: string;
    usdt_network: 'TRC20' | 'ERC20' | 'BEP20';
  }) => {
    return getData(await api.post('/creators/payouts/request', data));
  },

  // Get transaction history
  getTransactions: async (params?: { limit?: number; offset?: number }) => {
    return getData(await api.get('/creators/transactions', { params }));
  },

  // Get product stats
  getProductStats: async () => {
    return getData(await api.get('/creators/stats/products'));
  },
};

// ============ Admin Creators API ============
export const adminCreatorsAPI = {
  // Applications moderation
  getPendingApplications: async (params?: { limit?: number; offset?: number }) => {
    return getData(await api.get('/admin/creators/applications/pending', { params }));
  },

  reviewApplication: async (applicationId: number, data: {
    action: 'approve' | 'reject';
    rejection_reason?: string;
  }) => {
    return getData(await api.post(`/admin/creators/applications/${applicationId}/review`, data));
  },

  // Payouts moderation
  getPendingPayouts: async (params?: { limit?: number; offset?: number }) => {
    return getData(await api.get('/admin/creators/payouts/pending', { params }));
  },

  approvePayout: async (payoutId: number, transactionHash: string) => {
    return getData(await api.post(`/admin/creators/payouts/${payoutId}/approve`, {
      transaction_hash: transactionHash,
    }));
  },

  rejectPayout: async (payoutId: number, reason: string) => {
    return getData(await api.post(`/admin/creators/payouts/${payoutId}/reject`, null, {
      params: { reason },
    }));
  },

  // Statistics
  getModerationStats: async () => {
    return getData(await api.get('/admin/creators/stats/moderation'));
  },

  getCommissionStats: async () => {
    return getData(await api.get('/admin/creators/stats/commissions'));
  },

  // Creators list
  getCreatorsList: async (params?: { limit?: number; offset?: number }) => {
    return getData(await api.get('/admin/creators/list', { params }));
  },
};