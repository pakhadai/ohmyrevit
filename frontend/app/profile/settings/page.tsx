'use client';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    birth_date: user?.birth_date || ''
  });

  const [passData, setPassData] = useState({ old: '', new: '' });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.patch('/auth/profile', formData);
      setUser({ ...user!, ...res.data });
      toast.success('Профіль оновлено');
    } catch {
      toast.error('Помилка оновлення');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/change-password', {
        old_password: passData.old,
        new_password: passData.new
      });
      toast.success('Пароль змінено');
      setPassData({ old: '', new: '' });
    } catch {
      toast.error('Невірний старий пароль');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Налаштування</h1>

      <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
        <h2 className="text-xl font-semibold">Особисті дані</h2>
        <input
          value={formData.first_name}
          onChange={e => setFormData({...formData, first_name: e.target.value})}
          placeholder="Ім'я" className="w-full p-3 rounded border"
        />
        <input
          value={formData.last_name}
          onChange={e => setFormData({...formData, last_name: e.target.value})}
          placeholder="Прізвище" className="w-full p-3 rounded border"
        />
        <input
          type="date"
          value={formData.birth_date}
          onChange={e => setFormData({...formData, birth_date: e.target.value})}
          className="w-full p-3 rounded border"
        />
        <button className="btn-primary px-6 py-2 rounded">Зберегти</button>
      </form>

      <form onSubmit={handleChangePassword} className="space-y-4 max-w-md pt-6 border-t">
        <h2 className="text-xl font-semibold">Зміна пароля</h2>
        <input
          type="password" placeholder="Старий пароль"
          value={passData.old} onChange={e => setPassData({...passData, old: e.target.value})}
          className="w-full p-3 rounded border"
        />
        <input
          type="password" placeholder="Новий пароль"
          value={passData.new} onChange={e => setPassData({...passData, new: e.target.value})}
          className="w-full p-3 rounded border"
        />
        <button className="btn-primary px-6 py-2 rounded">Змінити пароль</button>
      </form>
    </div>
  );
}