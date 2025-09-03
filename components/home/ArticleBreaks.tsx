'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Quote, TrendingUp, Mail, Users, BookOpen, Star, ChevronRight } from 'lucide-react';
import NewsletterSignup from '@/components/NewsletterSignup';

interface QuoteBreakProps {
  quote: string;
  author: string;
  context?: string;
}

export function QuoteBreak({ quote, author, context }: QuoteBreakProps) {
  return (
    <div className="my-12 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-blue-100 dark:border-blue-800">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full flex-shrink-0">
          <Quote className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <blockquote className="text-xl font-medium text-gray-900 dark:text-white italic leading-relaxed mb-4">
            "{quote}"
          </blockquote>
          <div className="flex items-center gap-2">
            <cite className="font-semibold text-blue-600 dark:text-blue-400 not-italic">
              — {author}
            </cite>
            {context && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                • {context}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatsBreakProps {
  stats: Array<{
    value: string;
    label: string;
    trend?: string;
    icon?: string;
  }>;
  title?: string;
}

export function StatsBreak({ stats, title = "Wusstest du schon?" }: StatsBreakProps) {
  return (
    <div className="my-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
          <TrendingUp className="w-6 h-6" />
        </div>
        <h3 className="text-2xl font-bold">{title}</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white/10 backdrop-blur rounded-xl p-6 text-center">
            {stat.icon && (
              <div className="text-3xl mb-3">{stat.icon}</div>
            )}
            <div className="text-3xl font-bold mb-2">{stat.value}</div>
            <div className="text-sm opacity-90">{stat.label}</div>
            {stat.trend && (
              <div className="mt-2 text-xs text-green-300">
                {stat.trend}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface NewsletterBandProps {
  title?: string;
  description?: string;
  benefits?: string[];
}

export function NewsletterBand({ 
  title = "Bleib immer auf dem Laufenden", 
  description = "Erhalte die neuesten Tech-News und Insights direkt in dein Postfach",
  benefits = ["📰 Wöchentliche Highlights", "🚀 Exklusive Insights", "⚡ Immer als Erste*r informiert"]
}: NewsletterBandProps) {
  return (
    <div className="my-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl p-8 text-white shadow-2xl">
      <div className="max-w-4xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold">{title}</h3>
            </div>
            <p className="text-lg opacity-90 mb-6">{description}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur rounded-xl p-6">
            <NewsletterSignup />
          </div>
        </div>
      </div>
    </div>
  );
}

interface RelatedArticle {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  publishedAt?: string;
  viewCount?: number;
  category?: {
    name: string;
    slug: string;
  };
}

interface RelatedArticlesProps {
  articles: RelatedArticle[];
  title?: string;
  showImages?: boolean;
}

export function RelatedArticles({ 
  articles, 
  title = "Das könnte dich auch interessieren", 
  showImages = true 
}: RelatedArticlesProps) {
  return (
    <div className="my-12 bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h3>
      </div>
      
      <div className="grid gap-6">
        {articles.map((article, index) => (
          <Link 
            key={article.id} 
            href={`/${article.slug}`}
            className="group flex gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
          >
            {showImages && article.coverImage && (
              <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                <img 
                  src={article.coverImage} 
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-1">
                    {article.title}
                  </h4>
                  {article.excerpt && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                      {article.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    {article.category && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                        {article.category.name}
                      </span>
                    )}
                    {article.viewCount && (
                      <span>{article.viewCount} Views</span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0" />
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {articles.length > 3 && (
        <div className="mt-6 text-center">
          <Link 
            href="/articles"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Alle Artikel entdecken
          </Link>
        </div>
      )}
    </div>
  );
}

interface FunFactBreakProps {
  facts: Array<{
    fact: string;
    context?: string;
    icon?: string;
  }>;
  title?: string;
}

export function FunFactBreak({ facts, title = "Fun Facts" }: FunFactBreakProps) {
  const [currentFact, setCurrentFact] = useState(0);
  
  return (
    <div className="my-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-8 text-white">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
          <Star className="w-6 h-6" />
        </div>
        <h3 className="text-2xl font-bold">{title}</h3>
      </div>
      
      <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center min-h-[120px] flex flex-col justify-center">
        <div className="text-4xl mb-4">
          {facts[currentFact].icon || '💡'}
        </div>
        <p className="text-xl font-medium mb-2">
          {facts[currentFact].fact}
        </p>
        {facts[currentFact].context && (
          <p className="text-sm opacity-75">
            {facts[currentFact].context}
          </p>
        )}
      </div>
      
      {facts.length > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {facts.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentFact(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentFact 
                  ? 'bg-white' 
                  : 'bg-white/30 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}