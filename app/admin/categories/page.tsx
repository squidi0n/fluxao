'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Edit2, Plus, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
  slug: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  _count: {
    posts: number;
  };
}

interface CategoryFormData {
  name: string;
  slug: string;
  order: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({ name: '', slug: '', order: 0 });
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Kategorien konnten nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      slug: category.slug,
      order: category.order,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({ name: '', slug: '', order: 0 });
  };

  const saveCategory = async (categoryId?: string) => {
    if (!formData.name || !formData.slug) {
      toast({
        title: 'Fehler',
        description: 'Name und Slug sind erforderlich.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const method = categoryId ? 'PUT' : 'POST';
      const url = categoryId ? `/api/admin/categories/${categoryId}` : '/api/admin/categories';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Erfolg',
          description: `Kategorie ${categoryId ? 'aktualisiert' : 'erstellt'}.`,
        });
        await fetchCategories();
        cancelEdit();
      } else {
        const error = await response.json();
        toast({
          title: 'Fehler',
          description: error.message || 'Ein Fehler ist aufgetreten.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Ein Netzwerkfehler ist aufgetreten.',
        variant: 'destructive',
      });
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Kategorie löschen möchten?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Erfolg',
          description: 'Kategorie gelöscht.',
        });
        await fetchCategories();
      } else {
        const error = await response.json();
        toast({
          title: 'Fehler',
          description: error.message || 'Kategorie konnte nicht gelöscht werden.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Ein Netzwerkfehler ist aufgetreten.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Kategorien verwalten</h1>
        <Button onClick={() => setIsCreating(true)} disabled={isCreating || editingId}>
          <Plus className="h-4 w-4 mr-2" />
          Neue Kategorie
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Neue Kategorie erstellen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="z.B. Business & Finance"
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="z.B. business-finance"
              />
            </div>
            <div>
              <Label htmlFor="order">Reihenfolge</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                placeholder="0"
                min="0"
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => saveCategory()}>
                <Save className="h-4 w-4 mr-2" />
                Speichern
              </Button>
              <Button variant="outline" onClick={cancelEdit}>
                <X className="h-4 w-4 mr-2" />
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardContent className="pt-6">
              {editingId === category.id ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`name-${category.id}`}>Name</Label>
                    <Input
                      id={`name-${category.id}`}
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`slug-${category.id}`}>Slug</Label>
                    <Input
                      id={`slug-${category.id}`}
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`order-${category.id}`}>Reihenfolge</Label>
                    <Input
                      id={`order-${category.id}`}
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={() => saveCategory(category.id)}>
                      <Save className="h-4 w-4 mr-2" />
                      Speichern
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEdit}>
                      <X className="h-4 w-4 mr-2" />
                      Abbrechen
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Slug: <code className="bg-muted px-1 rounded">{category.slug}</code>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Reihenfolge: {category.order}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {category._count.posts} Post{category._count.posts !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Erstellt: {new Date(category.createdAt).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(category)}
                      disabled={editingId !== null || isCreating}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteCategory(category.id)}
                      disabled={category._count.posts > 0 || editingId !== null || isCreating}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Keine Kategorien gefunden.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}