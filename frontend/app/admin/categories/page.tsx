// frontend/app/admin/categories/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LayoutList, PlusCircle, Trash2, Edit } from 'lucide-react';
// OLD: import { adminApi } from '@/lib/api/admin';
import { adminAPI } from '@/lib/api';
import { LoadingSpinner, EmptyState } from '@/components/admin/Shared';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function CategoriesManagementPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '' });
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

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">{t('admin.categories.pageTitle')}</h2>
        <button onClick={() => { setShowForm(!showForm); setIsEditing(null); setFormData({ name: '', slug: '' }); }} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
          <PlusCircle size={18} />
          {showForm ? t('admin.categories.hide') : t('admin.categories.new')}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow">
          <h3 className="font-semibold mb-4">{isEditing ? t('admin.categories.formTitleEdit') : t('admin.categories.formTitleNew')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder={t('admin.categories.form.name')} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })} className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            <input type="text" placeholder={t('admin.categories.form.slug')} value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })} className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSubmit} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">{t('common.save')}</button>
            <button onClick={resetForm} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400">{t('common.cancel')}</button>
          </div>
        </div>
      )}

      {categories.length === 0 && !showForm ? (
        <EmptyState message={t('admin.categories.empty')} icon={LayoutList} />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {categories.map((cat) => (
              <li key={cat.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{cat.name}</p>
                  <p className="text-sm text-gray-500 font-mono">{cat.slug}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(cat)} className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(cat.id)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg"><Trash2 size={16} /></button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}