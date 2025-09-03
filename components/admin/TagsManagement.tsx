'use client';

import { X, Plus, Upload } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Tag {
  id: string;
  name: string;
  slug: string;
  _count: {
    posts: number;
  };
}

export default function TagsManagement() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkTags, setBulkTags] = useState('');

  // Fetch tags
  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const res = await fetch('/api/admin/tags');
      if (res.ok) {
        const data = await res.json();
        setTags(data);
      }
    } catch (error) {
      // console.error('Error fetching tags:', error);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName }),
      });

      if (res.ok) {
        const newTag = await res.json();
        setTags([...tags, newTag]);
        setNewTagName('');
        alert('Tag erfolgreich erstellt!');
      } else {
        const data = await res.json();
        setError(data.detail || 'Fehler beim Erstellen des Tags');
      }
    } catch (error) {
      setError('Fehler beim Erstellen des Tags');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Möchten Sie diesen Tag wirklich löschen?')) return;

    try {
      const res = await fetch(`/api/admin/tags/${tagId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setTags(tags.filter((t) => t.id !== tagId));
        alert('Tag erfolgreich gelöscht!');
      } else {
        alert('Fehler beim Löschen des Tags');
      }
    } catch (error) {
      alert('Fehler beim Löschen des Tags');
    }
  };

  const handleBulkImport = async () => {
    if (!bulkTags.trim()) {
      alert('Bitte geben Sie Tags ein');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/tags/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: bulkTags }),
      });

      if (res.ok) {
        const result = await res.json();

        // Zeige Ergebnis
        let message = `Bulk-Import abgeschlossen!\n\n`;
        message += `✅ Erstellt: ${result.created} Tags\n`;
        message += `⏭️ Übersprungen (existieren bereits): ${result.skipped} Tags\n`;

        if (result.errors > 0) {
          message += `❌ Fehler: ${result.errors}\n`;
          message += `\nDetails:\n${result.details.errors.join('\n')}`;
        }

        alert(message);

        // Aktualisiere Tag-Liste
        fetchTags();
        setBulkTags('');
        setShowBulkImport(false);
      } else {
        const data = await res.json();
        setError(data.error || 'Fehler beim Bulk-Import');
      }
    } catch (error) {
      setError('Fehler beim Bulk-Import');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tags verwalten</h1>
        <button
          onClick={() => setShowBulkImport(!showBulkImport)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Bulk-Import
        </button>
      </div>

      {/* Bulk Import Section */}
      {showBulkImport && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              Bulk-Import von Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
                  Tags eingeben (getrennt durch Komma, Semikolon, Leerzeichen oder neue Zeile):
                </label>
                <textarea
                  value={bulkTags}
                  onChange={(e) => setBulkTags(e.target.value)}
                  placeholder="z.B.: #AI, #Technologie, #Innovation&#10;oder: KI; Machine Learning; Deep Learning&#10;oder: React Vue Angular"
                  className="w-full h-32 px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tipp: # wird automatisch entfernt. Duplikate werden ignoriert.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkImport}
                  disabled={loading || !bulkTags.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Importiere...' : 'Tags importieren'}
                </button>
                <button
                  onClick={() => {
                    setShowBulkImport(false);
                    setBulkTags('');
                  }}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Tag Form */}
      <Card>
        <CardHeader>
          <CardTitle>Neuen Tag erstellen</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateTag} className="flex gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Tag Name (z.B. ChatGPT, Blockchain, etc.)"
              className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !newTagName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {loading ? 'Erstelle...' : 'Tag erstellen'}
            </button>
          </form>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      {/* Tags List */}
      <Card>
        <CardHeader>
          <CardTitle>Alle Tags ({tags.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <p className="text-gray-500">
              Noch keine Tags vorhanden. Erstellen Sie den ersten Tag oben!
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="group inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="text-sm font-medium">#{tag.name}</span>
                  <span className="text-xs text-gray-500">({tag._count.posts})</span>
                  <button
                    onClick={() => handleDeleteTag(tag.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                    title="Tag löschen"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Popular Tags */}
      {tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Beliebteste Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tags
                .sort((a, b) => b._count.posts - a._count.posts)
                .slice(0, 10)
                .map((tag) => (
                  <div key={tag.id} className="flex justify-between items-center">
                    <span className="font-medium">#{tag.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">{tag._count.posts} Artikel</span>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min((tag._count.posts / Math.max(...tags.map((t) => t._count.posts))) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
