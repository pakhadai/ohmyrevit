'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, FolderPlus, Check, Loader, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCollectionStore } from '@/store/collectionStore';
import { Product } from '@/types';
import toast from 'react-hot-toast';
import { useTheme } from '@/lib/theme';

interface AddToCollectionModalProps {
  product: Product;
  onClose: () => void;
}

export default function AddToCollectionModal({ product, onClose }: AddToCollectionModalProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const {
    collections,
    fetchCollections,
    addToCollection,
    removeFromCollection,
    createCollection,
    isLoading,
  } = useCollectionStore();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  useEffect(() => {
    const initial = new Set<number>();
    collections.forEach(c => {
      if (c.products?.some(p => p.id === product.id)) {
        initial.add(c.id);
      }
    });
    setSelectedIds(initial);
  }, [collections, product.id]);

  const handleToggle = async (collectionId: number) => {
    const isSelected = selectedIds.has(collectionId);
    try {
      if (isSelected) {
        await removeFromCollection(collectionId, product.id);
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(collectionId);
          return next;
        });
        toast.success(t('collections.removedFromCollection'));
      } else {
        await addToCollection(collectionId, product.id);
        setSelectedIds(prev => new Set(prev).add(collectionId));
        toast.success(t('collections.addedToCollection'));
      }
    } catch (error) {
      toast.error(t('collections.error'));
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      const newCollection = await createCollection(newName.trim());
      if (newCollection) {
        await addToCollection(newCollection.id, product.id);
        setSelectedIds(prev => new Set(prev).add(newCollection.id));
        toast.success(t('collections.created'));
      }
      setNewName('');
      setShowCreate(false);
    } catch (error) {
      toast.error(t('collections.createError'));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-md max-h-[80vh] flex flex-col"
          style={{
            backgroundColor: theme.colors.card,
            borderTopLeftRadius: theme.radius['2xl'],
            borderTopRightRadius: theme.radius['2xl'],
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            boxShadow: theme.shadows.xl,
          }}
        >
          <div
            className="flex items-center justify-between p-5 border-b flex-shrink-0"
            style={{ borderColor: theme.colors.border }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 flex items-center justify-center"
                style={{
                  backgroundColor: theme.colors.errorLight,
                  borderRadius: theme.radius.lg,
                }}
              >
                <Heart size={20} style={{ color: theme.colors.error }} />
              </div>
              <div>
                <h2 className="font-bold" style={{ color: theme.colors.text }}>
                  {t('collections.addTo')}
                </h2>
                <p className="text-xs truncate max-w-[180px]" style={{ color: theme.colors.textMuted }}>
                  {product.title}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 transition-colors"
              style={{
                color: theme.colors.textMuted,
                borderRadius: theme.radius.md,
              }}
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="animate-spin" size={24} style={{ color: theme.colors.primary }} />
              </div>
            ) : collections.length === 0 ? (
              <div className="text-center py-8">
                <FolderPlus size={40} className="mx-auto mb-3" style={{ color: theme.colors.textMuted, opacity: 0.5 }} />
                <p className="text-sm" style={{ color: theme.colors.textMuted }}>
                  {t('collections.noCollections')}
                </p>
              </div>
            ) : (
              collections.map((collection) => {
                const isSelected = selectedIds.has(collection.id);
                return (
                  <button
                    key={collection.id}
                    onClick={() => handleToggle(collection.id)}
                    className="w-full p-4 flex items-center justify-between transition-all"
                    style={{
                      backgroundColor: isSelected ? theme.colors.primaryLight : theme.colors.surface,
                      border: `1px solid ${isSelected ? theme.colors.primary : theme.colors.border}`,
                      borderRadius: theme.radius.xl,
                    }}
                  >
                    <div className="text-left">
                      <p className="font-medium" style={{ color: theme.colors.text }}>
                        {collection.name}
                      </p>
                      <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                        {collection.products?.length || 0} {t('collections.items')}
                      </p>
                    </div>
                    <div
                      className="w-6 h-6 flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                        border: `2px solid ${isSelected ? theme.colors.primary : theme.colors.border}`,
                        borderRadius: theme.radius.md,
                      }}
                    >
                      {isSelected && <Check size={14} color="#FFF" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div
            className="p-5 border-t flex-shrink-0"
            style={{ borderColor: theme.colors.border }}
          >
            <AnimatePresence mode="wait">
              {showCreate ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={t('collections.newName')}
                    autoFocus
                    className="w-full px-4 py-3 text-sm outline-none"
                    style={{
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.radius.lg,
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCreate(false)}
                      className="flex-1 py-2.5 font-medium text-sm"
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        borderRadius: theme.radius.lg,
                      }}
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      onClick={handleCreate}
                      disabled={!newName.trim() || isCreating}
                      className="flex-1 py-2.5 font-medium text-sm flex items-center justify-center gap-1 disabled:opacity-50"
                      style={{
                        backgroundColor: theme.colors.primary,
                        color: '#FFF',
                        borderRadius: theme.radius.lg,
                      }}
                    >
                      {isCreating ? (
                        <Loader size={16} className="animate-spin" />
                      ) : (
                        <>
                          <Plus size={16} />
                          {t('common.create')}
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setShowCreate(true)}
                  className="w-full py-3 font-medium flex items-center justify-center gap-2 transition-all"
                  style={{
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    border: `1px dashed ${theme.colors.border}`,
                    borderRadius: theme.radius.xl,
                  }}
                >
                  <FolderPlus size={18} />
                  {t('collections.createNew')}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}