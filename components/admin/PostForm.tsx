'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { PostStatus } from '@prisma/client';
import { Upload, X, Tag } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { sanitizeHtml } from '@/lib/sanitize';

// Dynamically import TipTap to avoid SSR issues
const TipTapEditor = dynamic(() => import('@/components/editor/TipTapEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl animate-pulse" />
  ),
});

const postSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich').max(200),
  slug: z
    .string()
    .min(1, 'Slug ist erforderlich')
    .regex(/^[a-z0-9-]+$/, 'Slug muss kleingeschrieben sein, nur Bindestriche'),
  teaser: z.union([z.string().max(500), z.literal('')]).optional(),
  content: z.string().min(1, 'Inhalt ist erforderlich'),
  excerpt: z.union([z.string().max(300), z.literal('')]).optional(),
  coverImage: z.union([z.string(), z.literal('')]).optional(),
  status: z.nativeEnum(PostStatus),
  publishedAt: z.union([z.string(), z.literal('')]).optional(),
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

export default function PostForm({ post, isEdit = false }: PostFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
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

  // Fetch available tags and categories
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

  // Auto-generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const onSubmit = async (data: PostFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const url = isEdit ? `/api/admin/posts/${post?.id}` : '/api/admin/posts';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        ...data,
        publishedAt: data.publishedAt ? new Date(data.publishedAt).toISOString() : null,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save post');
      }

      router.push('/admin/posts');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Title
        </label>
        <input
          {...register('title')}
          type="text"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:text-sm"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="slug"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Slug
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <input
            {...register('slug')}
            type="text"
            className="block w-full flex-1 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:text-sm"
          />
          <button
            type="button"
            onClick={() => setValue('slug', generateSlug(watchTitle))}
            className="ml-2 inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Generate
          </button>
        </div>
        {errors.slug && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.slug.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="teaser"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Teaser (optional)
        </label>
        <textarea
          {...register('teaser')}
          rows={2}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:text-sm"
        />
        {errors.teaser && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.teaser.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="excerpt"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Excerpt / SEO Description (optional)
        </label>
        <textarea
          {...register('excerpt')}
          rows={2}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:text-sm"
          placeholder="Brief description for SEO and previews..."
        />
        {errors.excerpt && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.excerpt.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="coverImage"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Cover Image (optional)
        </label>
        <div className="mt-1 space-y-3">
          {watch('coverImage') && (
            <div className="relative">
              <img
                src={watch('coverImage')}
                alt="Cover"
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => setValue('coverImage', '')}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {!watch('coverImage') && (
            <div className="space-y-3">
              <div className="text-center">
                <label className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {uploadingImage
                        ? 'Bild wird hochgeladen...'
                        : 'Klicke hier um ein Bild hochzuladen'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      PNG, JPG, GIF bis zu 10MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      if (file.size > 10 * 1024 * 1024) {
                        alert('Datei ist zu groß. Max. 10MB erlaubt.');
                        return;
                      }

                      setUploadingImage(true);
                      const formData = new FormData();
                      formData.append('file', file);

                      try {
                        const response = await fetch('/api/upload', {
                          method: 'POST',
                          body: formData,
                        });

                        if (!response.ok) throw new Error('Upload failed');

                        const data = await response.json();
                        setValue('coverImage', data.url);
                      } catch (error) {
                        // console.error('Image upload failed:', error);
                        alert('Bildupload fehlgeschlagen');
                      } finally {
                        setUploadingImage(false);
                      }
                    }}
                    disabled={uploadingImage}
                  />
                </label>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">oder</span>
                </div>
              </div>

              <div>
                <input
                  {...register('coverImage')}
                  type="text"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:text-sm"
                  placeholder="Bild-URL eingeben (z.B. https://example.com/image.jpg)"
                />
              </div>
            </div>
          )}
        </div>
        {errors.coverImage && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.coverImage.message}</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor="content"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Content
          </label>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            {showPreview ? 'Edit' : 'Preview'}
          </button>
        </div>
        {showPreview ? (
          <div className="mt-1 min-h-[400px] rounded-md border border-gray-300 bg-white p-4 dark:border-gray-600 dark:bg-gray-900">
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(watchContent) }}
            />
          </div>
        ) : (
          <div className="mt-1">
            <TipTapEditor
              content={watch('content')}
              onChange={(content) => setValue('content', content)}
              placeholder="Schreibe deinen Artikel hier..."
            />
          </div>
        )}
        {errors.content && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.content.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="tags"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Tags
        </label>
        <div className="mt-1 flex flex-wrap gap-2">
          {availableTags.map((tag) => {
            const isSelected = watch('tags')?.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => {
                  const currentTags = watch('tags') || [];
                  if (isSelected) {
                    setValue(
                      'tags',
                      currentTags.filter((id) => id !== tag.id),
                    );
                  } else {
                    setValue('tags', [...currentTags, tag.id]);
                  }
                }}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {tag.name}
              </button>
            );
          })}
        </div>
        {availableTags.length === 0 && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            No tags available. Create tags first.
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="categories"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Kategorien
        </label>
        <div className="mt-1 flex flex-wrap gap-2">
          {availableCategories.map((category) => {
            const isSelected = watch('categories')?.includes(category.id);
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  const currentCategories = watch('categories') || [];
                  if (isSelected) {
                    setValue(
                      'categories',
                      currentCategories.filter((id) => id !== category.id),
                    );
                  } else {
                    setValue('categories', [...currentCategories, category.id]);
                  }
                }}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {category.name}
              </button>
            );
          })}
        </div>
        {availableCategories.length === 0 && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Keine Kategorien verfügbar. Erstelle zuerst Kategorien.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Status
          </label>
          <select
            {...register('status')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:text-sm"
          >
            <option value={PostStatus.DRAFT}>Draft</option>
            <option value={PostStatus.PUBLISHED}>Published</option>
            <option value={PostStatus.ARCHIVED}>Archived</option>
          </select>
          {errors.status && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.status.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="publishedAt"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Publish Date (optional)
          </label>
          <input
            {...register('publishedAt')}
            type="datetime-local"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:text-sm"
          />
          {errors.publishedAt && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.publishedAt.message}
            </p>
          )}
          {watchStatus === PostStatus.PUBLISHED && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              If not set, will use current time when published
            </p>
          )}
        </div>
      </div>

      {/* Featured Checkbox */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center">
          <input
            {...register('isFeatured')}
            type="checkbox"
            id="isFeatured"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isFeatured" className="ml-3 block">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Als Top Story anzeigen
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">
              Dieser Artikel wird im Hero-Bereich der Homepage als Hauptartikel angezeigt
            </span>
          </label>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.push('/admin/posts')}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          {isLoading ? 'Saving...' : isEdit ? 'Update Post' : 'Create Post'}
        </button>
      </div>
    </form>
  );
}
