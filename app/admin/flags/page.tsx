import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import FlagToggle from '@/components/admin/FlagToggle';
import { getUserFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/rbac';

export const metadata: Metadata = {
  title: 'Feature Flags - Admin - FluxAO',
};

async function getFlags() {
  return prisma.setting.findMany({
    orderBy: {
      key: 'asc',
    },
  });
}

export default async function FlagsPage() {
  const user = await getUserFromCookies();

  if (!user || !can(user, 'read', 'flags')) {
    redirect('/auth/login');
  }

  const flags = await getFlags();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Feature Flags</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage feature flags and system settings
        </p>
      </div>

      <div className="rounded-lg bg-gray-50 p-6 dark:bg-gray-800/50">
        <FlagToggle
          flags={flags}
          onUpdate={(key, value) => {
            // This will be handled by the component
            // We could add a client-side refresh here if needed
          }}
        />
      </div>

      <div className="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Important Note
            </h3>
            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              <p>
                Changes to feature flags take effect immediately and may impact system behavior.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
