'use client';

import { useState } from 'react';
import { TrendingUp, Eye, MessageSquare, Heart, Clock, User, Calendar, ArrowUp, ArrowDown, Minus, Filter, Search } from 'lucide-react';

interface TrendingItem {
  id: string;
  title: string;
  category: string;
  author: string;
  publishDate: string;
  views: number;
  comments: number;
  likes: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  readTime: number;
  excerpt: string;
  slug: string;
}

export default function TrendingPage() {
  const [trendingPosts] = useState<TrendingItem[]>([
    {
      id: '1',
      title: 'ChatGPT-5: Die nächste Revolution der Künstlichen Intelligenz',
      category: 'KI & Tech',
      author: 'Dr. Anna Schmidt',
      publishDate: '2024-03-15',
      views: 15420,
      comments: 127,
      likes: 892,
      trend: 'up',
      trendPercentage: 45,
      readTime: 8,
      excerpt: 'OpenAI kündigt bahnbrechende Verbesserungen an, die die Art wie wir mit KI interagieren grundlegend verändern werden...',
      slug: 'chatgpt-5-revolution'
    },
    {
      id: '2',
      title: 'Gaming im Metaverse: Warum VR endlich mainstream wird',
      category: 'Gaming & Kultur',
      author: 'Max Müller',
      publishDate: '2024-03-14',
      views: 12340,
      comments: 98,
      likes: 654,
      trend: 'up',
      trendPercentage: 32,
      readTime: 6,
      excerpt: 'Die neueste Generation von VR-Headsets macht Gaming-Erfahrungen möglich, die früher undenkbar waren...',
      slug: 'gaming-metaverse-vr'
    },
    {
      id: '3',
      title: 'Minimalistisches Design: Weniger ist das neue Mehr',
      category: 'Style & Ästhetik',
      author: 'Sophie Weber',
      publishDate: '2024-03-13',
      views: 9876,
      comments: 76,
      likes: 543,
      trend: 'up',
      trendPercentage: 18,
      readTime: 5,
      excerpt: 'In einer überladenen digitalen Welt setzt sich minimalistisches Design als Gegenbewegung durch...',
      slug: 'minimalistisches-design'
    },
    {
      id: '4',
      title: 'Digitale Ethik: Wer trägt Verantwortung für KI-Entscheidungen?',
      category: 'Mensch & Gesellschaft',
      author: 'Prof. Michael Wagner',
      publishDate: '2024-03-12',
      views: 8765,
      comments: 145,
      likes: 432,
      trend: 'stable',
      trendPercentage: 0,
      readTime: 12,
      excerpt: 'Die zunehmende Automatisierung wirft fundamentale Fragen über Verantwortung und Kontrolle auf...',
      slug: 'digitale-ethik-ki'
    },
    {
      id: '5',
      title: 'Das Paradox des freien Willens im digitalen Zeitalter',
      category: 'Mindset & Philosophie',
      author: 'Dr. Lisa Hoffmann',
      publishDate: '2024-03-11',
      views: 7654,
      comments: 89,
      likes: 321,
      trend: 'down',
      trendPercentage: -12,
      readTime: 10,
      excerpt: 'Algorithmen beeinflussen unsere Entscheidungen - aber wie frei sind wir wirklich noch?',
      slug: 'freier-wille-digital'
    }
  ]);

  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('week');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { key: 'all', label: 'Alle Kategorien' },
    { key: 'KI & Tech', label: 'KI & Tech' },
    { key: 'Gaming & Kultur', label: 'Gaming & Kultur' },
    { key: 'Style & Ästhetik', label: 'Style & Ästhetik' },
    { key: 'Mensch & Gesellschaft', label: 'Mensch & Gesellschaft' },
    { key: 'Mindset & Philosophie', label: 'Mindset & Philosophie' },
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <ArrowDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'KI & Tech': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      'Gaming & Kultur': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      'Style & Ästhetik': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      'Mensch & Gesellschaft': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      'Mindset & Philosophie': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  };

  const filteredPosts = trendingPosts.filter(post => {
    const matchesCategory = categoryFilter === 'all' || post.category === categoryFilter;
    const matchesSearch = searchTerm === '' || 
                         post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <TrendingUp className="w-12 h-12 text-gray-800 dark:text-gray-200 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Trending
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Die meistgelesenen und diskutierten Artikel der Community
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Trending Artikel durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>

            {/* Timeframe Filter */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {[
                { key: 'today', label: 'Heute' },
                { key: 'week', label: 'Diese Woche' },
                { key: 'month', label: 'Dieser Monat' },
              ].map((period) => (
                <button
                  key={period.key}
                  onClick={() => setTimeframe(period.key as any)}
                  className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${
                    timeframe === period.key
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {categories.map(category => (
                <option key={category.key} value={category.key}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
            <Eye className="w-8 h-8 text-gray-600 dark:text-gray-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {filteredPosts.reduce((sum, post) => sum + post.views, 0).toLocaleString('de-DE')}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Gesamt-Views</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
            <MessageSquare className="w-8 h-8 text-gray-600 dark:text-gray-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {filteredPosts.reduce((sum, post) => sum + post.comments, 0)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Kommentare</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
            <Heart className="w-8 h-8 text-gray-600 dark:text-gray-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {filteredPosts.reduce((sum, post) => sum + post.likes, 0)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Likes</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
            <TrendingUp className="w-8 h-8 text-gray-600 dark:text-gray-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {filteredPosts.filter(p => p.trend === 'up').length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Trending Up</p>
          </div>
        </div>

        {/* Trending Posts */}
        <div className="space-y-6">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                Keine Trending-Artikel gefunden
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                Versuche andere Filter oder Suchbegriffe
              </p>
            </div>
          ) : (
            filteredPosts.map((post, index) => (
              <div key={post.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-6">
                  {/* Rank */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-xl font-bold text-gray-600 dark:text-gray-400">
                        #{index + 1}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                          <a href={`/article/${post.slug}`}>
                            {post.title}
                          </a>
                        </h2>
                        
                        <div className="flex flex-wrap items-center gap-4 mb-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
                            {post.category}
                          </span>
                          
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <User className="w-4 h-4 mr-1" />
                            {post.author}
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(post.publishDate).toLocaleDateString('de-DE')}
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Clock className="w-4 h-4 mr-1" />
                            {post.readTime} Min. Lesezeit
                          </div>
                        </div>
                      </div>

                      {/* Trend Indicator */}
                      <div className="flex items-center space-x-2 ml-4">
                        {getTrendIcon(post.trend)}
                        <span className={`text-sm font-medium ${getTrendColor(post.trend)}`}>
                          {post.trendPercentage !== 0 && (
                            `${post.trendPercentage > 0 ? '+' : ''}${post.trendPercentage}%`
                          )}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Eye className="w-4 h-4 mr-1" />
                          <span className="font-medium">{post.views.toLocaleString('de-DE')}</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          <span className="font-medium">{post.comments}</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Heart className="w-4 h-4 mr-1" />
                          <span className="font-medium">{post.likes}</span>
                        </div>
                      </div>

                      <a 
                        href={`/article/${post.slug}`}
                        className="px-4 py-2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors text-sm font-medium"
                      >
                        Artikel lesen
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More */}
        {filteredPosts.length > 0 && (
          <div className="text-center mt-12">
            <button className="px-8 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium">
              Weitere Trending-Artikel laden
            </button>
          </div>
        )}
      </div>
    </div>
  );
}