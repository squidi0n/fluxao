'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Search, 
  Bell, 
  MessageSquare, 
  Star, 
  Shield, 
  Smartphone, 
  Globe, 
  Users, 
  BookOpen,
  TrendingUp,
  Eye,
  Check,
  ArrowRight,
  Play,
  Pause,
  ChevronRight,
  Lightbulb,
  Heart,
  Share2,
  Filter,
  Bookmark
} from 'lucide-react';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  badge?: string;
  details: string[];
  preview?: string;
  interactive?: boolean;
}

const features: Feature[] = [
  {
    id: 'ai-powered',
    title: 'KI-unterstützte Inhalte',
    description: 'Intelligente Artikel-Empfehlungen basierend auf deinen Interessen',
    icon: Lightbulb,
    color: 'from-yellow-400 to-orange-500',
    badge: 'Neu',
    details: [
      'Personalisierte Inhaltsvorschläge',
      'Automatische Tag-Erkennung',
      'Smarte Kategorisierung',
      'Trending-Topics Erkennung'
    ],
    preview: 'Probiere unseren KI-Feed aus',
    interactive: true
  },
  {
    id: 'real-time',
    title: 'Echtzeit-Updates',
    description: 'Bleib immer auf dem neuesten Stand mit Live-Benachrichtigungen',
    icon: Bell,
    color: 'from-blue-400 to-purple-500',
    details: [
      'Push-Benachrichtigungen',
      'Live-Kommentar Updates',
      'Breaking News Alerts',
      'Personalisierte Benachrichtigungen'
    ],
    preview: 'Benachrichtigungen einschalten',
    interactive: true
  },
  {
    id: 'advanced-search',
    title: 'Erweiterte Suche',
    description: 'Finde genau das, was du suchst mit unserer intelligenten Suchfunktion',
    icon: Search,
    color: 'from-green-400 to-teal-500',
    details: [
      'Volltext-Suche',
      'Filter nach Kategorien',
      'Zeitraum-basierte Suche',
      'Gespeicherte Suchen'
    ],
    preview: 'Suche ausprobieren',
    interactive: true
  },
  {
    id: 'social',
    title: 'Community Features',
    description: 'Diskutiere mit der Community und teile deine Gedanken',
    icon: MessageSquare,
    color: 'from-pink-400 to-red-500',
    details: [
      'Kommentar-System',
      'Artikel bewerten',
      'Social Sharing',
      'Folge anderen Usern'
    ],
    preview: 'Community beitreten'
  },
  {
    id: 'premium',
    title: 'Premium Features',
    description: 'Erweiterte Funktionen für die ultimative Erfahrung',
    icon: Star,
    color: 'from-purple-400 to-indigo-500',
    badge: 'Premium',
    details: [
      'Werbefreie Erfahrung',
      'Exklusive Inhalte',
      'Frühzeitiger Zugang',
      'Premium-Badge'
    ],
    preview: 'Premium testen'
  },
  {
    id: 'mobile',
    title: 'Mobile-First Design',
    description: 'Optimiert für alle Geräte - Desktop, Tablet und Mobile',
    icon: Smartphone,
    color: 'from-teal-400 to-cyan-500',
    details: [
      'Responsive Design',
      'Touch-optimierte UI',
      'Offline-Modus',
      'PWA Support'
    ]
  }
];

const comparisonFeatures = [
  { name: 'Unbegrenzte Artikel', free: true, premium: true },
  { name: 'Kommentare & Community', free: true, premium: true },
  { name: 'Newsletter-Abonnement', free: true, premium: true },
  { name: 'Personalisierte Empfehlungen', free: 'Basis', premium: 'Advanced KI' },
  { name: 'Werbefrei', free: false, premium: true },
  { name: 'Exklusive Inhalte', free: false, premium: true },
  { name: 'Premium-Badge', free: false, premium: true },
  { name: 'Frühzeitiger Zugang', free: false, premium: true },
  { name: 'Priority Support', free: false, premium: true }
];

export default function PublicFeaturesPage() {
  const [activeFeature, setActiveFeature] = useState<string>('ai-powered');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const handleFeatureClick = (featureId: string) => {
    setActiveFeature(featureId);
  };

  const activeFeatureData = features.find(f => f.id === activeFeature);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-white"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur rounded-full text-sm font-medium mb-6"
            >
              <Zap className="w-4 h-4" />
              Powered by Modern Technology
            </motion.div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Features, die begeistern
            </h1>
            
            <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-3xl mx-auto">
              Entdecke die innovativen Features, die FluxAO zur besten Plattform für Tech-News und digitale Trends machen
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="#features"
                className="px-8 py-4 bg-white text-purple-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-xl"
              >
                Features entdecken
              </Link>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-2 px-6 py-4 bg-white/20 backdrop-blur text-white rounded-xl font-medium hover:bg-white/30 transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                Demo ansehen
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Features Section */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Innovative Features im Detail
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Klicke auf ein Feature, um mehr zu erfahren und es interaktiv zu erleben
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Features List */}
            <div className="lg:col-span-1 space-y-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const isActive = activeFeature === feature.id;
                
                return (
                  <motion.div
                    key={feature.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleFeatureClick(feature.id)}
                    className={`relative p-6 rounded-xl cursor-pointer transition-all ${
                      isActive 
                        ? 'bg-white dark:bg-gray-800 shadow-2xl border-2 border-purple-200 dark:border-purple-600' 
                        : 'bg-white/70 dark:bg-gray-800/70 hover:bg-white dark:hover:bg-gray-800 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${feature.color} shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {feature.title}
                          </h3>
                          {feature.badge && (
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-medium rounded-full">
                              {feature.badge}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          {feature.description}
                        </p>
                        
                        {feature.interactive && (
                          <div className="mt-3 flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                            <Zap className="w-3 h-3" />
                            Interaktiv
                          </div>
                        )}
                      </div>
                      
                      {isActive && (
                        <ChevronRight className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Feature Detail */}
            <div className="lg:col-span-2">
              {activeFeatureData && (
                <motion.div
                  key={activeFeature}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
                >
                  {/* Header */}
                  <div className={`p-8 bg-gradient-to-br ${activeFeatureData.color} text-white`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-4 bg-white/20 backdrop-blur rounded-xl">
                        <activeFeatureData.icon className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">{activeFeatureData.title}</h3>
                        <p className="text-lg opacity-90">{activeFeatureData.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                          Was du erwarten kannst:
                        </h4>
                        <ul className="space-y-3">
                          {activeFeatureData.details.map((detail, index) => (
                            <li key={index} className="flex items-center gap-3">
                              <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        {/* Interactive Demo Area */}
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                            Live Demo
                          </h4>
                          
                          {activeFeature === 'advanced-search' && (
                            <div className="space-y-4">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                  type="text"
                                  placeholder="Nach Artikeln suchen..."
                                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm">
                                  KI & Tech
                                </button>
                                <button className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                                  Design
                                </button>
                                <Filter className="w-8 h-8 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400" />
                              </div>
                            </div>
                          )}
                          
                          {activeFeature === 'social' && (
                            <div className="space-y-4">
                              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                    J
                                  </div>
                                  <span className="font-medium">John Doe</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                  Großartiger Artikel über KI! Sehr aufschlussreich.
                                </p>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <button className="flex items-center gap-1 hover:text-red-500">
                                    <Heart className="w-3 h-3" />
                                    12 Likes
                                  </button>
                                  <button className="flex items-center gap-1 hover:text-blue-500">
                                    <Share2 className="w-3 h-3" />
                                    Teilen
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {activeFeature === 'ai-powered' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                                <span className="text-sm">🤖 KI Empfehlung</span>
                                <span className="text-xs text-purple-600 dark:text-purple-400">98% Match</span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                                <span className="text-sm">📱 Tech Trend</span>
                                <span className="text-xs text-green-600 dark:text-green-400">Trending</span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                                <span className="text-sm">🎨 Design Update</span>
                                <span className="text-xs text-blue-600 dark:text-blue-400">Neu</span>
                              </div>
                            </div>
                          )}
                          
                          {activeFeature === 'real-time' && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <span className="text-sm text-blue-800 dark:text-blue-200">Neuer Kommentar</span>
                              </div>
                              <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-sm text-green-800 dark:text-green-200">Artikel veröffentlicht</span>
                              </div>
                              <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-sm text-red-800 dark:text-red-200">Breaking News</span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {activeFeatureData.preview && (
                          <button className="mt-4 w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
                            {activeFeatureData.preview}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Free vs. Premium
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Vergleiche die Features und finde das richtige Paket für dich
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-3 gap-0">
              {/* Headers */}
              <div className="p-6 border-r border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Features</h3>
              </div>
              <div className="p-6 border-r border-gray-200 dark:border-gray-700 text-center">
                <h3 className="font-semibold text-gray-900 dark:text-white">Free</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">€0/Monat</p>
              </div>
              <div className="p-6 text-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <h3 className="font-semibold">Premium</h3>
                <p className="text-sm opacity-90 mt-1">€4.99/Monat</p>
              </div>

              {/* Features */}
              {comparisonFeatures.map((feature, index) => (
                <React.Fragment key={index}>
                  <div className="p-4 border-r border-gray-200 dark:border-gray-700 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {feature.name}
                    </span>
                  </div>
                  <div className="p-4 border-r border-gray-200 dark:border-gray-700 border-t border-gray-100 dark:border-gray-800 text-center">
                    {typeof feature.free === 'boolean' ? (
                      feature.free ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <div className="w-5 h-5 mx-auto"></div>
                      )
                    ) : (
                      <span className="text-sm text-gray-600 dark:text-gray-400">{feature.free}</span>
                    )}
                  </div>
                  <div className="p-4 border-t border-gray-100 dark:border-gray-800 text-center bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10">
                    {typeof feature.premium === 'boolean' ? (
                      feature.premium ? (
                        <Check className="w-5 h-5 text-purple-600 mx-auto" />
                      ) : (
                        <div className="w-5 h-5 mx-auto"></div>
                      )
                    ) : (
                      <span className="text-sm font-medium text-purple-800 dark:text-purple-200">{feature.premium}</span>
                    )}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="text-center mt-8">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors shadow-lg"
            >
              Premium ausprobieren
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">50K+</div>
              <div className="text-gray-600 dark:text-gray-400">Aktive Nutzer</div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">1.2K+</div>
              <div className="text-gray-600 dark:text-gray-400">Artikel</div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">98%</div>
              <div className="text-gray-600 dark:text-gray-400">Zufriedenheit</div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">2.5M+</div>
              <div className="text-gray-600 dark:text-gray-400">Page Views</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-purple-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Bereit für die Zukunft?
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Tritt der FluxAO Community bei und erlebe die innovativsten Features für Tech-News und digitale Trends
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="px-8 py-4 bg-white text-purple-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-xl"
            >
              Kostenlos registrieren
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 bg-white/20 backdrop-blur text-white border border-white/30 rounded-xl font-semibold hover:bg-white/30 transition-colors"
            >
              Premium Features ansehen
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}