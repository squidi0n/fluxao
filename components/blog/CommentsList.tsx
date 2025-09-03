'use client';

import { format } from 'date-fns';
import { useState, useEffect } from 'react';

import { sanitizeHtml } from '@/lib/sanitize';

interface Comment {
  id: string;
  authorName: string | null;
  authorEmail?: string | null;
  body: string;
  createdAt: string;
  status: string;
  replies?: Comment[]; // Support for nested replies
  author?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    subscription?: {
      plan: string;
      status: string;
    };
  };
}

interface CommentsListProps {
  postId: string;
  refreshTrigger?: number;
}

export default function CommentsList({ postId, refreshTrigger = 0 }: CommentsListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyForm, setReplyForm] = useState({
    authorName: '',
    authorEmail: '',
    body: '',
  });

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        postId,
        status: 'APPROVED',
        page: page.toString(),
        limit: '20',
      });

      const response = await fetch(`/api/comments?${params}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      // console.error('Failed to fetch comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId, page, refreshTrigger]);

  const handleReplySubmit = async (parentId: string) => {
    if (!replyForm.authorName.trim() || !replyForm.body.trim()) return;

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          parentId,
          authorName: replyForm.authorName,
          authorEmail: replyForm.authorEmail || undefined,
          body: replyForm.body,
        }),
      });

      if (response.ok) {
        setReplyForm({ authorName: '', authorEmail: '', body: '' });
        setReplyingTo(null);
        fetchComments(); // Refresh comments to show the new reply
      }
    } catch (error) {
      console.error('Failed to submit reply:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">Loading comments...</p>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          No comments yet. Be the first to share your thoughts!
        </p>
      </div>
    );
  }

  const renderComment = (comment: Comment, isReply = false) => {
    const isPremium =
      comment.author?.subscription?.plan === 'PREMIUM' ||
      comment.author?.subscription?.plan === 'PRO';
    const isAdmin = comment.author?.role === 'ADMIN';

    return (
      <div
        key={comment.id}
        className={`${isReply ? 'ml-8 mt-4' : ''} rounded-lg border p-6 transition-all ${
          isPremium
            ? 'border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50 dark:border-purple-600 dark:from-purple-900/20 dark:to-pink-900/20'
            : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
        }`}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                isPremium
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold'
                  : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300'
              }`}
            >
              {(comment.authorName || comment.author?.name || 'A')[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900 dark:text-white">
                  {comment.authorName || comment.author?.name || 'Anonymous'}
                </p>
                {isPremium && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                    ⚡ PREMIUM
                  </span>
                )}
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white">
                    👑 ADMIN
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {format(new Date(comment.createdAt), 'MMM dd, yyyy at HH:mm')}
              </p>
            </div>
          </div>
        </div>

        <div className="prose prose-sm max-w-none text-gray-700 dark:prose-invert dark:text-gray-300">
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(comment.body) }} />
        </div>

        {!isReply && (
          <div className="mt-4 flex items-center space-x-4">
            <button
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Reply
            </button>
          </div>
        )}

        {replyingTo === comment.id && (
          <div className="mt-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Your name"
                value={replyForm.authorName}
                onChange={(e) => setReplyForm({ ...replyForm, authorName: e.target.value })}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:text-sm"
                required
              />
              <input
                type="email"
                placeholder="your@email.com (optional)"
                value={replyForm.authorEmail}
                onChange={(e) => setReplyForm({ ...replyForm, authorEmail: e.target.value })}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:text-sm"
              />
            </div>
            <textarea
              rows={3}
              placeholder="Your reply..."
              value={replyForm.body}
              onChange={(e) => setReplyForm({ ...replyForm, body: e.target.value })}
              className="mt-3 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:text-sm"
              required
            />
            <div className="mt-3 flex justify-end space-x-2">
              <button
                onClick={() => setReplyingTo(null)}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReplySubmit(comment.id)}
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                Post Reply
              </button>
            </div>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4">
            {comment.replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
        Comments ({comments.length})
      </h3>

      <div className="space-y-4">
        {comments.map((comment) => renderComment(comment))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
