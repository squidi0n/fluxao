'use client';

import { useState, useEffect } from 'react';
import { Quote, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuoteData {
  text: string;
  author: string;
  profession?: string;
  year?: number;
  category: string;
}

export default function RandomQuote() {
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchRandomQuote = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/quotes/random');
      const data = await response.json();
      setQuote(data.quote);
    } catch (error) {
      console.error('Error fetching quote:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomQuote();
  }, []);

  if (!quote) return null;

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'TECHNOLOGY': 'from-blue-500 to-cyan-500',
      'AI': 'from-purple-500 to-pink-500',
      'PHILOSOPHY': 'from-indigo-500 to-purple-500',
      'FUTURE': 'from-green-500 to-teal-500',
      'INNOVATION': 'from-orange-500 to-red-500',
      'SOCIETY': 'from-emerald-500 to-green-500',
      'SCIENCE': 'from-blue-600 to-indigo-600',
      'WISDOM': 'from-yellow-500 to-orange-500',
    };
    return colors[category] || 'from-gray-500 to-gray-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative overflow-hidden"
    >
      {/* Background with gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryColor(quote.category)} opacity-10`} />
      
      <div className="relative max-w-4xl mx-auto px-6 py-12 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={quote.text}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            {/* Quote Icon */}
            <div className={`inline-flex p-4 rounded-full bg-gradient-to-br ${getCategoryColor(quote.category)} mb-6`}>
              <Quote className="w-6 h-6 text-white" />
            </div>
            
            {/* Quote Text */}
            <blockquote className="text-2xl md:text-3xl font-light text-gray-800 dark:text-gray-200 italic mb-8 leading-relaxed">
              "{quote.text}"
            </blockquote>
            
            {/* Author */}
            <div className="space-y-2">
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                — {quote.author}
              </p>
              {quote.profession && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {quote.profession} {quote.year && `• ${quote.year}`}
                </p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Refresh Button */}
        <button
          onClick={fetchRandomQuote}
          disabled={loading}
          className={`mt-8 inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 ${
            loading ? 'opacity-50 cursor-not-allowed' : 'hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">Neues Zitat</span>
        </button>
      </div>
    </motion.div>
  );
}