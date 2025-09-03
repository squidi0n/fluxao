'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const technologies = [
  // KI & Machine Learning
  { name: 'OpenAI', logo: '🤖', color: 'from-green-400 to-green-600', searchTerm: 'openai' },
  { name: 'Claude', logo: '🧠', color: 'from-purple-400 to-purple-600', searchTerm: 'claude' },
  { name: 'ChatGPT', logo: '💬', color: 'from-teal-400 to-teal-600', searchTerm: 'chatgpt' },
  { name: 'Midjourney', logo: '🎨', color: 'from-pink-400 to-pink-600', searchTerm: 'midjourney' },
  { name: 'Stable Diffusion', logo: '🖼️', color: 'from-blue-400 to-blue-600', searchTerm: 'stable-diffusion' },
  { name: 'DALL-E', logo: '🎭', color: 'from-indigo-400 to-indigo-600', searchTerm: 'dall-e' },
  { name: 'Gemini', logo: '♊', color: 'from-blue-500 to-purple-500', searchTerm: 'gemini' },
  { name: 'Copilot', logo: '👨‍💻', color: 'from-gray-600 to-gray-800', searchTerm: 'copilot' },
  { name: 'Perplexity', logo: '🔍', color: 'from-violet-400 to-violet-600', searchTerm: 'perplexity' },
  { name: 'Llama', logo: '🦙', color: 'from-purple-500 to-pink-500', searchTerm: 'llama' },
  
  // Entwicklung & Tools
  { name: 'GitHub', logo: '🐙', color: 'from-gray-700 to-gray-900', searchTerm: 'github' },
  { name: 'VS Code', logo: '💻', color: 'from-blue-500 to-blue-700', searchTerm: 'vscode' },
  { name: 'Docker', logo: '🐳', color: 'from-blue-400 to-blue-600', searchTerm: 'docker' },
  { name: 'Kubernetes', logo: '☸️', color: 'from-blue-600 to-blue-800', searchTerm: 'kubernetes' },
  { name: 'React', logo: '⚛️', color: 'from-cyan-400 to-cyan-600', searchTerm: 'react' },
  { name: 'Next.js', logo: '▲', color: 'from-black to-gray-800', searchTerm: 'nextjs' },
  { name: 'Python', logo: '🐍', color: 'from-yellow-400 to-blue-600', searchTerm: 'python' },
  { name: 'JavaScript', logo: '🟨', color: 'from-yellow-400 to-yellow-600', searchTerm: 'javascript' },
  { name: 'TypeScript', logo: '🔷', color: 'from-blue-400 to-blue-600', searchTerm: 'typescript' },
  { name: 'Rust', logo: '🦀', color: 'from-orange-600 to-orange-800', searchTerm: 'rust' },
  
  // Tech Companies
  { name: 'Tesla', logo: '🚗', color: 'from-red-500 to-red-700', searchTerm: 'tesla' },
  { name: 'SpaceX', logo: '🚀', color: 'from-gray-800 to-black', searchTerm: 'spacex' },
  { name: 'Apple', logo: '🍎', color: 'from-gray-600 to-gray-800', searchTerm: 'apple' },
  { name: 'Google', logo: '🔍', color: 'from-blue-500 via-red-500 to-yellow-500', searchTerm: 'google' },
  { name: 'Microsoft', logo: '🪟', color: 'from-blue-400 to-blue-600', searchTerm: 'microsoft' },
  { name: 'Meta', logo: '♾️', color: 'from-blue-500 to-blue-700', searchTerm: 'meta' },
  { name: 'Amazon', logo: '📦', color: 'from-orange-400 to-orange-600', searchTerm: 'amazon' },
  { name: 'NVIDIA', logo: '🎮', color: 'from-green-500 to-green-700', searchTerm: 'nvidia' },
  { name: 'AMD', logo: '💾', color: 'from-red-500 to-red-700', searchTerm: 'amd' },
  { name: 'Intel', logo: '🔲', color: 'from-blue-500 to-blue-700', searchTerm: 'intel' },
  
  // Blockchain & Crypto
  { name: 'Bitcoin', logo: '₿', color: 'from-orange-400 to-orange-600', searchTerm: 'bitcoin' },
  { name: 'Ethereum', logo: 'Ξ', color: 'from-purple-400 to-purple-600', searchTerm: 'ethereum' },
  { name: 'Web3', logo: '🌐', color: 'from-blue-400 to-purple-600', searchTerm: 'web3' },
  { name: 'NFT', logo: '🖼️', color: 'from-pink-400 to-purple-600', searchTerm: 'nft' },
  { name: 'DeFi', logo: '💰', color: 'from-green-400 to-green-600', searchTerm: 'defi' },
  
  // Social & Gaming
  { name: 'Discord', logo: '💬', color: 'from-indigo-500 to-indigo-700', searchTerm: 'discord' },
  { name: 'Twitch', logo: '🎮', color: 'from-purple-500 to-purple-700', searchTerm: 'twitch' },
  { name: 'Steam', logo: '🎯', color: 'from-gray-700 to-gray-900', searchTerm: 'steam' },
  { name: 'Unity', logo: '🎲', color: 'from-gray-600 to-gray-800', searchTerm: 'unity' },
  { name: 'Unreal', logo: '🎬', color: 'from-gray-800 to-black', searchTerm: 'unreal' },
  
  // Emerging Tech
  { name: 'Quantum', logo: '⚛️', color: 'from-purple-500 to-indigo-600', searchTerm: 'quantum' },
  { name: 'AR/VR', logo: '🥽', color: 'from-blue-400 to-purple-600', searchTerm: 'ar-vr' },
  { name: 'IoT', logo: '📡', color: 'from-green-400 to-blue-600', searchTerm: 'iot' },
  { name: '5G', logo: '📶', color: 'from-blue-500 to-blue-700', searchTerm: '5g' },
  { name: 'Robotics', logo: '🤖', color: 'from-gray-600 to-gray-800', searchTerm: 'robotics' },
  { name: 'Biotech', logo: '🧬', color: 'from-green-400 to-green-600', searchTerm: 'biotech' },
  { name: 'Neuralink', logo: '🧠', color: 'from-gray-700 to-gray-900', searchTerm: 'neuralink' },
  { name: 'Starlink', logo: '🛰️', color: 'from-blue-500 to-blue-700', searchTerm: 'starlink' },
  { name: 'Cybersecurity', logo: '🔐', color: 'from-red-500 to-red-700', searchTerm: 'cybersecurity' },
];

export default function TechStackBreak() {
  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Die Themen die uns bewegen
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Klicke auf ein Thema um alle Artikel dazu zu sehen
          </p>
        </motion.div>

        {/* Continuous scrolling wrapper */}
        <div className="relative">
          
          {/* Scrolling container */}
          <div className="flex gap-6 py-4">
            {/* First set for continuous loop */}
            <div className="flex gap-6 animate-scroll-continuous">
              {technologies.map((tech, index) => (
                <motion.div
                  key={`${tech.name}-1-${index}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: (index % 10) * 0.05 }}
                  className="flex-shrink-0"
                >
                  <Link href={`/search?q=${tech.searchTerm}`} className="block">
                    <div className="relative group cursor-pointer">
                      <div
                        className={`absolute inset-0 bg-gradient-to-r ${tech.color} rounded-xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300`}
                      />
                      <div className="relative bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1 border border-gray-200 dark:border-gray-700">
                        <div className="text-3xl mb-2 text-center">{tech.logo}</div>
                        <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 text-center whitespace-nowrap">
                          {tech.name}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
            
            {/* Duplicate set for seamless loop */}
            <div className="flex gap-6 animate-scroll-continuous" aria-hidden="true">
              {technologies.map((tech, index) => (
                <motion.div
                  key={`${tech.name}-2-${index}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: (index % 10) * 0.05 }}
                  className="flex-shrink-0"
                >
                  <Link href={`/search?q=${tech.searchTerm}`} className="block">
                    <div className="relative group cursor-pointer">
                      <div
                        className={`absolute inset-0 bg-gradient-to-r ${tech.color} rounded-xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300`}
                      />
                      <div className="relative bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1 border border-gray-200 dark:border-gray-700">
                        <div className="text-3xl mb-2 text-center">{tech.logo}</div>
                        <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 text-center whitespace-nowrap">
                          {tech.name}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll-continuous {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-100% - 1.5rem));
          }
        }

        .animate-scroll-continuous {
          animation: scroll-continuous 120s linear infinite;
        }

        .animate-scroll-continuous:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}