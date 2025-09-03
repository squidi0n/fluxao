'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface FluxRatingProps {
  articleId: string;
  articleSlug: string;
  initialLikes?: number;
  initialDislikes?: number;
  currentUserVote?: 'like' | 'dislike' | null;
}

export default function FluxRating({
  articleId,
  articleSlug,
  initialLikes = 0,
  initialDislikes = 0,
  currentUserVote = null,
}: FluxRatingProps) {
  const { data: session } = useSession();
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [userVote, setUserVote] = useState(currentUserVote);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitVote = async (voteType: 'like' | 'dislike') => {
    if (!session) {
      window.location.href = `/auth/login?callbackUrl=/news/${articleSlug}`;
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/articles/${articleId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: voteType }),
      });

      if (response.ok) {
        const data = await response.json();
        setLikes(data.likes);
        setDislikes(data.dislikes);
        setUserVote(data.userVote);
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="my-6">
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 w-full">
        {/* Header */}
        <div className="text-center mb-3">
          <h3 className="text-base font-medium text-gray-900 mb-1">
            Wie fandest du den Artikel?
          </h3>
        </div>

        {/* Current Stats */}
        {likes > 0 && (
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-1 text-sm text-green-600">
              <ThumbsUp className="h-4 w-4" />
              <span>{likes} fanden das gut</span>
            </div>
          </div>
        )}

        {/* Vote Buttons */}
        {session ? (
          <div>
            <p className="text-center text-sm text-gray-600 mb-4">
              {userVote ? 'Danke für deine Bewertung!' : 'Was denkst du?'}
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => submitVote('like')}
                disabled={isSubmitting}
                className={`flex items-center gap-1 px-3 py-1 rounded text-xs transition-colors ${
                  userVote === 'like'
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'border-gray-200 hover:bg-green-50'
                } ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              >
                <ThumbsUp className="h-3 w-3" />
                <span>{likes}</span>
                <span>Gefällt mir</span>
              </button>
              
              <button
                onClick={() => submitVote('dislike')}
                disabled={isSubmitting}
                className={`flex items-center gap-1 px-3 py-1 rounded text-xs transition-colors ${
                  userVote === 'dislike'
                    ? 'bg-gray-50 border-gray-300 text-gray-700'
                    : 'border-gray-200 hover:bg-gray-50'
                } ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              >
                <ThumbsDown className="h-3 w-3" />
                <span>Gefällt mir nicht</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-3">
              Melde dich an, um zu bewerten
            </p>
            <button
              onClick={() => window.location.href = `/auth/login?callbackUrl=/news/${articleSlug}`}
              className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              Anmelden
            </button>
          </div>
        )}
      </div>
    </div>
  );
}