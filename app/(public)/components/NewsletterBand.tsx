'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';

export default function NewsletterBand() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) return;

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Vielen Dank! Bitte bestätige deine E-Mail-Adresse.');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Ein Fehler ist aufgetreten.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Ein Fehler ist aufgetreten. Bitte versuche es später erneut.');
    }
  };

  return (
    <section className="relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 opacity-90" />

      {/* Pattern Overlay */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Bleib auf dem Laufenden
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Erhalte wöchentlich die wichtigsten News zu KI, Tech und Zukunft direkt in dein
            Postfach.
          </p>

          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Deine E-Mail-Adresse"
                className="flex-1 px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                required
                disabled={status === 'loading' || status === 'success'}
              />

              <button
                type="submit"
                disabled={status === 'loading' || status === 'success'}
                className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {status === 'loading' ? (
                  <>
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>Anmelden...</span>
                  </>
                ) : status === 'success' ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Angemeldet</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Anmelden</span>
                  </>
                )}
              </button>
            </div>

            {/* Status Message */}
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
                  status === 'success' ? 'bg-green-500/20 text-white' : 'bg-red-500/20 text-white'
                }`}
              >
                {status === 'success' ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <span className="text-sm">{message}</span>
              </motion.div>
            )}
          </form>

          <p className="mt-6 text-xs text-white/60">
            Mit der Anmeldung stimmst du unseren{' '}
            <Link href="/datenschutz" className="underline hover:text-white/80">
              Datenschutzbestimmungen
            </Link>{' '}
            zu. Du kannst dich jederzeit abmelden.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// Add missing Link import
import Link from 'next/link';
