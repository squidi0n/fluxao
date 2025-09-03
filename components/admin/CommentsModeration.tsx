'use client';

import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  User, 
  Clock, 
  ExternalLink, 
  Check, 
  X, 
  Shield, 
  Trash2, 
  Filter, 
  Search,
  ChevronDown,
  AlertTriangle,
  Eye,
  MoreHorizontal,
  Flag
} from 'lucide-react';

interface Comment {
  id: string;
  postId: string;
  post: {
    id: string;
    title: string;
    slug: string;
  };
  authorName: string | null;
  authorEmail: string | null;
  body: string;
  status: string;
  spamScore: number | null;
  ipAddress: string | null;
  userAgent: string | null;
  moderatedBy: string | null;
  moderatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CommentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  spam: number;
}

export default function CommentsModeration() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [stats, setStats] = useState<CommentStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    spam: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedComments, setSelectedComments] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(selectedStatus && selectedStatus !== 'ALL' && { status: selectedStatus }),
      });

      const response = await fetch(`/api/admin/comments?${params}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
        setStats(data.stats || {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          spam: 0,
        });
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        // Set empty state on API error
        setComments([]);
        setStats({
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          spam: 0,
        });
        setTotalPages(1);
      }
    } catch (error) {
      // console.error('Failed to fetch comments:', error);
      // Set empty state on error
      setComments([]);
      setStats({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        spam: 0,
      });
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [selectedStatus, page]);

  const handleModerate = async (commentId: string, status: string) => {
    try {
      // Optimistic update
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, status } 
          : comment
      ));
      
      const response = await fetch(`/api/admin/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        await fetchComments();
        setSelectedComments([]);
      } else {
        // Revert optimistic update on failure
        await fetchComments();
        alert('Failed to moderate comment');
      }
    } catch (error) {
      // Revert optimistic update on error
      await fetchComments();
      alert('Failed to moderate comment');
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedComments.length === 0) {
      alert('Please select comments to moderate');
      return;
    }

    const actionText = {
      'approve': 'approve',
      'reject': 'reject', 
      'spam': 'mark as spam'
    }[action] || action;

    if (!confirm(`Are you sure you want to ${actionText} ${selectedComments.length} comment${selectedComments.length > 1 ? 's' : ''}?`)) {
      return;
    }

    try {
      // Show loading state
      const originalComments = [...comments];
      setComments(prev => prev.map(comment => 
        selectedComments.includes(comment.id)
          ? { ...comment, status: action.toUpperCase() }
          : comment
      ));
      
      const response = await fetch('/api/admin/comments/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          commentIds: selectedComments,
        }),
      });

      if (response.ok) {
        await fetchComments();
        setSelectedComments([]);
      } else {
        // Revert on failure
        setComments(originalComments);
        alert('Failed to perform bulk action');
      }
    } catch (error) {
      // Revert on error
      await fetchComments();
      alert('Failed to perform bulk action');
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to permanently delete this comment? This action cannot be undone.')) {
      return;
    }

    try {
      // Optimistic delete
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      
      const response = await fetch(`/api/admin/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchComments();
      } else {
        // Revert optimistic delete on failure
        await fetchComments();
        alert('Failed to delete comment');
      }
    } catch (error) {
      // Revert optimistic delete on error
      await fetchComments();
      alert('Failed to delete comment');
    }
  };

  const toggleCommentSelection = (commentId: string) => {
    setSelectedComments((prev) =>
      prev.includes(commentId) ? prev.filter((id) => id !== commentId) : [...prev, commentId],
    );
  };

  const toggleAllComments = () => {
    if (!comments || comments.length === 0) return;
    
    if (selectedComments.length === comments.length) {
      setSelectedComments([]);
    } else {
      setSelectedComments(comments.map((c) => c.id));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: {
        icon: Clock,
        label: 'Pending',
        classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      },
      APPROVED: {
        icon: Check,
        label: 'Approved',
        classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      },
      REJECTED: {
        icon: X,
        label: 'Rejected',
        classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      },
      SPAM: {
        icon: Shield,
        label: 'Spam',
        classes: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.classes}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const getSpamScoreBadge = (score: number | null) => {
    if (score === null) return null;

    let colorClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    let icon = '✅';
    
    if (score >= 70) {
      colorClass = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      icon = '🚨';
    } else if (score >= 50) {
      colorClass = 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      icon = '⚠️';
    } else if (score >= 30) {
      colorClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      icon = '⚡';
    }

    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${colorClass}`}>
        <span>{icon}</span>
        {score}% Risk
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Comments</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats?.total || 0}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
              stats?.pending > 0 
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' 
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              {stats?.pending > 0 ? 'Needs Review' : 'Up to date'}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Review</h3>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{stats?.pending || 0}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full dark:bg-green-900/30 dark:text-green-400">
              {stats?.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Approved</h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{stats?.approved || 0}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <X className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Rejected</h3>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{stats?.rejected || 0}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <Shield className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
            <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
              stats?.spam > 0 
                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            }`}>
              {stats?.spam === 0 ? 'Clean' : 'Alert'}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Spam Detected</h3>
          <p className="text-3xl font-bold text-gray-600 dark:text-gray-400 mt-1">{stats?.spam || 0}</p>
        </div>
      </div>

      {/* Enhanced Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                id="status-filter"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Comments</option>
                <option value="PENDING">⏱️ Pending Review</option>
                <option value="APPROVED">✅ Approved</option>
                <option value="REJECTED">❌ Rejected</option>
                <option value="SPAM">🛡️ Spam</option>
              </select>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search comments..."
                className="w-64 pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {selectedComments.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {selectedComments.length} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkAction('approve')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleBulkAction('reject')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Reject
                </button>
                <button
                  onClick={() => handleBulkAction('spam')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Mark as Spam
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modern Comment Cards */}
      <div className="space-y-4">
        {comments && comments.length > 0 && (
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={comments && selectedComments.length === comments.length && comments.length > 0}
                onChange={toggleAllComments}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedComments.length > 0 ? `${selectedComments.length} selected` : 'Select all'}
              </span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {comments ? comments.length : 0} comments
            </div>
          </div>
        )}
        
        {comments && comments.map((comment) => (
          <div
            key={comment.id}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border transition-all hover:shadow-md ${
              selectedComments.includes(comment.id)
                ? 'border-blue-300 dark:border-blue-600 ring-2 ring-blue-100 dark:ring-blue-900/50'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedComments.includes(comment.id)}
                    onChange={() => toggleCommentSelection(comment.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                  />
                  
                  {/* Avatar */}
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  
                  {/* Author Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {comment.authorName || 'Anonymous User'}
                      </h4>
                      {getStatusBadge(comment.status)}
                      {comment.spamScore && comment.spamScore > 30 && (
                        <span className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                          <AlertTriangle className="w-3 h-3" />
                          Risk: {comment.spamScore}%
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(comment.createdAt), 'MMM dd, yyyy HH:mm')}
                      </span>
                      {comment.authorEmail && (
                        <span>{comment.authorEmail}</span>
                      )}
                      {comment.ipAddress && (
                        <span>IP: {comment.ipAddress}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Actions Dropdown */}
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Comment Content */}
              <div className="mb-4 pl-12">
                <p className="text-gray-900 dark:text-white leading-relaxed">
                  {comment.body}
                </p>
              </div>
              
              {/* Post Reference */}
              <div className="flex items-center justify-between pl-12 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Comment on:</span>
                  <a
                    href={`/news/${comment.post.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                  >
                    {comment.post.title}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                
                {/* Quick Actions */}
                <div className="flex items-center gap-2">
                  {comment.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleModerate(comment.id, 'APPROVED')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleModerate(comment.id, 'REJECTED')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </>
                  )}
                  
                  {comment.status === 'APPROVED' && (
                    <button
                      onClick={() => handleModerate(comment.id, 'REJECTED')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {(!comments || comments.length === 0) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            {isLoading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 dark:text-gray-400">Loading comments...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No comments found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {selectedStatus === 'ALL' 
                      ? 'There are no comments yet.' 
                      : `No ${selectedStatus.toLowerCase()} comments found.`}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Pagination */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {Math.min((page - 1) * 20 + 1, stats.total)} to {Math.min(page * 20, stats.total)} of {stats.total} comments
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
