'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Newspaper,
  TrendingUp,
  Cpu,
  Gamepad2,
  Brain,
  Sparkles,
  Clock,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Hash,
  Bot,
} from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl?: string;
  category: 'tech' | 'ai' | 'gaming' | 'philosophy' | 'science';
  publishedAt: string;
  relevanceScore: number;
  aiAnalysis?: string;
  tags: string[];
  fluxRating?: number;
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'Alle News', icon: Newspaper },
    { id: 'tech', label: 'Tech', icon: Cpu },
    { id: 'ai', label: 'KI', icon: Bot },
    { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
    { id: 'philosophy', label: 'Philosophie', icon: Brain },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
  ];

  const categoryColors = {
    tech: 'blue',
    ai: 'purple',
    gaming: 'green',
    philosophy: 'amber',
    science: 'red',
  };

  const fetchNews = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/news/aggregate');
      if (!res.ok) throw new Error('Fehler beim Laden der News');

      const data = await res.json();
      setNews(data.news);
      setLastUpdate(new Date(data.lastUpdate));
    } catch (err: any) {
      setError(err.message);
      // Fallback auf Demo-Daten
      setNews(getDemoNews());
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();

    // Auto-Refresh alle 5 Minuten
    if (autoRefresh) {
      const interval = setInterval(fetchNews, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const filteredNews = news.filter(
    (item) =>
      selectedCategory === 'all' ||
      (selectedCategory === 'trending' && item.relevanceScore > 80) ||
      item.category === selectedCategory,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Newspaper className="w-10 h-10 text-purple-600" />
              FluxAO News Feed
            </h1>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchNews}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Aktualisieren
              </button>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  autoRefresh
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                <Clock className="w-4 h-4" />
                Auto-Refresh {autoRefresh ? 'An' : 'Aus'}
              </button>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-4">
            KI-kuratierte News aus Tech, Gaming und Zukunftsthemen. Automatisch aktualisiert und für
            dich aufbereitet.
          </p>

          {lastUpdate && (
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Letztes Update: {format(lastUpdate, "dd. MMM yyyy 'um' HH:mm", { locale: de })} Uhr
            </div>
          )}
        </div>

        {/* Category Filter */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    selectedCategory === cat.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                  {cat.id === 'trending' && (
                    <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full animate-pulse">
                      HOT
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                Hinweis: News-API nicht verfügbar
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Zeige Demo-Daten. Die echte KI-Integration benötigt API-Keys.
              </p>
            </div>
          </div>
        )}

        {/* News Grid */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredNews.map((item) => (
              <article
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 group cursor-pointer"
                onClick={() => {
                  if (item.sourceUrl) {
                    window.open(item.sourceUrl, '_blank');
                  }
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-${categoryColors[item.category]}-600`}
                  >
                    {item.category.toUpperCase()}
                  </div>
                  {item.relevanceScore > 80 && <Sparkles className="w-5 h-5 text-yellow-500" />}
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {item.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-3">
                  {item.summary}
                </p>

                {item.aiAnalysis && (
                  <div className="mb-3 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Bot className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                        KI-Analyse
                      </span>
                    </div>
                    <p className="text-xs text-purple-700 dark:text-purple-300">
                      {item.aiAnalysis}
                    </p>
                  </div>
                )}

                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs"
                      >
                        <Hash className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {format(new Date(item.publishedAt), 'dd. MMM', { locale: de })}
                  </div>
                  {item.sourceUrl && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-purple-600"
                    >
                      <span>{item.source}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {filteredNews.length === 0 && !loading && (
          <div className="text-center py-12">
            <Newspaper className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Keine News in dieser Kategorie gefunden.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Demo-Daten falls API nicht verfügbar
function getDemoNews(): NewsItem[] {
  return [
    {
      id: '1',
      title: 'GPT-5 soll 2025 revolutionäre Fähigkeiten bringen',
      summary:
        'OpenAI deutet an, dass die nächste Generation ihrer KI-Modelle nicht nur Text verstehen, sondern auch komplexe Reasoning-Aufgaben lösen kann.',
      source: 'TechCrunch',
      sourceUrl: 'https://techcrunch.com',
      category: 'ai',
      publishedAt: new Date().toISOString(),
      relevanceScore: 95,
      aiAnalysis:
        'Wichtiger Meilenstein für AGI-Entwicklung. Könnte Game-Changer für Coding und wissenschaftliche Forschung werden.',
      tags: ['GPT-5', 'OpenAI', 'AGI'],
      fluxRating: 89,
    },
    {
      id: '2',
      title: 'Steam Deck 2 mit OLED und besserer Akkulaufzeit',
      summary:
        'Valve bestätigt Entwicklung der nächsten Generation. Fokus auf längere Spielzeiten und verbesserte Display-Technologie.',
      source: 'IGN',
      sourceUrl: 'https://ign.com',
      category: 'gaming',
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
      relevanceScore: 82,
      aiAnalysis:
        'Perfekt für Handheld-Gaming-Revolution. Nintendo Switch bekommt ernsthafte Konkurrenz.',
      tags: ['SteamDeck', 'Valve', 'Handheld'],
      fluxRating: 76,
    },
    {
      id: '3',
      title: 'Quantencomputer knackt erstmals RSA-Verschlüsselung',
      summary:
        'IBM-Forscher demonstrieren erfolgreichen Angriff auf 2048-bit RSA. Krypto-Welt in Aufruhr.',
      source: 'Wired',
      sourceUrl: 'https://wired.com',
      category: 'tech',
      publishedAt: new Date(Date.now() - 7200000).toISOString(),
      relevanceScore: 91,
      aiAnalysis:
        'Game Over für aktuelle Verschlüsselung. Post-Quantum-Krypto wird jetzt zur Pflicht.',
      tags: ['Quantum', 'Security', 'Crypto'],
      fluxRating: 94,
    },
    {
      id: '4',
      title: 'Bewusstsein in KI-Systemen: Neue Studie sorgt für Diskussionen',
      summary:
        'MIT-Forscher präsentieren Framework zur Messung von Bewusstseinsmerkmalen in Large Language Models.',
      source: 'MIT News',
      sourceUrl: 'https://news.mit.edu',
      category: 'philosophy',
      publishedAt: new Date(Date.now() - 10800000).toISOString(),
      relevanceScore: 88,
      aiAnalysis: 'Philosophische Bombe. Wenn KI bewusst ist, müssen wir alles überdenken.',
      tags: ['Consciousness', 'Ethics', 'AGI'],
      fluxRating: 91,
    },
    {
      id: '5',
      title: 'Unreal Engine 6 Preview: Photorealismus ohne Performance-Einbußen',
      summary:
        'Epic Games zeigt beeindruckende Tech-Demo. Nanite 2.0 und Lumen revolutionieren Echtzeit-Rendering.',
      source: 'GameSpot',
      sourceUrl: 'https://gamespot.com',
      category: 'gaming',
      publishedAt: new Date(Date.now() - 14400000).toISOString(),
      relevanceScore: 79,
      aiAnalysis:
        'Matrix-Level Graphics werden Standard. Indies können jetzt AAA-Qualität liefern.',
      tags: ['UnrealEngine', 'Graphics', 'GameDev'],
      fluxRating: 83,
    },
    {
      id: '6',
      title: 'Neuralink beginnt zweite Testphase mit 10 Probanden',
      summary:
        'Elon Musks Brain-Computer-Interface zeigt erste Erfolge. Gelähmte Patienten steuern Computer mit Gedanken.',
      source: 'The Verge',
      sourceUrl: 'https://theverge.com',
      category: 'tech',
      publishedAt: new Date(Date.now() - 18000000).toISOString(),
      relevanceScore: 93,
      aiAnalysis: 'Cyborg-Ära beginnt. In 10 Jahren normal, heute noch Science-Fiction.',
      tags: ['Neuralink', 'BCI', 'Future'],
      fluxRating: 96,
    },
  ];
}
