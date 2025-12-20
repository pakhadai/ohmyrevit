'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { setUser } = useAuthStore(); // припустимо, що authStore оновлено

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      // Збереження токена в store та localStorage реалізовано в authStore або тут
      useAuthStore.getState().setToken(res.data.access_token);
      useAuthStore.getState().setUser(res.data.user);
      router.push('/');
    } catch (err) {
      toast.error('Невірний логін або пароль');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center">Вхід</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full p-3 rounded border bg-background"
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-3 rounded border bg-background"
            required
          />
          <button type="submit" className="btn-primary w-full py-3 rounded">Увійти</button>
        </form>
        <div className="text-center text-sm">
          <Link href="/register" className="text-primary hover:underline">Реєстрація</Link> |
          <Link href="/forgot-password" className="text-primary hover:underline ml-1">Забули пароль?</Link>
        </div>
      </div>
    </div>
  );
}