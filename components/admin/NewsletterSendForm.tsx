'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { sanitizeHtml } from '@/lib/sanitize';

const sendNewsletterSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(200),
  body: z.string().min(1, 'Body is required').max(50000),
  target: z.enum(['verified', 'all']),
});

type SendNewsletterFormData = z.infer<typeof sendNewsletterSchema>;

export default function NewsletterSendForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    jobCount: number;
    skipped: number;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SendNewsletterFormData>({
    resolver: zodResolver(sendNewsletterSchema),
    defaultValues: {
      target: 'verified',
    },
  });

  const watchBody = watch('body');

  const onSubmit = async (data: SendNewsletterFormData) => {
    if (!confirm('Are you sure you want to send this newsletter to all selected subscribers?')) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Failed to send newsletter');
      }

      setSuccess({
        jobCount: result.jobCount,
        skipped: result.skipped,
      });

      setTimeout(() => {
        router.push('/admin/newsletter/jobs');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPreview = (markdown: string) => {
    // Simple markdown preview
    return markdown.split('\n\n').map((paragraph, i) => {
      const html = paragraph
        .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold">$1</h1>')
        .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*)\*/g, '<em>$1</em>')
        .replace(
          /\[([^\]]+)\]\(([^)]+)\)/g,
          '<a href="$2" class="text-blue-600 hover:underline">$1</a>',
        );

      return <div key={i} className="mb-4" dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />;
    });
  };

  if (success) {
    return (
      <div className="rounded-lg bg-green-50 p-6 text-center dark:bg-green-900/20">
        <svg
          className="mx-auto h-12 w-12 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="mt-2 text-lg font-semibold text-green-800 dark:text-green-300">
          Newsletter Sent Successfully!
        </h3>
        <p className="mt-1 text-sm text-green-700 dark:text-green-400">
          {success.jobCount} emails queued for delivery
          {success.skipped > 0 && ` (${success.skipped} duplicates skipped)`}
        </p>
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          Redirecting to jobs dashboard...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label
          htmlFor="subject"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Subject
        </label>
        <input
          {...register('subject')}
          type="text"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
          placeholder="Your newsletter subject line"
        />
        {errors.subject && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.subject.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="target"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Target Audience
        </label>
        <select
          {...register('target')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
        >
          <option value="verified">Verified Subscribers Only</option>
          <option value="all">All Subscribers</option>
        </select>
        {errors.target && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.target.message}</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor="body"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Body (Markdown)
          </label>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            {showPreview ? 'Edit' : 'Preview'}
          </button>
        </div>

        {showPreview ? (
          <div className="mt-1 min-h-[300px] rounded-md border border-gray-300 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {renderPreview(watchBody || '')}
            </div>
          </div>
        ) : (
          <textarea
            {...register('body')}
            rows={15}
            className="mt-1 block w-full rounded-md border-gray-300 font-mono text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder={`# Newsletter Title

Write your newsletter content here using Markdown.

## Section Title

Your content goes here. You can use:
- **Bold text** with double asterisks
- *Italic text* with single asterisks
- [Links](https://example.com) with brackets and parentheses

### Subsection

More content...`}
          />
        )}
        {errors.body && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.body.message}</p>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.push('/admin/newsletter')}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          {isLoading ? (
            <>
              <svg className="mr-2 inline h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
              Sending...
            </>
          ) : (
            'Send Newsletter'
          )}
        </button>
      </div>
    </form>
  );
}
