'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LayoutList, Plus, Trash2, Edit, X, Save, Search } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { LoadingSpinner, EmptyState } from '@/components/admin/Shared';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

export default function CategoriesManagementPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '' });
  const [search, setSearch] = useState('');
  const { t } = useTranslation();

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getCategories();
      setCategories(response || []);
    } catch (error) {
      toast.error(t('admin.products.form.toasts.categoriesLoadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const resetForm = () => {
    setShowForm(false);
    setIsEditing(null);
    setFormData({ name: '', slug: '' });
  };

  const handleEdit = (category: any) => {
    setIsEditing(category.id);
    setFormData({ name: category.name, slug: category.slug });
    setShowForm(true);
    // Прокручуємо вгору до форми
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.slug) {
      toast.error(t('admin.categories.form.nameRequired'));
      return;
    }

    try {
      if (isEditing) {
        await adminAPI.updateCategory(isEditing, formData.name, formData.slug);
        toast.success(t('admin.categories.toasts.updated'));
      } else {
        await adminAPI.createCategory(formData.name, formData.slug);
        toast.success(t('admin.categories.toasts.created'));
      }
      resetForm();
      await fetchCategories();
    } catch (error: any) {
      toast.error(error.message || t('admin.categories.toasts.saveError'));
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm(t('admin.categories.toasts.confirmDelete'))) {
      try {
        await adminAPI.deleteCategory(id);
        toast.success(t('admin.categories.toasts.deleted'));
        await fetchCategories();
      } catch (error) {
        toast.error(t('admin.categories.toasts.deleteError'));
      }
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(search.toLowerCase()) ||
    cat.slug.toLowerCase().includes(search.toLowerCase())
  );

  const inputClass = "w-full px-4 py-3 bg-muted/50 border border-transparent rounded-xl text-foreground text-sm placeholder:text-muted-foreground focus:bg-background focus:border-primary/30 focus:ring-0 outline-none transition-all";

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-foreground">{t('admin.categories.pageTitle')}</h2>
        <button
          onClick={() => {
              if (showForm) {
                  resetForm();
              } else {
                  setShowForm(true);
                  setIsEditing(null);
                  setFormData({ name: '', slug: '' });
              }
          }}
          className={`btn-primary flex items-center gap-2 ${showForm ? 'bg-muted text-foreground hover:bg-muted/80 shadow-none' : ''}`}
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? t('common.cancel') : t('admin.categories.new')}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card-minimal p-6 border-l-4 border-l-primary"
          >
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-foreground">
                {isEditing ? <Edit size={20} className="text-primary" /> : <Plus size={20} className="text-primary" />}
                {isEditing ? t('admin.categories.formTitleEdit') : t('admin.categories.formTitleNew')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">{t('admin.categories.form.name')}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                    className={inputClass}
                    placeholder="Наприклад: Меблі"
                  />
              </div>
              <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">{t('admin.categories.form.slug')}</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                    className={inputClass}
                    placeholder="Наприклад: furniture"
                  />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={resetForm} className="px-6 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                {t('common.cancel')}
              </button>
              <button onClick={handleSubmit} className="btn-primary py-2.5 px-6 text-sm flex items-center gap-2">
                <Save size={16} />
                {t('common.save')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Пошук */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
        <input
          type="text"
          placeholder="Пошук категорій..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-card border border-border/50 rounded-2xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all shadow-sm placeholder:text-muted-foreground"
        />
      </div>

      {filteredCategories.length === 0 ? (
        <EmptyState message={t('admin.categories.empty')} icon={LayoutList} />
      ) : (
        <div className="card-minimal overflow-hidden">
          <ul className="divide-y divide-border/50">
            {filteredCategories.map((cat) => (
              <li key={cat.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <LayoutList size={20} />
                    </div>
                    <div>
                        <p className="font-bold text-foreground">{cat.name}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5 bg-muted px-2 py-0.5 rounded w-fit">{cat.slug}</p>
                    </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(cat)}
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                    title={t('common.edit')}
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                    title={t('common.delete')}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}