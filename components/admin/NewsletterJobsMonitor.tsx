'use client';

import { format } from 'date-fns';
import { useState, useEffect } from 'react';

interface JobStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  successRate: number;
}

interface QueueMetrics {
  queue: {
    newsletter: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
    };
    dlq: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
    };
  };
  stats: JobStats;
  circuit: {
    state: string;
    failures: number;
    lastFailureTime: number;
  };
  backpressure: {
    activeJobs: number;
    queuedJobs: number;
    maxConcurrency: number;
  };
}

interface FailedJob {
  id: string;
  issue: { subject: string };
  subscriber: { email: string };
  error: string;
  attempts: number;
  updatedAt: string;
}

interface NewsletterIssue {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  sentAt: string | null;
  stats: JobStats;
}

export default function NewsletterJobsMonitor() {
  const [metrics, setMetrics] = useState<QueueMetrics | null>(null);
  const [failedJobs, setFailedJobs] = useState<FailedJob[]>([]);
  const [issues, setIssues] = useState<NewsletterIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'failed' | 'issues'>('overview');
  const [retryingJob, setRetryingJob] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      // Fetch metrics
      const metricsRes = await fetch('/api/admin/newsletter/jobs');
      if (metricsRes.ok) {
        setMetrics(await metricsRes.json());
      }

      // Fetch failed jobs
      const failedRes = await fetch('/api/admin/newsletter/jobs?view=failed');
      if (failedRes.ok) {
        const data = await failedRes.json();
        setFailedJobs(data.jobs);
      }

      // Fetch issues
      const issuesRes = await fetch('/api/admin/newsletter/jobs?view=issues');
      if (issuesRes.ok) {
        const data = await issuesRes.json();
        setIssues(data.issues);
      }
    } catch (error) {
      // console.error('Failed to fetch newsletter jobs data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleRetryJob = async (jobId: string) => {
    setRetryingJob(jobId);
    try {
      const response = await fetch('/api/admin/newsletter/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'retry',
          jobId,
        }),
      });

      if (response.ok) {
        await fetchData();
        alert('Job retried successfully');
      } else {
        alert('Failed to retry job');
      }
    } catch (error) {
      // console.error('Retry error:', error);
      alert('Failed to retry job');
    } finally {
      setRetryingJob(null);
    }
  };

  const handleResetCircuit = async () => {
    if (!confirm('Are you sure you want to reset the circuit breaker?')) return;

    try {
      const response = await fetch('/api/admin/newsletter/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reset-circuit',
        }),
      });

      if (response.ok) {
        await fetchData();
        alert('Circuit breaker reset successfully');
      } else {
        alert('Failed to reset circuit breaker');
      }
    } catch (error) {
      // console.error('Reset circuit error:', error);
      alert('Failed to reset circuit breaker');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'sent':
        return 'text-green-600 dark:text-green-400';
      case 'processing':
      case 'sending':
        return 'text-blue-600 dark:text-blue-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getCircuitStateColor = (state: string) => {
    switch (state) {
      case 'CLOSED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'OPEN':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'HALF_OPEN':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* System Status Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow dark:bg-gray-800">
          <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
            Success Rate
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
            {metrics?.stats.successRate.toFixed(1)}%
          </dd>
        </div>

        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow dark:bg-gray-800">
          <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
            Circuit Breaker
          </dt>
          <dd className="mt-1 flex items-center">
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getCircuitStateColor(metrics?.circuit.state || 'UNKNOWN')}`}
            >
              {metrics?.circuit.state || 'UNKNOWN'}
            </span>
            {metrics?.circuit.state === 'OPEN' && (
              <button
                onClick={handleResetCircuit}
                className="ml-2 text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                Reset
              </button>
            )}
          </dd>
        </div>

        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow dark:bg-gray-800">
          <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
            Active Jobs
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
            {metrics?.backpressure.activeJobs || 0} / {metrics?.backpressure.maxConcurrency || 5}
          </dd>
        </div>

        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow dark:bg-gray-800">
          <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
            Queue Depth
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
            {metrics?.queue.newsletter.waiting || 0}
          </dd>
        </div>
      </div>

      {/* Job Statistics */}
      {metrics && (
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Job Statistics</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                {metrics.stats.total}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400">
                {metrics.stats.pending}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Pending</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                {metrics.stats.processing}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Processing</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
                {metrics.stats.completed}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-red-600 dark:text-red-400">
                {metrics.stats.failed}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Failed</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-orange-600 dark:text-orange-400">
                {metrics.queue.dlq.waiting}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">DLQ</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('issues')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === 'issues'
                ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Recent Issues
          </button>
          <button
            onClick={() => setActiveTab('failed')}
            className={`flex items-center whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === 'failed'
                ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Failed Jobs
            {failedJobs.length > 0 && (
              <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-300">
                {failedJobs.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && metrics && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
                Newsletter Queue
              </h3>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Waiting</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">
                    {metrics.queue.newsletter.waiting}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Active</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">
                    {metrics.queue.newsletter.active}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Completed</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">
                    {metrics.queue.newsletter.completed}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Failed</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">
                    {metrics.queue.newsletter.failed}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
                System Health
              </h3>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Circuit Failures</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">
                    {metrics.circuit.failures}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">
                    Queued (Backpressure)
                  </dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">
                    {metrics.backpressure.queuedJobs}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">DLQ Size</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">
                    {metrics.queue.dlq.waiting}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {activeTab === 'issues' && (
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Sent
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {issues.map((issue) => (
                  <tr key={issue.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {issue.subject}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`text-sm font-medium ${getStatusColor(issue.status)}`}>
                        {issue.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <div className="mr-2 h-2 w-32 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${issue.stats.successRate}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {issue.stats.completed}/{issue.stats.total}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(issue.createdAt), 'MMM dd, HH:mm')}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {issue.sentAt ? format(new Date(issue.sentAt), 'MMM dd, HH:mm') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {issues.length === 0 && (
              <div className="bg-white px-6 py-12 text-center dark:bg-gray-900">
                <p className="text-gray-500 dark:text-gray-400">No newsletter issues found</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'failed' && (
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Newsletter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Subscriber
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Error
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Attempts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Failed At
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {failedJobs.map((job) => (
                  <tr key={job.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {job.issue.subject}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {job.subscriber.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600 dark:text-red-400">
                      {job.error}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {job.attempts}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(job.updatedAt), 'MMM dd, HH:mm')}
                    </td>
                    <td className="relative whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => handleRetryJob(job.id)}
                        disabled={retryingJob === job.id}
                        className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        {retryingJob === job.id ? 'Retrying...' : 'Retry'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {failedJobs.length === 0 && (
              <div className="bg-white px-6 py-12 text-center dark:bg-gray-900">
                <p className="text-gray-500 dark:text-gray-400">No failed jobs</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
