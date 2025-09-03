'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Nachricht konnte nicht gesendet werden');
      }

      setIsSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch {
      setError(
        'Entschuldigung, es gab einen Fehler beim Senden Ihrer Nachricht. Bitte versuchen Sie es später erneut.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-12">
        <div className="mb-4 text-green-600">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-semibold mb-2">Vielen Dank für Ihre Nachricht!</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Wir werden uns so schnell wie möglich bei Ihnen melden.
        </p>
        <Button
          onClick={() => {
            setIsSubmitted(false);
            setFormData({ name: '', email: '', subject: '', message: '' });
          }}
          className="mt-4"
        >
          Neue Nachricht senden
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Name *
          </label>
          <Input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            E-Mail *
          </label>
          <Input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium mb-2">
          Betreff *
        </label>
        <Input
          type="text"
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          required
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-2">
          Nachricht *
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          value={formData.message}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus-visible:ring-primary-400"
        />
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <Button type="submit" disabled={isSubmitting} size="lg" className="w-full sm:w-auto">
        {isSubmitting ? 'Wird gesendet...' : 'Nachricht senden'}
      </Button>
    </form>
  );
}
