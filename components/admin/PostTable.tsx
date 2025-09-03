'use client';

import { PostStatus } from '@prisma/client';
import { format } from 'date-fns';
import { Eye, Edit, Trash2, Globe, Search, Copy, Calendar, BarChart3, Star, ThumbsUp, MessageCircle, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useMemo, useEffect, useRef } from 'react';
import { Pagination } from '@/components/ui/pagination';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  status: PostStatus;
  publishedAt: Date | null;
  isFeatured?: boolean;
  viewCount?: number;
  author: {
    name: string | null;
    email: string;
  };
  categories?: Array<{ category: Category }>;
  _count?: {
    comments: number;
    articleVotes: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: {
    posts: number;
  };
}

interface PostTableProps {
  posts: Post[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  initialSearch?: string;
  initialStatus?: string;
  initialCategory?: string;
  initialSortBy?: string;
  initialSortOrder?: string;
  categories: Category[];
  onDelete?: (id: string) => void;
}

type SortField = 'title' | 'createdAt' | 'publishedAt' | 'status' | 'viewCount' | 'updatedAt';
type SortOrder = 'asc' | 'desc';

export default function PostTable({ 
  posts, 
  totalCount,
  totalPages,
  currentPage,
  initialSearch = '',
  initialStatus = 'all',
  initialCategory = 'all',
  initialSortBy = 'createdAt',
  initialSortOrder = 'desc',
  categories,
  onDelete 
}: PostTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>(initialSearch);
  const [selectedStatus, setSelectedStatus] = useState<PostStatus | 'all' | 'featured'>(initialStatus as PostStatus | 'all' | 'featured');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>(initialSortBy as SortField);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSortOrder as SortOrder);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown && !(event.target as HTMLElement).closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  // Update URL when filters change
  const updateURL = (search: string, status: string, category: string, sort?: string, order?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }
    
    if (status && status !== 'all') {
      params.set('status', status);
    } else {
      params.delete('status');
    }
    
    if (category && category !== 'all') {
      params.set('category', category);
    } else {
      params.delete('category');
    }
    
    if (sort) params.set('sort', sort);
    if (order) params.set('order', order);
    
    // Reset to page 1 when filtering
    params.delete('page');
    
    router.push(`?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateURL(searchTerm, selectedStatus, selectedCategory);
  };

  const handleStatusChange = (status: PostStatus | 'all' | 'featured') => {
    setSelectedStatus(status);
    updateURL(searchTerm, status, selectedCategory);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    updateURL(searchTerm, selectedStatus, categoryId);
  };

  const handleSort = (field: SortField) => {
    const newOrder = sortField === field && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortField(field);
    setSortOrder(newOrder);
    updateURL(searchTerm, selectedStatus, selectedCategory, field, newOrder);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return '↕️';
    }
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        'Möchten Sie diesen Beitrag wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden!',
      )
    )
      return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/posts/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDelete?.(id);
        window.location.reload();
      } else {
        alert('Fehler beim Löschen des Beitrags');
      }
    } catch (error) {
      // console.error('Delete error:', error);
      alert('Fehler beim Löschen des Beitrags');
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusToggle = async (post: Post) => {
    const newStatus = post.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';

    setUpdatingStatus(post.id);
    try {
      const response = await fetch(`/api/admin/posts/${post.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          publishedAt: newStatus === 'PUBLISHED' ? new Date().toISOString() : null,
        }),
      });

      if (response.ok) {
        router.refresh();
        window.location.reload();
      } else {
        alert('Fehler beim Aktualisieren des Status');
      }
    } catch (error) {
      // console.error('Status update error:', error);
      alert('Fehler beim Aktualisieren des Status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDuplicate = async (post: Post) => {
    if (!confirm('Möchten Sie diesen Artikel duplizieren?')) return;
    
    try {
      const response = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `${post.title} (Kopie)`,
          slug: `${post.slug}-kopie-${Date.now()}`,
          content: post.content,
          status: 'DRAFT',
          categories: post.categories?.map(pc => pc.category.id),
        }),
      });

      if (response.ok) {
        const newPost = await response.json();
        router.push(`/admin/posts/${newPost.id}/edit`);
      } else {
        alert('Fehler beim Duplizieren des Artikels');
      }
    } catch (error) {
      alert('Fehler beim Duplizieren des Artikels');
    }
  };

  const handleToggleFeatured = async (post: Post) => {
    setUpdatingStatus(post.id);
    try {
      const response = await fetch(`/api/admin/posts/${post.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isFeatured: !post.isFeatured,
        }),
      });

      if (response.ok) {
        router.refresh();
        window.location.reload();
      } else {
        alert('Fehler beim Aktualisieren');
      }
    } catch (error) {
      alert('Fehler beim Aktualisieren');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusBadge = (status: PostStatus) => {
    const styles = {
      DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      PUBLISHED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      ARCHIVED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };

    const labels = {
      DRAFT: 'Entwurf',
      PUBLISHED: 'Veröffentlicht',
      ARCHIVED: 'Archiviert',
    };

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  return (
    <div>
      {/* Filter Section */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            placeholder="Suche nach Titel oder Slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-12 pr-20 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
          >
            Suchen
          </button>
        </form>

        {/* Compact Filter Bar - Slack/Linear Style */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-6">
            {/* Status Filter - Compact Pills */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Status:
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => handleStatusChange('all')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedStatus === 'all'
                      ? 'bg-indigo-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Alle
                </button>
                <button
                  onClick={() => handleStatusChange(PostStatus.DRAFT)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedStatus === PostStatus.DRAFT
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Draft
                </button>
                <button
                  onClick={() => handleStatusChange(PostStatus.PUBLISHED)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedStatus === PostStatus.PUBLISHED
                      ? 'bg-green-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Live
                </button>
                <button
                  onClick={() => handleStatusChange(PostStatus.ARCHIVED)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedStatus === PostStatus.ARCHIVED
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Archiv
                </button>
                <button
                  onClick={() => handleStatusChange('featured')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedStatus === 'featured'
                      ? 'bg-yellow-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  ⭐ Top
                </button>
              </div>
            </div>
            
            {/* Category Filter - All Categories as Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Kategorie:
              </span>
              <div className="flex gap-1 flex-wrap">
                <button
                  onClick={() => handleCategoryChange('all')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-purple-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Alle
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-purple-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                    title={`${category.name} (${category._count.posts} Artikel)`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results Count - Enhanced */}
        <div className="flex flex-wrap items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div>
            {totalCount} {totalCount === 1 ? 'Beitrag' : 'Beiträge'} gefunden
            {(searchTerm || selectedStatus !== 'all' || selectedCategory !== 'all') && (
              <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400 rounded-full text-xs">
                Gefiltert
              </span>
            )}
          </div>
          
          {/* Active Filters */}
          <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400 rounded-full text-xs">
                🔍 "{searchTerm}"
                <button
                  onClick={() => {
                    setSearchTerm('');
                    updateURL('', selectedStatus, selectedCategory);
                  }}
                  className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                >
                  ×
                </button>
              </span>
            )}
            {selectedStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400 rounded-full text-xs">
                Status: {selectedStatus === 'featured' ? '⭐ Top' : selectedStatus}
                <button
                  onClick={() => handleStatusChange('all')}
                  className="hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5"
                >
                  ×
                </button>
              </span>
            )}
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400 rounded-full text-xs">
                {categories.find(c => c.id === selectedCategory)?.name || 'Kategorie'}
                <button
                  onClick={() => handleCategoryChange('all')}
                  className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th 
                className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleSort('title')}
              >
                📝 Titel {getSortIcon('title')}
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleSort('viewCount')}
              >
                📊 Statistiken {getSortIcon('viewCount')}
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleSort('status')}
              >
                🏷️ Status {getSortIcon('status')}
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                📂 Kategorie
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleSort('publishedAt')}
              >
                📅 Veröffentlicht {getSortIcon('publishedAt')}
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                ⚙️ Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {posts.map((post) => (
              <tr
                key={post.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="max-w-md">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/${post.slug}`}
                            target="_blank"
                            className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          >
                            {post.title}
                          </Link>
                          {post.isFeatured && (
                            <span className="inline-flex items-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
                              ⭐ TOP
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <Eye className="w-3 h-3" />
                        <span className="font-medium">{post.viewCount || 0}</span>
                      </span>
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <ThumbsUp className="w-3 h-3" />
                        <span className="font-medium">{post._count?.articleVotes || 0}</span>
                      </span>
                      <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                        <MessageCircle className="w-3 h-3" />
                        <span className="font-medium">{post._count?.comments || 0}</span>
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {post.author.name || post.author.email.split('@')[0]}
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">{getStatusBadge(post.status)}</td>
                <td className="px-6 py-4">
                  {post.categories && post.categories.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {post.categories.map((pc) => (
                        <span
                          key={pc.category.id}
                          className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                        >
                          {pc.category.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {post.publishedAt ? (
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {format(new Date(post.publishedAt), 'dd.MM.yyyy')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(post.publishedAt), 'HH:mm')} Uhr
                      </p>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 italic">Nicht geplant</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center justify-center gap-1">
                    {/* Primary Actions */}
                    <Link
                      href={`/admin/posts/${post.id}/edit`}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Bearbeiten
                    </Link>
                    
                    {/* Quick Status Toggle */}
                    <button
                      onClick={() => handleStatusToggle(post)}
                      disabled={updatingStatus === post.id}
                      className={`inline-flex items-center p-1.5 rounded-md transition-colors ${
                        post.status === 'PUBLISHED'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                      title={post.status === 'PUBLISHED' ? 'Auf Draft setzen' : 'Veröffentlichen'}
                    >
                      <Globe className="w-4 h-4" />
                    </button>

                    {/* Featured Toggle */}
                    <button
                      onClick={() => handleToggleFeatured(post)}
                      className={`inline-flex items-center p-1.5 rounded-md transition-colors ${
                        post.isFeatured
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-800'
                      }`}
                      title={post.isFeatured ? 'Von Highlights entfernen' : 'Als Highlight'}
                    >
                      <Star className={`w-4 h-4 ${post.isFeatured ? 'fill-current' : ''}`} />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(post.id)}
                      disabled={deletingId === post.id}
                      className="inline-flex items-center p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-md transition-colors"
                      title="Löschen"
                    >
                      {deletingId === post.id ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {posts.length === 0 && (
          <div className="bg-white px-6 py-12 text-center dark:bg-gray-900">
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || selectedStatus !== 'all'
                ? 'Keine Beiträge gefunden. Versuche andere Filterkriterien.'
                : 'Keine Beiträge vorhanden'}
            </p>
          </div>
        )}
        
        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
        />
      </div>
    </div>
  );
}
