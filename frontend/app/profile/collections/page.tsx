'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, PlusCircle, Loader, ArrowLeft, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCollectionStore } from '@/store/collectionStore';
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
  const { collections, isInitialized, fetchInitialData, addCollection, deleteCollection } = useCollectionStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionColor, setNewCollectionColor] = useState('default');

  useEffect(() => {
    if (!isInitialized) {
      fetchInitialData();
    }
  }, [isInitialized, fetchInitialData]);

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      toast.error('Назва колекції не може бути порожньою.');
      return;
    }
    const newCollection = await addCollection(newCollectionName, newCollectionColor);
    if (newCollection) {
        setShowCreateModal(false);
        setNewCollectionName('');
        setNewCollectionColor('default');
    }
  };

  const handleDelete = (e: React.MouseEvent, id: number, name: string) => {
    e.stopPropagation(); // Зупиняємо перехід на сторінку колекції при кліку на видалення
    if (window.confirm(`Ви впевнені, що хочете видалити колекцію "${name}"? Цю дію неможливо скасувати.`)) {
      deleteCollection(id);
    }
  };

  if (!isInitialized) {
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
            <button onClick={() => router.push('/profile')} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
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

      {isInitialized && collections.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 rounded-2xl">
          <Heart size={48} className="mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold mb-2">У вас ще немає колекцій</h2>
          <p className="mb-4">Створіть свою першу колекцію, щоб зберігати улюблені товари.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Створити першу колекцію
          </button>
        </div>
      )}

      {collections.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map(collection => (
            <motion.div
              key={collection.id}
              onClick={() => router.push(`/profile/collections/${collection.id}`)}
              className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              whileHover={{ scale: 1.03 }}
              layout
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Heart size={24} className={`${colorMap[collection.color] || colorMap.default} flex-shrink-0`} />
                  <h3 className="font-semibold truncate">{collection.name}</h3>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm text-gray-500 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                    {collection.products_count}
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, collection.id, collection.name)}
                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-full transition-colors"
                    title="Видалити колекцію"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          {collections.length < 9 && (
            <motion.div
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center p-5 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 cursor-pointer text-gray-400 dark:text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800 hover:border-purple-500 hover:text-purple-500 transition-colors"
              whileHover={{ scale: 1.03 }}
              layout
            >
              <div className="text-center">
                <PlusCircle size={24} className="mx-auto mb-2" />
                <h3 className="font-semibold">Створити колекцію</h3>
              </div>
            </motion.div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm"
              onClick={e => e.stopPropagation()}
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
                      className={`w-8 h-8 rounded-full transition-transform transform hover:scale-110 ${newCollectionColor === color ? 'ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-slate-800' : ''}`}
                    >
                      <Heart className={`${colorMap[color]} fill-current w-full h-full p-1`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button onClick={handleCreateCollection} className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">Створити</button>
                <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-700 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600">Скасувати</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}