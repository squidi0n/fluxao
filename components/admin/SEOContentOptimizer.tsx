'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, Search, CheckCircle, AlertCircle, Clock,
  TrendingUp, Target, Lightbulb, ExternalLink, 
  Hash, Eye, Globe, ArrowRight
} from 'lucide-react';

// 🔥 CONTENT SEO OPTIMIZATION TOOLS
interface ContentAnalysis {
  id: string;
  title: string;
  url: string;
  seoScore: number;
  keywordDensity: number;
  readabilityScore: number;
  wordCount: number;
  lastUpdated: string;
  issues: SEOIssue[];
  recommendations: string[];
  targetKeywords: string[];
}

interface SEOIssue {
  type: 'critical' | 'warning' | 'suggestion';
  category: 'meta' | 'content' | 'structure' | 'performance';
  message: string;
  fix: string;
}

const SAMPLE_CONTENT: ContentAnalysis[] = [
  {
    id: '1',
    title: 'Künstliche Intelligenz im Jahr 2024: Trends und Entwicklungen',
    url: '/blog/ki-trends-2024',
    seoScore: 87,
    keywordDensity: 1.8,
    readabilityScore: 85,
    wordCount: 1200,
    lastUpdated: '2024-08-30',
    issues: [
      {
        type: 'warning',
        category: 'meta',
        message: 'Meta description ist 168 Zeichen lang',
        fix: 'Kürzen Sie auf 155-160 Zeichen'
      },
      {
        type: 'suggestion',
        category: 'content',
        message: 'Wenige interne Links gefunden',
        fix: 'Fügen Sie 2-3 relevante interne Links hinzu'
      }
    ],
    recommendations: [
      'Fügen Sie mehr Zwischenüberschriften hinzu',
      'Optimieren Sie für Featured Snippets',
      'Erweitern Sie die Sektion über Deep Learning'
    ],
    targetKeywords: ['künstliche intelligenz', 'ki trends', 'machine learning']
  },
  {
    id: '2',
    title: 'Machine Learning Tutorial für Anfänger',
    url: '/blog/machine-learning-tutorial',
    seoScore: 72,
    keywordDensity: 2.3,
    readabilityScore: 78,
    wordCount: 2100,
    lastUpdated: '2024-08-28',
    issues: [
      {
        type: 'critical',
        category: 'meta',
        message: 'H1 Tag fehlt',
        fix: 'Fügen Sie eine H1-Überschrift hinzu'
      },
      {
        type: 'warning',
        category: 'structure',
        message: 'Keine Alt-Texte für 3 Bilder',
        fix: 'Alt-Texte für alle Bilder hinzufügen'
      },
      {
        type: 'suggestion',
        category: 'content',
        message: 'Keyword-Dichte könnte optimiert werden',
        fix: 'Reduzieren Sie die Keyword-Dichte auf 1.5-2%'
      }
    ],
    recommendations: [
      'Strukturieren Sie den Inhalt mit mehr Zwischenüberschriften',
      'Fügen Sie eine FAQ-Sektion hinzu',
      'Erstellen Sie ein Inhaltsverzeichnis'
    ],
    targetKeywords: ['machine learning tutorial', 'ml für anfänger', 'algorithmen lernen']
  },
  {
    id: '3',
    title: 'Deep Learning Framework Vergleich 2024',
    url: '/blog/deep-learning-frameworks',
    seoScore: 91,
    keywordDensity: 1.6,
    readabilityScore: 82,
    wordCount: 1800,
    lastUpdated: '2024-08-31',
    issues: [
      {
        type: 'suggestion',
        category: 'performance',
        message: 'Ladezeit könnte verbessert werden',
        fix: 'Optimieren Sie Bildgrößen'
      }
    ],
    recommendations: [
      'Erweitern Sie den TensorFlow-Abschnitt',
      'Fügen Sie praktische Code-Beispiele hinzu',
      'Erstellen Sie eine Vergleichstabelle'
    ],
    targetKeywords: ['deep learning frameworks', 'tensorflow vs pytorch', 'neural networks']
  }
];

function ContentCard({ content }: { content: ContentAnalysis }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getIssueIcon = (type: SEOIssue['type']) => {
    if (type === 'critical') return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (type === 'warning') return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    return <Lightbulb className="w-4 h-4 text-blue-500" />;
  };

  const criticalIssues = content.issues.filter(i => i.type === 'critical').length;
  const warningIssues = content.issues.filter(i => i.type === 'warning').length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
            {content.title}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ExternalLink className="w-3 h-3" />
            <span>{content.url}</span>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBgColor(content.seoScore)} ${getScoreColor(content.seoScore)}`}>
          {content.seoScore}/100
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{content.wordCount}</p>
          <p className="text-xs text-gray-600">Words</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{content.keywordDensity}%</p>
          <p className="text-xs text-gray-600">Keyword Density</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{content.readabilityScore}</p>
          <p className="text-xs text-gray-600">Readability</p>
        </div>
      </div>

      {/* Issues Summary */}
      {content.issues.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Issues Found</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            {criticalIssues > 0 && (
              <span className="flex items-center gap-1 text-red-600">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                {criticalIssues} Critical
              </span>
            )}
            {warningIssues > 0 && (
              <span className="flex items-center gap-1 text-yellow-600">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                {warningIssues} Warnings
              </span>
            )}
            <span className="flex items-center gap-1 text-blue-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              {content.issues.filter(i => i.type === 'suggestion').length} Suggestions
            </span>
          </div>
        </div>
      )}

      {/* Target Keywords */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-1">
          <Hash className="w-4 h-4" />
          Target Keywords
        </h4>
        <div className="flex flex-wrap gap-1">
          {content.targetKeywords.map((keyword, index) => (
            <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
              {keyword}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button className="flex-1 px-3 py-2 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors">
          Optimize
        </button>
        <button className="flex-1 px-3 py-2 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors">
          Analyze
        </button>
      </div>
    </div>
  );
}

function IssueDetails({ content }: { content: ContentAnalysis }) {
  return (
    <div className="space-y-4">
      {content.issues.map((issue, index) => (
        <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
          {getIssueIcon(issue.type)}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-1 rounded uppercase font-medium ${
                issue.type === 'critical' ? 'bg-red-100 text-red-800' :
                issue.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {issue.category}
              </span>
            </div>
            <p className="text-sm text-gray-900 mb-1">{issue.message}</p>
            <p className="text-xs text-gray-600">{issue.fix}</p>
          </div>
        </div>
      ))}
    </div>
  );

  function getIssueIcon(type: SEOIssue['type']) {
    if (type === 'critical') return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (type === 'warning') return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    return <Lightbulb className="w-4 h-4 text-blue-500" />;
  }
}

function RecommendationsPanel({ content }: { content: ContentAnalysis }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-yellow-500" />
        Optimization Recommendations
      </h3>
      <div className="space-y-3">
        {content.recommendations.map((recommendation, index) => (
          <div key={index} className="flex items-start gap-3">
            <ArrowRight className="w-4 h-4 text-blue-500 mt-0.5" />
            <p className="text-sm text-gray-700">{recommendation}</p>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          Apply All Recommendations
        </button>
      </div>
    </div>
  );
}

export default function SEOContentOptimizer() {
  const [content] = useState<ContentAnalysis[]>(SAMPLE_CONTENT);
  const [selectedContent, setSelectedContent] = useState<ContentAnalysis | null>(null);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning'>('all');

  const filteredContent = content.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'critical') return c.issues.some(i => i.type === 'critical');
    if (filter === 'warning') return c.issues.some(i => i.type === 'warning');
    return true;
  });

  const stats = {
    total: content.length,
    avgScore: Math.round(content.reduce((sum, c) => sum + c.seoScore, 0) / content.length),
    needsAttention: content.filter(c => c.seoScore < 80).length,
    criticalIssues: content.reduce((sum, c) => sum + c.issues.filter(i => i.type === 'critical').length, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Content Optimizer</h2>
            <p className="text-gray-600">AI-Powered SEO Content Analysis</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Analyze New Content
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            <p className="text-sm text-gray-600">Total Content</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.avgScore}%</p>
            <p className="text-sm text-gray-600">Avg. SEO Score</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.needsAttention}</p>
            <p className="text-sm text-gray-600">Need Attention</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{stats.criticalIssues}</p>
            <p className="text-sm text-gray-600">Critical Issues</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Filter:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Content</option>
                <option value="critical">Critical Issues</option>
                <option value="warning">Needs Attention</option>
              </select>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            {filteredContent.length} items shown
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredContent.map(contentItem => (
          <div key={contentItem.id} onClick={() => setSelectedContent(contentItem)}>
            <ContentCard content={contentItem} />
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedContent.title}</h3>
                  <p className="text-gray-600">{selectedContent.url}</p>
                </div>
                <button
                  onClick={() => setSelectedContent(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Issues & Fixes</h4>
                <IssueDetails content={selectedContent} />
              </div>
              
              <div>
                <RecommendationsPanel content={selectedContent} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}