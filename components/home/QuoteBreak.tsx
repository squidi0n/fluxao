'use client';

import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import { useState, useEffect } from 'react';

const quotes = [
  {
    text: 'Die Zukunft ist bereits hier – sie ist nur ungleich verteilt.',
    author: 'William Gibson',
    role: 'Cyberpunk-Autor',
  },
  {
    text: 'Jede hinreichend fortgeschrittene Technologie ist von Magie nicht zu unterscheiden.',
    author: 'Arthur C. Clarke',
    role: 'Science-Fiction-Autor',
  },
  {
    text: 'KI wird nicht den Menschen ersetzen, aber Menschen mit KI werden Menschen ohne KI ersetzen.',
    author: 'Karim Lakhani',
    role: 'Harvard Professor',
  },
];

export default function QuoteBreak() {
  // Use first quote to avoid hydration issues (no random on server)
  const [quote, setQuote] = useState(quotes[0]);

  // Set random quote only on client side
  useEffect(() => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-100 via-pink-50 to-blue-100" />

      {/* Floating Particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-purple-400/20 rounded-full"
            style={{
              left: `${(i * 5) % 100}%`,
              top: `${(i * 7) % 100}%`,
            }}
            animate={{
              x: [0, 30, -30, 0],
              y: [0, -30, 30, 0],
            }}
            transition={{
              duration: 10 + i * 0.5,
              repeat: Infinity,
              repeatType: 'reverse',
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <Quote className="w-12 h-12 text-purple-600 mx-auto mb-6 opacity-50" />

          <blockquote className="text-2xl md:text-3xl lg:text-4xl font-light text-gray-800 leading-relaxed mb-8">
            "{quote.text}"
          </blockquote>

          <div className="flex items-center justify-center">
            <div className="h-px w-12 bg-gradient-to-r from-transparent via-purple-600 to-transparent" />
            <cite className="mx-4 not-italic">
              <div className="font-semibold text-gray-900">{quote.author}</div>
              <div className="text-sm text-gray-600">{quote.role}</div>
            </cite>
            <div className="h-px w-12 bg-gradient-to-r from-transparent via-purple-600 to-transparent" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
