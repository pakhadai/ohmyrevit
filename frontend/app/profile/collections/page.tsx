'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Plus, Loader, Trash2, FolderPlus } from 'lucide-react';
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
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-5 pt-14 pb-24 min-h-screen">

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t('profilePages.collections.pageTitle')}</h1>
      </div>

      {/* Порожній стан */}
      {isInitialized && collections.length === 0 && (
        <div className="text-center py-20 px-6 bg-muted/30 rounded-[24px] border border-dashed border-border">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart size={32} className="text-muted-foreground opacity-50" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">{t('profilePages.collections.empty.title')}</h2>
          <p className="mb-6 text-sm text-muted-foreground max-w-xs mx-auto">{t('profilePages.collections.empty.subtitle')}</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus size={18} />
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
              className="card-minimal p-5 cursor-pointer group hover:border-primary/30"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              layout
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`p-3 rounded-xl bg-muted/50 group-hover:bg-muted transition-colors`}>
                    <Heart size={22} className={`${colorMap[collection.color] || colorMap.default} fill-current`} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-base text-foreground truncate">{collection.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {collection.products_count} {t('profilePages.main.menu.products', {count: collection.products_count, defaultValue: 'товарів'})}
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => handleDelete(e, collection.id, collection.name)}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title={t('profilePages.collections.deleteTitle')}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))}

          {/* Картка "Створити" в сітці */}
          {collections.length < 9 && (
            <motion.div
              onClick={() => setShowCreateModal(true)}
              className="flex flex-col items-center justify-center p-6 rounded-[20px] border-2 border-dashed border-border cursor-pointer text-muted-foreground hover:bg-muted/30 hover:border-primary/50 hover:text-primary transition-all h-full min-h-[100px]"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              layout
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2 group-hover:bg-primary/10">
                <Plus size={20} />
              </div>
              <span className="text-sm font-medium">{t('profilePages.collections.createCta')}</span>
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-5"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-card rounded-[24px] p-6 w-full max-w-xs shadow-2xl border border-border"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 text-primary">
                    <FolderPlus size={24} />
                </div>
                <h2 className="text-lg font-bold text-foreground">{t('profilePages.collections.modal.title')}</h2>
              </div>

              <input
                type="text"
                placeholder={t('profilePages.collections.modal.placeholder')}
                value={newCollectionName}
                onChange={e => setNewCollectionName(e.target.value)}
                className="w-full px-4 py-3 border border-transparent bg-muted rounded-xl text-foreground placeholder:text-muted-foreground mb-5 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                autoFocus
              />

              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider mb-3 text-muted-foreground text-center">
                    {t('profilePages.collections.modal.iconColor')}
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  {Object.keys(colorMap).map(color => (
                    <button
                      key={color}
                      onClick={() => setNewCollectionColor(color)}
                      className={`w-8 h-8 rounded-full transition-all transform ${newCollectionColor === color ? 'scale-110 ring-2 ring-primary ring-offset-2 dark:ring-offset-card' : 'hover:scale-105 opacity-70 hover:opacity-100'}`}
                    >
                      <Heart className={`${colorMap[color]} fill-current w-full h-full p-1.5`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2.5 bg-muted text-muted-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors"
                >
                    {t('common.cancel')}
                </button>
                <button
                    onClick={handleCreateCollection}
                    className="flex-1 btn-primary py-2.5 text-sm"
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