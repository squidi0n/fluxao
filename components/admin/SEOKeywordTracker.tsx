'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Minus, Search, Plus, 
  Target, BarChart3, Globe, AlertTriangle
} from 'lucide-react';

// 🔥 GERMAN AI/TECH KEYWORDS - Enhanced Focus
interface Keyword {
  id: string;
  term: string;
  category: 'AI' | 'Tech' | 'Development' | 'Data';
  currentPosition: number;
  previousPosition: number;
  searchVolume: number;
  difficulty: number;
  trend: 'up' | 'down' | 'stable';
  opportunities: string[];
  lastUpdated: string;
}

const INITIAL_KEYWORDS: Keyword[] = [
  {
    id: '1',
    term: 'künstliche intelligenz',
    category: 'AI',
    currentPosition: 8,
    previousPosition: 11,
    searchVolume: 8100,
    difficulty: 65,
    trend: 'up',
    opportunities: ['Featured snippet opportunity', 'Long-tail variations'],
    lastUpdated: '2024-08-31'
  },
  {
    id: '2',
    term: 'machine learning tutorial',
    category: 'AI',
    currentPosition: 12,
    previousPosition: 11,
    searchVolume: 3200,
    difficulty: 58,
    trend: 'down',
    opportunities: ['Add more practical examples', 'Video content'],
    lastUpdated: '2024-08-30'
  },
  {
    id: '3',
    term: 'ki entwicklung deutschland',
    category: 'AI',
    currentPosition: 15,
    previousPosition: 20,
    searchVolume: 2400,
    difficulty: 45,
    trend: 'up',
    opportunities: ['Local SEO optimization', 'Industry case studies'],
    lastUpdated: '2024-08-31'
  },
  {
    id: '4',
    term: 'deep learning frameworks',
    category: 'Tech',
    currentPosition: 23,
    previousPosition: 21,
    searchVolume: 5500,
    difficulty: 72,
    trend: 'down',
    opportunities: ['Framework comparison content', 'Hands-on tutorials'],
    lastUpdated: '2024-08-29'
  },
  {
    id: '5',
    term: 'automation tools',
    category: 'Tech',
    currentPosition: 31,
    previousPosition: 28,
    searchVolume: 18000,
    difficulty: 58,
    trend: 'down',
    opportunities: ['Tool reviews', 'Use case scenarios'],
    lastUpdated: '2024-08-30'
  }
];

interface KeywordCardProps {
  keyword: Keyword;
  onUpdate: (id: string, updates: Partial<Keyword>) => void;
}

function KeywordCard({ keyword, onUpdate }: KeywordCardProps) {
  const getTrendIcon = () => {
    if (keyword.trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (keyword.trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getPositionChange = () => {
    const change = keyword.previousPosition - keyword.currentPosition;
    if (change > 0) return `+${change}`;
    if (change < 0) return change.toString();
    return '0';
  };

  const getDifficultyColor = () => {
    if (keyword.difficulty < 30) return 'bg-green-500';
    if (keyword.difficulty < 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getCategoryColor = () => {
    switch (keyword.category) {
      case 'AI': return 'bg-blue-100 text-blue-800';
      case 'Tech': return 'bg-purple-100 text-purple-800';
      case 'Development': return 'bg-green-100 text-green-800';
      case 'Data': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900">{keyword.term}</h3>
            <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor()}`}>
              {keyword.category}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Volume: {keyword.searchVolume.toLocaleString()} • Updated: {keyword.lastUpdated}
          </p>
        </div>
        {getTrendIcon()}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">#{keyword.currentPosition}</p>
          <p className="text-xs text-gray-600">Current Position</p>
          <p className={`text-xs font-medium ${
            keyword.trend === 'up' ? 'text-green-600' : 
            keyword.trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {getPositionChange()} positions
          </p>
        </div>
        
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{keyword.searchVolume.toLocaleString()}</p>
          <p className="text-xs text-gray-600">Monthly Volume</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <div className={`w-2 h-2 rounded-full ${getDifficultyColor()}`} />
            <p className="text-2xl font-bold text-gray-900">{keyword.difficulty}%</p>
          </div>
          <p className="text-xs text-gray-600">Difficulty</p>
        </div>
      </div>

      {/* Opportunities */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-1">
          <Target className="w-4 h-4" />
          Opportunities
        </h4>
        <div className="space-y-1">
          {keyword.opportunities.map((opportunity, index) => (
            <div key={index} className="text-xs text-gray-600 bg-blue-50 rounded px-2 py-1">
              {opportunity}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button className="flex-1 px-3 py-2 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors">
          Analyze Content
        </button>
        <button className="flex-1 px-3 py-2 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors">
          Track Changes
        </button>
      </div>
    </div>
  );
}

function AddKeywordForm({ onAdd }: { onAdd: (keyword: Omit<Keyword, 'id'>) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [category, setCategory] = useState<Keyword['category']>('AI');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!term) return;
    
    onAdd({
      term,
      category,
      currentPosition: 0,
      previousPosition: 0,
      searchVolume: 0,
      difficulty: 50,
      trend: 'stable',
      opportunities: [],
      lastUpdated: new Date().toISOString().split('T')[0]
    });
    
    setTerm('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-6 hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
      >
        <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-gray-600">Add New Keyword</p>
        <p className="text-xs text-gray-500">Track German AI/Tech keywords</p>
      </button>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Add New Keyword</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Keyword Term
          </label>
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="e.g., künstliche intelligenz"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Keyword['category'])}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="AI">AI</option>
            <option value="Tech">Tech</option>
            <option value="Development">Development</option>
            <option value="Data">Data</option>
          </select>
        </div>
        
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Keyword
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default function SEOKeywordTracker() {
  const [keywords, setKeywords] = useState<Keyword[]>(INITIAL_KEYWORDS);
  const [filter, setFilter] = useState<'all' | 'AI' | 'Tech' | 'Development' | 'Data'>('all');
  const [sortBy, setSortBy] = useState<'position' | 'volume' | 'trend'>('position');

  const updateKeyword = (id: string, updates: Partial<Keyword>) => {
    setKeywords(prev => prev.map(k => k.id === id ? { ...k, ...updates } : k));
  };

  const addKeyword = (newKeyword: Omit<Keyword, 'id'>) => {
    const keyword: Keyword = {
      ...newKeyword,
      id: Date.now().toString()
    };
    setKeywords(prev => [...prev, keyword]);
  };

  const filteredAndSortedKeywords = keywords
    .filter(k => filter === 'all' || k.category === filter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'position': return a.currentPosition - b.currentPosition;
        case 'volume': return b.searchVolume - a.searchVolume;
        case 'trend': 
          if (a.trend === b.trend) return 0;
          if (a.trend === 'up') return -1;
          if (b.trend === 'up') return 1;
          if (a.trend === 'stable') return -1;
          return 1;
        default: return 0;
      }
    });

  const stats = {
    total: keywords.length,
    trending_up: keywords.filter(k => k.trend === 'up').length,
    trending_down: keywords.filter(k => k.trend === 'down').length,
    avg_position: Math.round(keywords.reduce((sum, k) => sum + k.currentPosition, 0) / keywords.length)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Keyword Tracker</h2>
            <p className="text-gray-600">German AI/Tech Keywords Performance</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">Germany Focus</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            <p className="text-sm text-gray-600">Total Keywords</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.trending_up}</p>
            <p className="text-sm text-gray-600">Trending Up</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{stats.trending_down}</p>
            <p className="text-sm text-gray-600">Trending Down</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">#{stats.avg_position}</p>
            <p className="text-sm text-gray-600">Avg. Position</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Category:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="AI">AI</option>
                <option value="Tech">Tech</option>
                <option value="Development">Development</option>
                <option value="Data">Data</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="position">Position</option>
                <option value="volume">Search Volume</option>
                <option value="trend">Trend</option>
              </select>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            {filteredAndSortedKeywords.length} keywords shown
          </div>
        </div>
      </div>

      {/* Keywords Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAndSortedKeywords.map(keyword => (
          <KeywordCard 
            key={keyword.id} 
            keyword={keyword} 
            onUpdate={updateKeyword}
          />
        ))}
        <AddKeywordForm onAdd={addKeyword} />
      </div>
    </div>
  );
}