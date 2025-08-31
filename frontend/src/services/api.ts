import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Інтерцептор для додавання мови
api.interceptors.request.use((config) => {
  const language = localStorage.getItem('language') || 'uk';
  config.headers['Accept-Language'] = language;
  return config;
});