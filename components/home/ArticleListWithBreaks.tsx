'use client';

import { Fragment } from 'react';
import PostCard from './PostCard';
import { QuoteBreak, StatsBreak, NewsletterBand, RelatedArticles, FunFactBreak } from './ArticleBreaks';

interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  coverImage?: string | null;
  publishedAt?: Date | string;
  author?: {
    name: string;
    avatarUrl?: string | null;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  viewCount?: number;
}

interface ArticleListWithBreaksProps {
  articles: Article[];
  showCategoryBadges?: boolean;
  relatedArticles?: Article[];
}

// Predefined content for breaks
const quotes = [
  {
    quote: "Technology is best when it brings people together.",
    author: "Matt Mullenweg",
    context: "WordPress Founder"
  },
  {
    quote: "The future belongs to those who learn more skills and combine them in creative ways.",
    author: "Robert Greene",
    context: "Author"
  },
  {
    quote: "Innovation distinguishes between a leader and a follower.",
    author: "Steve Jobs",
    context: "Apple Co-Founder"
  }
];

const techStats = [
  {
    value: "5.16B",
    label: "Internet-Nutzer weltweit",
    icon: "🌐",
    trend: "+4% vs. letztes Jahr"
  },
  {
    value: "2.7B",
    label: "ChatGPT Nutzer monatlich",
    icon: "🤖",
    trend: "+300% seit Launch"
  },
  {
    value: "463",
    label: "Exabytes Daten täglich",
    icon: "📊",
    trend: "Verdopplung alle 2 Jahre"
  }
];

const funFacts = [
  {
    fact: "Das erste YouTube-Video wurde am 23. April 2005 hochgeladen",
    context: "Es hieß 'Me at the zoo' und dauerte nur 18 Sekunden",
    icon: "📹"
  },
  {
    fact: "Google verarbeitet über 8.5 Milliarden Suchanfragen pro Tag",
    context: "Das sind etwa 99.000 Suchanfragen pro Sekunde",
    icon: "🔍"
  },
  {
    fact: "Der erste Computer-Bug war ein echter Bug",
    context: "1947 fand Grace Hopper einen Käfer in einem Computer-Relais",
    icon: "🐛"
  }
];

export default function ArticleListWithBreaks({ 
  articles, 
  showCategoryBadges = true,
  relatedArticles = []
}: ArticleListWithBreaksProps) {
  const getRandomQuote = () => quotes[Math.floor(Math.random() * quotes.length)];
  const getRandomFact = () => funFacts[Math.floor(Math.random() * funFacts.length)];

  const insertBreaks = () => {
    const result = [];
    
    for (let i = 0; i < articles.length; i++) {
      // Add the article
      result.push(
        <PostCard 
          key={articles[i].id}
          post={{
            id: articles[i].id,
            slug: articles[i].slug,
            title: articles[i].title,
            excerpt: articles[i].excerpt,
            coverUrl: articles[i].coverImage,
            publishedAt: typeof articles[i].publishedAt === 'string' 
              ? articles[i].publishedAt 
              : articles[i].publishedAt?.toISOString(),
            author: articles[i].author || { name: 'FluxAO Team' },
            category: articles[i].category
          }}
          showCategoryBadge={showCategoryBadges}
        />
      );

      // Insert breaks at strategic positions
      if ((i + 1) % 3 === 0 && i < articles.length - 1) {
        const breakType = Math.floor(Math.random() * 4);
        
        switch (breakType) {
          case 0:
            // Quote Break
            const quote = getRandomQuote();
            result.push(
              <div key={`quote-${i}`} className="col-span-full">
                <QuoteBreak 
                  quote={quote.quote}
                  author={quote.author}
                  context={quote.context}
                />
              </div>
            );
            break;
            
          case 1:
            // Stats Break
            result.push(
              <div key={`stats-${i}`} className="col-span-full">
                <StatsBreak stats={techStats} />
              </div>
            );
            break;
            
          case 2:
            // Newsletter Band
            result.push(
              <div key={`newsletter-${i}`} className="col-span-full">
                <NewsletterBand />
              </div>
            );
            break;
            
          case 3:
            // Fun Fact
            const fact = getRandomFact();
            result.push(
              <div key={`funfact-${i}`} className="col-span-full">
                <FunFactBreak facts={[fact]} />
              </div>
            );
            break;
        }
      }
      
      // Insert Related Articles section after 6 articles
      if ((i + 1) === 6 && relatedArticles.length > 0) {
        result.push(
          <div key={`related-${i}`} className="col-span-full">
            <RelatedArticles articles={relatedArticles} />
          </div>
        );
      }
    }
    
    return result;
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {insertBreaks()}
    </div>
  );
}