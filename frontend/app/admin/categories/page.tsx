'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LayoutList, Plus, Trash2, Edit, X, Save, Search } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { LoadingSpinner, EmptyState } from '@/components/admin/Shared';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme';

export default function CategoriesManagementPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '' });
  const [search, setSearch] = useState('');
  const { t } = useTranslation();
  const { theme } = useTheme();

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

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold" style={{ color: theme.colors.text }}>
          {t('admin.categories.pageTitle')}
        </h2>
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
          className="flex items-center gap-2 px-4 py-2 font-medium transition-all"
          style={{
            backgroundColor: showForm ? theme.colors.surface : theme.colors.primary,
            color: showForm ? theme.colors.text : '#fff',
            borderRadius: theme.radius.xl,
            boxShadow: showForm ? 'none' : theme.shadows.md,
          }}
          onMouseEnter={(e) => {
            if (!showForm) {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = theme.shadows.lg;
            } else {
              e.currentTarget.style.backgroundColor = theme.colors.surfaceHover;
            }
          }}
          onMouseLeave={(e) => {
            if (!showForm) {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = theme.shadows.md;
            } else {
              e.currentTarget.style.backgroundColor = theme.colors.surface;
            }
          }}
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
            className="p-6"
            style={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
              borderLeft: `4px solid ${theme.colors.primary}`,
              borderRadius: theme.radius.xl,
              boxShadow: theme.shadows.md,
            }}
          >
            <h3
              className="text-lg font-bold mb-6 flex items-center gap-2"
              style={{ color: theme.colors.text }}
            >
              {isEditing ? (
                <Edit size={20} style={{ color: theme.colors.primary }} />
              ) : (
                <Plus size={20} style={{ color: theme.colors.primary }} />
              )}
              {isEditing ? t('admin.categories.formTitleEdit') : t('admin.categories.formTitleNew')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label
                  className="block text-xs font-bold mb-2 uppercase tracking-wider"
                  style={{ color: theme.colors.textMuted }}
                >
                  {t('admin.categories.form.name')}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                      slug: e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^a-z0-9-]/g, ''),
                    })
                  }
                  className="w-full px-4 py-3 text-sm outline-none transition-all"
                  style={{
                    backgroundColor: `${theme.colors.surface}80`,
                    border: '1px solid transparent',
                    borderRadius: theme.radius.xl,
                    color: theme.colors.text,
                  }}
                  placeholder="Наприклад: Меблі"
                  onFocus={(e) => {
                    e.target.style.backgroundColor = theme.colors.bg;
                    e.target.style.borderColor = `${theme.colors.primary}4d`;
                  }}
                  onBlur={(e) => {
                    e.target.style.backgroundColor = `${theme.colors.surface}80`;
                    e.target.style.borderColor = 'transparent';
                  }}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-bold mb-2 uppercase tracking-wider"
                  style={{ color: theme.colors.textMuted }}
                >
                  {t('admin.categories.form.slug')}
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slug: e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^a-z0-9-]/g, ''),
                    })
                  }
                  className="w-full px-4 py-3 text-sm outline-none transition-all"
                  style={{
                    backgroundColor: `${theme.colors.surface}80`,
                    border: '1px solid transparent',
                    borderRadius: theme.radius.xl,
                    color: theme.colors.text,
                  }}
                  placeholder="Наприклад: furniture"
                  onFocus={(e) => {
                    e.target.style.backgroundColor = theme.colors.bg;
                    e.target.style.borderColor = `${theme.colors.primary}4d`;
                  }}
                  onBlur={(e) => {
                    e.target.style.backgroundColor = `${theme.colors.surface}80`;
                    e.target.style.borderColor = 'transparent';
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={resetForm}
                className="px-6 py-2.5 text-sm font-medium transition-colors"
                style={{
                  color: theme.colors.textMuted,
                  borderRadius: theme.radius.xl,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.surface;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSubmit}
                className="py-2.5 px-6 text-sm flex items-center gap-2 font-medium transition-all"
                style={{
                  backgroundColor: theme.colors.primary,
                  color: '#fff',
                  borderRadius: theme.radius.xl,
                  boxShadow: theme.shadows.md,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = theme.shadows.lg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = theme.shadows.md;
                }}
              >
                <Save size={16} />
                {t('common.save')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Пошук */}
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 transform -translate-y-1/2"
          size={20}
          style={{ color: theme.colors.textMuted }}
        />
        <input
          type="text"
          placeholder="Пошук категорій..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 outline-none transition-all shadow-sm"
          style={{
            backgroundColor: theme.colors.card,
            border: `1px solid ${theme.colors.border}80`,
            borderRadius: theme.radius['2xl'],
            color: theme.colors.text,
          }}
          onFocus={(e) => {
            e.target.style.boxShadow = `0 0 0 2px ${theme.colors.primary}33`;
            e.target.style.borderColor = `${theme.colors.primary}4d`;
          }}
          onBlur={(e) => {
            e.target.style.boxShadow = theme.shadows.sm;
            e.target.style.borderColor = `${theme.colors.border}80`;
          }}
        />
      </div>

      {filteredCategories.length === 0 ? (
        <EmptyState message={t('admin.categories.empty')} icon={LayoutList} />
      ) : (
        <div
          className="overflow-hidden"
          style={{
            backgroundColor: theme.colors.card,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.xl,
            boxShadow: theme.shadows.md,
          }}
        >
          <ul>
            {filteredCategories.map((cat, index) => (
              <li
                key={cat.id}
                className="p-4 flex items-center justify-between transition-colors group"
                style={{
                  borderBottom:
                    index < filteredCategories.length - 1
                      ? `1px solid ${theme.colors.border}80`
                      : 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${theme.colors.surface}4d`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 flex items-center justify-center"
                    style={{
                      backgroundColor: theme.colors.primaryLight,
                      color: theme.colors.primary,
                      borderRadius: theme.radius.xl,
                    }}
                  >
                    <LayoutList size={20} />
                  </div>
                  <div>
                    <p className="font-bold" style={{ color: theme.colors.text }}>
                      {cat.name}
                    </p>
                    <p
                      className="text-xs font-mono mt-0.5 px-2 py-0.5 rounded w-fit"
                      style={{
                        color: theme.colors.textMuted,
                        backgroundColor: theme.colors.surface,
                      }}
                    >
                      {cat.slug}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(cat)}
                    className="p-2 transition-colors"
                    title={t('common.edit')}
                    style={{
                      color: theme.colors.textMuted,
                      borderRadius: theme.radius.xl,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = theme.colors.primary;
                      e.currentTarget.style.backgroundColor = theme.colors.primaryLight;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = theme.colors.textMuted;
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="p-2 transition-colors"
                    title={t('common.delete')}
                    style={{
                      color: theme.colors.textMuted,
                      borderRadius: theme.radius.xl,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = theme.colors.error;
                      e.currentTarget.style.backgroundColor = theme.colors.errorLight;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = theme.colors.textMuted;
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
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
