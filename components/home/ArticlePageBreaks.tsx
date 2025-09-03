'use client';

import Link from 'next/link';
import { Coffee, Lightbulb, Share2, Bookmark, ThumbsUp } from 'lucide-react';
import NewsletterSignup from '@/components/NewsletterSignup';

interface ReadingBreakProps {
  totalReadTime?: number;
  currentProgress?: number;
}

export function ReadingBreak({ totalReadTime = 5, currentProgress = 50 }: ReadingBreakProps) {
  return (
    <div className="my-8 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-200 dark:bg-amber-800 rounded-lg">
            <Coffee className="w-5 h-5 text-amber-700 dark:text-amber-300" />
          </div>
          <div>
            <p className="font-medium text-amber-900 dark:text-amber-100">
              Zeit für eine kleine Pause?
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Du bist schon {currentProgress}% durch den Artikel • Noch ~{Math.ceil((totalReadTime * (100 - currentProgress)) / 100)} Min
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-amber-200 dark:hover:bg-amber-800 rounded-lg transition-colors">
            <Share2 className="w-4 h-4 text-amber-700 dark:text-amber-300" />
          </button>
          <button className="p-2 hover:bg-amber-200 dark:hover:bg-amber-800 rounded-lg transition-colors">
            <Bookmark className="w-4 h-4 text-amber-700 dark:text-amber-300" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface KeyTakeawayProps {
  points: string[];
  title?: string;
}

export function KeyTakeaway({ points, title = "Die wichtigsten Punkte" }: KeyTakeawayProps) {
  return (
    <div className="my-8 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-blue-200 dark:bg-blue-800 rounded-lg flex-shrink-0">
          <Lightbulb className="w-5 h-5 text-blue-700 dark:text-blue-300" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
            {title}
          </h3>
          <ul className="space-y-2">
            {points.map((point, index) => (
              <li key={index} className="flex items-start gap-2 text-blue-800 dark:text-blue-200">
                <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5">•</span>
                <span className="text-sm leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

interface EngagementBreakProps {
  articleTitle: string;
  articleUrl?: string;
}

export function EngagementBreak({ articleTitle, articleUrl }: EngagementBreakProps) {
  const handleShare = async () => {
    if (navigator.share && articleUrl) {
      try {
        await navigator.share({
          title: articleTitle,
          url: articleUrl
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard?.writeText(articleUrl);
      }
    }
  };

  return (
    <div className="my-8 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <ThumbsUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          <h3 className="font-semibold text-green-900 dark:text-green-100">
            Gefällt dir der Artikel?
          </h3>
        </div>
        
        <p className="text-sm text-green-700 dark:text-green-300 mb-4">
          Hilf uns, mehr Menschen zu erreichen!
        </p>
        
        <div className="flex items-center justify-center gap-3">
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <Share2 className="w-4 h-4" />
            Teilen
          </button>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-700 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors text-sm font-medium">
            <Bookmark className="w-4 h-4" />
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}

interface NewsletterCtaBreakProps {
  variant?: 'minimal' | 'featured';
}

export function NewsletterCtaBreak({ variant = 'minimal' }: NewsletterCtaBreakProps) {
  if (variant === 'minimal') {
    return (
      <div className="my-8 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
        <div className="text-center">
          <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
            📧 Mehr solche Artikel?
          </h3>
          <p className="text-sm text-purple-700 dark:text-purple-300 mb-4">
            Abonniere unseren Newsletter für wöchentliche Tech-Insights
          </p>
          <div className="max-w-sm mx-auto">
            <NewsletterSignup />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-8 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-8 text-white">
      <div className="max-w-2xl mx-auto text-center">
        <div className="text-4xl mb-4">🚀</div>
        <h3 className="text-2xl font-bold mb-4">
          Bleib am Puls der Zeit
        </h3>
        <p className="text-lg opacity-90 mb-6">
          Jeden Donnerstag die wichtigsten Tech-News, KI-Updates und digitalen Trends direkt in dein Postfach
        </p>
        
        <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
          <div>
            <div className="font-semibold">📰</div>
            <div>Kuratierte Inhalte</div>
          </div>
          <div>
            <div className="font-semibold">⚡</div>
            <div>Schnelle Updates</div>
          </div>
          <div>
            <div className="font-semibold">🎯</div>
            <div>Relevant & Präzise</div>
          </div>
        </div>
        
        <NewsletterSignup />
        
        <p className="text-xs opacity-75 mt-4">
          Kostenlos • Jederzeit abbestellbar • Kein Spam
        </p>
      </div>
    </div>
  );
}

interface ContinueReadingProps {
  nextArticles: Array<{
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    coverImage?: string;
    readTime?: number;
  }>;
}

export function ContinueReading({ nextArticles }: ContinueReadingProps) {
  return (
    <div className="my-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
        📖 Weiterlesen
      </h3>
      
      <div className="space-y-4">
        {nextArticles.map((article) => (
          <Link
            key={article.id}
            href={`/${article.slug}`}
            className="group flex gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            {article.coverImage && (
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                <img 
                  src={article.coverImage} 
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                {article.title}
              </h4>
              {article.excerpt && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mt-1">
                  {article.excerpt}
                </p>
              )}
              {article.readTime && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {article.readTime} Min Lesezeit
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}