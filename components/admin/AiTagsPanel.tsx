'use client';

import { Post, Tag } from '@prisma/client';
import { useState, useEffect } from 'react';

interface AiTagsPanelProps {
  post: Post & { tags?: any[] };
  availableTags: Tag[];
  onKeywordsUpdate: (keywords: string[]) => void;
  onTagsUpdate: (tagIds: string[]) => void;
}

export default function AiTagsPanel({
  post,
  availableTags,
  onKeywordsUpdate,
  onTagsUpdate,
}: AiTagsPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [keywords, setKeywords] = useState<string[]>(
    Array.isArray(post.keywords) ? post.keywords : [],
  );
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    post.tags?.map((t: any) => t.tagId || t.tag?.id) || [],
  );

  // Poll for job status
  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/admin/ai/status?jobId=${jobId}`);
        if (response.ok) {
          const status = await response.json();

          if (status.state === 'completed' && status.returnvalue) {
            const { keywords: newKeywords, suggestedTags: newTags } = status.returnvalue;

            if (newKeywords) {
              setKeywords(newKeywords);
              onKeywordsUpdate(newKeywords);
            }

            if (newTags) {
              setSuggestedTags(newTags);
            }

            setIsGenerating(false);
            setJobId(null);
          } else if (status.state === 'failed') {
            setError(status.failedReason || 'Generation failed');
            setIsGenerating(false);
            setJobId(null);
          }
        }
      } catch (err) {
        // console.error('Failed to check job status:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, onKeywordsUpdate]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/ai/autotags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to generate tags');
      }

      const data = await response.json();
      setJobId(data.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate tags');
      setIsGenerating(false);
    }
  };

  const handleKeywordToggle = (keyword: string) => {
    const newKeywords = keywords.includes(keyword)
      ? keywords.filter((k) => k !== keyword)
      : [...keywords, keyword];
    setKeywords(newKeywords);
    onKeywordsUpdate(newKeywords);
  };

  const handleTagToggle = (tagId: string) => {
    const newTags = selectedTags.includes(tagId)
      ? selectedTags.filter((t) => t !== tagId)
      : [...selectedTags, tagId];
    setSelectedTags(newTags);
    onTagsUpdate(newTags);
  };

  const handleAddKeyword = (keyword: string) => {
    const normalized = keyword.toLowerCase().replace(/\s+/g, '-');
    if (normalized && !keywords.includes(normalized)) {
      const newKeywords = [...keywords, normalized];
      setKeywords(newKeywords);
      onKeywordsUpdate(newKeywords);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Tags & Keywords</h3>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !post.content}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Generiere...
            </>
          ) : (
            'Vorschläge generieren'
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Keywords Section */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Keywords ({keywords.length}/8)
        </h4>
        <div className="flex flex-wrap gap-2 mb-2">
          {keywords.map((keyword) => (
            <span
              key={keyword}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
            >
              {keyword}
              <button
                onClick={() => handleKeywordToggle(keyword)}
                className="ml-2 text-blue-500 hover:text-blue-700"
              >
                ×
              </button>
            </span>
          ))}
        </div>

        {keywords.length < 8 && (
          <input
            type="text"
            placeholder="Keyword hinzufügen..."
            className="mt-2 px-3 py-1 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddKeyword((e.target as HTMLInputElement).value);
                (e.target as HTMLInputElement).value = '';
              }
            }}
          />
        )}
      </div>

      {/* Suggested Tags Section */}
      {suggestedTags.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Vorgeschlagene Tags
          </h4>
          <div className="flex flex-wrap gap-2">
            {suggestedTags.map((tagName) => {
              const existingTag = availableTags.find(
                (t) => t.name.toLowerCase() === tagName.toLowerCase(),
              );
              const isSelected = existingTag && selectedTags.includes(existingTag.id);

              return (
                <button
                  key={tagName}
                  onClick={() => {
                    if (existingTag) {
                      handleTagToggle(existingTag.id);
                    }
                  }}
                  disabled={!existingTag}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    isSelected
                      ? 'bg-green-600 text-white'
                      : existingTag
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                        : 'bg-gray-50 text-gray-400 cursor-not-allowed dark:bg-gray-800'
                  }`}
                >
                  {tagName}
                  {!existingTag && ' (neu)'}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Tags Section */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Verfügbare Tags
        </h4>
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => {
            const isSelected = selectedTags.includes(tag.id);
            return (
              <button
                key={tag.id}
                onClick={() => handleTagToggle(tag.id)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  isSelected
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {tag.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        <p>
          Die AI schlägt 5-8 Keywords und 3-6 passende Tags vor. Bevorzugt werden existierende Tags
          verwendet.
        </p>
      </div>
    </div>
  );
}
