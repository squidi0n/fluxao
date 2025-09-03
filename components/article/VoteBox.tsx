'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface VoteBoxProps {
  articleId: string;
  articleSlug: string;
  initialLikes: number;
  initialDislikes: number;
  currentUserVote: 'like' | 'dislike' | null;
}

export default function VoteBox({
  articleId,
  articleSlug,
  initialLikes,
  initialDislikes,
  currentUserVote,
}: VoteBoxProps) {
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vote: voteType }),
      });

      if (response.ok) {
        const data = await response.json();
        setLikes(data.likes);
        setDislikes(data.dislikes);
        setUserVote(data.userVote);
      } else {
        console.error('Failed to submit vote');
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
      <h3 className="text-base font-semibold text-gray-900 mb-3 text-center">Artikel bewerten</h3>
      <p className="text-xs text-gray-600 text-center mb-3">Wie findest du diesen Artikel?</p>
      
      {session ? (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => submitVote('like')}
            disabled={isSubmitting}
            className={`flex flex-col items-center gap-1 px-4 py-3 rounded-lg transition-all hover:shadow-md group cursor-pointer ${
              userVote === 'like'
                ? 'bg-green-100 border-2 border-green-300 text-green-700'
                : 'bg-gradient-to-b from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-700'
            } ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <ThumbsUp className={`w-5 h-5 group-hover:scale-110 transition-transform ${
              userVote === 'like' ? 'text-green-600' : ''
            }`} />
            <div className="text-center">
              <div className="font-bold text-sm">{likes}</div>
              <div className="text-xs text-green-600">Gefällt mir</div>
            </div>
          </button>
          
          <button
            onClick={() => submitVote('dislike')}
            disabled={isSubmitting}
            className={`flex flex-col items-center gap-1 px-4 py-3 rounded-lg transition-all hover:shadow-md group cursor-pointer ${
              userVote === 'dislike'
                ? 'bg-red-100 border-2 border-red-300 text-red-700'
                : 'bg-gradient-to-b from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700'
            } ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <ThumbsDown className={`w-5 h-5 group-hover:scale-110 transition-transform ${
              userVote === 'dislike' ? 'text-red-600' : ''
            }`} />
            <div className="text-center">
              <div className="text-xs text-gray-600">Gefällt mir nicht</div>
            </div>
          </button>
        </div>
      ) : (
        <div className="text-center py-2">
          <p className="text-xs text-gray-600 mb-2">Melde dich an, um zu bewerten</p>
          <button
            onClick={() => window.location.href = `/auth/login?callbackUrl=/news/${articleSlug}`}
            className="px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            Anmelden
          </button>
        </div>
      )}
    </div>
  );
}
