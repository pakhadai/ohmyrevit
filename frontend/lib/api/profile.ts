import api from '../api';

export const profileAPI = {
  // Отримати профіль
  getProfile: async () => {
    const { data } = await api.get('/profile/me');
    return data;
  },

  // Отримати список завантажень
  getDownloads: async () => {
    const { data } = await api.get('/profile/downloads');
    return data;
  },

  // Отримати бонусну інформацію
  getBonusInfo: async () => {
    const { data } = await api.get('/profile/bonus/info');
    return data;
  },

  // Отримати щоденний бонус
  claimDailyBonus: async () => {
    const { data } = await api.post('/profile/bonus/claim');
    return data;
  },

  // Оновити профіль
  updateProfile: async (updates: any) => {
    const { data } = await api.patch('/profile/me', updates);
    return data;
  }
};