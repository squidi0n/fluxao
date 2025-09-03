'use client';

import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Eye, 
  Save, 
  Users, 
  Mail, 
  Wand2, 
  RefreshCw,
  Download,
  Settings,
  Clock,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import TipTap to avoid SSR issues
const TipTapEditor = dynamic(() => import('@/components/editor/TipTapEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
  ),
});

interface NewsletterTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  htmlContent: string;
}

interface AutofillData {
  recentPosts: Array<{
    id: string;
    title: string;
    url: string;
    excerpt: string;
    thumbnail?: string;
    category: string;
    author: string;
    readTime: number;
  }>;
  weeklyStats: {
    totalArticles: number;
    totalSubscribers: number;
    weeklyTip: string;
  };
  customSections: Array<{
    title: string;
    content: string;
    type: 'text' | 'html' | 'posts';
  }>;
}

export function NewsletterCreator() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoadingAutofill, setIsLoadingAutofill] = useState(false);
  const [templates, setTemplates] = useState<NewsletterTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [autofillData, setAutofillData] = useState<AutofillData | null>(null);
  const [stats, setStats] = useState({ subscribers: 0, verified: 0 });
  
  const [formData, setFormData] = useState({
    subject: '',
    preheader: '',
    content: '',
    templateType: 'weekly' as 'weekly' | 'welcome' | 'announcement' | 'promotional',
    customTitle: '',
    customIntro: '',
    sendNow: false,
  });

  // Load initial data
  useEffect(() => {
    loadTemplates();
    loadStats();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/admin/newsletter/templates');
      if (response.ok) {
        const templatesData = await response.json();
        setTemplates(templatesData);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/newsletter/stats');
      if (response.ok) {
        const statsData = await response.json();
        setStats({
          subscribers: statsData.total || 0,
          verified: statsData.verified || 0,
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadAutofillData = async () => {
    setIsLoadingAutofill(true);
    try {
      const response = await fetch('/api/admin/newsletter/autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType: formData.templateType,
          customTitle: formData.customTitle || undefined,
          customIntro: formData.customIntro || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAutofillData(data.data);
        
        // Update form data with generated content
        setFormData(prev => ({
          ...prev,
          subject: data.metadata.subject,
          preheader: data.metadata.preheader,
          content: data.html,
        }));
      }
    } catch (error) {
      console.error('Failed to load autofill data:', error);
      alert('Fehler beim Laden der Auto-Fill Daten');
    } finally {
      setIsLoadingAutofill(false);
    }
  };

  const applyTemplate = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    setSelectedTemplate(templateId);
    setFormData(prev => ({
      ...prev,
      content: template.htmlContent,
      templateType: template.category as any,
    }));
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/newsletter/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'draft',
          templateId: selectedTemplate || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to save draft');

      alert('Newsletter-Entwurf gespeichert!');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Fehler beim Speichern des Entwurfs');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendTest = async (testEmail: string) => {
    if (!testEmail) {
      alert('Bitte Test-Email eingeben');
      return;
    }

    try {
      const response = await fetch('/api/admin/newsletter/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          testEmail,
        }),
      });

      if (!response.ok) throw new Error('Failed to send test');

      alert(`Test-Newsletter an ${testEmail} gesendet!`);
    } catch (error) {
      console.error('Error sending test:', error);
      alert('Fehler beim Senden der Test-Email');
    }
  };

  const handleSendNewsletter = async () => {
    if (!confirm(`Newsletter wirklich an ${stats.verified} Abonnenten senden?`)) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to send newsletter');

      const result = await response.json();
      alert(`Newsletter wird an ${result.jobCount} Abonnenten gesendet!`);
    } catch (error) {
      console.error('Error sending newsletter:', error);
      alert('Fehler beim Senden des Newsletters');
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportPreview = async () => {
    try {
      const response = await fetch('/api/admin/newsletter/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: formData.content, subject: formData.subject }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `newsletter-${Date.now()}.html`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting newsletter:', error);
      alert('Fehler beim Exportieren');
    }
  };

  return (
    <div className="space-y-6">
      {/* Auto-Fill Section */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Wand2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Automatischer Newsletter
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Erstelle Newsletter automatisch mit aktuellen Artikeln und Inhalten
              </p>
            </div>
          </div>
          <button
            onClick={loadAutofillData}
            disabled={isLoadingAutofill}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoadingAutofill ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            {isLoadingAutofill ? 'Generiere...' : 'Auto-Fill aktivieren'}
          </button>
        </div>

        {/* Auto-Fill Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Template-Typ
            </label>
            <select
              value={formData.templateType}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                templateType: e.target.value as any 
              }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="weekly">Wöchentlicher Newsletter</option>
              <option value="announcement">Ankündigung</option>
              <option value="promotional">Promotion</option>
              <option value="welcome">Willkommens-Mail</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Eigener Titel (optional)
            </label>
            <input
              type="text"
              value={formData.customTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, customTitle: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
              placeholder="Newsletter-Titel..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Eigene Einleitung (optional)
            </label>
            <input
              type="text"
              value={formData.customIntro}
              onChange={(e) => setFormData(prev => ({ ...prev, customIntro: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
              placeholder="Einleitungstext..."
            />
          </div>
        </div>

        {/* Auto-Fill Preview */}
        {autofillData && (
          <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Auto-Fill Daten geladen
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {autofillData.recentPosts.length} neue Artikel
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {autofillData.weeklyStats.totalSubscribers} Abonnenten
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {autofillData.customSections?.length || 0} Extra-Sektionen
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Subject and Preheader */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Betreff *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Newsletter-Betreff eingeben..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preheader
                </label>
                <input
                  type="text"
                  value={formData.preheader}
                  onChange={(e) => setFormData(prev => ({ ...prev, preheader: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Kurze Vorschau für Email-Clients..."
                />
              </div>
            </div>
          </div>

          {/* Content Editor */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Newsletter Inhalt *
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  {showPreview ? 'Editor' : 'Vorschau'}
                </button>
                <button
                  onClick={exportPreview}
                  disabled={!formData.content}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>

            {showPreview ? (
              <div className="min-h-[400px] p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
                <iframe
                  srcDoc={formData.content}
                  className="w-full h-[600px] border-0"
                  title="Newsletter Preview"
                />
              </div>
            ) : (
              <TipTapEditor
                content={formData.content}
                onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                placeholder="Newsletter-Inhalt schreiben oder Auto-Fill verwenden..."
                className="min-h-[400px]"
              />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="space-y-3">
              <button
                onClick={handleSaveDraft}
                disabled={isSubmitting || !formData.subject || !formData.content}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                Als Entwurf speichern
              </button>
              <button
                onClick={handleSendNewsletter}
                disabled={isSubmitting || !formData.subject || !formData.content}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Sende...' : 'Newsletter senden'}
              </button>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Empfänger
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Gesamt</span>
                </div>
                <span className="text-sm font-semibold">{stats.subscribers}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Verifiziert</span>
                </div>
                <span className="text-sm font-semibold text-green-600">{stats.verified}</span>
              </div>
            </div>
          </div>

          {/* Test Email */}
          <TestEmailSection onSendTest={handleSendTest} />

          {/* Templates */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Vorlagen
            </h3>
            <div className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template.id)}
                  className={`w-full text-left px-3 py-3 rounded-lg transition-colors text-sm ${
                    selectedTemplate === template.id
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                      : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="font-medium">{template.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {template.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Test Email Component
function TestEmailSection({ onSendTest }: { onSendTest: (email: string) => void }) {
  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    setIsSending(true);
    try {
      await onSendTest(testEmail);
      setTestEmail('');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Settings className="w-4 h-4" />
        Test-Versand
      </h3>
      <div className="space-y-3">
        <input
          type="email"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
          placeholder="ihre.email@example.com"
        />
        <button
          onClick={handleSend}
          disabled={!testEmail || isSending}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          {isSending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Test-Email senden
        </button>
      </div>
    </div>
  );
}