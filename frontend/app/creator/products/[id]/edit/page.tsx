'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { creatorsAPI, productsAPI, adminAPI } from '@/lib/api';
import { MARKETPLACE_ENABLED } from '@/lib/features';

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
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Завантаження...</div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push('/creator/products')}
            className="text-purple-400 hover:text-purple-300 mb-6 flex items-center gap-2"
          >
            ← Назад до товарів
          </button>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 p-6 pb-28">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push('/creator/products')}
          className="text-purple-400 hover:text-purple-300 mb-6 flex items-center gap-2"
        >
          ← Назад до товарів
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Редагувати товар
          </h1>
          <p className="text-slate-400">Оновіть інформацію про ваш плагін</p>
        </div>

        {/* Rejection Reason */}
        {product?.rejection_reason && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <div className="text-red-400 font-medium mb-2">
              ❌ Причина відхилення модератором:
            </div>
            <div className="text-red-300">{product.rejection_reason}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Основна інформація</h2>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-slate-300 mb-2 font-medium">
                  Назва товару *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Наприклад: Автоматичне розміщення MEP"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-300 mb-2 font-medium">
                  Опис товару *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  placeholder="Детальний опис функціоналу плагіна..."
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                  required
                />
                <p className="text-slate-500 text-sm mt-2">
                  {description.length} символів (мінімум 10)
                </p>
              </div>

              {/* Price */}
              <div>
                <label className="block text-slate-300 mb-2 font-medium">
                  Ціна (USD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="2"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="2.00"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
                <p className="text-slate-500 text-sm mt-2">
                  Мінімальна ціна: $2.00. Ви отримаєте 85% від продажу.
                </p>
              </div>

              {/* Compatibility */}
              <div>
                <label className="block text-slate-300 mb-2 font-medium">
                  Сумісність з Revit
                </label>
                <input
                  type="text"
                  value={compatibility}
                  onChange={(e) => setCompatibility(e.target.value)}
                  placeholder="Наприклад: Revit 2020-2024"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Категорії</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className={`py-3 px-4 rounded-lg font-medium transition-all ${
                    selectedCategories.includes(category.id)
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Main Image */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Головне зображення *</h2>

            {mainImagePreview ? (
              <div className="relative">
                <img
                  src={mainImagePreview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <label className="absolute bottom-2 right-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors cursor-pointer">
                  Змінити
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMainImageChange}
                    className="hidden"
                  />
                </label>
                {uploadingMain && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <div className="text-white">Завантаження...</div>
                  </div>
                )}
              </div>
            ) : (
              <label className="block border-2 border-dashed border-slate-700 rounded-lg p-12 text-center cursor-pointer hover:border-purple-500 transition-colors">
                <div className="text-4xl mb-2">📷</div>
                <div className="text-white font-medium mb-2">
                  Натисніть щоб обрати зображення
                </div>
                <div className="text-slate-400 text-sm">PNG, JPG (макс. 5MB)</div>
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
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">
              Галерея зображень (опціонально)
            </h2>
            <p className="text-slate-400 text-sm mb-4">Максимум 5 зображень</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {galleryPreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(index)}
                    className="absolute top-1 right-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {galleryPreviews.length < 5 && (
              <label className="block border-2 border-dashed border-slate-700 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 transition-colors">
                <div className="text-2xl mb-2">📸</div>
                <div className="text-white font-medium">Додати зображення</div>
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
              <div className="text-center text-purple-400 mt-4">
                Завантаження зображень...
              </div>
            )}
          </div>

          {/* ZIP File */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">ZIP файл плагіна *</h2>

            {zipFileUrl ? (
              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">{zipFileName}</div>
                  <div className="text-slate-400 text-sm">
                    {zipFileSize.toFixed(2)} MB
                  </div>
                </div>
                <label className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors cursor-pointer">
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
              <label className="block border-2 border-dashed border-slate-700 rounded-lg p-12 text-center cursor-pointer hover:border-purple-500 transition-colors">
                <div className="text-4xl mb-2">📦</div>
                <div className="text-white font-medium mb-2">
                  Натисніть щоб обрати ZIP файл
                </div>
                <div className="text-slate-400 text-sm">Максимум 10 MB</div>
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleZipFileChange}
                  className="hidden"
                />
              </label>
            )}

            {uploadingZip && (
              <div className="text-center text-purple-400 mt-4">
                Завантаження файлу...
              </div>
            )}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <p className="text-green-400 text-sm">
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
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/50"
          >
            {submitting ? 'Оновлення...' : '💾 Зберегти зміни'}
          </button>

          <div className="text-center text-slate-400 text-sm">
            Після збереження ви зможете відправити товар на модерацію
          </div>
        </form>
      </div>
    </div>
  );
}
