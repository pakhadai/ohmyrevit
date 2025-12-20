'use client';
import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', { email });
      setSent(true);
    } catch (err) {
      toast.error('Помилка реєстрації');
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-2xl font-bold mb-4">Перевірте пошту! 📧</h1>
          <p>Ми надіслали посилання для завершення реєстрації на <b>{email}</b></p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center">Реєстрація</h1>
        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full p-3 rounded border bg-background"
            required
          />
          <button type="submit" className="btn-primary w-full py-3 rounded">Продовжити</button>
        </form>
      </div>
    </div>
  );
}