'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SubscribeForm() {
  const [email, setEmail] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!privacyAccepted) {
      setStatus('error');
      setMessage('Bitte stimmen Sie den Datenschutzbestimmungen zu.');
      return;
    }
    
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, privacyAccepted }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Subscription failed');
      }

      setStatus('success');
      setMessage('Vielen Dank! Bitte prüfen Sie Ihre E-Mails für die Bestätigung.');
      setEmail('');
      setPrivacyAccepted(false);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten');
    }
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Ihre E-Mail-Adresse"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={status === 'loading'}
            className="flex-1"
          />
          <Button type="submit" disabled={status === 'loading' || !privacyAccepted} variant="primary">
            {status === 'loading' ? 'Wird gesendet...' : 'Abonnieren'}
          </Button>
        </div>
        {message && (
          <p className={`text-sm ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}
        
        {/* Privacy Checkbox */}
        <div className="flex items-start">
          <input
            type="checkbox"
            id="privacy-subscribe"
            checked={privacyAccepted}
            onChange={(e) => setPrivacyAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            disabled={status === 'loading' || status === 'success'}
          />
          <label htmlFor="privacy-subscribe" className="ml-2 text-xs text-gray-600 dark:text-gray-400">
            Ich stimme den{' '}
            <a href="/datenschutz" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline">
              Datenschutzbestimmungen
            </a>{' '}
            zu und möchte den Newsletter erhalten. *
          </label>
        </div>
      </form>
      
      <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
        3x pro Woche die neuesten KI-News. Jederzeit abbestellbar.
      </p>
    </div>
  );
}
