'use client';

import { X, Plus, Upload } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySlug, setNewCategorySlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      // console.error('Error fetching categories:', error);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[äöüß]/g, (char) => {
        const replacements: { [key: string]: string } = {
          'ä': 'ae',
          'ö': 'oe', 
          'ü': 'ue',
          'ß': 'ss'
        };
        return replacements[char] || char;
      })
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (value: string) => {
    setNewCategoryName(value);
    setNewCategorySlug(generateSlug(value));
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !newCategorySlug.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newCategoryName,
          slug: newCategorySlug 
        }),
      });

      if (res.ok) {
        const newCategory = await res.json();
        setCategories([...categories, newCategory]);
        setNewCategoryName('');
        setNewCategorySlug('');
        alert('Kategorie erfolgreich erstellt!');
      } else {
        const data = await res.json();
        setError(data.detail || 'Fehler beim Erstellen der Kategorie');
      }
    } catch (error) {
      setError('Fehler beim Erstellen der Kategorie');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Möchten Sie diese Kategorie wirklich löschen?')) return;

    try {
      const res = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setCategories(categories.filter((c) => c.id !== categoryId));
        alert('Kategorie erfolgreich gelöscht!');
      } else {
        alert('Fehler beim Löschen der Kategorie');
      }
    } catch (error) {
      alert('Fehler beim Löschen der Kategorie');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Kategorien verwalten</h1>
      </div>

      {/* Create Category Form */}
      <Card>
        <CardHeader>
          <CardTitle>Neue Kategorie erstellen</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategorie Name
              </label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="z.B. KI & Tech, Lifestyle, etc."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL Slug
              </label>
              <input
                type="text"
                value={newCategorySlug}
                onChange={(e) => setNewCategorySlug(e.target.value)}
                placeholder="ki-tech, lifestyle, etc."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !newCategoryName.trim() || !newCategorySlug.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {loading ? 'Erstelle...' : 'Kategorie erstellen'}
            </button>
          </form>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>Alle Kategorien ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-gray-500">
              Noch keine Kategorien vorhanden. Erstellen Sie die erste Kategorie oben!
            </p>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <span className="font-medium text-gray-900">{category.name}</span>
                    <span className="text-sm text-gray-500 ml-2">({category.slug})</span>
                    {category.description && (
                      <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="text-red-500 hover:text-red-700 p-2"
                    title="Kategorie löschen"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}