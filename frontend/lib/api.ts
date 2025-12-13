import axios, { AxiosInstance } from 'axios';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import i18n from '@/lib/i18n';

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

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

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

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (axios.isCancel(error)) {
        return Promise.reject(error);
      }

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initData) {
          if (isRefreshing) {
            return new Promise(function (resolve, reject) {
              failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers['Authorization'] = 'Bearer ' + token;
                return instance(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const tgData = window.Telegram.WebApp.initDataUnsafe;
            const authData = {
              id: tgData.user?.id,
              first_name: tgData.user?.first_name,
              last_name: tgData.user?.last_name,
              username: tgData.user?.username,
              photo_url: tgData.user?.photo_url,
              language_code: tgData.user?.language_code,
              auth_date: tgData.auth_date,
              hash: tgData.hash,
              query_id: tgData.query_id,
              start_param: tgData.start_param || null,
            };

            const { data } = await axios.post(
              `${API_URL}/auth/telegram`,
              authData
            );

            if (data.access_token) {
              useAuthStore.getState().login(authData);
              instance.defaults.headers.common['Authorization'] = 'Bearer ' + data.access_token;
              originalRequest.headers['Authorization'] = 'Bearer ' + data.access_token;
              processQueue(null, data.access_token);
              return instance(originalRequest);
            }
          } catch (refreshError) {
            processQueue(refreshError, null);
            useAuthStore.getState().logout();
            if (window.location.pathname !== '/') {
              toast.error(i18n.t('toasts.sessionExpired'));
            }
          } finally {
            isRefreshing = false;
          }
        } else {
          useAuthStore.getState().logout();
        }
      } else if (error.response?.status === 403) {
      } else if (error.response?.status === 500) {
        if (!originalRequest.url?.includes('/auth/telegram')) {
          toast.error(i18n.t('toasts.serverError'));
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

const api = createAPIClient();
const getData = (response: any) => response.data;

export const authAPI = {
  loginTelegram: async (initData: any) => {
    const response = await api.post('/auth/telegram', initData);
    return getData(response);
  },
};

export const productsAPI = {
  getProducts: async (params?: {
    category_id?: number;
    product_type?: string;
    is_on_sale?: boolean;
    min_price?: number;
    max_price?: number;
    sort_by?: string;
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

export const subscriptionsAPI = {
  checkout: async () => {
    return getData(await api.post('/subscriptions/checkout'));
  },
  cancel: async () => {
    return getData(await api.delete('/subscriptions/cancel'));
  },
  getStatus: async () => {
    return getData(await api.get('/subscriptions/status'));
  },
};

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
  getOrderDetail: async (id: number) => {
    return getData(await api.get(`/admin/orders/${id}`));
  },
  updateOrderStatus: async (id: number, status: string) => {
    const formData = new FormData();
    formData.append('status', status);
    const response = await api.patch(`/admin/orders/${id}/status`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return getData(response);
  },
  exportUsersCSV: async () => {
    const response = await api.get('/admin/export/users', {
      responseType: 'blob'
    });
    return getData(response);
  },
};

export default api;