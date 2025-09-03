'use client';

import Link from 'next/link';
import { useState } from 'react';

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

interface CommentModerationCardProps {
  comment: CommentWithPost;
  onModerate: (
    commentId: string,
    action: 'approve' | 'reject' | 'spam',
    reason?: string,
  ) => Promise<void>;
  compact?: boolean;
}

export default function CommentModerationCard({
  comment,
  onModerate,
  compact = false,
}: CommentModerationCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleModerate = async (action: 'approve' | 'reject' | 'spam') => {
    setIsLoading(true);
    setError(null);

    try {
      let reason: string | undefined;

      if (action === 'reject') {
        reason = prompt('Reason for rejection (optional):') || undefined;
      }

      await onModerate(comment.id, action, reason);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} comment`);
    } finally {
      setIsLoading(false);
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

  const getPriorityIndicator = (status: string, score?: number) => {
    if (status === 'toxic' || status === 'spam') return 'high';
    if (status === 'review' || (status === 'pending' && !score)) return 'medium';
    return 'low';
  };

  const priority = getPriorityIndicator(comment.moderationStatus, comment.moderationScore);
  const priorityColors = {
    high: 'border-l-red-500',
    medium: 'border-l-orange-500',
    low: 'border-l-green-500',
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return date.toLocaleDateString('de-DE');
  };

  if (compact) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-l-4 ${priorityColors[priority]} p-4`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {getStatusBadge(comment.moderationStatus, comment.moderationScore)}
            <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleModerate('approve')}
              disabled={isLoading}
              className="p-1 text-green-600 hover:bg-green-100 rounded disabled:opacity-50"
              title="Approve"
            >
              ✓
            </button>
            <button
              onClick={() => handleModerate('reject')}
              disabled={isLoading}
              className="p-1 text-red-600 hover:bg-red-100 rounded disabled:opacity-50"
              title="Reject"
            >
              ✗
            </button>
            <button
              onClick={() => handleModerate('spam')}
              disabled={isLoading}
              className="p-1 text-orange-600 hover:bg-orange-100 rounded disabled:opacity-50"
              title="Mark as Spam"
            >
              ⚠
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">{comment.body}</p>

        <div className="text-xs text-gray-500">
          {comment.authorName || 'Anonymous'} on{' '}
          <Link href={`/news/${comment.post.slug}`} className="text-blue-600 hover:underline">
            {comment.post.title}
          </Link>
        </div>

        {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow border border-l-4 ${priorityColors[priority]} dark:border-gray-700`}
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
              <span
                className={`text-xs px-2 py-1 rounded ${
                  priority === 'high'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                    : priority === 'medium'
                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                }`}
              >
                {priority.toUpperCase()} PRIORITY
              </span>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              By <strong>{comment.authorName || 'Anonymous'}</strong>
              {comment.authorEmail && <span className="ml-2 text-xs">({comment.authorEmail})</span>}
              <span className="mx-2">•</span>
              {formatDate(comment.createdAt)}
              <span className="mx-2">•</span>
              <Link
                href={`/news/${comment.post.slug}`}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                target="_blank"
              >
                {comment.post.title}
              </Link>
            </div>
          </div>
        </div>

        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
            {comment.body}
          </p>
        </div>

        {comment.moderationReason && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-400">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              <strong>AI Analysis:</strong> {comment.moderationReason}
            </p>
            {comment.moderationScore && (
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                Confidence: {Math.round(comment.moderationScore * 100)}%
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-400">
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleModerate('approve')}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
            Approve
          </button>

          <button
            onClick={() => handleModerate('reject')}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Reject
          </button>

          <button
            onClick={() => handleModerate('spam')}
            disabled={isLoading}
            className="px-4 py-2 bg-orange-600 text-white hover:bg-orange-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.866-.833-2.636 0L3.178 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            Spam
          </button>

          <Link
            href={`/admin/comments/moderation/${comment.id}`}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md dark:bg-gray-700 dark:hover:bg-gray-600 flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}
