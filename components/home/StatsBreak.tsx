'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Users, Eye, Zap } from 'lucide-react';

export default function StatsBreak() {
  // TODO: Diese Stats aus der Database laden statt Fake-Zahlen
  const stats = [
    {
      icon: TrendingUp,
      value: '12', // Aus DB: Posts diesen Monat
      label: 'Artikel diesen Monat',
      color: 'from-gray-600 to-gray-700',
    },
    { icon: Eye, value: '2.3K', label: 'Artikel-Aufrufe', color: 'from-gray-600 to-gray-700' }, // Aus DB: Sum(viewCount)
    { icon: Users, value: '47', label: 'Community', color: 'from-gray-600 to-gray-700' }, // Aus DB: User count
    { icon: Zap, value: '8', label: 'Kategorien', color: 'from-gray-600 to-gray-700' }, // Aus DB: Category count
  ];

  return (
    <section className="relative py-16 overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Die Zukunft wird hier geschrieben
          </h2>
          <p className="text-lg text-gray-300">
            Deine Quelle für Tech-Innovation und digitale Transformation
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm">
                <stat.icon className="w-8 h-8 text-white" />
              </div>
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`text-3xl md:text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}
              >
                {stat.value}
              </motion.div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}