'use client';

import { format } from 'date-fns';
import { useState } from 'react';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  createdAt: Date;
  verifiedAt: Date | null;
}

interface NewsletterQueueProps {
  subscribers: Subscriber[];
}

export default function NewsletterQueue({ subscribers }: NewsletterQueueProps) {
  const [isTriggering, setIsTriggering] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'verified'>('all');

  const filteredSubscribers = subscribers.filter((sub) => {
    if (selectedStatus === 'all') return true;
    return sub.status === selectedStatus;
  });

  const handleTriggerNewsletter = async () => {
    if (!confirm('Are you sure you want to trigger the newsletter for all verified subscribers?')) {
      return;
    }

    setIsTriggering(true);
    try {
      const response = await fetch('/api/admin/newsletter/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: 'verified',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Newsletter job queued successfully! ${data.count} emails will be sent.`);
      } else {
        alert('Failed to trigger newsletter');
      }
    } catch (error) {
      // console.error('Trigger error:', error);
      alert('Failed to trigger newsletter');
    } finally {
      setIsTriggering(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      verified: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    };

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status as keyof typeof styles] || styles.pending}`}
      >
        {status}
      </span>
    );
  };

  const stats = {
    total: subscribers.length,
    verified: subscribers.filter((s) => s.status === 'verified').length,
    pending: subscribers.filter((s) => s.status === 'pending').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow dark:bg-gray-800">
          <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Subscribers
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
            {stats.total}
          </dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow dark:bg-gray-800">
          <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
            Verified
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-green-600 dark:text-green-400">
            {stats.verified}
          </dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow dark:bg-gray-800">
          <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Pending</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-yellow-600 dark:text-yellow-400">
            {stats.pending}
          </dd>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              selectedStatus === 'all'
                ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setSelectedStatus('verified')}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              selectedStatus === 'verified'
                ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Verified ({stats.verified})
          </button>
          <button
            onClick={() => setSelectedStatus('pending')}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              selectedStatus === 'pending'
                ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Pending ({stats.pending})
          </button>
        </div>

        <button
          onClick={handleTriggerNewsletter}
          disabled={isTriggering || stats.verified === 0}
          className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50 dark:bg-green-500 dark:hover:bg-green-600"
        >
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          {isTriggering ? 'Triggering...' : 'Send Newsletter'}
        </button>
      </div>

      {/* Subscribers Table */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Subscribed
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Verified
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {filteredSubscribers.map((subscriber) => (
              <tr key={subscriber.id}>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                  {subscriber.email}
                </td>
                <td className="whitespace-nowrap px-6 py-4">{getStatusBadge(subscriber.status)}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {format(new Date(subscriber.createdAt), 'MMM dd, yyyy')}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {subscriber.verifiedAt
                    ? format(new Date(subscriber.verifiedAt), 'MMM dd, yyyy')
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredSubscribers.length === 0 && (
          <div className="bg-white px-6 py-12 text-center dark:bg-gray-900">
            <p className="text-gray-500 dark:text-gray-400">No subscribers found</p>
          </div>
        )}
      </div>
    </div>
  );
}
