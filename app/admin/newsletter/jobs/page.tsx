import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import NewsletterJobsMonitor from '@/components/admin/NewsletterJobsMonitor';
import { getUserFromCookies } from '@/lib/auth';
import { can } from '@/lib/rbac';

export const metadata: Metadata = {
  title: 'Newsletter Jobs - Admin - FluxAO',
};

export default async function NewsletterJobsPage() {
  const user = await getUserFromCookies();

  if (!user || !can(user, 'read', 'newsletter')) {
    redirect('/auth/login');
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Newsletter Jobs</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitor newsletter delivery status and manage failed jobs
          </p>
        </div>
        <Link
          href="/admin/newsletter/send"
          className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          Send New Newsletter
        </Link>
      </div>

      <NewsletterJobsMonitor />
    </div>
  );
}
