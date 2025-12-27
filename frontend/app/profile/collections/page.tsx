'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, FolderHeart, Plus, MoreVertical, Trash2, Edit3, Loader, X
} from 'lucide-react';
import { useCollectionStore } from '@/store/collectionStore';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useTheme } from '@/lib/theme';

export default function CollectionsPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const {
    collections,
    fetchCollections,
    createCollection,
    deleteCollection,
    renameCollection,
    isLoading,
  } = useCollectionStore();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      await createCollection(newName.trim());
      toast.success(t('collections.created'));
      setNewName('');
      setShowCreate(false);
    } catch (error) {
      toast.error(t('collections.createError'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCollection(id);
      toast.success(t('collections.deleted'));
    } catch (error) {
      toast.error(t('collections.error'));
    }
    setMenuOpen(null);
  };

  const handleRename = async (id: number) => {
    if (!editName.trim()) return;
    try {
      await renameCollection(id, editName.trim());
      toast.success(t('collections.renamed'));
      setEditingId(null);
    } catch (error) {
      toast.error(t('collections.error'));
    }
  };

  const startEdit = (id: number, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
    setMenuOpen(null);
  };

  const fullImageUrl = (path: string) => {
    if (!path) return '/placeholder.jpg';
    if (path.startsWith('http')) return path;
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${cleanBase}${path.startsWith('/') ? path : `/${path}`}`;
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: theme.colors.bgGradient }}>
      <div className="max-w-2xl mx-auto px-5 pt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2.5 transition-colors"
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.textMuted,
                borderRadius: theme.radius.lg,
              }}
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold" style={{ color: theme.colors.text }}>
              {t('collections.title')}
            </h1>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="p-2.5 transition-colors"
            style={{
              backgroundColor: theme.colors.primary,
              color: '#FFF',
              borderRadius: theme.radius.lg,
            }}
          >
            <Plus size={20} />
          </button>
        </div>

        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div
                className="p-4 space-y-3"
                style={{
                  backgroundColor: theme.colors.card,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.xl,
                }}
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
                    onClick={() => {
                      setShowCreate(false);
                      setNewName('');
                    }}
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
                      t('common.create')
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="animate-spin" size={32} style={{ color: theme.colors.primary }} />
          </div>
        ) : collections.length === 0 ? (
          <div
            className="text-center py-16"
            style={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.xl,
            }}
          >
            <FolderHeart size={48} className="mx-auto mb-4" style={{ color: theme.colors.textMuted, opacity: 0.5 }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.text }}>
              {t('collections.empty')}
            </h3>
            <p className="text-sm mb-6" style={{ color: theme.colors.textMuted }}>
              {t('collections.emptySubtitle')}
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-6 py-2.5 font-medium flex items-center gap-2 mx-auto transition-all active:scale-95"
              style={{
                backgroundColor: theme.colors.primary,
                color: '#FFF',
                borderRadius: theme.radius.xl,
              }}
            >
              <Plus size={18} />
              {t('collections.createNew')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {collections.map((collection, index) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 relative"
                style={{
                  backgroundColor: theme.colors.card,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.xl,
                  boxShadow: theme.shadows.sm,
                }}
              >
                {editingId === collection.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                      className="flex-1 px-3 py-2 text-sm outline-none"
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.radius.md,
                      }}
                    />
                    <button
                      onClick={() => handleRename(collection.id)}
                      className="px-3 py-2 text-sm font-medium"
                      style={{
                        backgroundColor: theme.colors.primary,
                        color: '#FFF',
                        borderRadius: theme.radius.md,
                      }}
                    >
                      {t('common.save')}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-2"
                      style={{ color: theme.colors.textMuted }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => router.push(`/profile/collections/${collection.id}`)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="w-14 h-14 flex-shrink-0 overflow-hidden grid grid-cols-2 gap-0.5"
                        style={{ borderRadius: theme.radius.lg }}
                      >
                        {collection.products?.slice(0, 4).map((p, i) => (
                          <div key={i} className="relative aspect-square overflow-hidden" style={{ backgroundColor: theme.colors.surface }}>
                            <Image
                              src={fullImageUrl(p.main_image_url)}
                              alt=""
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                        {Array.from({ length: Math.max(0, 4 - (collection.products?.length || 0)) }).map((_, i) => (
                          <div key={`empty-${i}`} style={{ backgroundColor: theme.colors.surface }} />
                        ))}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate" style={{ color: theme.colors.text }}>
                          {collection.name}
                        </h3>
                        <p className="text-sm" style={{ color: theme.colors.textMuted }}>
                          {collection.products?.length || 0} {t('collections.items')}
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(menuOpen === collection.id ? null : collection.id);
                        }}
                        className="p-2"
                        style={{ color: theme.colors.textMuted }}
                      >
                        <MoreVertical size={18} />
                      </button>
                      <AnimatePresence>
                        {menuOpen === collection.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 top-full mt-1 py-1 z-10 min-w-[140px]"
                            style={{
                              backgroundColor: theme.colors.card,
                              border: `1px solid ${theme.colors.border}`,
                              borderRadius: theme.radius.lg,
                              boxShadow: theme.shadows.lg,
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => startEdit(collection.id, collection.name)}
                              className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors"
                              style={{ color: theme.colors.text }}
                            >
                              <Edit3 size={14} />
                              {t('common.rename')}
                            </button>
                            <button
                              onClick={() => handleDelete(collection.id)}
                              className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors"
                              style={{ color: theme.colors.error }}
                            >
                              <Trash2 size={14} />
                              {t('common.delete')}
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}