// frontend/lib/api/index.ts
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

// Створюємо екземпляр axios
const api = axios.create({
  baseURL: 'http://localhost:8000', // Прямо вказуємо порт бекенду
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Інтерсептор для додавання токену
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    const response = await api.post('/api/v1/auth/telegram', authData);
    return response.data;
  },
};

// PRODUCTS API
export const productsAPI = {
  getProducts: async (params?: any) => {
    const response = await api.get('/api/v1/products', { params });
    return response.data;
  },

  getProduct: async (id: number, lang: string = 'uk') => {
    const response = await api.get(`/api/v1/products/${id}`, {
      headers: { 'Accept-Language': lang }
    });
    return response.data;
  },
};

// ORDERS API
export const ordersAPI = {
  createCheckout: async (data: any) => {
    const response = await api.post('/api/v1/orders/checkout', data);
    return response.data;
  },

  applyDiscount: async (data: any) => {
    const response = await api.post('/api/v1/orders/promo/apply', data);
    return response.data;
  },
};

// PROFILE API
export const profileAPI = {
  getProfile: async () => {
    const response = await api.get('/api/v1/profile/me');
    return response.data;
  },

  getDownloads: async () => {
    const response = await api.get('/api/v1/profile/downloads');
    return response.data;
  },

  claimBonus: async () => {
    const response = await api.post('/api/v1/profile/bonus/claim');
    return response.data;
  },

  getBonusInfo: async () => {
    const response = await api.get('/api/v1/profile/bonus/info');
    return response.data;
  },
};

// SUBSCRIPTIONS API
export const subscriptionsAPI = {
  checkout: async () => {
    const response = await api.post('/api/v1/subscriptions/checkout');
    return response.data;
  },
  getStatus: async () => {
    const response = await api.get('/api/v1/subscriptions/status');
    return response.data;
  }
};

export default api;