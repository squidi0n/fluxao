'use client';

import { useState, useEffect } from 'react';
import { Mail, Eye, Send, Copy, Edit, Trash2 } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  subject: string;
  description: string;
  preview: string;
}

const predefinedTemplates: Template[] = [
  {
    id: 'weekly-ai',
    name: '🤖 Weekly AI Roundup',
    subject: 'KI der Woche: Die 5 wichtigsten AI-News',
    description: 'Automatisch gefüllt mit den neuesten AI/Tech-Artikeln der letzten Woche',
    preview: `
      <div style="max-width: 600px; font-family: Arial, sans-serif;">
        <!-- HEADER -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
          <h1 style="color: white; font-size: 28px; margin: 0;">FLUXAO</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 12px; letter-spacing: 2px;">MENSCH · MASCHINE · TECHNOLOGIE</p>
        </div>
        
        <!-- BODY -->
        <div style="padding: 30px 20px; background: white;">
          <h2 style="color: #1e293b; margin: 0 0 20px 0;">🤖 KI der Woche</h2>
          <p>Hallo {{name}},</p>
          <p>hier sind die 5 wichtigsten AI-Entwicklungen:</p>
          
          <!-- AUTO-FILLED POST EXAMPLE -->
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; margin: 20px 0; overflow: hidden;">
            <img src="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=200&fit=crop" style="width: 100%; height: 150px; object-fit: cover;" />
            <div style="padding: 20px;">
              <span style="background: #667eea; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px;">KI & TECH</span>
              <h3 style="margin: 15px 0 10px 0; color: #1e293b;">GPT-5 Revolution</h3>
              <p style="color: #64748b; margin: 0 0 15px 0;">Ein bahnbrechender Durchbruch...</p>
              <a href="#" style="background: #667eea; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">Weiterlesen →</a>
            </div>
          </div>
        </div>
        
        <!-- FOOTER -->
        <div style="background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b;">
          <p><strong>FluxAO</strong> • Musterstraße 123, 12345 Berlin</p>
          <p><a href="#" style="color: #667eea;">Abmelden</a> | <a href="#" style="color: #667eea;">Datenschutz</a></p>
        </div>
      </div>
    `
  },
  {
    id: 'breaking-news',
    name: '🚨 Breaking Tech News',
    subject: 'BREAKING: {{headline}}',
    description: 'Eilmeldung für wichtige Tech-News',
    preview: `
      <div style="max-width: 600px; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 20px; text-align: center;">
          <div style="background: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 15px; display: inline-block; margin-bottom: 10px;">
            <span style="color: white; font-size: 11px; font-weight: bold;">🚨 BREAKING</span>
          </div>
          <h1 style="color: white; font-size: 24px; margin: 0;">FLUXAO</h1>
        </div>
        <div style="padding: 25px 20px; background: white;">
          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0;">
            <h2 style="color: #dc2626; margin: 0; font-size: 18px;">OpenAI kündigt GPT-5 an</h2>
          </div>
          <p>Das musst du sofort wissen...</p>
        </div>
      </div>
    `
  },
  {
    id: 'monthly-digest', 
    name: '📊 Monthly Tech Digest',
    subject: '{{month}} Rückblick: Das war wichtig',
    description: 'Monatlicher Überblick mit Top-Artikeln und Trends',
    preview: `
      <div style="max-width: 600px; font-family: Arial, sans-serif;">
        <div style="background: #0f172a; padding: 25px 20px; text-align: center;">
          <h1 style="color: white; font-size: 24px; margin: 0 0 10px 0;">FLUXAO</h1>
          <span style="background: rgba(255,255,255,0.1); color: white; padding: 8px 15px; border-radius: 20px; font-size: 11px;">📊 MONTHLY DIGEST</span>
        </div>
        <div style="padding: 25px 20px; background: white;">
          <h2 style="margin: 0 0 15px 0;">August 2024 im Überblick</h2>
          <p>Die wichtigsten Tech-Entwicklungen des Monats...</p>
        </div>
      </div>
    `
  }
];

export default function NewsletterTemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const createNewsletterFromTemplate = async (templateId: string) => {
    setLoading(true);
    try {
      alert(`Newsletter-Vorlage "${templateId}" wird vorbereitet...`);
      // TODO: Implement auto-fill API
      setTimeout(() => {
        alert('Demo: Newsletter mit aktuellen Posts erstellt! (API kommt noch...)');
        setLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📧 Click & Send Newsletter</h1>
        <p className="text-gray-600 dark:text-gray-400">Wähle eine Vorlage und wir füllen sie automatisch mit deinen neuesten Posts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {predefinedTemplates.map((template) => (
          <div key={template.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Template Preview */}
            <div className="h-64 overflow-hidden bg-gray-50 dark:bg-gray-900 relative">
              <div 
                dangerouslySetInnerHTML={{ __html: template.preview }}
                className="transform scale-50 origin-top-left w-[200%] h-[200%]"
              />
              <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                Preview
              </div>
            </div>
            
            {/* Template Info */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {template.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                <strong>Betreff:</strong> {template.subject}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {template.description}
              </p>
              
              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => createNewsletterFromTemplate(template.id)}
                  disabled={loading}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold transition-colors ${
                    loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-700'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Auto-Fill läuft...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      🚀 Auto-Fill & Erstellen
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setSelectedTemplate(template.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Vollbild-Vorschau
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
        <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">⚡ Quick Actions</h3>
        <p className="text-purple-700 dark:text-purple-300 mb-4">Schnelle Newsletter-Erstellung für eilige Nachrichten</p>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            <Mail className="w-4 h-4" />
            Weekly Newsletter jetzt
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800 transition-colors">
            <Send className="w-4 h-4" />
            Breaking News senden
          </button>
        </div>
      </div>

      {/* Fullscreen Preview Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedTemplate(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Vollbild-Vorschau: {predefinedTemplates.find(t => t.id === selectedTemplate)?.name}
              </h3>
              <button 
                onClick={() => setSelectedTemplate(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
              >
                ✕
              </button>
            </div>
            <div 
              className="p-6"
              dangerouslySetInnerHTML={{ 
                __html: predefinedTemplates.find(t => t.id === selectedTemplate)?.preview || '' 
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
