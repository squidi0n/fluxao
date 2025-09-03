'use client';

import { Save, Eye, Code, Palette, ChevronLeft, Copy, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { toast } from '@/hooks/use-toast';

interface Template {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  htmlContent: string;
  jsonContent?: any;
  isDefault: boolean;
}

interface NewsletterTemplateEditorProps {
  template?: Template;
}

export default function NewsletterTemplateEditor({ template }: NewsletterTemplateEditorProps) {
  const router = useRouter();
  const isEdit = !!template;
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'visual' | 'code'>('visual');
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState<Template>({
    name: template?.name || '',
    slug: template?.slug || '',
    description: template?.description || '',
    category: template?.category || 'announcement',
    htmlContent: template?.htmlContent || getDefaultTemplate('announcement'),
    jsonContent: template?.jsonContent || null,
    isDefault: template?.isDefault || false,
  });

  const categories = [
    { value: 'welcome', label: 'Willkommen', icon: '👋' },
    { value: 'announcement', label: 'Ankündigung', icon: '📢' },
    { value: 'weekly', label: 'Wöchentlich', icon: '📅' },
    { value: 'promotional', label: 'Werbung', icon: '🎁' },
  ];

  function getDefaultTemplate(category: string): string {
    const templates: Record<string, string> = {
      welcome: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Willkommen bei FluxAO</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 32px;">Willkommen bei FluxAO!</h1>
      <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">Schön, dass du dabei bist</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 20px;">
      <h2 style="color: #333; margin-bottom: 20px;">Hallo {{name}},</h2>
      <p style="color: #666; line-height: 1.6;">
        Willkommen in unserer Community! Wir freuen uns sehr, dich als neues Mitglied begrüßen zu dürfen.
      </p>
      <p style="color: #666; line-height: 1.6;">
        Bei FluxAO findest du die neuesten Artikel zu Technologie, Design und Innovation.
      </p>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="{{siteUrl}}" style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Entdecke FluxAO
        </a>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background: #f8f8f8; padding: 20px; text-align: center; color: #999; font-size: 14px;">
      <p style="margin: 0;">© 2025 FluxAO. Alle Rechte vorbehalten.</p>
      <p style="margin: 10px 0 0 0;">
        <a href="{{unsubscribeUrl}}" style="color: #999;">Newsletter abbestellen</a>
      </p>
    </div>
  </div>
</body>
</html>`,

      announcement: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white;">
    <!-- Header -->
    <div style="background: #1a1a1a; padding: 30px 20px; text-align: center;">
      <img src="{{logoUrl}}" alt="FluxAO" style="height: 40px;">
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 20px;">
      {{content}}
    </div>
    
    <!-- Footer -->
    <div style="background: #f8f8f8; padding: 20px; text-align: center; color: #999; font-size: 14px;">
      <p style="margin: 0;">FluxAO Newsletter</p>
      <p style="margin: 10px 0 0 0;">
        <a href="{{unsubscribeUrl}}" style="color: #999;">Abbestellen</a> | 
        <a href="{{preferencesUrl}}" style="color: #999;">Einstellungen</a>
      </p>
    </div>
  </div>
</body>
</html>`,

      weekly: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wöchentliche Highlights</title>
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, serif; background-color: #fafafa;">
  <div style="max-width: 600px; margin: 0 auto; background: white;">
    <!-- Header -->
    <div style="border-bottom: 3px solid #667eea; padding: 30px 20px;">
      <h1 style="margin: 0; color: #333; font-size: 28px;">📰 Wöchentliche Highlights</h1>
      <p style="color: #666; margin-top: 10px;">Ausgabe {{issueNumber}} - {{date}}</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 20px;">
      <h2 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Diese Woche bei FluxAO</h2>
      
      {{articles}}
      
      <div style="margin-top: 40px; padding: 20px; background: #f8f8f8; border-left: 4px solid #667eea;">
        <h3 style="margin: 0 0 10px 0; color: #333;">💡 Tipp der Woche</h3>
        <p style="color: #666; margin: 0;">{{weeklyTip}}</p>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background: #1a1a1a; color: #fff; padding: 30px 20px; text-align: center;">
      <p style="margin: 0 0 10px 0;">Folge uns auf Social Media</p>
      <div style="margin: 20px 0;">
        {{socialLinks}}
      </div>
      <p style="margin: 20px 0 0 0; font-size: 12px; color: #999;">
        <a href="{{unsubscribeUrl}}" style="color: #999;">Newsletter abbestellen</a>
      </p>
    </div>
  </div>
</body>
</html>`,

      promotional: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
  <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
    <!-- Banner -->
    <div style="background: #fff; padding: 40px 20px; text-align: center;">
      <div style="display: inline-block; background: #ff4757; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 20px;">
        SPECIAL OFFER
      </div>
      <h1 style="margin: 0; color: #333; font-size: 36px;">{{offerTitle}}</h1>
      <p style="color: #666; font-size: 18px; margin-top: 10px;">{{offerSubtitle}}</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 20px;">
      {{content}}
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="{{ctaUrl}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
          {{ctaText}}
        </a>
      </div>
      
      <p style="text-align: center; color: #999; font-size: 14px; margin-top: 20px;">
        {{disclaimer}}
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background: #f8f8f8; padding: 20px; text-align: center; color: #999; font-size: 12px;">
      <p style="margin: 0;">Diese E-Mail wurde gesendet an {{email}}</p>
      <p style="margin: 10px 0 0 0;">
        <a href="{{unsubscribeUrl}}" style="color: #999;">Abbestellen</a>
      </p>
    </div>
  </div>
</body>
</html>`,
    };

    return templates[category] || templates.announcement;
  }

  useEffect(() => {
    if (formData.category && !isEdit) {
      setFormData((prev) => ({
        ...prev,
        htmlContent: getDefaultTemplate(formData.category),
      }));
    }
  }, [formData.category, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const url = isEdit
        ? `/api/admin/newsletter/templates/${template.id}`
        : '/api/admin/newsletter/templates';

      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save template');
      }

      toast({
        title: 'Erfolg',
        description: `Template wurde ${isEdit ? 'aktualisiert' : 'erstellt'}`,
      });

      router.push('/admin/newsletter/templates');
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message || 'Template konnte nicht gespeichert werden',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const generateSlug = () => {
    const slug = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    setFormData((prev) => ({ ...prev, slug }));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formData.htmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Kopiert!',
      description: 'HTML-Code wurde in die Zwischenablage kopiert',
    });
  };

  const insertPlaceholder = (placeholder: string) => {
    const textarea = document.getElementById('html-editor') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);

      setFormData((prev) => ({
        ...prev,
        htmlContent: before + placeholder + after,
      }));

      // Restore cursor position
      setTimeout(() => {
        textarea.selectionStart = start + placeholder.length;
        textarea.selectionEnd = start + placeholder.length;
        textarea.focus();
      }, 0);
    }
  };

  const placeholders = [
    { label: 'Name', value: '{{name}}' },
    { label: 'E-Mail', value: '{{email}}' },
    { label: 'Betreff', value: '{{subject}}' },
    { label: 'Inhalt', value: '{{content}}' },
    { label: 'Website URL', value: '{{siteUrl}}' },
    { label: 'Logo URL', value: '{{logoUrl}}' },
    { label: 'Abmelde-Link', value: '{{unsubscribeUrl}}' },
    { label: 'Einstellungen', value: '{{preferencesUrl}}' },
    { label: 'Datum', value: '{{date}}' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
            Zurück
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <Eye className="w-5 h-5" />
              {showPreview ? 'Editor' : 'Vorschau'}
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Speichern...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {isEdit ? 'Aktualisieren' : 'Speichern'}
                </>
              )}
            </button>
          </div>
        </div>

        <div className={`grid ${showPreview ? 'grid-cols-1' : 'lg:grid-cols-3'} gap-6`}>
          {/* Settings Sidebar */}
          {!showPreview && (
            <div className="lg:col-span-1 space-y-6">
              {/* Basic Info */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Grundeinstellungen</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Slug
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      pattern="[a-z0-9-]+"
                      required
                    />
                    <button
                      type="button"
                      onClick={generateSlug}
                      className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                      title="Aus Name generieren"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Beschreibung
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kategorie
                  </label>
                  <div className="space-y-2">
                    {categories.map((cat) => (
                      <label
                        key={cat.value}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          formData.category === cat.value
                            ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="category"
                          value={cat.value}
                          checked={formData.category === cat.value}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, category: e.target.value }))
                          }
                          className="sr-only"
                        />
                        <span className="text-2xl">{cat.icon}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {cat.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, isDefault: e.target.checked }))
                      }
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Als Standard für diese Kategorie setzen
                    </span>
                  </label>
                </div>
              </div>

              {/* Placeholders */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Platzhalter</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Klicke auf einen Platzhalter, um ihn einzufügen
                </p>
                <div className="flex flex-wrap gap-2">
                  {placeholders.map((ph) => (
                    <button
                      key={ph.value}
                      type="button"
                      onClick={() => insertPlaceholder(ph.value)}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs font-mono rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                      title={ph.label}
                    >
                      {ph.value}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Editor/Preview */}
          <div className={`${showPreview ? 'col-span-1' : 'lg:col-span-2'}`}>
            {showPreview ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
                  <h3 className="font-semibold text-gray-900 dark:text-white">E-Mail Vorschau</h3>
                </div>
                <div className="p-4 bg-gray-100 dark:bg-gray-900">
                  <div className="mx-auto" style={{ maxWidth: '600px' }}>
                    <iframe
                      srcDoc={formData.htmlContent}
                      className="w-full bg-white rounded"
                      style={{ minHeight: '600px' }}
                      title="Email Preview"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <div className="flex">
                    <button
                      type="button"
                      onClick={() => setActiveTab('visual')}
                      className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                        activeTab === 'visual'
                          ? 'text-purple-600 border-b-2 border-purple-600'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <Palette className="w-4 h-4" />
                      Visuell
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('code')}
                      className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                        activeTab === 'code'
                          ? 'text-purple-600 border-b-2 border-purple-600'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <Code className="w-4 h-4" />
                      HTML Code
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {activeTab === 'visual' ? (
                    <div className="space-y-4">
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          Der visuelle Editor ist noch in Entwicklung. Bitte nutze den HTML-Code
                          Editor.
                        </p>
                      </div>
                      <iframe
                        srcDoc={formData.htmlContent}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg"
                        style={{ minHeight: '500px' }}
                        title="Visual Editor"
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Bearbeite den HTML-Code direkt
                        </p>
                        <button
                          type="button"
                          onClick={copyToClipboard}
                          className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          {copied ? (
                            <>
                              <Check className="w-4 h-4" />
                              Kopiert!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Kopieren
                            </>
                          )}
                        </button>
                      </div>
                      <textarea
                        id="html-editor"
                        value={formData.htmlContent}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, htmlContent: e.target.value }))
                        }
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm"
                        style={{ minHeight: '500px' }}
                        spellCheck={false}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
