'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface NewsletterTopic {
  title: string;
  summary: string;
  url?: string;
}

interface NewsletterDraft {
  id: string;
  date: string;
  subject: string;
  intro: string;
  topics: NewsletterTopic[];
  cta?: string;
  status: 'draft' | 'published' | 'archived';
  publishedIssueId?: string;
  createdAt: string;
  updatedAt: string;
}

interface DraftListResponse {
  drafts: NewsletterDraft[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function NewsletterDraftsPage() {
  const [drafts, setDrafts] = useState<NewsletterDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchDrafts();
  }, [statusFilter]);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const response = await fetch(`/api/admin/newsletter/drafts?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch drafts');
      }

      const data: DraftListResponse = await response.json();
      setDrafts(data.drafts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load drafts');
    } finally {
      setLoading(false);
    }
  };

  const generateDraft = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/newsletter/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generateNow: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to generate draft');
      }

      // Poll for completion (simplified)
      setTimeout(() => {
        fetchDrafts();
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate draft');
    } finally {
      setIsGenerating(false);
    }
  };

  const publishDraft = async (draftId: string) => {
    try {
      const response = await fetch(`/api/admin/newsletter/drafts/${draftId}/publish`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to publish draft');
      }

      fetchDrafts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish draft');
    }
  };

  const deleteDraft = async (draftId: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) return;

    try {
      const response = await fetch(`/api/admin/newsletter/drafts/${draftId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to delete draft');
      }

      fetchDrafts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete draft');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      published: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles] || styles.draft}`}
      >
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Newsletter Drafts</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI-generated newsletter drafts for review and publishing
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>

          <button
            onClick={generateDraft}
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating...
              </>
            ) : (
              'Generate Draft'
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {drafts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            <svg
              className="mx-auto h-12 w-12 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-lg font-medium">No newsletter drafts found</p>
            <p className="mt-2">
              Click "Generate Draft" to create your first AI-powered newsletter.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {draft.subject}
                      </h3>
                      {getStatusBadge(draft.status)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(draft.date).toLocaleDateString('de-DE')} • {draft.topics.length}{' '}
                      Topics
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {draft.status === 'draft' && (
                      <>
                        <Link
                          href={`/admin/newsletter/drafts/${draft.id}/edit`}
                          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md dark:bg-gray-700 dark:hover:bg-gray-600"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => publishDraft(draft.id)}
                          className="px-3 py-1 text-sm bg-green-600 text-white hover:bg-green-700 rounded-md"
                        >
                          Publish
                        </button>
                        <button
                          onClick={() => deleteDraft(draft.id)}
                          className="px-3 py-1 text-sm bg-red-600 text-white hover:bg-red-700 rounded-md"
                        >
                          Delete
                        </button>
                      </>
                    )}

                    {draft.status === 'published' && draft.publishedIssueId && (
                      <Link
                        href={`/admin/newsletter/issues/${draft.publishedIssueId}`}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md dark:bg-blue-900/20 dark:text-blue-300"
                      >
                        View Issue
                      </Link>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{draft.intro}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {draft.topics.slice(0, 3).map((topic, index) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                        {topic.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {topic.summary.slice(0, 80)}...
                      </p>
                    </div>
                  ))}
                </div>

                {draft.cta && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>CTA:</strong> {draft.cta}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
