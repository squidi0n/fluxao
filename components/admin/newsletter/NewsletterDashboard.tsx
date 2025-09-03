'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, Edit, Calendar, Users, Send, Clock, MoreHorizontal, Mail, TrendingUp, Filter, Search } from 'lucide-react';

interface Issue {
  id: string;
  subject: string;
  status: string;
  createdAt: Date | string;
  sentAt: Date | string | null;
  _count: {
    recipients: number;
  };
}

interface Subscriber {
  id: string;
  email: string;
  status: string;
  createdAt: Date | string;
}

interface Stats {
  totalSent: number;
  monthlyGrowth: number;
  weeklyGrowth: number;
  templates: number;
  drafts: number;
}

interface NewsletterDashboardProps {
  issues: Issue[];
  subscribers: Subscriber[];
  stats: Stats;
}

export function NewsletterDashboard({ issues, subscribers, stats }: NewsletterDashboardProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredIssues = issues.filter(issue => {
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    const matchesSearch = issue.subject.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const issueDate = new Date(date);
    const diffInDays = Math.floor((now.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Heute';
    if (diffInDays === 1) return 'Gestern';
    if (diffInDays < 7) return `vor ${diffInDays} Tagen`;
    if (diffInDays < 30) return `vor ${Math.floor(diffInDays / 7)} Wochen`;
    return `vor ${Math.floor(diffInDays / 30)} Monaten`;
  };

  const getStatusBadge = (status: string, sentAt: Date | string | null) => {
    if (status === 'sent') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <Send className="w-3 h-3" />
          Versendet
        </span>
      );
    }
    if (status === 'scheduled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          <Clock className="w-3 h-3" />
          Geplant
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
        <Edit className="w-3 h-3" />
        Entwurf
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Recent Newsletter Issues */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Mail className="w-6 h-6 text-blue-600" />
                Newsletter Campaigns
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Verwalte und überwache deine Newsletter-Kampagnen
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/newsletter/drafts"
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Entwürfe ({stats.drafts})
              </Link>
              <Link
                href="/admin/newsletter/create"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Neuer Newsletter
              </Link>
            </div>
          </div>
          
          {/* Filters and Search */}
          <div className="flex items-center gap-4 mt-6">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Alle Status</option>
                <option value="sent">Versendet</option>
                <option value="scheduled">Geplant</option>
                <option value="draft">Entwurf</option>
              </select>
            </div>
            
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Newsletter suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          {filteredIssues.length > 0 ? (
            <div className="space-y-4">
              {filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Status Icon */}
                    <div className={`p-2 rounded-lg ${
                      issue.status === 'sent' 
                        ? 'bg-green-100 dark:bg-green-900/30' 
                        : issue.status === 'scheduled'
                        ? 'bg-blue-100 dark:bg-blue-900/30'
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      {issue.status === 'sent' ? (
                        <Send className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : issue.status === 'scheduled' ? (
                        <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Edit className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">{issue.subject}</h3>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatTimeAgo(issue.createdAt)}
                        </span>
                        {issue.status === 'sent' && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {issue._count.recipients} Empfänger
                          </span>
                        )}
                        {issue.sentAt && (
                          <span className="flex items-center gap-1">
                            <Send className="w-3 h-3" />
                            Versendet: {new Date(issue.sentAt).toLocaleDateString('de-DE')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Status and Actions */}
                  <div className="flex items-center gap-3">
                    {getStatusBadge(issue.status, issue.sentAt)}
                    
                    <div className="flex items-center gap-2">
                      {issue.status !== 'sent' && (
                        <Link
                          href={`/admin/newsletter/drafts/${issue.id}/edit`}
                          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                          title="Bearbeiten"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      )}
                      <Link
                        href={`/admin/newsletter/preview/${issue.id}`}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                        title="Vorschau"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                        title="Mehr Optionen"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Mail className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Noch keine Newsletter vorhanden
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Erstelle deinen ersten Newsletter, um loszulegen
              </p>
              <Link
                href="/admin/newsletter/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Send className="w-4 h-4" />
                Ersten Newsletter erstellen
              </Link>
            </div>
          )}
        </div>
        
        {/* Pagination/View All */}
        {issues.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filteredIssues.length} von {issues.length} Newsletter
              </p>
              <Link
                href="/admin/newsletter/all"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Alle anzeigen →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Subscriber Growth Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-2xl font-bold text-green-600">+{stats.weeklyGrowth}</span>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Wöchentliches Wachstum</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Neue Abonnenten diese Woche
          </p>
        </div>

        {/* Engagement Rate */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-2xl font-bold text-blue-600">
              {((subscribers.length / Math.max(stats.totalSent || 1, 1)) * 100).toFixed(1)}%
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Engagement Rate</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Aktive Abonnenten von Gesamt
          </p>
        </div>

        {/* Monthly Growth */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-2xl font-bold text-purple-600">+{stats.monthlyGrowth}</span>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Monatliches Wachstum</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Neue Abonnenten diesen Monat
          </p>
        </div>
      </div>
    </div>
  );
}