'use client';

import { useState } from 'react';

import CommentForm from './CommentForm';
import CommentsList from './CommentsList';

interface CommentsSectionProps {
  postId: string;
}

export default function CommentsSection({ postId }: CommentsSectionProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCommentAdded = () => {
    // Trigger a refresh of the comments list
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-8">
      <div className="border-t border-gray-200 pt-8 dark:border-gray-700">
        <CommentsList postId={postId} refreshTrigger={refreshTrigger} />
      </div>

      <div className="border-t border-gray-200 pt-8 dark:border-gray-700">
        <CommentForm postId={postId} onCommentAdded={handleCommentAdded} />
      </div>
    </div>
  );
}
