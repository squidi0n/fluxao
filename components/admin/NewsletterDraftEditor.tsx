'use client';

import { useRouter } from 'next/navigation';
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
  createdAt: string;
  updatedAt: string;
}

interface NewsletterDraftEditorProps {
  draftId?: string;
  initialDraft?: NewsletterDraft;
  onSave?: (draft: NewsletterDraft) => void;
}

export default function NewsletterDraftEditor({
  draftId,
  initialDraft,
  onSave,
}: NewsletterDraftEditorProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<NewsletterDraft | null>(initialDraft || null);
  const [loading, setLoading] = useState(!initialDraft && !!draftId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (draftId && !initialDraft) {
      fetchDraft();
    }
  }, [draftId, initialDraft]);

  const fetchDraft = async () => {
    if (!draftId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/newsletter/drafts/${draftId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch draft');
      }

      const data = await response.json();
      setDraft(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load draft');
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async () => {
    if (!draft) return;

    setSaving(true);
    setError(null);

    try {
      const url = draftId
        ? `/api/admin/newsletter/drafts/${draftId}`
        : '/api/admin/newsletter/drafts';

      const method = draftId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(method === 'POST' ? { manualDraft: draft } : draft),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to save draft');
      }

      const savedDraft = await response.json();
      setDraft(savedDraft);

      if (onSave) {
        onSave(savedDraft);
      }

      if (!draftId) {
        router.push(`/admin/newsletter/drafts/${savedDraft.id}/edit`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const addTopic = () => {
    if (!draft) return;

    setDraft({
      ...draft,
      topics: [...draft.topics, { title: '', summary: '' }],
    });
  };

  const updateTopic = (index: number, field: keyof NewsletterTopic, value: string) => {
    if (!draft) return;

    const updatedTopics = draft.topics.map((topic, i) =>
      i === index ? { ...topic, [field]: value } : topic,
    );

    setDraft({ ...draft, topics: updatedTopics });
  };

  const removeTopic = (index: number) => {
    if (!draft) return;

    setDraft({
      ...draft,
      topics: draft.topics.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!draft) {
    // Initialize empty draft
    const newDraft: NewsletterDraft = {
      id: '',
      date: new Date().toISOString(),
      subject: '',
      intro: '',
      topics: [{ title: '', summary: '' }],
      cta: '',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDraft(newDraft);
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {draftId ? 'Edit Newsletter Draft' : 'Create Newsletter Draft'}
          </h1>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={saveDraft}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="p-6 space-y-6">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date
            </label>
            <input
              type="date"
              value={new Date(draft.date).toISOString().split('T')[0]}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  date: new Date(e.target.value).toISOString(),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={draft.subject}
              onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
              placeholder="Newsletter subject line..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Intro */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Introduction
            </label>
            <textarea
              value={draft.intro}
              onChange={(e) => setDraft({ ...draft, intro: e.target.value })}
              placeholder="Newsletter introduction (max 100 words)..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              {draft.intro.split(' ').filter((w) => w.length > 0).length} words
            </p>
          </div>

          {/* Topics */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Topics ({draft.topics.length})
              </label>
              <button
                onClick={addTopic}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                Add Topic
              </button>
            </div>

            <div className="space-y-4">
              {draft.topics.map((topic, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg dark:border-gray-600"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Topic {index + 1}
                    </span>
                    {draft.topics.length > 1 && (
                      <button
                        onClick={() => removeTopic(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <input
                      type="text"
                      value={topic.title}
                      onChange={(e) => updateTopic(index, 'title', e.target.value)}
                      placeholder="Topic title..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />

                    <textarea
                      value={topic.summary}
                      onChange={(e) => updateTopic(index, 'summary', e.target.value)}
                      placeholder="Topic summary (max 50 words)..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <p className="text-xs text-gray-500">
                      {topic.summary.split(' ').filter((w) => w.length > 0).length} words
                    </p>

                    <input
                      type="url"
                      value={topic.url || ''}
                      onChange={(e) => updateTopic(index, 'url', e.target.value)}
                      placeholder="URL (optional)..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Call to Action (Optional)
            </label>
            <textarea
              value={draft.cta || ''}
              onChange={(e) => setDraft({ ...draft, cta: e.target.value })}
              placeholder="Call to action text..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
