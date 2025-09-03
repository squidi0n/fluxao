'use client';

import { Post } from '@prisma/client';
import { useState, useEffect } from 'react';

interface AiSummaryPanelProps {
  post: Post;
  onSummaryUpdate: (summary: string) => void;
}

export default function AiSummaryPanel({ post, onSummaryUpdate }: AiSummaryPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState(post.summary || '');
  const [isEditing, setIsEditing] = useState(false);

  // Poll for job status
  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/admin/ai/status?jobId=${jobId}`);
        if (response.ok) {
          const status = await response.json();

          if (status.state === 'completed' && status.returnvalue?.summary) {
            setSummary(status.returnvalue.summary);
            setIsGenerating(false);
            setJobId(null);

            // Auto-save after generation
            onSummaryUpdate(status.returnvalue.summary);
          } else if (status.state === 'failed') {
            setError(status.failedReason || 'Generation failed');
            setIsGenerating(false);
            setJobId(null);
          }
        }
      } catch (err) {
        // console.error('Failed to check job status:', err);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [jobId, onSummaryUpdate]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to generate summary');
      }

      const data = await response.json();
      setJobId(data.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary');
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    onSummaryUpdate(summary);
    setIsEditing(false);
  };

  const wordCount = summary.split(/\s+/).filter((w) => w.length > 0).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Zusammenfassung</h3>
        <div className="flex items-center gap-2">
          {summary && (
            <span
              className={`text-sm ${
                wordCount >= 80 && wordCount <= 120
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-orange-600 dark:text-orange-400'
              }`}
            >
              {wordCount} Wörter
            </span>
          )}
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
              'Generieren'
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Zusammenfassung eingeben..."
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Speichern
            </button>
            <button
              onClick={() => {
                setSummary(post.summary || '');
                setIsEditing(false);
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Abbrechen
            </button>
          </div>
        </div>
      ) : (
        <div
          className="prose prose-sm max-w-none dark:prose-invert cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-3 rounded"
          onClick={() => setIsEditing(true)}
        >
          {summary ? (
            <p className="text-gray-700 dark:text-gray-300">{summary}</p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">
              Noch keine Zusammenfassung vorhanden. Klicken Sie auf "Generieren" oder hier zum
              manuellen Eingeben.
            </p>
          )}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        <p>
          Die AI-Zusammenfassung sollte 80-120 Wörter umfassen und die Hauptpunkte des Artikels
          neutral wiedergeben.
        </p>
      </div>
    </div>
  );
}
