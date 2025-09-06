'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Plus, Loader, X } from 'lucide-react';
import { useCollectionStore } from '@/store/collectionStore';
import { Product } from '@/types';
import toast from 'react-hot-toast';

interface AddToCollectionModalProps {
  product: Product;
  onClose: () => void;
}

export default function AddToCollectionModal({ product, onClose }: AddToCollectionModalProps) {
  const { collections, addCollection, addProductToCollection, removeProductFromCollection } = useCollectionStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  // Локальний стан для миттєвого оновлення UI, поки Zustand оновлюється у фоні
  const [productCollections, setProductCollections] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  // TODO: Поки що ця логіка не реалізована, але вона потрібна для відображення,
  // в яких саме колекціях вже є товар.
  useEffect(() => {
    // setLoading(false);
  }, [product.id]);

  const handleToggleCollection = async (collectionId: number) => {
    const isInCollection = productCollections.has(collectionId);

    // Оптимістичне оновлення UI
    setProductCollections(prev => {
        const newSet = new Set(prev);
        if (isInCollection) {
            newSet.delete(collectionId);
        } else {
            newSet.add(collectionId);
        }
        return newSet;
    });

    try {
      if (isInCollection) {
        await removeProductFromCollection(collectionId, product.id);
        toast.success(`Видалено з "${collections.find(c => c.id === collectionId)?.name}"`);
      } else {
        await addProductToCollection(collectionId, product.id);
        toast.success(`Додано до "${collections.find(c => c.id === collectionId)?.name}"`);
      }
    } catch {
      toast.error("Сталася помилка");
      // Відкат оптимістичного оновлення у разі помилки
      setProductCollections(prev => {
        const newSet = new Set(prev);
        if (isInCollection) {
            newSet.add(collectionId);
        } else {
            newSet.delete(collectionId);
        }
        return newSet;
      });
    }
  };

  const handleCreateAndAdd = async () => {
    const newCollection = await addCollection(newCollectionName, 'default');
    if (newCollection) {
      await handleToggleCollection(newCollection.id);
      setNewCollectionName('');
      setIsCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Додати в колекцію</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700">
            <X size={20} />
          </button>
        </div>

        {collections.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {collections.map(collection => {
                    const isInCollection = productCollections.has(collection.id);
                    return (
                        <label key={collection.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer">
                            <input
                                type="checkbox"
                                className="h-5 w-5 rounded text-purple-600 focus:ring-purple-500"
                                checked={isInCollection}
                                onChange={() => handleToggleCollection(collection.id)}
                            />
                            <Heart className={isInCollection ? 'text-purple-500' : 'text-gray-400'}/>
                            <span>{collection.name}</span>
                        </label>
                    )
                })}
            </div>
        ) : (
            <div className="text-center py-4 text-gray-500">
                <p>У вас ще немає жодної колекції.</p>
                <p className="text-xs mt-1">Створіть першу, щоб додати цей товар.</p>
            </div>
        )}
      </motion.div>
    </motion.div>
  );
}