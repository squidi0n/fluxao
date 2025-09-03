'use client';

import { PostStatus } from '@prisma/client';
import {
  Save,
  X,
  Eye,
  Upload,
  Tag,
  Folder,
  AlertCircle,
  CheckCircle,
  Home,
  Star,
  Loader2,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

// Temporary fix for runtime error  
function sanitizeHtml(content: string) {
  return content; // TODO: Re-implement proper sanitization
}

import TechTagSelector from './TechTagSelector';

// Dynamically import editor
const TipTapEditor = dynamic(() => import('@/components/editor/TipTapEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  ),
});

interface PostFormV2Props {
  post?: any;
  isEdit?: boolean;
}

export default function PostFormV2({ post, isEdit = false }: PostFormV2Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Form data
  const [formData, setFormData] = useState({
    title: post?.title || '',
    slug: post?.slug || '',
    teaser: post?.teaser || '',
    content: post?.content || '',
    excerpt: post?.excerpt || '',
    coverImage: post?.coverImage || '',
    status: post?.status || PostStatus.DRAFT,
    publishedAt: post?.publishedAt ? new Date(post.publishedAt).toISOString().slice(0, 16) : '',
    isFeatured: post?.isFeatured || false,
    isFeaturedInCategory: post?.isFeaturedInCategory || false,
    tags: post?.tags?.map((pt: any) => pt.tag.id) || [],
    categories: post?.categories?.map((pc: any) => pc.category.id) || [],
    techTags: post?.techTags || [], // New field for tech tags
  });

  // Load tags and categories
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const [tagsResponse, categoriesResponse] = await Promise.all([
          fetch('/api/admin/tags'),
          fetch('/api/categories'),
        ]);

        let tags = [];
        let categories = [];

        if (tagsResponse.ok) {
          tags = await tagsResponse.json();
        } else {
          console.error('Failed to fetch tags:', tagsResponse.status);
          setErrors(prev => ({ ...prev, tags: 'Fehler beim Laden der Tags' }));
        }

        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          categories = categoriesData.categories || [];
        } else {
          console.error('Failed to fetch categories:', categoriesResponse.status);
          setErrors(prev => ({ ...prev, categories: 'Fehler beim Laden der Kategorien' }));
        }

        setAvailableTags(Array.isArray(tags) ? tags : []);
        setAvailableCategories(Array.isArray(categories) ? categories : []);
      } catch (error) {
        console.error('Error loading tags and categories:', error);
        setAvailableTags([]);
        setAvailableCategories([]);
        setErrors(prev => ({ ...prev, data: 'Fehler beim Laden der Daten' }));
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, []);

  // Auto-generate slug
  const generateSlug = useCallback((title: string) => {
    return title
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }, []);

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setErrors({ ...errors, coverImage: 'Datei zu groß. Max. 10MB.' });
      return;
    }

    setUploadingImage(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setFormData({ ...formData, coverImage: data.url });
      setErrors({ ...errors, coverImage: '' });
    } catch (error) {
      setErrors({ ...errors, coverImage: 'Bildupload fehlgeschlagen' });
    } finally {
      setUploadingImage(false);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Titel ist erforderlich';
    }
    if (formData.title.length > 200) {
      newErrors.title = 'Titel darf maximal 200 Zeichen lang sein';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug ist erforderlich';
    }
    if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Inhalt ist erforderlich';
    }

    if (formData.teaser && formData.teaser.length > 500) {
      newErrors.teaser = 'Teaser darf maximal 500 Zeichen lang sein';
    }

    if (formData.excerpt && formData.excerpt.length > 300) {
      newErrors.excerpt = 'Excerpt darf maximal 300 Zeichen lang sein';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save post
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setSuccessMessage('');

    try {
      const url = isEdit ? `/api/admin/posts/${post?.id}` : '/api/admin/posts';
      const method = isEdit ? 'PUT' : 'POST';

      // Clean up data before sending
      const payload = {
        ...formData,
        teaser: formData.teaser || undefined,
        excerpt: formData.excerpt || undefined,
        coverImage: formData.coverImage || undefined,
        publishedAt: formData.publishedAt || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        categories: formData.categories.length > 0 ? formData.categories : undefined,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Speichern fehlgeschlagen');
      }

      setSuccessMessage(isEdit ? 'Post erfolgreich aktualisiert!' : 'Post erfolgreich erstellt!');

      setTimeout(() => {
        router.push('/admin/posts');
        router.refresh();
      }, 1000);
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <p className="text-green-800 dark:text-green-300">{successMessage}</p>
        </div>
      )}

      {/* Error Messages */}
      {errors.submit && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-red-800 dark:text-red-300">{errors.submit}</p>
        </div>
      )}
      {errors.data && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-red-800 dark:text-red-300">{errors.data}</p>
        </div>
      )}

      {/* Title and Slug */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h3 className="text-lg font-semibold mb-4">Grundinformationen</h3>

        <div>
          <label className="block text-sm font-medium mb-2">
            Titel <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
            placeholder="Gib einen aussagekräftigen Titel ein..."
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            URL-Slug <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
              placeholder="url-freundlicher-slug"
            />
            <button
              type="button"
              onClick={() => setFormData({ ...formData, slug: generateSlug(formData.title) })}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Generieren
            </button>
          </div>
          {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Teaser <span className="text-gray-500 text-xs">(Optional, max. 500 Zeichen)</span>
          </label>
          <textarea
            value={formData.teaser}
            onChange={(e) => setFormData({ ...formData, teaser: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
            placeholder="Kurze Zusammenfassung für Vorschauen..."
          />
          <p className="mt-1 text-xs text-gray-500">{formData.teaser.length}/500</p>
          {errors.teaser && <p className="mt-1 text-sm text-red-600">{errors.teaser}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            SEO Beschreibung{' '}
            <span className="text-gray-500 text-xs">(Optional, max. 300 Zeichen)</span>
          </label>
          <textarea
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
            placeholder="Beschreibung für Suchmaschinen..."
          />
          <p className="mt-1 text-xs text-gray-500">{formData.excerpt.length}/300</p>
          {errors.excerpt && <p className="mt-1 text-sm text-red-600">{errors.excerpt}</p>}
        </div>
      </div>

      {/* Cover Image */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4">Cover Bild</h3>

        {formData.coverImage ? (
          <div className="relative">
            <img
              src={formData.coverImage}
              alt="Cover"
              className="w-full h-64 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={() => setFormData({ ...formData, coverImage: '' })}
              className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer"
              onClick={() => document.getElementById('image-upload')?.click()}
            >
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {uploadingImage ? 'Wird hochgeladen...' : 'Klicke oder ziehe ein Bild hierher'}
              </p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF bis 10MB</p>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                  oder URL eingeben
                </span>
              </div>
            </div>

            <input
              type="text"
              value={formData.coverImage}
              onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
              placeholder="https://example.com/image.jpg"
            />
          </div>
        )}
        {errors.coverImage && <p className="mt-2 text-sm text-red-600">{errors.coverImage}</p>}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            Inhalt <span className="text-red-500">*</span>
          </h3>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Editor' : 'Vorschau'}
          </button>
        </div>

        {showPreview ? (
          <div className="prose prose-lg max-w-none dark:prose-invert min-h-[400px] p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(formData.content) }} />
          </div>
        ) : (
          <TipTapEditor
            content={formData.content}
            onChange={(content) => setFormData({ ...formData, content })}
            placeholder="Schreibe deinen Artikel hier..."
          />
        )}
        {errors.content && <p className="mt-2 text-sm text-red-600">{errors.content}</p>}
      </div>

      {/* Tech Tags Selector - NEW! */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <TechTagSelector
          selectedTags={formData.techTags}
          onTagsChange={(tags) => setFormData({ ...formData, techTags: tags })}
        />
      </div>

      {/* Categories and Tags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Folder className="w-5 h-5" />
            Kategorien
          </h3>
          {isLoadingData ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Lade Kategorien...</span>
            </div>
          ) : errors.categories ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{errors.categories}</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableCategories && availableCategories.length > 0 ? (
                availableCategories.map((category) => {
                  const isSelected = formData.categories.includes(category.id);
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setFormData({
                            ...formData,
                            categories: formData.categories.filter((id) => id !== category.id),
                          });
                        } else {
                          setFormData({
                            ...formData,
                            categories: [...formData.categories, category.id],
                          });
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {category.name}
                    </button>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500 italic">
                  Keine Kategorien verfügbar. Erstelle zuerst Kategorien im Admin-Bereich.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Tags
          </h3>
          {isLoadingData ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Lade Tags...</span>
            </div>
          ) : errors.tags ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{errors.tags}</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableTags && availableTags.length > 0 ? (
                availableTags.map((tag) => {
                  const isSelected = formData.tags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setFormData({
                            ...formData,
                            tags: formData.tags.filter((id) => id !== tag.id),
                          });
                        } else {
                          setFormData({
                            ...formData,
                            tags: [...formData.tags, tag.id],
                          });
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      #{tag.name}
                    </button>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500 italic">
                  Keine Tags verfügbar. Erstelle zuerst Tags im Admin-Bereich.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Publishing Options */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4">Veröffentlichungsoptionen</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as PostStatus })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
            >
              <option value={PostStatus.DRAFT}>Entwurf</option>
              <option value={PostStatus.PUBLISHED}>Veröffentlicht</option>
              <option value={PostStatus.ARCHIVED}>Archiviert</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Veröffentlichungsdatum
              {formData.status === PostStatus.PUBLISHED && !formData.publishedAt && (
                <span className="text-xs text-gray-500 ml-2">(Sofort veröffentlichen)</span>
              )}
            </label>
            <input
              type="datetime-local"
              value={formData.publishedAt}
              onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
            />
          </div>
        </div>

        {/* Featured Options */}
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium">Als Hauptartikel auf der Startseite</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Dieser Artikel wird in der großen Slideshow auf der Homepage angezeigt
                </p>
              </div>
            </label>
          </div>

          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={formData.isFeaturedInCategory}
                onChange={(e) =>
                  setFormData({ ...formData, isFeaturedInCategory: e.target.checked })
                }
                className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="font-medium">Als Top-Artikel in der Kategorie</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Dieser Artikel wird prominent in seiner Kategorie-Seite angezeigt
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={() => router.push('/admin/posts')}
          className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Abbrechen
        </button>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Wird gespeichert...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEdit ? 'Aktualisieren' : 'Veröffentlichen'}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
