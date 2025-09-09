// frontend/lib/api/index.ts
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import i18n from '@/lib/i18n'; // Для доступу до поточної мови

// Створюємо екземпляр axios
const api = axios.create({
  // # OLD: baseURL: 'http://localhost:8000', // Прямо вказуємо порт бекенду
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Інтерсептор для додавання токену та мови
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Додаємо мову з i18next
    if (i18n.language) {
      config.headers['Accept-Language'] = i18n.language;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Інтерсептор для обробки помилок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Токен невалідний - виходимо
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// AUTH API
export const authAPI = {
  loginTelegram: async (authData: any) => {
    const response = await api.post('/auth/telegram', authData);
    return response.data;
  },
};

// PRODUCTS API
export const productsAPI = {
  getProducts: async (params?: any) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  getProductById: async (id: number | string, lang?: string) => {
    const response = await api.get(`/products/${id}`, {
      headers: lang ? { 'Accept-Language': lang } : {}
    });
    return response.data;
  },

  getCategories: async () => {
      const response = await api.get('/products/categories');
      return response.data;
  }
};

// ORDERS API
export const ordersAPI = {
  createCheckout: async (data: any) => {
    const response = await api.post('/orders/checkout', data);
    return response.data;
  },

  applyDiscount: async (data: any) => {
    const response = await api.post('/orders/promo/apply', data);
    return response.data;
  },
};

// PROFILE API
export const profileAPI = {
  getProfile: async () => {
    const response = await api.get('/profile/me');
    return response.data;
  },

  updateProfile: async (data: { email?: string; phone?: string }) => {
    const response = await api.patch('/profile/me', data);
    return response.data;
  },

  getDownloads: async () => {
    const response = await api.get('/profile/downloads');
    return response.data;
  },

  claimDailyBonus: async () => {
    const response = await api.post('/profile/bonus/claim');
    return response.data;
  },

  getBonusInfo: async () => {
    const response = await api.get('/profile/bonus/info');
    return response.data;
  },

  checkAccess: async (productIds: number[]) => {
      const response = await api.post('/profile/check-access', { product_ids: productIds });
      return response.data;
  },

  getReferralInfo: async () => {
      const response = await api.get('/profile/referrals');
      return response.data;
  },
  getCollections: async () => {
      const response = await api.get('/profile/collections');
      return response.data;
  },
  getCollectionDetails: async (id: number) => {
      const response = await api.get(`/profile/collections/${id}`);
      return response.data;
  },
    createCollection: async (data: { name: string; color: string }) => {
        const response = await api.post('/profile/collections', data);
        return response.data;
  },
  deleteCollection: async (id: number) => {
        const response = await api.delete(`/profile/collections/${id}`);
        return response.data;
  },
  addProductToCollection: async (collectionId: number, productId: number) => {
        const response = await api.post(`/profile/collections/${collectionId}/products/${productId}`);
        return response.data;
  },
  removeProductFromCollection: async (collectionId: number, productId: number) => {
        const response = await api.delete(`/profile/collections/${collectionId}/products/${productId}`);
        return response.data;
  },
  getFavoritedProductIds: async () => {
        const response = await api.get('/profile/collections/product-ids');
        return response.data;
  }
};

// SUBSCRIPTIONS API
export const subscriptionsAPI = {
    checkout: async () => {
        const response = await api.post('/subscriptions/checkout');
        return response.data;
    },
    getStatus: async () => {
        const response = await api.get('/subscriptions/status');
        return response.data;
    }
};

// ADMIN API
export const adminAPI = {
    getUsers: async (params: any) => {
        const response = await api.get('/admin/users', { params });
        return response.data;
    },
    toggleUserAdmin: async (userId: number) => {
        const response = await api.patch(`/admin/users/${userId}/toggle-admin`);
        return response.data;
    },
    toggleUserActive: async (userId: number) => {
        const response = await api.patch(`/admin/users/${userId}/toggle-active`);
        return response.data;
    },
    addUserBonus: async (userId: number, amount: number, reason?: string) => {
        const formData = new FormData();
        formData.append('amount', String(amount));
        if (reason) {
            formData.append('reason', reason);
        }
        const response = await api.post(`/admin/users/${userId}/add-bonus`, formData);
        return response.data;
    },
    giveSubscription: async (userId: number, days: number) => {
        const response = await api.post(`/admin/users/${userId}/subscription`, { days });
        return response.data;
    },
    createProduct: async (data: any) => {
        const response = await api.post('/admin/products', data);
        return response.data;
    },
    updateProduct: async (id: string, data: any) => {
        const response = await api.put(`/admin/products/${id}`, data);
        return response.data;
    },
    deleteProduct: async (id: string) => {
        const response = await api.delete(`/admin/products/${id}`);
        return response.data;
    },
    uploadImage: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/admin/upload/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },
    uploadArchive: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/admin/upload/archive', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },
};


export default api;