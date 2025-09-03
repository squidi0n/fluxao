import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

import { prisma } from '@/lib/prisma';

// RSS Parser
const parser = new Parser();

// Deutsche RSS Feeds - KEINE API LIMITS! 🎉
const RSS_FEEDS = {
  t3n: 'https://t3n.de/rss.xml',
  heise: 'https://www.heise.de/rss/heise-atom.xml',
  golem: 'https://rss.golem.de/rss.php?feed=ATOM1.0',
  computerwoche: 'https://www.computerwoche.de/rss/computerwoche.xml',
  chip: 'https://www.chip.de/rss/rss_topnews.xml',
};

// News-Quellen APIs (Free Tier)
const NEWS_SOURCES = {
  // Reddit API (ohne Key)
  reddit:
    'https://www.reddit.com/r/de_EDV+de_IT+zocken+Philosophie+KuenstlicheIntelligenz/top.json?limit=10',
  redditInt:
    'https://www.reddit.com/r/technology+programming+artificial+gaming+philosophy/top.json?limit=10',
  devto: 'https://dev.to/api/articles?top=1',
  hackernews: 'https://hacker-news.firebaseio.com/v0/topstories.json',
  // GitHub Trending (ohne Key)
  githubTrending: 'https://api.github.com/search/repositories?q=stars:>10000&sort=stars&order=desc',
};

// Cache und API-Limits
let newsCache: any = null;
let lastFetch: Date | null = null;
let dailyNewsAPICount = 0;
let lastResetDate: Date = new Date();

// Cache länger halten wegen API-Limit (100/Tag = ~4 pro Stunde)
const CACHE_DURATION = 30 * 60 * 1000; // 30 Minuten Cache (RSS Feeds brauchen keine Limits!)
const NEWSAPI_DAILY_LIMIT = 100;
const MAX_CALLS_PER_HOUR = 2; // Max 2 Calls pro Stunde = 48/Tag (mehr Spielraum)

export async function GET() {
  try {
    // Cache prüfen
    if (newsCache && lastFetch && Date.now() - lastFetch.getTime() < CACHE_DURATION) {
      return NextResponse.json({
        news: newsCache,
        lastUpdate: lastFetch,
        cached: true,
      });
    }

    // OpenAI API Key prüfen
    const openaiKey = process.env.OPENAI_API_KEY;

    if (openaiKey) {
      // Mit KI-Analyse
      const aggregatedNews = await fetchAndAnalyzeNews(openaiKey);
      newsCache = aggregatedNews;
      lastFetch = new Date();

      return NextResponse.json({
        news: aggregatedNews,
        lastUpdate: lastFetch,
        cached: false,
        apiStatus: {
          newsApiCallsToday: dailyNewsAPICount,
          newsApiLimit: MAX_CALLS_PER_HOUR,
          remainingCalls: Math.max(0, MAX_CALLS_PER_HOUR - dailyNewsAPICount),
        },
      });
    } else {
      // Fallback: Ohne KI, nur aggregieren
      const simpleNews = await fetchSimpleNews();
      newsCache = simpleNews;
      lastFetch = new Date();

      return NextResponse.json({
        news: simpleNews,
        lastUpdate: lastFetch,
        cached: false,
        warning: 'KI-Analyse nicht verfügbar. Setze OPENAI_API_KEY in .env',
      });
    }
  } catch (error) {
    // console.error('News aggregation error:', error);

    // Fallback auf gespeicherte News aus DB
    const recentPosts = await prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      take: 10,
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        excerpt: true,
        slug: true,
        publishedAt: true,
        categories: {
          include: { category: true },
        },
        tags: true,
      },
    });

    const fallbackNews = recentPosts.map((post) => ({
      id: post.id,
      title: post.title,
      summary: post.excerpt || '',
      source: 'FluxAO',
      sourceUrl: `/posts/${post.slug}`,
      category: mapCategory(post.categories[0]?.category?.slug || 'tech'),
      publishedAt: post.publishedAt?.toISOString() || new Date().toISOString(),
      relevanceScore: 75,
      tags: post.tags?.map((t: any) => t.name) || [],
      fluxRating: Math.floor(Math.random() * 30) + 70,
    }));

    return NextResponse.json({
      news: fallbackNews,
      lastUpdate: new Date(),
      cached: false,
      fallback: true,
    });
  }
}

async function fetchAndAnalyzeNews(apiKey: string) {
  const news: any[] = [];

  // Reset daily counter wenn neuer Tag
  const today = new Date().toDateString();
  if (lastResetDate.toDateString() !== today) {
    dailyNewsAPICount = 0;
    lastResetDate = new Date();
  }

  // DEUTSCHE RSS FEEDS - Keine Limits! \ud83d\ude80
  try {
    // t3n.de Feed
    try {
      const t3nFeed = await parser.parseURL(RSS_FEEDS.t3n);
      const t3nItems = t3nFeed.items.slice(0, 3);

      for (const item of t3nItems) {
        if (!item.title) continue;

        const analysis = await analyzeWithAI(apiKey, {
          title: item.title,
          content: item.contentSnippet || item.content,
          source: 't3n.de',
        });

        news.push({
          id: `t3n-${Date.now()}-${Math.random()}`,
          title: analysis.title || item.title,
          summary: analysis.summary || item.contentSnippet?.substring(0, 200) || '',
          source: 't3n \ud83c\udde9\ud83c\uddea',
          sourceUrl: item.link,
          category: 'tech',
          publishedAt: item.pubDate || new Date().toISOString(),
          relevanceScore: analysis.relevanceScore || 88,
          aiAnalysis: analysis.insight,
          tags: analysis.tags || ['Tech', 'Deutschland'],
          fluxRating: 90,
        });
      }
    } catch (error) {
      // console.error('t3n RSS error:', error);
    }

    // heise.de Feed
    try {
      const heiseFeed = await parser.parseURL(RSS_FEEDS.heise);
      const heiseItems = heiseFeed.items.slice(0, 3);

      for (const item of heiseItems) {
        if (!item.title) continue;

        const analysis = await analyzeWithAI(apiKey, {
          title: item.title,
          content: item.contentSnippet || item.content,
          source: 'heise.de',
        });

        news.push({
          id: `heise-${Date.now()}-${Math.random()}`,
          title: analysis.title || item.title,
          summary: analysis.summary || item.contentSnippet?.substring(0, 200) || '',
          source: 'heise \ud83c\udde9\ud83c\uddea',
          sourceUrl: item.link,
          category: 'tech',
          publishedAt: item.pubDate || new Date().toISOString(),
          relevanceScore: analysis.relevanceScore || 87,
          aiAnalysis: analysis.insight,
          tags: analysis.tags || ['Tech', 'News'],
          fluxRating: 88,
        });
      }
    } catch (error) {
      // console.error('heise RSS error:', error);
    }

    // golem.de Feed
    try {
      const golemFeed = await parser.parseURL(RSS_FEEDS.golem);
      const golemItems = golemFeed.items.slice(0, 2);

      for (const item of golemItems) {
        if (!item.title) continue;

        const analysis = await analyzeWithAI(apiKey, {
          title: item.title,
          content: item.contentSnippet || item.summary,
          source: 'golem.de',
        });

        news.push({
          id: `golem-${Date.now()}-${Math.random()}`,
          title: analysis.title || item.title,
          summary: analysis.summary || item.contentSnippet?.substring(0, 200) || '',
          source: 'Golem \ud83c\udde9\ud83c\uddea',
          sourceUrl: item.link,
          category: 'tech',
          publishedAt: item.pubDate || new Date().toISOString(),
          relevanceScore: analysis.relevanceScore || 85,
          aiAnalysis: analysis.insight,
          tags: analysis.tags || ['IT', 'Tech'],
          fluxRating: 86,
        });
      }
    } catch (error) {
      // console.error('golem RSS error:', error);
    }
  } catch (error) {
    // console.error('RSS feeds error:', error);
  }

  try {
    // NewsAPI.org - aber nur wenn Limit noch nicht erreicht
    const newsApiKey = process.env.NEWSAPI_KEY;
    if (newsApiKey && dailyNewsAPICount < MAX_CALLS_PER_HOUR) {
      try {
        // Deutsche Tech-News
        const newsApiUrl = `https://newsapi.org/v2/top-headlines?country=de&category=technology&apiKey=${newsApiKey}`;
        const newsApiRes = await fetch(newsApiUrl);

        if (newsApiRes.ok) {
          dailyNewsAPICount++; // Zähle API-Call
          const newsApiData = await newsApiRes.json();
          const articles = newsApiData.articles?.slice(0, 3) || [];

          for (const article of articles) {
            if (!article.title || article.title === '[Removed]') continue;

            const analysis = await analyzeWithAI(apiKey, {
              title: article.title,
              content: article.description || article.content,
              source: article.source?.name,
            });

            news.push({
              id: `newsapi-${Date.now()}-${Math.random()}`,
              title: analysis.title || article.title,
              summary: analysis.summary || article.description || 'Kein Text verfügbar',
              source: article.source?.name || 'NewsAPI',
              sourceUrl: article.url,
              category: 'tech',
              publishedAt: article.publishedAt,
              relevanceScore: analysis.relevanceScore || 85,
              aiAnalysis: analysis.insight,
              tags: analysis.tags || ['Tech', 'Deutschland'],
              fluxRating: 80,
            });
          }
        }

        // Internationale Tech-News (nur 1x pro Stunde)
        if (dailyNewsAPICount < 2) {
          const techCrunchUrl = `https://newsapi.org/v2/top-headlines?sources=techcrunch,the-verge,ars-technica,wired&apiKey=${newsApiKey}`;
          const techRes = await fetch(techCrunchUrl);

          if (techRes.ok) {
            dailyNewsAPICount++;
            const techData = await techRes.json();
            const techArticles = techData.articles?.slice(0, 3) || [];

            for (const article of techArticles) {
              if (!article.title || article.title === '[Removed]') continue;

              const analysis = await analyzeWithAI(apiKey, {
                title: article.title,
                content: article.description,
                source: article.source?.name,
              });

              news.push({
                id: `tech-${Date.now()}-${Math.random()}`,
                title: analysis.title || article.title,
                summary: analysis.summary || article.description,
                source: article.source?.name,
                sourceUrl: article.url,
                category: 'tech',
                publishedAt: article.publishedAt,
                relevanceScore: analysis.relevanceScore || 90,
                aiAnalysis: analysis.insight,
                tags: analysis.tags || extractTags(article.title),
                fluxRating: 85,
              });
            }
          }
        }
      } catch (error) {
        // console.error('NewsAPI error:', error);
      }
    }

    // Deutsche Reddit Communities (funktioniert ohne API Key)
    try {
      const redditDeRes = await fetch(NEWS_SOURCES.reddit, {
        headers: { 'User-Agent': 'FluxAO/1.0' },
      });

      if (redditDeRes.ok) {
        const redditDeData = await redditDeRes.json();
        const redditDePosts = redditDeData.data.children.slice(0, 3);

        for (const post of redditDePosts) {
          const item = post.data;
          if (!item.title) continue;

          const analysis = await analyzeWithAI(apiKey, {
            title: item.title,
            content: item.selftext || item.url,
            subreddit: item.subreddit,
          });

          news.push({
            id: `reddit-de-${item.id}`,
            title: analysis.title || item.title,
            summary: analysis.summary || item.selftext?.substring(0, 200) || 'Link-Post ohne Text',
            source: `r/${item.subreddit} 🇩🇪`,
            sourceUrl: `https://reddit.com${item.permalink}`,
            category: mapSubredditToCategory(item.subreddit),
            publishedAt: new Date(item.created_utc * 1000).toISOString(),
            relevanceScore: analysis.relevanceScore || calculateRelevance(item),
            aiAnalysis: analysis.insight,
            tags: analysis.tags || extractTags(item.title),
            fluxRating: Math.min(100, Math.floor((item.score / 100) * 10)),
          });
        }
      }
    } catch (error) {
      // console.error('Deutsche Reddit error:', error);
    }

    // Internationale Reddit Tech News
    try {
      const redditIntRes = await fetch(NEWS_SOURCES.redditInt, {
        headers: { 'User-Agent': 'FluxAO/1.0' },
      });

      if (redditIntRes.ok) {
        const redditIntData = await redditIntRes.json();
        const redditIntPosts = redditIntData.data.children.slice(0, 3);

        for (const post of redditIntPosts) {
          const item = post.data;
          if (!item.title) continue;

          const analysis = await analyzeWithAI(apiKey, {
            title: item.title,
            content: item.selftext || item.url,
            subreddit: item.subreddit,
          });

          news.push({
            id: `reddit-int-${item.id}`,
            title: analysis.title || item.title,
            summary: analysis.summary || item.selftext?.substring(0, 200) || 'Link-Post ohne Text',
            source: `r/${item.subreddit}`,
            sourceUrl: `https://reddit.com${item.permalink}`,
            category: mapSubredditToCategory(item.subreddit),
            publishedAt: new Date(item.created_utc * 1000).toISOString(),
            relevanceScore: analysis.relevanceScore || calculateRelevance(item),
            aiAnalysis: analysis.insight,
            tags: analysis.tags || extractTags(item.title),
            fluxRating: Math.min(100, Math.floor((item.score / 100) * 10)),
          });
        }
      }
    } catch (error) {
      // console.error('International Reddit error:', error);
    }

    // Dev.to Artikel (funktioniert ohne API Key)
    const devtoRes = await fetch(NEWS_SOURCES.devto);

    if (devtoRes.ok) {
      const devtoData = await devtoRes.json();
      const devtoPosts = devtoData.slice(0, 5);

      for (const article of devtoPosts) {
        const analysis = await analyzeWithAI(apiKey, {
          title: article.title,
          content: article.description,
          tags: article.tag_list,
        });

        news.push({
          id: `devto-${article.id}`,
          title: analysis.title || article.title,
          summary: analysis.summary || article.description,
          source: 'Dev.to',
          sourceUrl: article.url,
          category: 'tech',
          publishedAt: article.published_at,
          relevanceScore: analysis.relevanceScore || 70,
          aiAnalysis: analysis.insight,
          tags: analysis.tags || article.tag_list || [],
          fluxRating: Math.min(100, article.positive_reactions_count),
        });
      }
    }
  } catch (error) {
    // console.error('Error fetching news sources:', error);
  }

  // Nach Relevanz sortieren
  return news.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

async function fetchSimpleNews() {
  const news: any[] = [];

  // RSS Feeds zuerst - funktionieren IMMER ohne Limits!
  try {
    // t3n.de
    try {
      const t3nFeed = await parser.parseURL(RSS_FEEDS.t3n);
      const t3nItems = t3nFeed.items.slice(0, 5);

      for (const item of t3nItems) {
        news.push({
          id: `t3n-${Date.now()}-${Math.random()}`,
          title: item.title || 'Kein Titel',
          summary: item.contentSnippet?.substring(0, 200) || 'Keine Beschreibung',
          source: 't3n \ud83c\udde9\ud83c\uddea',
          sourceUrl: item.link,
          category: 'tech',
          publishedAt: item.pubDate || new Date().toISOString(),
          relevanceScore: 80,
          tags: ['Tech', 'Deutschland'],
          fluxRating: 85,
        });
      }
    } catch (error) {
      // console.error('t3n RSS error (simple):', error);
    }

    // heise.de
    try {
      const heiseFeed = await parser.parseURL(RSS_FEEDS.heise);
      const heiseItems = heiseFeed.items.slice(0, 5);

      for (const item of heiseItems) {
        news.push({
          id: `heise-${Date.now()}-${Math.random()}`,
          title: item.title || 'Kein Titel',
          summary: item.contentSnippet?.substring(0, 200) || 'Keine Beschreibung',
          source: 'heise \ud83c\udde9\ud83c\uddea',
          sourceUrl: item.link,
          category: 'tech',
          publishedAt: item.pubDate || new Date().toISOString(),
          relevanceScore: 78,
          tags: ['IT', 'News'],
          fluxRating: 82,
        });
      }
    } catch (error) {
      // console.error('heise RSS error (simple):', error);
    }
  } catch (error) {
    // console.error('RSS feeds error (simple):', error);
  }

  // Reddit als Fallback
  try {
    const redditRes = await fetch(NEWS_SOURCES.reddit, {
      headers: { 'User-Agent': 'FluxAO/1.0' },
    });

    if (redditRes.ok) {
      const redditData = await redditRes.json();
      const redditPosts = redditData.data.children.slice(0, 5);

      for (const post of redditPosts) {
        const item = post.data;
        news.push({
          id: item.id,
          title: item.title,
          summary: item.selftext?.substring(0, 200) || 'Link zu externem Artikel',
          source: `r/${item.subreddit}`,
          sourceUrl: `https://reddit.com${item.permalink}`,
          category: mapSubredditToCategory(item.subreddit),
          publishedAt: new Date(item.created_utc * 1000).toISOString(),
          relevanceScore: calculateRelevance(item),
          tags: extractTags(item.title),
          fluxRating: Math.min(100, Math.floor((item.score / 100) * 10)),
        });
      }
    }
  } catch (error) {
    // console.error('Simple news fetch error:', error);
  }

  return news;
}

async function analyzeWithAI(apiKey: string, content: any) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'Du bist ein Tech-News-Analyst für FluxAO. Übersetze und analysiere News auf Deutsch. Sei prägnant und fokussiert auf Tech, KI, Gaming und Zukunftsthemen. Nutze lockere, moderne Sprache.',
          },
          {
            role: 'user',
            content: `Analysiere und übersetze diese News ins Deutsche:
          Titel: ${content.title}
          Inhalt: ${content.content || content.description || ''}
          Tags: ${content.tags?.join(', ') || content.subreddit || ''}
          
          Gib zurück als JSON:
          - title: Übersetzter Titel auf Deutsch (falls englisch)
          - summary: Deutsche Zusammenfassung in 2-3 Sätzen
          - insight: Warum ist das wichtig für Tech-Interessierte? (max 30 Wörter, locker formuliert)
          - relevanceScore: Zahl 0-100 (wie relevant für FluxAO Leser)
          - tags: Array mit 3-5 deutschen Tags`,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices[0].message.content;
      return JSON.parse(content);
    }
  } catch (error) {
    // console.error('AI analysis error:', error);
  }

  // Fallback ohne KI
  return {
    summary: content.content?.substring(0, 200),
    relevanceScore: 70,
    tags: extractTags(content.title),
  };
}

function mapSubredditToCategory(
  subreddit: string,
): 'tech' | 'ai' | 'gaming' | 'philosophy' | 'science' {
  const mapping: Record<string, any> = {
    technology: 'tech',
    programming: 'tech',
    artificial: 'ai',
    MachineLearning: 'ai',
    gaming: 'gaming',
    pcgaming: 'gaming',
    philosophy: 'philosophy',
    Futurology: 'science',
  };
  return mapping[subreddit] || 'tech';
}

function mapCategory(slug: string): 'tech' | 'ai' | 'gaming' | 'philosophy' | 'science' {
  if (slug.includes('ki') || slug.includes('ai')) return 'ai';
  if (slug.includes('gaming')) return 'gaming';
  if (slug.includes('philosoph') || slug.includes('mindset')) return 'philosophy';
  if (slug.includes('science') || slug.includes('fiction')) return 'science';
  return 'tech';
}

function calculateRelevance(item: any): number {
  const score = item.score || 0;
  const comments = item.num_comments || 0;
  const age = (Date.now() - item.created_utc * 1000) / (1000 * 60 * 60); // Stunden

  // Formel: Score und Kommentare wichtig, aber neuere Posts bevorzugen
  const relevance = score / 10 + comments / 5 - (age / 24) * 10;
  return Math.max(0, Math.min(100, Math.round(relevance)));
}

function extractTags(title: string): string[] {
  const keywords = [
    'AI',
    'KI',
    'GPT',
    'Gaming',
    'Tech',
    'Quantum',
    'VR',
    'AR',
    'Crypto',
    'Web3',
    'Cloud',
    'Security',
  ];
  const found = keywords.filter((k) => title.toLowerCase().includes(k.toLowerCase()));

  // Zusätzliche Tags aus Titel-Wörtern
  const words = title
    .split(' ')
    .filter(
      (w) =>
        w.length > 4 && !['dieser', 'diese', 'dieses', 'einem', 'einer'].includes(w.toLowerCase()),
    )
    .slice(0, 3);

  return [...new Set([...found, ...words])].slice(0, 5);
}
