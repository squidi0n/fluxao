'use client';

import { useState } from 'react';
import { Mail, CheckCircle, Clock, TrendingUp, Users, Calendar, ArrowRight, Star, Zap } from 'lucide-react';

export default function NewsletterPage() {
  const [email, setEmail] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [frequency, setFrequency] = useState('weekly');

  const availableInterests = [
    { id: 'ai-tech', label: 'KI & Tech', description: 'Neueste Entwicklungen in der Technologie' },
    { id: 'gaming', label: 'Gaming & Kultur', description: 'Gaming-Trends und kulturelle Einblicke' },
    { id: 'style', label: 'Style & Ästhetik', description: 'Design, Mode und visuelle Kultur' },
    { id: 'society', label: 'Mensch & Gesellschaft', description: 'Gesellschaftliche Themen und Trends' },
    { id: 'philosophy', label: 'Mindset & Philosophie', description: 'Philosophische Gedanken und Reflexionen' },
    { id: 'fiction', label: 'Fiction Lab', description: 'Kreative Inhalte und Science Fiction' },
  ];

  const stats = [
    { icon: Users, label: 'Abonnenten', value: '12.5K+' },
    { icon: Mail, label: 'Newsletter versandt', value: '156' },
    { icon: TrendingUp, label: 'Öffnungsrate', value: '68%' },
    { icon: Star, label: 'Zufriedenheit', value: '4.8/5' },
  ];

  const recentNewsletters = [
    {
      id: 1,
      title: 'KI-Revolution: Was 2024 bringen wird',
      description: 'Ein umfassender Blick auf die wichtigsten KI-Trends und ihre Auswirkungen auf unsere Zukunft.',
      date: '2024-03-15',
      readTime: '8 Min.',
      categories: ['KI & Tech', 'Zukunft'],
    },
    {
      id: 2,
      title: 'Gaming Culture: Zwischen Virtual Reality und Social Impact',
      description: 'Wie Gaming unsere Gesellschaft prägt und neue Formen der sozialen Interaktion schafft.',
      date: '2024-03-08',
      readTime: '6 Min.',
      categories: ['Gaming & Kultur', 'Gesellschaft'],
    },
    {
      id: 3,
      title: 'Design Philosophy: Minimalismus in der digitalen Ära',
      description: 'Warum weniger mehr ist und wie minimalistisches Design unsere digitale Erfahrung verbessert.',
      date: '2024-03-01',
      readTime: '5 Min.',
      categories: ['Style & Ästhetik', 'Design'],
    },
  ];

  const handleInterestToggle = (interestId: string) => {
    setInterests(prev => 
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && interests.length > 0) {
      setIsSubscribed(true);
    }
  };

  if (isSubscribed) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Willkommen im FluxAO Newsletter!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Danke für deine Anmeldung! Du erhältst eine Bestätigung per E-Mail und bekommst bald unseren ersten Newsletter.
          </p>
          <button
            onClick={() => setIsSubscribed(false)}
            className="px-6 py-2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
          >
            Zurück zur Newsletter-Seite
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gray-800 dark:bg-gray-200 rounded-full flex items-center justify-center mr-4">
              <Mail className="w-8 h-8 text-white dark:text-gray-900" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
              FluxAO Newsletter
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Bleib auf dem Laufenden über die neuesten Entwicklungen in Tech, Gaming, Design und Philosophie. 
            Kuratierte Inhalte direkt in dein Postfach.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
              <stat.icon className="w-8 h-8 text-gray-600 dark:text-gray-400 mx-auto mb-3" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Subscription Form */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-6">
              <Zap className="w-6 h-6 text-gray-800 dark:text-gray-200 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Newsletter abonnieren
              </h2>
            </div>

            <form onSubmit={handleSubscribe} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  E-Mail-Adresse
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="deine@email.com"
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Häufigkeit
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'daily', label: 'Täglich', desc: 'Die wichtigsten Updates jeden Tag' },
                    { value: 'weekly', label: 'Wöchentlich', desc: 'Zusammenfassung der Woche (empfohlen)' },
                    { value: 'monthly', label: 'Monatlich', desc: 'Nur die Highlights des Monats' },
                  ].map((option) => (
                    <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="frequency"
                        value={option.value}
                        checked={frequency === option.value}
                        onChange={(e) => setFrequency(e.target.value)}
                        className="mt-1"
                      />
                      <div>
                        <div className="text-gray-900 dark:text-white font-medium">{option.label}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{option.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Interests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Interessensbereiche wählen
                </label>
                <div className="space-y-3">
                  {availableInterests.map((interest) => (
                    <label
                      key={interest.id}
                      className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        interests.includes(interest.id)
                          ? 'border-gray-800 bg-gray-50 dark:border-gray-200 dark:bg-gray-700'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={interests.includes(interest.id)}
                        onChange={() => handleInterestToggle(interest.id)}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {interest.label}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {interest.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!email || interests.length === 0}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-300 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:text-gray-500 transition-colors font-medium"
              >
                <span>Newsletter abonnieren</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Du kannst dich jederzeit abmelden. Wir respektieren deine Privatsphäre.
              </p>
            </form>
          </div>

          {/* Recent Newsletters */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Aktuelle Newsletter
            </h2>
            <div className="space-y-6">
              {recentNewsletters.map((newsletter) => (
                <div
                  key={newsletter.id}
                  className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(newsletter.date).toLocaleDateString('de-DE')}
                    <span className="mx-2">•</span>
                    <Clock className="w-4 h-4 mr-1" />
                    {newsletter.readTime}
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {newsletter.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {newsletter.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {newsletter.categories.map((category, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                  
                  <button className="text-gray-800 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-400 font-medium text-sm flex items-center transition-colors">
                    Newsletter lesen
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <button className="w-full px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium">
                Alle Newsletter anzeigen
              </button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
            Was du erwarten kannst
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Kuratierte Inhalte
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Handverlesene Artikel und Insights aus der Tech- und Kulturwelt
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Exklusive Inhalte
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Newsletter-exklusive Interviews und Behind-the-Scenes Einblicke
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Community
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Werde Teil einer Community von Tech-Enthusiasten und Denkern
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}