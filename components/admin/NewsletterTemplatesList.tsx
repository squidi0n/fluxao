'use client';

import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  Star,
  StarOff,
  Mail,
  FileText,
  Calendar,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { toast } from '@/hooks/use-toast';

interface Template {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    campaigns: number;
  };
}

export default function NewsletterTemplatesList() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { value: 'all', label: 'Alle Templates' },
    { value: 'welcome', label: 'Willkommen' },
    { value: 'announcement', label: 'Ankündigung' },
    { value: 'weekly', label: 'Wöchentlich' },
    { value: 'promotional', label: 'Werbung' },
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/newsletter/templates');
      if (!res.ok) throw new Error('Failed to fetch templates');
      const data = await res.json();
      setTemplates(data);
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Templates konnten nicht geladen werden',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Möchtest du dieses Template wirklich löschen?')) return;

    try {
      const res = await fetch(`/api/admin/newsletter/templates/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete template');

      toast({
        title: 'Erfolg',
        description: 'Template wurde gelöscht',
      });
      fetchTemplates();
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Template konnte nicht gelöscht werden',
        variant: 'destructive',
      });
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/newsletter/templates/${id}/duplicate`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to duplicate template');

      toast({
        title: 'Erfolg',
        description: 'Template wurde dupliziert',
      });
      fetchTemplates();
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Template konnte nicht dupliziert werden',
        variant: 'destructive',
      });
    }
  };

  const handleSetDefault = async (id: string, category: string) => {
    try {
      const res = await fetch(`/api/admin/newsletter/templates/${id}/default`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      });
      if (!res.ok) throw new Error('Failed to set default');

      toast({
        title: 'Erfolg',
        description: 'Standard-Template wurde gesetzt',
      });
      fetchTemplates();
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Standard-Template konnte nicht gesetzt werden',
        variant: 'destructive',
      });
    }
  };

  const filteredTemplates = templates.filter(
    (template) => selectedCategory === 'all' || template.category === selectedCategory,
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === cat.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => router.push('/admin/newsletter/templates/new')}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Neues Template
        </button>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Keine Templates gefunden
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Erstelle dein erstes Newsletter-Template
          </p>
          <button
            onClick={() => router.push('/admin/newsletter/templates/new')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Template erstellen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Template Preview */}
              <div className="h-48 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 p-4 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Mail className="w-24 h-24 text-white/20" />
                </div>
                {template.isDefault && (
                  <div className="absolute top-4 right-4">
                    <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500 text-white text-xs font-medium rounded">
                      <Star className="w-3 h-3" />
                      Standard
                    </div>
                  </div>
                )}
                <div className="relative z-10">
                  <div className="text-purple-900 dark:text-purple-100 font-semibold">
                    {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
                  </div>
                </div>
              </div>

              {/* Template Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {template.name}
                </h3>
                {template.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {template.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(template.createdAt).toLocaleDateString('de-DE')}
                  </div>
                  {template._count && (
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {template._count.campaigns} Kampagnen
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/admin/newsletter/templates/${template.id}`)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">Anzeigen</span>
                  </button>

                  <button
                    onClick={() => router.push(`/admin/newsletter/templates/${template.id}/edit`)}
                    className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="Bearbeiten"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDuplicate(template.id)}
                    className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="Duplizieren"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleSetDefault(template.id, template.category)}
                    className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title={template.isDefault ? 'Als Standard entfernen' : 'Als Standard setzen'}
                  >
                    {template.isDefault ? (
                      <StarOff className="w-4 h-4" />
                    ) : (
                      <Star className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                    title="Löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
