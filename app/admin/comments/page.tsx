import { Metadata } from 'next';

// Auth temporarily disabled for testing
import CommentsModeration from '@/components/admin/CommentsModeration';

export const metadata: Metadata = {
  title: 'Comments Moderation - Admin - FluxAO',
};

export default async function AdminCommentsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Comments Moderation</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Review and moderate user comments</p>
      </div>

      <CommentsModeration />
    </div>
  );
}
