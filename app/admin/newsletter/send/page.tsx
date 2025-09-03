import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import NewsletterSendForm from '@/components/admin/NewsletterSendForm';
import { getUserFromCookies } from '@/lib/auth';
import { can } from '@/lib/rbac';

export const metadata: Metadata = {
  title: 'Send Newsletter - Admin - FluxAO',
};

export default async function NewsletterSendPage() {
  const user = await getUserFromCookies();

  if (!user || !can(user, 'trigger', 'newsletter')) {
    redirect('/auth/login');
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Send Newsletter</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Compose and send a newsletter to your subscribers
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <NewsletterSendForm />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Guidelines</h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <svg
                  className="mr-2 mt-0.5 h-4 w-4 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Keep subject lines concise and engaging
              </li>
              <li className="flex items-start">
                <svg
                  className="mr-2 mt-0.5 h-4 w-4 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Use markdown for formatting
              </li>
              <li className="flex items-start">
                <svg
                  className="mr-2 mt-0.5 h-4 w-4 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Preview before sending
              </li>
              <li className="flex items-start">
                <svg
                  className="mr-2 mt-0.5 h-4 w-4 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Newsletters are queued for reliable delivery
              </li>
            </ul>
          </div>

          <div className="rounded-lg bg-blue-50 p-6 dark:bg-blue-900/20">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Delivery Information
            </h3>
            <p className="mt-2 text-sm text-blue-700 dark:text-blue-400">
              Emails are sent through a queue system with automatic retry on failure. You can
              monitor the progress in the Jobs dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
