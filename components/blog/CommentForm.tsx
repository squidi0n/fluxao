'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import dynamic from 'next/dynamic';
import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const HCaptcha = dynamic(() => import('@hcaptcha/react-hcaptcha'), { ssr: false });

const commentSchema = z.object({
  authorName: z.string().min(1, 'Name is required').max(100),
  authorEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  body: z.string().min(1, 'Comment is required').max(5000),
});

type CommentFormData = z.infer<typeof commentSchema>;

interface CommentFormProps {
  postId: string;
  parentId?: string; // For reply functionality
  onCommentAdded?: () => void;
}

export default function CommentForm({ postId, parentId, onCommentAdded }: CommentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hcaptchaToken, setHcaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<any>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
  });

  const onSubmit = async (data: CommentFormData) => {
    if (process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY && !hcaptchaToken) {
      setMessage({ type: 'error', text: 'Please complete the captcha' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          postId,
          parentId, // Include parentId for replies
          hcaptchaToken,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: result.message || 'Your comment has been submitted for moderation',
        });
        reset();
        setHcaptchaToken(null);
        captchaRef.current?.resetCaptcha();
        onCommentAdded?.();
      } else {
        setMessage({
          type: 'error',
          text: result.detail || 'Failed to submit comment',
        });
      }
    } catch (error) {
      // console.error('Submit error:', error);
      setMessage({
        type: 'error',
        text: 'An error occurred while submitting your comment',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Leave a Comment</h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="authorName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Name *
            </label>
            <input
              {...register('authorName')}
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
              placeholder="Your name"
            />
            {errors.authorName && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.authorName.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="authorEmail"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email (optional)
            </label>
            <input
              {...register('authorEmail')}
              type="email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
              placeholder="your@email.com"
            />
            {errors.authorEmail && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.authorEmail.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="body"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Comment *
          </label>
          <textarea
            {...register('body')}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            placeholder="Share your thoughts..."
          />
          {errors.body && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.body.message}</p>
          )}
        </div>

        {process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY && (
          <div className="flex justify-center">
            <HCaptcha
              ref={captchaRef}
              sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY}
              onVerify={setHcaptchaToken}
              onExpire={() => setHcaptchaToken(null)}
              theme="light"
            />
          </div>
        )}

        {message && (
          <div
            className={`rounded-md p-4 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'
            }`}
          >
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        <div className="text-xs text-gray-500 dark:text-gray-400">
          <p>
            Your email address will not be published. Comments are moderated and may take some time
            to appear.
          </p>
          <p className="mt-1">
            By submitting this form, you agree to our privacy policy and terms of service.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          {isSubmitting ? 'Submitting...' : 'Post Comment'}
        </button>
      </form>
    </div>
  );
}
