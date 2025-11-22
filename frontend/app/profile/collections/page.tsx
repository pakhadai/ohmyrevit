// frontend/app/profile/collections/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Plus, Loader, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCollectionStore } from '@/store/collectionStore';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

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
      toast.error(t('profilePages.collections.toasts.nameEmpty'));
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
    e.stopPropagation();
    if (window.confirm(t('profilePages.collections.deleteConfirm', { name }))) {
      deleteCollection(id);
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex justify-center items-center h-60">
        <Loader className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    // Повертаємо стандартний відступ py-6, оскільки липкого хедера більше немає
    <div className="container mx-auto px-4 py-6">

      {/* Порожній стан */}
      {isInitialized && collections.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 rounded-2xl">
          <Heart size={48} className="mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold mb-2">{t('profilePages.collections.empty.title')}</h2>
          <p className="mb-6 text-sm opacity-80">{t('profilePages.collections.empty.subtitle')}</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-colors"
          >
            {t('profilePages.collections.empty.cta')}
          </button>
        </div>
      )}

      {/* Сітка колекцій */}
      {collections.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map(collection => (
            <motion.div
              key={collection.id}
              onClick={() => router.push(`/profile/collections/${collection.id}`)}
              className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm cursor-pointer border border-transparent hover:border-purple-200 dark:hover:border-purple-900/50 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              layout
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-full bg-gray-50 dark:bg-slate-700/50`}>
                    <Heart size={20} className={`${colorMap[collection.color] || colorMap.default} fill-current`} />
                  </div>
                  <h3 className="font-semibold truncate text-gray-800 dark:text-gray-200">{collection.name}</h3>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-slate-700 px-2.5 py-1 rounded-full">
                    {collection.products_count}
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, collection.id, collection.name)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title={t('profilePages.collections.deleteTitle')}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Картка "Створити" в сітці */}
          {collections.length < 9 && (
            <motion.div
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-700 cursor-pointer text-gray-400 dark:text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:border-purple-300 dark:hover:border-purple-700 hover:text-purple-500 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              layout
            >
              <div className="flex flex-col items-center">
                <Plus size={24} className="mb-1" />
                <span className="text-sm font-medium">{t('profilePages.collections.createCta')}</span>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Модальне вікно */}
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
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-xs shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold mb-4 text-center">{t('profilePages.collections.modal.title')}</h2>
              <input
                type="text"
                placeholder={t('profilePages.collections.modal.placeholder')}
                value={newCollectionName}
                onChange={e => setNewCollectionName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                autoFocus
              />
              <div className="mb-6">
                <p className="text-sm font-medium mb-3 text-gray-500 dark:text-gray-400 text-center">{t('profilePages.collections.modal.iconColor')}</p>
                <div className="flex flex-wrap gap-3 justify-center">
                  {Object.keys(colorMap).map(color => (
                    <button
                      key={color}
                      onClick={() => setNewCollectionColor(color)}
                      className={`w-8 h-8 rounded-full transition-all transform ${newCollectionColor === color ? 'scale-110 ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-slate-800' : 'hover:scale-105 opacity-70 hover:opacity-100'}`}
                    >
                      <Heart className={`${colorMap[color]} fill-current w-full h-full p-1.5`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                    {t('common.cancel')}
                </button>
                <button
                    onClick={handleCreateCollection}
                    className="flex-1 px-4 py-2.5 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-colors shadow-lg shadow-purple-500/30"
                >
                    {t('common.create')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}