'use client';

import { ArrowLeft, Send, Eye, Save, Users, Mail } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { sanitizeHtml } from '@/lib/sanitize';

// Dynamically import TipTap to avoid SSR issues
const TipTapEditor = dynamic(() => import('@/components/editor/TipTapEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
  ),
});

export default function CreateNewsletterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  const [formData, setFormData] = useState({
    subject: '',
    preheader: '',
    content: '',
    sendNow: false,
  });

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/newsletter/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'draft',
        }),
      });

      if (!response.ok) throw new Error('Failed to save draft');

      alert('Newsletter-Entwurf gespeichert!');
      router.push('/admin/newsletter');
    } catch (error) {
      // console.error('Error saving draft:', error);
      alert('Fehler beim Speichern des Entwurfs');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendTest = async () => {
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
      // console.error('Error sending test:', error);
      alert('Fehler beim Senden der Test-Email');
    }
  };

  const handleSendNewsletter = async () => {
    if (!confirm('Newsletter wirklich an alle Abonnenten senden?')) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to send newsletter');

      const result = await response.json();
      alert(`Newsletter wird an ${result.recipientCount} Abonnenten gesendet!`);
      router.push('/admin/newsletter/jobs');
    } catch (error) {
      // console.error('Error sending newsletter:', error);
      alert('Fehler beim Senden des Newsletters');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/newsletter"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Newsletter erstellen</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>{showPreview ? 'Editor' : 'Vorschau'}</span>
          </button>
          <button
            onClick={handleSaveDraft}
            disabled={isSubmitting || !formData.subject || !formData.content}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Als Entwurf speichern</span>
          </button>
          <button
            onClick={handleSendNewsletter}
            disabled={isSubmitting || !formData.subject || !formData.content}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Senden...' : 'Newsletter senden'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subject */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Betreff *
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Newsletter-Betreff eingeben..."
              required
            />
          </div>

          {/* Preheader */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preheader Text
            </label>
            <input
              type="text"
              value={formData.preheader}
              onChange={(e) => setFormData({ ...formData, preheader: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Kurze Vorschau für Email-Clients..."
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Wird in der Email-Vorschau angezeigt
            </p>
          </div>

          {/* Content Editor */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Newsletter Inhalt *
            </label>
            {showPreview ? (
              <div className="prose prose-lg max-w-none dark:prose-invert min-h-[400px] p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(formData.content) }} />
              </div>
            ) : (
              <TipTapEditor
                content={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                placeholder="Newsletter-Inhalt schreiben..."
              />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statistics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Statistiken
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Abonnenten</span>
                </div>
                <span className="text-sm font-semibold">0</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Verifiziert</span>
                </div>
                <span className="text-sm font-semibold">0</span>
              </div>
            </div>
          </div>

          {/* Test Email */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Test-Versand
            </h3>
            <div className="space-y-3">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                placeholder="ihre.email@example.com"
              />
              <button
                onClick={handleSendTest}
                disabled={!testEmail || !formData.subject || !formData.content}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Test-Email senden
              </button>
            </div>
          </div>

          {/* Templates */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Vorlagen</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
                📰 Wöchentlicher Newsletter
              </button>
              <button className="w-full text-left px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
                🎉 Ankündigung
              </button>
              <button className="w-full text-left px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
                💡 Tech-Update
              </button>
            </div>
          </div>

          {/* Recent Posts */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Neueste Posts
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Klicken um Link einzufügen</p>
            <div className="mt-3 space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                Keine Artikel vorhanden
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
