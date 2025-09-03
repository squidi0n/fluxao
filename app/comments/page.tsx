'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, ThumbsUp, ThumbsDown, Reply, Edit, Trash2, Clock, User } from 'lucide-react';

interface CommentItem {
  id: string;
  body: string;
  article: { title: string; slug: string } | null;
  createdAt: string;
  likeCount: number;
  dislikeCount: number;
  replies: number;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'SPAM';
}

export default function CommentsPage() {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'rejected' | 'spam'>('all');

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/profile/comments');
        if (!res.ok) throw new Error('Fehler beim Laden');
        const data = await res.json();
        const mapped: CommentItem[] = (data.comments || []).map((c: any) => ({
          id: c.id,
          body: c.body,
          article: c.article,
          createdAt: typeof c.createdAt === 'string' ? c.createdAt : new Date(c.createdAt).toISOString(),
          likeCount: c.likeCount || 0,
          dislikeCount: c.dislikeCount || 0,
          replies: c.replies || 0,
          status: c.status,
        }));
        setComments(mapped);
        setError(null);
      } catch (e: any) {
        setError(e.message || 'Unbekannter Fehler');
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, []);

  const filteredComments = filter === 'all'
    ? comments
    : comments.filter(comment => {
        const status = comment.status.toLowerCase();
        return (
          (filter === 'approved' && status === 'approved') ||
          (filter === 'pending' && status === 'pending') ||
          (filter === 'rejected' && status === 'rejected') ||
          (filter === 'spam' && status === 'spam')
        );
      });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'Genehmigt';
      case 'approved': return 'Genehmigt';
      case 'PENDING': return 'Wartend';
      case 'pending': return 'Wartend';
      case 'REJECTED': return 'Abgelehnt';
      case 'rejected': return 'Abgelehnt';
      case 'SPAM': return 'Spam';
      case 'spam': return 'Spam';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Meine Kommentare
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Verwalte deine Kommentare und sieh Reaktionen und Statistiken
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <MessageSquare className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{comments.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Gesamt</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{comments.filter(c => c.status.toLowerCase() === 'approved').length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Genehmigt</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <ThumbsUp className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{comments.reduce((sum, c) => sum + (c.likeCount || 0), 0)}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Likes</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Reply className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{comments.reduce((sum, c) => sum + (c.replies || 0), 0)}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Antworten</p>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-sm text-gray-500">Lade Kommentare...</div>
        )}
        {error && (
          <div className="text-sm text-red-600">{error}</div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'all', label: 'Alle', count: comments.length },
                { key: 'approved', label: 'Genehmigt', count: comments.filter(c => c.status.toLowerCase() === 'approved').length },
                { key: 'pending', label: 'Wartend', count: comments.filter(c => c.status.toLowerCase() === 'pending').length },
                { key: 'rejected', label: 'Abgelehnt', count: comments.filter(c => c.status.toLowerCase() === 'rejected').length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    filter === tab.key
                      ? 'border-gray-800 text-gray-900 dark:border-gray-200 dark:text-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-6">
          {filteredComments.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {filter === 'all' ? 'Noch keine Kommentare' : `Keine ${getStatusText(filter).toLowerCase()}n Kommentare`}
              </p>
            </div>
          ) : (
            filteredComments.map((comment) => (
              <div key={comment.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {comment.article?.title || 'Ohne Artikel'}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(comment.status)}`}>
                      {getStatusText(comment.status)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      {new Date(comment.createdAt).toLocaleDateString('de-DE', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {comment.body}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{comment.likeCount || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <ThumbsDown className="w-4 h-4" />
                      <span>{comment.dislikeCount || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Reply className="w-4 h-4" />
                      <span>{comment.replies} Antworten</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <a 
                    href={comment.article?.slug ? `/news/${comment.article.slug}` : '#'}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    → Zum Artikel
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
