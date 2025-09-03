'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Heart, ThumbsDown, MessageCircle, Send, User, Calendar, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface Comment {
  id: string;
  body: string;
  authorName: string;
  authorEmail?: string;
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'SPAM';
  likeCount: number;
  dislikeCount: number;
  replies?: Comment[];
  userHasLiked?: boolean;
  userHasDisliked?: boolean;
}

interface CommentSectionProps {
  articleId: string;
  articleSlug: string;
}

export default function CommentSection({ articleId, articleSlug }: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalComments, setTotalComments] = useState(0);
  const commentsPerPage = 10;
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    content: '',
  });

  // Auto-fill form for logged-in users
  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        name: session.user.name || '',
        email: session.user.email || '',
      }));
    }
  }, [session]);

  // Load comments
  useEffect(() => {
    fetchComments();
  }, [articleId, currentPage]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/articles/${articleId}/comments?page=${currentPage}&limit=${commentsPerPage}`);
      if (res.ok) {
        const data = await res.json();
        if (data.comments) {
          // Paginated response
          setComments(data.comments.filter((c: Comment) => c.status === 'APPROVED'));
          setTotalComments(data.total || 0);
        } else {
          // Legacy response - filter and paginate manually
          const approvedComments = data.filter((c: Comment) => c.status === 'APPROVED');
          setTotalComments(approvedComments.length);
          const startIndex = (currentPage - 1) * commentsPerPage;
          const endIndex = startIndex + commentsPerPage;
          setComments(approvedComments.slice(startIndex, endIndex));
        }
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.content.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/articles/${articleId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          parentId,
        }),
      });

      if (res.ok) {
        const response = await res.json();
        setFormData({ name: session?.user?.name || '', email: session?.user?.email || '', content: '' });
        setReplyingTo(null);
        setErrorMessage(null);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);
        
        // If comment was auto-approved, refresh comments
        if (response.status === 'APPROVED') {
          fetchComments();
        }
        
        // For demo, add to local state immediately (normally would wait for moderation)
        const newComment: Comment = {
          id: Date.now().toString(),
          body: formData.content,
          authorName: formData.name,
          authorEmail: formData.email,
          createdAt: new Date().toISOString(),
          status: 'PENDING',
          likeCount: 0,
          dislikeCount: 0,
        };
        
        if (parentId) {
          // Add as reply
          setComments(prev => prev.map(c => 
            c.id === parentId 
              ? { ...c, replies: [...(c.replies || []), newComment] }
              : c
          ));
        }
      } else {
        // Handle API errors (AI moderation rejection, etc.)
        const errorData = await res.json();
        setErrorMessage(errorData.error + (errorData.reason ? ` (${errorData.reason})` : ''));
        setTimeout(() => setErrorMessage(null), 8000);
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
      setErrorMessage('Fehler beim Senden des Kommentars. Bitte versuchen Sie es erneut.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReaction = async (commentId: string, type: 'like' | 'dislike') => {
    try {
      await fetch(`/api/comments/${commentId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      // Update local state
      setComments(prev => prev.map(c => {
        if (c.id === commentId) {
          if (type === 'like') {
            return {
              ...c,
              likeCount: c.userHasLiked ? c.likeCount - 1 : c.likeCount + 1,
              dislikeCount: c.userHasDisliked ? c.dislikeCount - 1 : c.dislikeCount,
              userHasLiked: !c.userHasLiked,
              userHasDisliked: false,
            };
          } else {
            return {
              ...c,
              likeCount: c.userHasLiked ? c.likeCount - 1 : c.likeCount,
              dislikeCount: c.userHasDisliked ? c.dislikeCount - 1 : c.dislikeCount + 1,
              userHasLiked: false,
              userHasDisliked: !c.userHasDisliked,
            };
          }
        }
        return c;
      }));
    } catch (error) {
      console.error('Failed to react to comment:', error);
    }
  };

  const CommentCard = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`${isReply ? 'ml-12 mt-4' : 'mb-6'}`}>
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow ${isReply ? 'border-l-4 border-purple-200' : ''}`}>
        {/* Author info */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
              {comment.authorName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{comment.authorName}</h4>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(comment.createdAt), { 
                  addSuffix: true,
                  locale: de 
                })}
              </p>
            </div>
          </div>
          {comment.status === 'PENDING' && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Wird geprüft
            </span>
          )}
        </div>

        {/* Comment content */}
        <p className="text-gray-700 mb-4 leading-relaxed">{comment.body}</p>

        {/* Actions */}
        <div className="flex items-center gap-4 text-sm">
          <button
            onClick={() => handleReaction(comment.id, 'like')}
            className={`flex items-center gap-1.5 transition-colors ${
              comment.userHasLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${comment.userHasLiked ? 'fill-current' : ''}`} />
            <span>{comment.likeCount}</span>
          </button>
          
          <button
            onClick={() => handleReaction(comment.id, 'dislike')}
            className={`flex items-center gap-1.5 transition-colors ${
              comment.userHasDisliked ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'
            }`}
          >
            <ThumbsDown className={`w-4 h-4 ${comment.userHasDisliked ? 'fill-current' : ''}`} />
            <span>{comment.dislikeCount}</span>
          </button>

          {!isReply && (
            <button
              onClick={() => setReplyingTo(comment.id === replyingTo ? null : comment.id)}
              className="flex items-center gap-1.5 text-gray-500 hover:text-purple-600 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Antworten</span>
            </button>
          )}
        </div>

        {/* Reply form */}
        {replyingTo === comment.id && (
          <form onSubmit={(e) => handleSubmit(e, comment.id)} className="mt-4 p-4 bg-gray-50 rounded-lg">
            {session?.user && (
              <div className="flex items-center gap-2 text-sm text-green-600 mb-3">
                <User className="w-4 h-4" />
                <span>Antworten als {session.user.name}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                placeholder="Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  session?.user ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                readOnly={!!session?.user}
                required
              />
              <input
                type="email"
                placeholder="E-Mail (optional)"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  session?.user ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                readOnly={!!session?.user}
              />
            </div>
            <textarea
              placeholder="Deine Antwort..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              rows={3}
              required
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                Antworten
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <CommentCard key={reply.id} comment={reply} isReply={true} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-purple-600" />
          Kommentare ({totalComments})
        </h2>
        <p className="text-gray-600">Teile deine Gedanken zu diesem Artikel</p>
      </div>

      {/* Success message */}
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <AlertCircle className="w-5 h-5" />
          <p>Dein Kommentar wurde eingereicht und wird nach Prüfung veröffentlicht.</p>
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700">
          <AlertCircle className="w-5 h-5 mt-0.5" />
          <div>
            <p className="font-medium">Kommentar abgelehnt</p>
            <p className="text-sm mt-1">{errorMessage}</p>
            <p className="text-xs mt-2 text-red-600">
              💡 Tipp: Vermeiden Sie Schimpfwörter, Beleidigungen und Werbung.
            </p>
          </div>
        </div>
      )}

      {/* Comment form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Kommentar schreiben</h3>
          {session?.user && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <User className="w-4 h-4" />
              <span>Angemeldet als {session.user.name}</span>
            </div>
          )}
        </div>
        <form onSubmit={(e) => handleSubmit(e)}>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Dein Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                session?.user ? 'bg-gray-50 cursor-not-allowed' : ''
              }`}
              readOnly={!!session?.user}
              required
            />
            <input
              type="email"
              placeholder="E-Mail (optional, wird nicht veröffentlicht)"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                session?.user ? 'bg-gray-50 cursor-not-allowed' : ''
              }`}
              readOnly={!!session?.user}
            />
          </div>
          <textarea
            placeholder="Was denkst du über diesen Artikel?"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            rows={4}
            required
          />
          <div className="flex justify-between items-center mt-4">
            <p className="text-xs text-gray-500">
              Kommentare werden vor Veröffentlichung geprüft.
            </p>
            <button
              type="submit"
              disabled={submitting || !formData.name.trim() || !formData.content.trim()}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Wird gespeichert...' : 'Kommentar speichern'}
            </button>
          </div>
        </form>
      </div>

      {/* Comments list */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="text-gray-500 mt-2">Kommentare werden geladen...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Noch keine Kommentare</p>
          <p className="text-gray-500 text-sm mt-1">Sei der Erste, der einen Kommentar hinterlässt!</p>
        </div>
      ) : (
        <div>
          {comments.map((comment) => (
            <CommentCard key={comment.id} comment={comment} />
          ))}
          
          {/* Pagination */}
          {totalComments > commentsPerPage && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Vorherige
              </button>
              
              <span className="px-4 py-2 text-gray-600">
                Seite {currentPage} von {Math.ceil(totalComments / commentsPerPage)}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalComments / commentsPerPage), prev + 1))}
                disabled={currentPage >= Math.ceil(totalComments / commentsPerPage)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Nächste →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}