'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { adminApi } from '@/lib/api/admin';
import { LoadingSpinner } from '@/components/admin/Shared';
import toast from 'react-hot-toast';
import {
    ArrowLeft, User, Mail, Phone, Clock, Gift, CreditCard, Shield,
    CheckCircle, XCircle, UserPlus, Package, ShoppingCart
} from 'lucide-react';

// Типізація для кращої читабельності
interface UserDetail {
    id: number;
    telegram_id: number;
    username?: string;
    first_name: string;
    last_name?: string;
    email?: string;
    phone?: string;
    photo_url?: string;
    is_admin: boolean;
    is_active: boolean;
    bonus_balance: number;
    bonus_streak: number;
    created_at: string;
    last_login_at?: string;
    subscriptions: any[];
    orders: any[];
    referrals: any[];
}

export default function UserDetailPage() {
    const router = useRouter();
    const params = useParams();
    const userId = Number(params.id);

    const [user, setUser] = useState<UserDetail | null>(null);
    const [loading, setLoading] = useState(true);

    // Стан для модальних вікон
    const [showBonusModal, setShowBonusModal] = useState(false);
    const [bonusAmount, setBonusAmount] = useState(100);
    const [bonusReason, setBonusReason] = useState('');
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [subscriptionDays, setSubscriptionDays] = useState(30);

    const fetchUserDetails = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const userData = await adminApi.getUserDetails(userId);
            setUser(userData);
        } catch (error) {
            toast.error('Не вдалося завантажити профіль користувача.');
            router.push('/admin/users');
        } finally {
            setLoading(false);
        }
    }, [userId, router]);

    useEffect(() => {
        fetchUserDetails();
    }, [fetchUserDetails]);

    // Функції для кнопок управління
    const handleToggleAdmin = async () => {
        if (!user) return;
        try {
            const res = await adminApi.toggleUserAdmin(user.id);
            toast.success(`Статус адміна ${res.is_admin ? 'надано' : 'відкликано'}`);
            fetchUserDetails();
        } catch (error) {
            toast.error('Помилка зміни статусу адміна.');
        }
    };

    const handleToggleActive = async () => {
        if (!user) return;
        try {
            const res = await adminApi.toggleUserActive(user.id);
            toast.success(`Користувача ${res.is_active ? 'розблоковано' : 'заблоковано'}`);
            fetchUserDetails();
        } catch (error) {
            toast.error('Помилка зміни статусу активності.');
        }
    };

    const handleAddBonus = async () => {
        if (!user) return;
        try {
            await adminApi.addUserBonus(user.id, bonusAmount, bonusReason);
            toast.success(`Додано ${bonusAmount} бонусів`);
            setShowBonusModal(false);
            setBonusAmount(100);
            setBonusReason('');
            fetchUserDetails();
        } catch (error) {
            toast.error('Помилка додавання бонусів');
        }
    };

    const handleGiveSubscription = async () => {
        if (!user) return;
        try {
            await adminApi.giveSubscription(user.id, subscriptionDays);
            toast.success(`Надано підписку на ${subscriptionDays} днів`);
            setShowSubscriptionModal(false);
            setSubscriptionDays(30);
            fetchUserDetails();
        } catch (error) {
            toast.error('Помилка надання підписки');
        }
    };

    if (loading || !user) {
        return <LoadingSpinner />;
    }

    return (
        <div>
            {/* Навігація */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => router.push('/admin/users')} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-xl font-bold">Профіль користувача</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Ліва колонка: Профіль та дії */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Картка профілю */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                        <img src={user.photo_url || `https://avatar.vercel.sh/${user.id}.png`} alt="avatar" className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-gray-200 dark:border-gray-700" />
                        <h3 className="text-lg font-bold">{user.first_name} {user.last_name}</h3>
                        <p className="text-sm text-gray-500">@{user.username || 'N/A'}</p>
                        <div className="mt-2 flex justify-center gap-2">
                           {user.is_admin && <span className="px-2 py-1 text-xs bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400 rounded">Адмін</span>}
                           {user.is_active ? <span className="px-2 py-1 text-xs bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400 rounded">Активний</span> : <span className="px-2 py-1 text-xs bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400 rounded">Заблокований</span>}
                        </div>
                    </div>
                    {/* Дії */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-3">
                        <h4 className="font-semibold mb-2">Основні дії</h4>
                        <button onClick={() => setShowBonusModal(true)} className="w-full flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"><Gift size={16}/> Нарахувати бонуси</button>
                        <button onClick={() => setShowSubscriptionModal(true)} className="w-full flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"><CreditCard size={16}/> Видати підписку</button>
                        <button onClick={handleToggleAdmin} className="w-full flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"><Shield size={16}/> {user.is_admin ? 'Забрати права адміна' : 'Зробити адміном'}</button>
                        <button onClick={handleToggleActive} className="w-full flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">{user.is_active ? <XCircle size={16}/> : <CheckCircle size={16}/>} {user.is_active ? 'Заблокувати' : 'Розблокувати'}</button>
                    </div>
                </div>
                {/* Права колонка: Деталі */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h4 className="font-semibold mb-4">Детальна інформація</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                           <div className="flex items-center gap-2"><User size={16} className="text-gray-400"/> <strong>ID:</strong> {user.telegram_id}</div>
                           <div className="flex items-center gap-2"><Mail size={16} className="text-gray-400"/> <strong>Email:</strong> {user.email || 'Не вказано'}</div>
                           <div className="flex items-center gap-2"><Phone size={16} className="text-gray-400"/> <strong>Телефон:</strong> {user.phone || 'Не вказано'}</div>
                           <div className="flex items-center gap-2"><Gift size={16} className="text-gray-400"/> <strong>Бонуси:</strong> {user.bonus_balance} 💎</div>
                           <div className="flex items-center gap-2 col-span-2"><Clock size={16} className="text-gray-400"/> <strong>Реєстрація:</strong> {new Date(user.created_at).toLocaleString()}</div>
                           <div className="flex items-center gap-2 col-span-2"><Clock size={16} className="text-gray-400"/> <strong>Останній візит:</strong> {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Не було'}</div>
                        </div>
                    </div>
                    {/* Підписки */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                       <h4 className="font-semibold mb-4 flex items-center gap-2"><CreditCard size={18}/> Підписки ({user.subscriptions.length})</h4>
                       {user.subscriptions.length > 0 ? (
                           <ul className="text-sm space-y-2">
                               {user.subscriptions.map(s => <li key={s.id} className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"><span>Статус: <strong>{s.status}</strong></span><span>До: {new Date(s.end_date).toLocaleDateString()}</span></li>)}
                           </ul>
                       ) : <p className="text-sm text-gray-500">Активних підписок немає.</p>}
                    </div>
                    {/* Замовлення */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                       <h4 className="font-semibold mb-4 flex items-center gap-2"><ShoppingCart size={18}/> Замовлення ({user.orders.length})</h4>
                       {user.orders.length > 0 ? (
                           <ul className="text-sm space-y-2">
                               {user.orders.map(o => <li key={o.id} className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"><span>#{o.id} на <strong>${o.final_total.toFixed(2)}</strong></span><span>{new Date(o.created_at).toLocaleDateString()}</span></li>)}
                           </ul>
                       ) : <p className="text-sm text-gray-500">Замовлень ще не було.</p>}
                    </div>
                     {/* Реферали */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                       <h4 className="font-semibold mb-4 flex items-center gap-2"><UserPlus size={18}/> Запрошені користувачі ({user.referrals.length})</h4>
                       {user.referrals.length > 0 ? (
                           <ul className="text-sm space-y-2">
                               {user.referrals.map(r => <li key={r.id} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">{r.first_name} {r.last_name || ''} (@{r.username})</li>)}
                           </ul>
                       ) : <p className="text-sm text-gray-500">Цей користувач ще нікого не запросив.</p>}
                    </div>
                </div>
            </div>

            {/* Модальні вікна */}
            {showBonusModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm">
                    <h3 className="text-lg font-semibold mb-4">Додати бонус для {user?.first_name}</h3>
                    <input type="number" placeholder="Сума бонусу" value={bonusAmount} onChange={(e) => setBonusAmount(Number(e.target.value))} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 mb-3" />
                    <input type="text" placeholder="Причина (необов'язково)" value={bonusReason} onChange={(e) => setBonusReason(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 mb-4" />
                    <div className="flex gap-2">
                      <button onClick={handleAddBonus} className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">Додати</button>
                      <button onClick={() => setShowBonusModal(false)} className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400">Скасувати</button>
                    </div>
                  </div>
                </div>
            )}
            {showSubscriptionModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm">
                    <h3 className="text-lg font-semibold mb-4">Надати підписку для {user?.first_name}</h3>
                    <select value={subscriptionDays} onChange={(e) => setSubscriptionDays(Number(e.target.value))} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 mb-4">
                      <option value={7}>7 днів</option>
                      <option value={30}>30 днів</option>
                      <option value={90}>90 днів</option>
                      <option value={365}>365 днів (рік)</option>
                    </select>
                    <div className="flex gap-2">
                      <button onClick={handleGiveSubscription} className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">Надати</button>
                      <button onClick={() => setShowSubscriptionModal(false)} className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400">Скасувати</button>
                    </div>
                  </div>
                </div>
            )}
        </div>
    );
}