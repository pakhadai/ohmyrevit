'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, PlusCircle, Loader, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { profileAPI } from '@/lib/api';
import { Collection } from '@/types';
import toast from 'react-hot-toast';

const colorMap: { [key: string]: string } = {
  default: 'text-gray-500',
  red: 'text-red-500',
  green: 'text-green-500',
  blue: 'text-blue-500',
  yellow: 'text-yellow-500',
  purple: 'text-purple-500',
  pink: 'text-pink-500',
};

export default function CollectionsPage() {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionColor, setNewCollectionColor] = useState('default');

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const data = await profileAPI.getCollections();
      setCollections(data);
    } catch (error) {
      toast.error('Не вдалося завантажити колекції.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      toast.error('Назва колекції не може бути порожньою.');
      return;
    }
    try {
      await profileAPI.createCollection({ name: newCollectionName, color: newCollectionColor });
      toast.success(`Колекцію "${newCollectionName}" створено!`);
      setShowCreateModal(false);
      setNewCollectionName('');
      setNewCollectionColor('default');
      fetchCollections();
    } catch (error: any) {
      toast.error(error.message || 'Помилка створення колекції.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-60">
        <Loader className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
            <button onClick={() => router.push('/profile')} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold">Мої колекції</h1>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={collections.length >= 9}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
        >
          <PlusCircle size={18} />
          Створити
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map(collection => (
          <motion.div
            key={collection.id}
            onClick={() => router.push(`/profile/collections/${collection.id}`)}
            className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            whileHover={{ scale: 1.03 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart size={24} className={colorMap[collection.color] || colorMap.default} />
                <h3 className="font-semibold">{collection.name}</h3>
              </div>
              <span className="text-sm text-gray-500 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                {collection.products_count}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm"
            >
              <h2 className="text-lg font-bold mb-4">Створити нову колекцію</h2>
              <input
                type="text"
                placeholder="Назва колекції (напр., 'Кухня')"
                value={newCollectionName}
                onChange={e => setNewCollectionName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 mb-4"
              />
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Колір іконки</p>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(colorMap).map(color => (
                    <button
                      key={color}
                      onClick={() => setNewCollectionColor(color)}
                      className={`w-8 h-8 rounded-full transition-transform ${newCollectionColor === color ? 'ring-2 ring-offset-2 dark:ring-offset-slate-800' : ''}`}
                    >
                      <Heart className={`${colorMap[color]} fill-current w-full h-full p-1`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreateCollection} className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg">Створити</button>
                <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-700 rounded-lg">Скасувати</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}