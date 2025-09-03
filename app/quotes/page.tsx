'use client';

import { useState } from 'react';
import { Quote, Heart, Share2, Copy, User, Calendar, Tag, Search, Filter } from 'lucide-react';

interface QuoteData {
  id: string;
  text: string;
  author: string;
  category: string;
  date: string;
  likes: number;
  isLiked: boolean;
  tags: string[];
  source?: string;
}

export default function QuotesPage() {
  const [quotes] = useState<QuoteData[]>([
    {
      id: '1',
      text: 'Künstliche Intelligenz ist nicht nur ein Werkzeug, sondern ein Spiegel unserer eigenen Kreativität und Vorstellungskraft.',
      author: 'Dr. Sarah Chen',
      category: 'KI & Tech',
      date: '2024-03-15',
      likes: 156,
      isLiked: true,
      tags: ['KI', 'Kreativität', 'Zukunft'],
      source: 'AI Ethics Conference 2024'
    },
    {
      id: '2',
      text: 'Gaming ist nicht nur Unterhaltung - es ist die Zukunft des Lernens, der Zusammenarbeit und der menschlichen Verbindung.',
      author: 'Marcus Rodriguez',
      category: 'Gaming & Kultur',
      date: '2024-03-14',
      likes: 89,
      isLiked: false,
      tags: ['Gaming', 'Lernen', 'Community'],
    },
    {
      id: '3',
      text: 'In einer Welt voller Algorithmen müssen wir uns daran erinnern, dass echter Stil nicht programmierbar ist - er kommt von innen.',
      author: 'Valentina Rossi',
      category: 'Style & Ästhetik',
      date: '2024-03-13',
      likes: 234,
      isLiked: true,
      tags: ['Stil', 'Authentizität', 'Design'],
    },
    {
      id: '4',
      text: 'Die größte Technologie, die wir entwickeln können, ist die Technologie des Mitgefühls.',
      author: 'Prof. Akira Tanaka',
      category: 'Mensch & Gesellschaft',
      date: '2024-03-12',
      likes: 312,
      isLiked: false,
      tags: ['Empathie', 'Gesellschaft', 'Humanität'],
    },
    {
      id: '5',
      text: 'Das Paradox des Denkens: Je mehr wir über das Denken nachdenken, desto mysteriöser wird es.',
      author: 'Hannah Arendt',
      category: 'Mindset & Philosophie',
      date: '2024-03-11',
      likes: 178,
      isLiked: true,
      tags: ['Philosophie', 'Bewusstsein', 'Denken'],
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const categories = [
    { key: 'all', label: 'Alle Kategorien' },
    { key: 'KI & Tech', label: 'KI & Tech' },
    { key: 'Gaming & Kultur', label: 'Gaming & Kultur' },
    { key: 'Style & Ästhetik', label: 'Style & Ästhetik' },
    { key: 'Mensch & Gesellschaft', label: 'Mensch & Gesellschaft' },
    { key: 'Mindset & Philosophie', label: 'Mindset & Philosophie' },
  ];

  const filteredQuotes = quotes
    .filter(quote => 
      (selectedCategory === 'all' || quote.category === selectedCategory) &&
      (searchTerm === '' || 
       quote.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
       quote.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
       quote.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'likes':
          return b.likes - a.likes;
        case 'oldest':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'newest':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

  const handleCopyQuote = (quote: QuoteData) => {
    navigator.clipboard.writeText(`"${quote.text}" - ${quote.author}`);
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'KI & Tech': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'Gaming & Kultur': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      'Style & Ästhetik': 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400',
      'Mensch & Gesellschaft': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'Mindset & Philosophie': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Quote className="w-12 h-12 text-gray-800 dark:text-gray-200 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Quotes & Inspiration
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Entdecke inspirierende Zitate und Gedanken aus der Welt der Technologie, Philosophie und Kultur
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Zitate durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {categories.map(category => (
                <option key={category.key} value={category.key}>
                  {category.label}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <option value="newest">Neueste zuerst</option>
              <option value="oldest">Älteste zuerst</option>
              <option value="likes">Beliebteste</option>
            </select>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Beliebte Tags:</span>
            {['KI', 'Philosophie', 'Gaming', 'Zukunft', 'Kreativität', 'Gesellschaft'].map(tag => (
              <button
                key={tag}
                onClick={() => setSearchTerm(tag)}
                className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
            <Quote className="w-8 h-8 text-gray-600 dark:text-gray-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{quotes.length}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Zitate insgesamt</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
            <Heart className="w-8 h-8 text-gray-600 dark:text-gray-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {quotes.reduce((sum, quote) => sum + quote.likes, 0)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Gesamte Likes</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
            <User className="w-8 h-8 text-gray-600 dark:text-gray-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {new Set(quotes.map(q => q.author)).size}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Autoren</p>
          </div>
        </div>

        {/* Quotes Grid */}
        <div className="space-y-6">
          {filteredQuotes.length === 0 ? (
            <div className="text-center py-12">
              <Quote className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                Keine Zitate gefunden
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                Versuche andere Suchbegriffe oder Filter
              </p>
            </div>
          ) : (
            filteredQuotes.map((quote) => (
              <div key={quote.id} className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  <div className="flex-1">
                    {/* Quote Text */}
                    <div className="mb-6">
                      <Quote className="w-8 h-8 text-gray-400 mb-3" />
                      <blockquote className="text-xl lg:text-2xl text-gray-800 dark:text-gray-200 leading-relaxed font-medium italic">
                        "{quote.text}"
                      </blockquote>
                    </div>

                    {/* Author and Meta */}
                    <div className="flex flex-wrap items-center gap-4 mb-6">
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <User className="w-4 h-4 mr-2" />
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {quote.author}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span className="text-sm">
                          {new Date(quote.date).toLocaleDateString('de-DE')}
                        </span>
                      </div>

                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(quote.category)}`}>
                        {quote.category}
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {quote.tags.map((tag, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Source */}
                    {quote.source && (
                      <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                        Quelle: {quote.source}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col gap-3">
                    <button className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      quote.isLiked 
                        ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}>
                      <Heart className={`w-4 h-4 ${quote.isLiked ? 'fill-current' : ''}`} />
                      <span className="text-sm font-medium">{quote.likes}</span>
                    </button>

                    <button 
                      onClick={() => handleCopyQuote(quote)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      <span className="text-sm font-medium">Kopieren</span>
                    </button>

                    <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                      <Share2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Teilen</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More Button */}
        {filteredQuotes.length > 0 && (
          <div className="text-center mt-12">
            <button className="px-8 py-3 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors font-medium">
              Weitere Zitate laden
            </button>
          </div>
        )}
      </div>
    </div>
  );
}