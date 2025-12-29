'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { creatorsAPI, productsAPI, adminAPI } from '@/lib/api';
import { MARKETPLACE_ENABLED } from '@/lib/features';
import { useTheme } from '@/lib/theme';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  author_id: number;
  moderation_status: string;
  rejection_reason: string | null;
  main_image_url: string;
  gallery_image_urls: string[];
  zip_file_path: string;
  file_size_mb: number;
  compatibility: string | null;
  category_ids: number[];
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = parseInt(params.id as string);
  const { theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<Product | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [compatibility, setCompatibility] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  // Files state
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState('');
  const [mainImageUrl, setMainImageUrl] = useState('');

  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);

  const [zipFile, setZipFile] = useState<File | null>(null);
  const [zipFileName, setZipFileName] = useState('');
  const [zipFileUrl, setZipFileUrl] = useState('');
  const [zipFileSize, setZipFileSize] = useState(0);

  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingZip, setUploadingZip] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!MARKETPLACE_ENABLED) {
      router.push('/');
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load categories
      const categoriesData = await productsAPI.getCategories();
      setCategories(categoriesData);

      // Load product
      const productsData = await creatorsAPI.getMyProducts({ limit: 100 });
      const foundProduct = productsData.find((p: any) => p.id === productId);

      if (!foundProduct) {
        setError('Товар не знайдено');
        return;
      }

      // Check if can edit (only DRAFT or REJECTED)
      if (
        foundProduct.moderation_status !== 'draft' &&
        foundProduct.moderation_status !== 'rejected'
      ) {
        setError('Можна редагувати тільки чернетки та відхилені товари');
        return;
      }

      setProduct(foundProduct);

      // Populate form
      setTitle(foundProduct.title);
      setDescription(foundProduct.description);
      setPrice(foundProduct.price.toString());
      setCompatibility(foundProduct.compatibility || '');
      setSelectedCategories(foundProduct.category_ids || []);

      // Images
      setMainImageUrl(foundProduct.main_image_url);
      setMainImagePreview(foundProduct.main_image_url);

      setGalleryUrls(foundProduct.gallery_image_urls || []);
      setGalleryPreviews(foundProduct.gallery_image_urls || []);

      // ZIP file
      setZipFileUrl(foundProduct.zip_file_path);
      setZipFileSize(foundProduct.file_size_mb);
      setZipFileName(foundProduct.zip_file_path.split('/').pop() || 'file.zip');
    } catch (err: any) {
      if (err.response?.status === 403) {
        router.push('/become-creator');
      } else {
        setError('Не вдалося завантажити дані');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMainImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Будь ласка, оберіть зображення');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Розмір зображення не може перевищувати 5 MB');
      return;
    }

    setMainImage(file);
    setMainImagePreview(URL.createObjectURL(file));

    // Upload immediately
    await uploadMainImage(file);
  };

  const uploadMainImage = async (file: File) => {
    setUploadingMain(true);
    setError('');

    try {
      const response = await adminAPI.uploadImage(file);
      setMainImageUrl(response.file_path);
    } catch (err: any) {
      setError('Не вдалося завантажити головне зображення');
      setMainImage(null);
      setMainImagePreview(product?.main_image_url || '');
      setMainImageUrl(product?.main_image_url || '');
    } finally {
      setUploadingMain(false);
    }
  };

  const handleGalleryImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Max 5 images
    if (galleryImages.length + files.length > 5) {
      setError('Максимум 5 зображень у галереї');
      return;
    }

    // Validate each file
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError('Всі файли мають бути зображеннями');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Розмір кожного зображення не може перевищувати 5 MB');
        return;
      }
    }

    const newGalleryImages = [...galleryImages, ...files];
    const newPreviews = [...galleryPreviews, ...files.map((f) => URL.createObjectURL(f))];

    setGalleryImages(newGalleryImages);
    setGalleryPreviews(newPreviews);

    // Upload immediately
    await uploadGalleryImages(files);
  };

  const uploadGalleryImages = async (files: File[]) => {
    setUploadingGallery(true);
    setError('');

    try {
      const uploadedUrls = [];

      for (const file of files) {
        const response = await adminAPI.uploadImage(file);
        uploadedUrls.push(response.file_path);
      }

      setGalleryUrls([...galleryUrls, ...uploadedUrls]);
    } catch (err: any) {
      setError('Не вдалося завантажити зображення галереї');
    } finally {
      setUploadingGallery(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages(galleryImages.filter((_, i) => i !== index));
    setGalleryPreviews(galleryPreviews.filter((_, i) => i !== index));
    setGalleryUrls(galleryUrls.filter((_, i) => i !== index));
  };

  const handleZipFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.zip')) {
      setError('Тільки .zip файли дозволені');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Розмір файлу не може перевищувати 10 MB');
      return;
    }

    setZipFile(file);
    setZipFileName(file.name);
    setZipFileSize(file.size / 1024 / 1024); // Convert to MB

    // Upload immediately
    await uploadZipFile(file);
  };

  const uploadZipFile = async (file: File) => {
    setUploadingZip(true);
    setError('');

    try {
      const response = await adminAPI.uploadArchive(file);
      setZipFileUrl(response.file_path);
    } catch (err: any) {
      setError('Не вдалося завантажити ZIP файл');
      setZipFile(null);
      setZipFileName(product?.zip_file_path.split('/').pop() || '');
      setZipFileUrl(product?.zip_file_path || '');
      setZipFileSize(product?.file_size_mb || 0);
    } finally {
      setUploadingZip(false);
    }
  };

  const toggleCategory = (categoryId: number) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter((id) => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!title.trim()) {
      setError('Введіть назву товару');
      return;
    }

    if (!description.trim()) {
      setError('Введіть опис товару');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 2) {
      setError('Мінімальна ціна: $2');
      return;
    }

    if (!mainImageUrl) {
      setError('Завантажте головне зображення');
      return;
    }

    if (!zipFileUrl) {
      setError('Завантажте ZIP файл з плагіном');
      return;
    }

    setSubmitting(true);

    try {
      await creatorsAPI.updateProduct(productId, {
        title_uk: title,
        description_uk: description,
        price: priceNum,
        category_ids: selectedCategories,
        main_image_url: mainImageUrl,
        gallery_image_urls: galleryUrls,
        zip_file_path: zipFileUrl,
        file_size_mb: zipFileSize,
        compatibility: compatibility || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/creator/products');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не вдалося оновити товар');
    } finally {
      setSubmitting(false);
    }
  };

  if (!MARKETPLACE_ENABLED || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: theme.colors.bgGradient }}>
        <div style={{ color: theme.colors.text }} className="text-xl">Завантаження...</div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="min-h-screen p-6" style={{ background: theme.colors.bgGradient }}>
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push('/creator/products')}
            className="mb-6 flex items-center gap-2 transition-colors hover:opacity-80"
            style={{ color: theme.colors.purple }}
          >
            ← Назад до товарів
          </button>
          <div
            className="p-6"
            style={{
              backgroundColor: theme.colors.errorLight,
              border: `1px solid ${theme.colors.error}30`,
              borderRadius: theme.radius.lg
            }}
          >
            <p style={{ color: theme.colors.error }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 pb-28" style={{ background: theme.colors.bgGradient }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push('/creator/products')}
          className="mb-6 flex items-center gap-2 transition-colors hover:opacity-80"
          style={{ color: theme.colors.purple }}
        >
          ← Назад до товарів
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Редагувати товар
          </h1>
          <p style={{ color: theme.colors.textSecondary }}>Оновіть інформацію про ваш плагін</p>
        </div>

        {/* Rejection Reason */}
        {product?.rejection_reason && (
          <div
            className="p-4 mb-6"
            style={{
              backgroundColor: theme.colors.errorLight,
              border: `1px solid ${theme.colors.error}30`,
              borderRadius: theme.radius.lg
            }}
          >
            <div className="font-medium mb-2" style={{ color: theme.colors.error }}>
              ❌ Причина відхилення модератором:
            </div>
            <div style={{ color: theme.colors.error }}>{product.rejection_reason}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div
            className="backdrop-blur-sm p-6"
            style={{
              backgroundColor: theme.colors.card + '80',
              border: `1px solid ${theme.colors.purple}30`,
              borderRadius: theme.radius['2xl']
            }}
          >
            <h2 className="text-2xl font-bold mb-6" style={{ color: theme.colors.text }}>Основна інформація</h2>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block mb-2 font-medium" style={{ color: theme.colors.textSecondary }}>
                  Назва товару *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Наприклад: Автоматичне розміщення MEP"
                  className="w-full px-4 py-3 focus:outline-none transition-colors"
                  style={{
                    backgroundColor: theme.colors.surface,
                    border: `1px solid ${theme.colors.textMuted}40`,
                    borderRadius: theme.radius.lg,
                    color: theme.colors.text
                  }}
                  onFocus={(e) => e.target.style.borderColor = theme.colors.purple}
                  onBlur={(e) => e.target.style.borderColor = theme.colors.textMuted + '40'}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block mb-2 font-medium" style={{ color: theme.colors.textSecondary }}>
                  Опис товару *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  placeholder="Детальний опис функціоналу плагіна..."
                  className="w-full px-4 py-3 focus:outline-none transition-colors resize-none"
                  style={{
                    backgroundColor: theme.colors.surface,
                    border: `1px solid ${theme.colors.textMuted}40`,
                    borderRadius: theme.radius.lg,
                    color: theme.colors.text
                  }}
                  onFocus={(e) => e.target.style.borderColor = theme.colors.purple}
                  onBlur={(e) => e.target.style.borderColor = theme.colors.textMuted + '40'}
                  required
                />
                <p className="text-sm mt-2" style={{ color: theme.colors.textMuted }}>
                  {description.length} символів (мінімум 10)
                </p>
              </div>

              {/* Price */}
              <div>
                <label className="block mb-2 font-medium" style={{ color: theme.colors.textSecondary }}>
                  Ціна (USD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="2"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="2.00"
                  className="w-full px-4 py-3 focus:outline-none transition-colors"
                  style={{
                    backgroundColor: theme.colors.surface,
                    border: `1px solid ${theme.colors.textMuted}40`,
                    borderRadius: theme.radius.lg,
                    color: theme.colors.text
                  }}
                  onFocus={(e) => e.target.style.borderColor = theme.colors.purple}
                  onBlur={(e) => e.target.style.borderColor = theme.colors.textMuted + '40'}
                  required
                />
                <p className="text-sm mt-2" style={{ color: theme.colors.textMuted }}>
                  Мінімальна ціна: $2.00. Ви отримаєте 85% від продажу.
                </p>
              </div>

              {/* Compatibility */}
              <div>
                <label className="block mb-2 font-medium" style={{ color: theme.colors.textSecondary }}>
                  Сумісність з Revit
                </label>
                <input
                  type="text"
                  value={compatibility}
                  onChange={(e) => setCompatibility(e.target.value)}
                  placeholder="Наприклад: Revit 2020-2024"
                  className="w-full px-4 py-3 focus:outline-none transition-colors"
                  style={{
                    backgroundColor: theme.colors.surface,
                    border: `1px solid ${theme.colors.textMuted}40`,
                    borderRadius: theme.radius.lg,
                    color: theme.colors.text
                  }}
                  onFocus={(e) => e.target.style.borderColor = theme.colors.purple}
                  onBlur={(e) => e.target.style.borderColor = theme.colors.textMuted + '40'}
                />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div
            className="backdrop-blur-sm p-6"
            style={{
              backgroundColor: theme.colors.card + '80',
              border: `1px solid ${theme.colors.purple}30`,
              borderRadius: theme.radius['2xl']
            }}
          >
            <h2 className="text-2xl font-bold mb-6" style={{ color: theme.colors.text }}>Категорії</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className="py-3 px-4 font-medium transition-all hover:opacity-90"
                  style={selectedCategories.includes(category.id) ? {
                    background: `linear-gradient(to right, ${theme.colors.purple}, ${theme.colors.pink})`,
                    color: '#FFFFFF',
                    borderRadius: theme.radius.lg
                  } : {
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.textSecondary,
                    borderRadius: theme.radius.lg
                  }}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Main Image */}
          <div
            className="backdrop-blur-sm p-6"
            style={{
              backgroundColor: theme.colors.card + '80',
              border: `1px solid ${theme.colors.purple}30`,
              borderRadius: theme.radius['2xl']
            }}
          >
            <h2 className="text-2xl font-bold mb-6" style={{ color: theme.colors.text }}>Головне зображення *</h2>

            {mainImagePreview ? (
              <div className="relative">
                <img
                  src={mainImagePreview}
                  alt="Preview"
                  className="w-full h-64 object-cover"
                  style={{ borderRadius: theme.radius.lg }}
                />
                <label
                  className="absolute bottom-2 right-2 px-4 py-2 transition-colors cursor-pointer hover:opacity-90"
                  style={{
                    backgroundColor: theme.colors.purple,
                    color: '#FFFFFF',
                    borderRadius: theme.radius.lg
                  }}
                >
                  Змінити
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMainImageChange}
                    className="hidden"
                  />
                </label>
                {uploadingMain && (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      borderRadius: theme.radius.lg
                    }}
                  >
                    <div style={{ color: theme.colors.text }}>Завантаження...</div>
                  </div>
                )}
              </div>
            ) : (
              <label
                className="block border-2 border-dashed p-12 text-center cursor-pointer transition-colors hover:opacity-80"
                style={{
                  borderColor: theme.colors.textMuted + '60',
                  borderRadius: theme.radius.lg
                }}
              >
                <div className="text-4xl mb-2">📷</div>
                <div className="font-medium mb-2" style={{ color: theme.colors.text }}>
                  Натисніть щоб обрати зображення
                </div>
                <div className="text-sm" style={{ color: theme.colors.textSecondary }}>PNG, JPG (макс. 5MB)</div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleMainImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Gallery Images */}
          <div
            className="backdrop-blur-sm p-6"
            style={{
              backgroundColor: theme.colors.card + '80',
              border: `1px solid ${theme.colors.purple}30`,
              borderRadius: theme.radius['2xl']
            }}
          >
            <h2 className="text-2xl font-bold mb-6" style={{ color: theme.colors.text }}>
              Галерея зображень (опціонально)
            </h2>
            <p className="text-sm mb-4" style={{ color: theme.colors.textSecondary }}>Максимум 5 зображень</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {galleryPreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-32 object-cover"
                    style={{ borderRadius: theme.radius.lg }}
                  />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(index)}
                    className="absolute top-1 right-1 px-2 py-1 text-xs transition-colors hover:opacity-90"
                    style={{
                      backgroundColor: theme.colors.error,
                      color: '#FFFFFF',
                      borderRadius: theme.radius.md
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {galleryPreviews.length < 5 && (
              <label
                className="block border-2 border-dashed p-8 text-center cursor-pointer transition-colors hover:opacity-80"
                style={{
                  borderColor: theme.colors.textMuted + '60',
                  borderRadius: theme.radius.lg
                }}
              >
                <div className="text-2xl mb-2">📸</div>
                <div className="font-medium" style={{ color: theme.colors.text }}>Додати зображення</div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryImagesChange}
                  className="hidden"
                />
              </label>
            )}

            {uploadingGallery && (
              <div className="text-center mt-4" style={{ color: theme.colors.purple }}>
                Завантаження зображень...
              </div>
            )}
          </div>

          {/* ZIP File */}
          <div
            className="backdrop-blur-sm p-6"
            style={{
              backgroundColor: theme.colors.card + '80',
              border: `1px solid ${theme.colors.purple}30`,
              borderRadius: theme.radius['2xl']
            }}
          >
            <h2 className="text-2xl font-bold mb-6" style={{ color: theme.colors.text }}>ZIP файл плагіна *</h2>

            {zipFileUrl ? (
              <div
                className="p-4 flex items-center justify-between"
                style={{
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.textMuted}40`,
                  borderRadius: theme.radius.lg
                }}
              >
                <div>
                  <div className="font-medium" style={{ color: theme.colors.text }}>{zipFileName}</div>
                  <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                    {zipFileSize.toFixed(2)} MB
                  </div>
                </div>
                <label
                  className="px-4 py-2 transition-colors cursor-pointer hover:opacity-90"
                  style={{
                    backgroundColor: theme.colors.purple,
                    color: '#FFFFFF',
                    borderRadius: theme.radius.lg
                  }}
                >
                  Змінити
                  <input
                    type="file"
                    accept=".zip"
                    onChange={handleZipFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <label
                className="block border-2 border-dashed p-12 text-center cursor-pointer transition-colors hover:opacity-80"
                style={{
                  borderColor: theme.colors.textMuted + '60',
                  borderRadius: theme.radius.lg
                }}
              >
                <div className="text-4xl mb-2">📦</div>
                <div className="font-medium mb-2" style={{ color: theme.colors.text }}>
                  Натисніть щоб обрати ZIP файл
                </div>
                <div className="text-sm" style={{ color: theme.colors.textSecondary }}>Максимум 10 MB</div>
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleZipFileChange}
                  className="hidden"
                />
              </label>
            )}

            {uploadingZip && (
              <div className="text-center mt-4" style={{ color: theme.colors.purple }}>
                Завантаження файлу...
              </div>
            )}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div
              className="p-4"
              style={{
                backgroundColor: theme.colors.errorLight,
                border: `1px solid ${theme.colors.error}30`,
                borderRadius: theme.radius.lg
              }}
            >
              <p className="text-sm" style={{ color: theme.colors.error }}>{error}</p>
            </div>
          )}

          {success && (
            <div
              className="p-4"
              style={{
                backgroundColor: theme.colors.successLight,
                border: `1px solid ${theme.colors.success}30`,
                borderRadius: theme.radius.lg
              }}
            >
              <p className="text-sm" style={{ color: theme.colors.success }}>
                ✅ Товар успішно оновлено! Перенаправляємо...
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              submitting ||
              success ||
              uploadingMain ||
              uploadingGallery ||
              uploadingZip ||
              !mainImageUrl ||
              !zipFileUrl
            }
            className="w-full py-4 font-bold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(to right, ${theme.colors.purple}, ${theme.colors.pink})`,
              color: '#FFFFFF',
              borderRadius: theme.radius.lg,
              boxShadow: theme.shadows.lg
            }}
          >
            {submitting ? 'Оновлення...' : '💾 Зберегти зміни'}
          </button>

          <div className="text-center text-sm" style={{ color: theme.colors.textSecondary }}>
            Після збереження ви зможете відправити товар на модерацію
          </div>
        </form>
      </div>
    </div>
  );
}
