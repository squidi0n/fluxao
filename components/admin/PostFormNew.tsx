'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { PostStatus } from '@prisma/client';
import {
  Upload,
  Save,
  X,
  Eye,
  EyeOff,
  Calendar,
  Tag,
  Folder,
  Image,
  FileText,
  Link,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Clock,
  Hash,
  Type,
  AlignLeft,
  Settings,
  Search,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { sanitizeHtml } from '@/lib/sanitize';

const TipTapEditor = dynamic(() => import('@/components/editor/TipTapEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl animate-pulse" />
  ),
});

const postSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich').max(200),
  slug: z
    .string()
    .min(1, 'Slug ist erforderlich')
    .regex(/^[a-z0-9-]+$/, 'Nur Kleinbuchstaben, Zahlen und Bindestriche'),
  teaser: z.string().max(500).optional(),
  content: z.string().min(1, 'Inhalt ist erforderlich'),
  excerpt: z.string().max(300).optional(),
  coverImage: z.string().url().optional().or(z.literal('')),
  status: z.nativeEnum(PostStatus),
  publishedAt: z.string().optional(),
  isFeatured: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
});

type PostFormData = z.infer<typeof postSchema>;

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface PostFormProps {
  post?: {
    id: string;
    title: string;
    slug: string;
    teaser: string | null;
    content: string;
    excerpt?: string | null;
    coverImage?: string | null;
    status: PostStatus;
    publishedAt: Date | null;
    isFeatured?: boolean;
    tags?: Array<{ tag: Tag }>;
    categories?: Array<{ category: Category }>;
  };
  isEdit?: boolean;
}

export default function PostFormNew({ post, isEdit = false }: PostFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'media' | 'meta'>('editor');
  const [tagSearch, setTagSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: post?.title || '',
      slug: post?.slug || '',
      teaser: post?.teaser || '',
      content: post?.content || '',
      excerpt: post?.excerpt || '',
      coverImage: post?.coverImage || '',
      status: post?.status || PostStatus.DRAFT,
      publishedAt: post?.publishedAt ? new Date(post.publishedAt).toISOString().slice(0, 16) : '',
      isFeatured: post?.isFeatured || false,
      tags: post?.tags?.map((pt) => pt.tag.id) || [],
      categories: post?.categories?.map((pc) => pc.category.id) || [],
    },
  });

  const watchTitle = watch('title');
  const watchStatus = watch('status');
  const watchContent = watch('content');
  const watchCoverImage = watch('coverImage');

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/tags').then((res) => res.json()),
      fetch('/api/admin/categories').then((res) => res.json()),
    ])
      .then(([tags, categories]) => {
        setAvailableTags(tags);
        setAvailableCategories(categories);
      })
      .catch(console.error);
  }, []);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const onSubmit = async (data: PostFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const url = isEdit ? `/api/admin/posts/${post?.id}` : '/api/admin/posts';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        ...data,
        publishedAt: data.publishedAt ? new Date(data.publishedAt).toISOString() : null,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Speichern fehlgeschlagen');
      }

      setSuccess(isEdit ? 'Artikel aktualisiert!' : 'Artikel erstellt!');
      setTimeout(() => {
        router.push('/admin/posts');
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload fehlgeschlagen');

      const data = await response.json();
      setValue('coverImage', data.url);
      setSuccess('Bild hochgeladen!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Bildupload fehlgeschlagen');
      setTimeout(() => setError(null), 3000);
    } finally {
      setUploadingImage(false);
    }
  };

  const filteredTags = availableTags.filter((tag) =>
    tag.name.toLowerCase().includes(tagSearch.toLowerCase()),
  );

  const filteredCategories = availableCategories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="w-full px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Artikel bearbeiten' : 'Neuer Artikel'}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {isEdit
              ? 'Bearbeite deinen bestehenden Artikel'
              : 'Erstelle einen neuen Artikel für deine Leser'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Main Content Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-800">
              <nav className="flex">
                {[
                  { id: 'editor', label: 'Editor', icon: FileText },
                  { id: 'media', label: 'Medien & SEO', icon: Image },
                  { id: 'meta', label: 'Einstellungen', icon: Settings },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`
                      flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-all
                      ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-950/50 dark:to-gray-900 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500'
                          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }
                    `}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-8">
              {/* Editor Tab */}
              {activeTab === 'editor' && (
                <div className="space-y-8">
                  {/* Title & Slug */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        <Type className="w-4 h-4" />
                        Titel
                      </label>
                      <input
                        {...register('title')}
                        placeholder="Ein packender Titel..."
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                      {errors.title && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.title.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        <Link className="w-4 h-4" />
                        URL-Slug
                      </label>
                      <div className="flex gap-2">
                        <input
                          {...register('slug')}
                          placeholder="artikel-url"
                          className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setValue('slug', generateSlug(watchTitle))}
                          className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all flex items-center gap-2 shadow-lg"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span className="hidden sm:inline">Generieren</span>
                        </button>
                      </div>
                      {errors.slug && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.slug.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Teaser */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <AlignLeft className="w-4 h-4" />
                      Teaser
                      <span className="text-xs font-normal text-gray-500">(Optional)</span>
                    </label>
                    <textarea
                      {...register('teaser')}
                      rows={3}
                      placeholder="Ein kurzer Text, der Leser neugierig macht..."
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Content Editor */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        <FileText className="w-4 h-4" />
                        Inhalt
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPreview(!showPreview)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {showPreview ? 'Bearbeiten' : 'Vorschau'}
                      </button>
                    </div>
                    {showPreview ? (
                      <div className="min-h-[500px] p-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
                        <div
                          className="prose prose-lg max-w-none dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(watchContent) }}
                        />
                      </div>
                    ) : (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                        <TipTapEditor
                          content={watch('content')}
                          onChange={(content) => setValue('content', content)}
                          placeholder="Beginne mit dem Schreiben..."
                        />
                      </div>
                    )}
                    {errors.content && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.content.message}
                      </p>
                    )}
                  </div>

                  {/* Tags & Categories */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Tags */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        <Hash className="w-4 h-4" />
                        Tags
                      </label>
                      {availableTags.length > 10 && (
                        <div className="mb-3 relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Tags suchen..."
                            value={tagSearch}
                            onChange={(e) => setTagSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm"
                          />
                        </div>
                      )}
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 min-h-[150px] max-h-[300px] overflow-y-auto">
                        <div className="flex flex-wrap gap-2">
                          {filteredTags.map((tag) => {
                            const isSelected = watch('tags')?.includes(tag.id);
                            return (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() => {
                                  const currentTags = watch('tags') || [];
                                  setValue(
                                    'tags',
                                    isSelected
                                      ? currentTags.filter((id) => id !== tag.id)
                                      : [...currentTags, tag.id],
                                  );
                                }}
                                className={`
                                  px-3 py-1.5 rounded-lg text-sm font-medium transition-all transform hover:scale-105
                                  ${
                                    isSelected
                                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-indigo-400'
                                  }
                                `}
                              >
                                #{tag.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Categories */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        <Folder className="w-4 h-4" />
                        Kategorien
                      </label>
                      {availableCategories.length > 10 && (
                        <div className="mb-3 relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Kategorien suchen..."
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm"
                          />
                        </div>
                      )}
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 min-h-[150px] max-h-[300px] overflow-y-auto">
                        <div className="flex flex-wrap gap-2">
                          {filteredCategories.map((category) => {
                            const isSelected = watch('categories')?.includes(category.id);
                            return (
                              <button
                                key={category.id}
                                type="button"
                                onClick={() => {
                                  const currentCategories = watch('categories') || [];
                                  setValue(
                                    'categories',
                                    isSelected
                                      ? currentCategories.filter((id) => id !== category.id)
                                      : [...currentCategories, category.id],
                                  );
                                }}
                                className={`
                                  px-3 py-1.5 rounded-lg text-sm font-medium transition-all transform hover:scale-105
                                  ${
                                    isSelected
                                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-blue-400'
                                  }
                                `}
                              >
                                {category.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Media & SEO Tab */}
              {activeTab === 'media' && (
                <div className="space-y-8">
                  {/* Cover Image */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                      <Image className="w-4 h-4" />
                      Cover-Bild
                    </label>

                    {watchCoverImage && (
                      <div className="mb-6 relative group">
                        <img
                          src={watchCoverImage}
                          alt="Cover"
                          className="w-full h-80 object-cover rounded-xl shadow-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setValue('coverImage', '')}
                          className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-600"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                          Bild-URL
                        </label>
                        <input
                          {...register('coverImage')}
                          type="url"
                          placeholder="https://example.com/bild.jpg"
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                          Datei hochladen
                        </label>
                        <label className="cursor-pointer block">
                          <div className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2 shadow-lg">
                            <Upload className="w-4 h-4" />
                            <span>{uploadingImage ? 'Lädt...' : 'Bild auswählen'}</span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file);
                            }}
                            disabled={uploadingImage}
                          />
                        </label>
                      </div>
                    </div>

                    <div
                      className="mt-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors cursor-pointer"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file?.type.startsWith('image/')) {
                          handleImageUpload(file);
                        }
                      }}
                    >
                      <Image className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Ziehe ein Bild hierher oder klicke auf "Bild auswählen"
                      </p>
                      <p className="text-xs text-gray-500 mt-2">JPG, PNG, GIF, WebP (max. 5MB)</p>
                    </div>
                  </div>

                  {/* SEO */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      <Search className="w-4 h-4" />
                      SEO & Meta-Beschreibung
                    </label>
                    <textarea
                      {...register('excerpt')}
                      rows={4}
                      placeholder="Eine kurze Beschreibung für Suchmaschinen und Social Media..."
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Optimal: 150-160 Zeichen für Suchergebnisse
                    </p>

                    {/* SEO Preview */}
                    <div className="mt-6 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                      <p className="text-xs font-semibold text-gray-500 mb-3">GOOGLE-VORSCHAU</p>
                      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow">
                        <h3 className="text-blue-600 dark:text-blue-400 text-lg font-medium">
                          {watchTitle || 'Artikel-Titel'}
                        </h3>
                        <p className="text-green-700 dark:text-green-400 text-sm mt-1">
                          fluxao.de › {watch('slug') || 'artikel-url'}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 line-clamp-2">
                          {watch('excerpt') || watch('teaser') || 'Beschreibung des Artikels...'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'meta' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Status */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        <Settings className="w-4 h-4" />
                        Status
                      </label>
                      <select
                        {...register('status')}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value={PostStatus.DRAFT}>📝 Entwurf</option>
                        <option value={PostStatus.PUBLISHED}>✅ Veröffentlicht</option>
                        <option value={PostStatus.ARCHIVED}>📦 Archiviert</option>
                      </select>
                    </div>

                    {/* Publish Date */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        <Calendar className="w-4 h-4" />
                        Veröffentlichungsdatum
                      </label>
                      <input
                        {...register('publishedAt')}
                        type="datetime-local"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      />
                      {watchStatus === PostStatus.PUBLISHED && !watch('publishedAt') && (
                        <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Wird automatisch auf die aktuelle Zeit gesetzt
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Featured */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
                    <label className="flex items-start cursor-pointer">
                      <input
                        {...register('isFeatured')}
                        type="checkbox"
                        className="mt-1 h-5 w-5 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          Als Top Story hervorheben
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400 block mt-1">
                          Zeigt diesen Artikel prominent auf der Startseite
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                    <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">
                      Artikel-Informationen
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {watchStatus === PostStatus.DRAFT && '📝 Entwurf'}
                          {watchStatus === PostStatus.PUBLISHED && '✅ Veröffentlicht'}
                          {watchStatus === PostStatus.ARCHIVED && '📦 Archiviert'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tags:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {watch('tags')?.length || 0} ausgewählt
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Kategorien:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {watch('categories')?.length || 0} ausgewählt
                        </span>
                      </div>
                      {isDirty && (
                        <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
                          <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Ungespeicherte Änderungen
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-8 py-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 rounded-b-2xl">
              {/* Messages */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-4 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <p className="text-sm text-green-800 dark:text-green-300">{success}</p>
                </div>
              )}

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => router.push('/admin/posts')}
                  className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Abbrechen
                </button>

                <div className="flex gap-3">
                  {watchStatus !== PostStatus.PUBLISHED && (
                    <button
                      type="button"
                      onClick={() => {
                        setValue('status', PostStatus.DRAFT);
                        handleSubmit(onSubmit)();
                      }}
                      disabled={isLoading}
                      className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all disabled:opacity-50"
                    >
                      Als Entwurf speichern
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all disabled:opacity-50 shadow-lg flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isLoading ? 'Speichert...' : isEdit ? 'Aktualisieren' : 'Veröffentlichen'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
