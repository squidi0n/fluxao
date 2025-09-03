'use client';

import { useState } from 'react';
import { Share2, Linkedin, MessageCircle, Mail, Bell } from 'lucide-react';
import { X } from 'lucide-react';
import Link from 'next/link';
import FluxRating from './FluxRating';
import NewsletterSignup from './NewsletterSignup';

interface ArticleSidebarProps {
  articleId: string;
  articleSlug: string;
  articleTitle: string;
  initialLikes?: number;
  initialDislikes?: number;
  currentUserVote?: 'like' | 'dislike' | null;
}

export default function ArticleSidebar({
  articleId,
  articleSlug,
  articleTitle,
  initialLikes = 0,
  initialDislikes = 0,
  currentUserVote = null,
}: ArticleSidebarProps) {
  const articleUrl = `https://fluxao.de/news/${articleSlug}`;
  
  const shareToX = () => {
    const text = `Interessanter Artikel: ${articleTitle}`;
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(articleUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareToTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(articleTitle)}`;
    window.open(url, '_blank');
  };

  const shareToLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareToWhatsApp = () => {
    const text = `${articleTitle} - ${articleUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Social Media Share */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <Share2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Artikel teilen
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Teile diesen Artikel mit deinen Kontakten
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={shareToX}
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <X className="h-5 w-5 text-black dark:text-white" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Auf X teilen
            </span>
          </button>

          <button
            onClick={shareToTelegram}
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.820 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Per Telegram teilen
            </span>
          </button>

          <button
            onClick={shareToLinkedIn}
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <Linkedin className="h-5 w-5 text-blue-700" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Auf LinkedIn teilen
            </span>
          </button>

          <button
            onClick={shareToWhatsApp}
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <MessageCircle className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Per WhatsApp teilen
            </span>
          </button>
        </div>
      </div>

      {/* Newsletter Signup */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Newsletter
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Bleib immer auf dem neuesten Stand
            </p>
          </div>
        </div>

        <NewsletterSignup variant="compact" />
      </div>

      {/* Article Rating */}
      <FluxRating
        articleId={articleId}
        articleSlug={articleSlug}
        initialLikes={initialLikes}
        initialDislikes={initialDislikes}
        currentUserVote={currentUserVote}
      />
    </div>
  );
}