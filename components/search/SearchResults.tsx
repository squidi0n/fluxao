'use client';

import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

import { useDebounce } from '@/hooks/useDebounce';
import { SearchResponse } from '@/lib/search';
import { sanitizeHtml } from '@/lib/sanitize';

interface SearchResultsProps {
  query: string;
  tags: string;
  categories: string;
  page: number;
}

export default function SearchResults({
  query: initialQuery,
  tags: initialTags,
  categories: initialCategories,
  page,
}: SearchResultsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialTags ? initialTags.split(',').filter((t) => t) : [],
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategories ? initialCategories.split(',').filter((c) => c) : [],
  );
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const debouncedQuery = useDebounce(query, 300);
  const limit = 20;
  const offset = (page - 1) * limit;

  // Fetch search results
  const fetchResults = useCallback(async () => {
    if (!debouncedQuery && selectedTags.length === 0 && selectedCategories.length === 0) {
      setResults(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: debouncedQuery,
        limit: String(limit),
        offset: String(offset),
      });

      if (selectedTags.length > 0) {
        params.set('tags', selectedTags.join(','));
      }

      if (selectedCategories.length > 0) {
        params.set('categories', selectedCategories.join(','));
      }

      const response = await fetch(`/api/search?${params}`);

      if (!response.ok) {
        if (response.status === 429) {
          const data = await response.json();
          throw new Error(`Zu viele Anfragen. Bitte warten Sie ${data.retryAfter} Sekunden.`);
        }
        throw new Error('Suche fehlgeschlagen');
      }

      const data: SearchResponse = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, selectedTags, selectedCategories, offset]);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async () => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&suggestions=true`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (err) {
      // Silently fail for suggestions
    }
  }, [query]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  useEffect(() => {
    fetchSuggestions();
  }, [query, fetchSuggestions]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
    if (selectedCategories.length > 0) params.set('categories', selectedCategories.join(','));
    if (page > 1) params.set('page', String(page));

    const newUrl = params.toString() ? `/search?${params}` : '/search';
    router.replace(newUrl, { scroll: false });
  }, [query, selectedTags, selectedCategories, page, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResults();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    );
  };

  const totalPages = results ? Math.ceil(results.total / limit) : 0;

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Artikel durchsuchen..."
            className="w-full px-4 py-3 pr-12 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white dark:border-gray-700"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Active Filters */}
      {(selectedTags.length > 0 || selectedCategories.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300"
            >
              #{tag}
              <svg className="w-3 h-3 ml-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          ))}
          {selectedCategories.map((category) => (
            <button
              key={category}
              onClick={() => toggleCategory(category)}
              className="inline-flex items-center px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full hover:bg-green-200 dark:bg-green-900 dark:text-green-300"
            >
              {category}
              <svg className="w-3 h-3 ml-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          ))}
        </div>
      )}

      {/* Results Info */}
      {results && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {results.total} {results.total === 1 ? 'Ergebnis' : 'Ergebnisse'} gefunden
          {results.cached && ' (gecached)'}
          {' • '}
          {results.took}ms
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse border border-gray-200 dark:border-gray-800 rounded-lg p-6"
            >
              <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
            </div>
          ))}
        </div>
      )}

      {/* Search Results */}
      {!loading && results && results.results.length > 0 && (
        <div className="space-y-6">
          {results.results.map((result) => (
            <article
              key={result.id}
              className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <Link href={`/news/${result.slug}`}>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400">
                  {result.title}
                </h2>
              </Link>

              {result.matchedSnippet && (
                <div
                  className="text-gray-600 dark:text-gray-400 mb-3"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(
                      result.matchedSnippet.replace(
                        /\*\*(.*?)\*\*/g,
                        '<mark class="bg-yellow-200 dark:bg-yellow-900 px-1">$1</mark>',
                      )
                    ),
                  }}
                />
              )}

              {result.teaser && !result.matchedSnippet && (
                <p className="text-gray-600 dark:text-gray-400 mb-3">{result.teaser}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm">
                {result.publishedAt && (
                  <time className="text-gray-500 dark:text-gray-500">
                    {format(new Date(result.publishedAt), 'dd. MMMM yyyy', { locale: de })}
                  </time>
                )}

                {result.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {result.tags.map(({ tag }) => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.slug)}
                        className={`inline-block px-2 py-1 text-xs rounded-full ${
                          selectedTags.includes(tag.slug)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        #{tag.name}
                      </button>
                    ))}
                  </div>
                )}

                {result.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {result.categories.map(({ category }) => (
                      <button
                        key={category.id}
                        onClick={() => toggleCategory(category.slug)}
                        className={`inline-block px-2 py-1 text-xs rounded-full ${
                          selectedCategories.includes(category.slug)
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && results && results.results.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            Keine Ergebnisse gefunden für "{results.query}"
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Versuchen Sie es mit anderen Suchbegriffen oder entfernen Sie Filter
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Link
            href={`/search?q=${query}&page=${Math.max(1, page - 1)}`}
            className={`px-4 py-2 rounded-lg ${
              page === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800'
                : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
            aria-disabled={page === 1}
          >
            Zurück
          </Link>

          <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
            Seite {page} von {totalPages}
          </span>

          <Link
            href={`/search?q=${query}&page=${Math.min(totalPages, page + 1)}`}
            className={`px-4 py-2 rounded-lg ${
              page === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800'
                : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
            aria-disabled={page === totalPages}
          >
            Weiter
          </Link>
        </div>
      )}
    </div>
  );
}
