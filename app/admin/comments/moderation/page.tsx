'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface CommentWithPost {
  id: string;
  body: string;
  authorName?: string;
  authorEmail?: string;
  status: string;
  moderationStatus: string;
  moderationReason?: string;
  moderationScore?: number;
  aiReviewed: boolean;
  createdAt: string;
  post: {
    id: string;
    title: string;
    slug: string;
  };
}

interface ModerationStats {
  total: number;
  aiReviewed: number;
  aiReviewedPercent: number;
  byStatus: Record<string, number>;
}

interface QueueMetrics {
  total: any;
  moderation: {
    waiting: number;
    active: number;
  };
}

interface ModerationResponse {
  comments: CommentWithPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats?: ModerationStats;
  queue?: QueueMetrics;
}

export default function CommentModerationPage() {
  const [comments, setComments] = useState<CommentWithPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [queue, setQueue] = useState<QueueMetrics | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchComments();
  }, [statusFilter, page]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: statusFilter,
        page: page.toString(),
        stats: 'true',
      });

      const response = await fetch(`/api/admin/comments/moderation?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data: ModerationResponse = await response.json();
      setComments(data.comments);
      setPagination(data.pagination);
      setStats(data.stats || null);
      setQueue(data.queue || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const moderateComment = async (
    commentId: string,
    action: 'approve' | 'reject' | 'spam',
    reason?: string,
  ) => {
    try {
      const response = await fetch(`/api/admin/comments/moderation/${commentId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || `Failed to ${action} comment`);
      }

      fetchComments(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} comment`);
    }
  };

  const getStatusBadge = (status: string, aiScore?: number) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      review: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
      ok: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      spam: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      toxic: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles] || styles.pending}`}
      >
        {status}
        {aiScore && <span className="text-xs opacity-75">{Math.round(aiScore * 100)}%</span>}
      </span>
    );
  };

  const getCommentPreview = (body: string) => {
    return body.length > 150 ? body.slice(0, 150) + '...' : body;
  };

  if (loading && comments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Comment Moderation</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Review and moderate user comments using AI assistance
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600"
        >
          <option value="all">All Pending Review</option>
          <option value="pending">AI Pending</option>
          <option value="review">Needs Review</option>
          <option value="spam">Flagged as Spam</option>
          <option value="toxic">Flagged as Toxic</option>
          <option value="ok">AI Approved</option>
        </select>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Comments (7d)</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600 dark:text-gray-400">AI Reviewed</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.aiReviewedPercent}%
            </div>
            <div className="text-xs text-gray-500">
              {stats.aiReviewed} of {stats.total}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600 dark:text-gray-400">Needs Review</div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {(stats.byStatus.review || 0) + (stats.byStatus.pending || 0)}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600 dark:text-gray-400">Queue Status</div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {queue ? (
                <>
                  <div>Waiting: {queue.moderation.waiting}</div>
                  <div>Processing: {queue.moderation.active}</div>
                </>
              ) : (
                'Loading...'
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {comments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            <svg
              className="mx-auto h-12 w-12 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0v10a2 2 0 002 2h6a2 2 0 002-2V8"
              />
            </svg>
            <p className="text-lg font-medium">No comments need moderation</p>
            <p className="mt-2">
              All comments have been reviewed or there are no comments to moderate.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusBadge(comment.moderationStatus, comment.moderationScore)}
                        {comment.aiReviewed && (
                          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded dark:bg-blue-900/20 dark:text-blue-300">
                            AI Reviewed
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        By {comment.authorName || 'Anonymous'} •{' '}
                        {new Date(comment.createdAt).toLocaleDateString('de-DE')} •{' '}
                        <Link
                          href={`/news/${comment.post.slug}`}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        >
                          {comment.post.title}
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                      {getCommentPreview(comment.body)}
                    </p>
                  </div>

                  {comment.moderationReason && (
                    <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-300">
                        <strong>AI Reason:</strong> {comment.moderationReason}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => moderateComment(comment.id, 'approve')}
                      className="px-3 py-1 text-sm bg-green-600 text-white hover:bg-green-700 rounded-md"
                    >
                      Approve
                    </button>

                    <button
                      onClick={() => {
                        const reason = prompt('Reason for rejection (optional):');
                        moderateComment(comment.id, 'reject', reason || undefined);
                      }}
                      className="px-3 py-1 text-sm bg-red-600 text-white hover:bg-red-700 rounded-md"
                    >
                      Reject
                    </button>

                    <button
                      onClick={() => moderateComment(comment.id, 'spam')}
                      className="px-3 py-1 text-sm bg-orange-600 text-white hover:bg-orange-700 rounded-md"
                    >
                      Mark as Spam
                    </button>

                    <Link
                      href={`/admin/comments/moderation/${comment.id}`}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md dark:bg-gray-700 dark:hover:bg-gray-600"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                Previous
              </button>

              <span className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                Page {page} of {pagination.pages}
              </span>

              <button
                onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                disabled={page >= pagination.pages}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
