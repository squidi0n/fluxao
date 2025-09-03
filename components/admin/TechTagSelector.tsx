'use client';

import { motion } from 'framer-motion';
import { Check, Plus, Sparkles, Search } from 'lucide-react';
import { useState } from 'react';

// Predefined tech tags with icons and colors
const techTags = [
  { id: 'openai', name: 'OpenAI', icon: '🤖', color: 'from-green-400 to-green-600' },
  { id: 'claude', name: 'Claude', icon: '🧠', color: 'from-purple-400 to-purple-600' },
  { id: 'midjourney', name: 'Midjourney', icon: '🎨', color: 'from-pink-400 to-pink-600' },
  { id: 'github-copilot', name: 'GitHub Copilot', icon: '👨‍💻', color: 'from-gray-600 to-gray-800' },
  {
    id: 'stable-diffusion',
    name: 'Stable Diffusion',
    icon: '🖼️',
    color: 'from-blue-400 to-blue-600',
  },
  { id: 'langchain', name: 'LangChain', icon: '🔗', color: 'from-orange-400 to-orange-600' },
  { id: 'gpt-4', name: 'GPT-4', icon: '🎯', color: 'from-cyan-400 to-cyan-600' },
  { id: 'llama', name: 'Llama', icon: '🦙', color: 'from-yellow-400 to-yellow-600' },
  { id: 'mistral', name: 'Mistral', icon: '🌪️', color: 'from-indigo-400 to-indigo-600' },
  { id: 'huggingface', name: 'HuggingFace', icon: '🤗', color: 'from-red-400 to-red-600' },
  { id: 'tensorflow', name: 'TensorFlow', icon: '🔥', color: 'from-orange-500 to-red-500' },
  { id: 'pytorch', name: 'PyTorch', icon: '⚡', color: 'from-red-500 to-orange-500' },
  { id: 'dalle', name: 'DALL-E', icon: '🖌️', color: 'from-purple-500 to-pink-500' },
  { id: 'bard', name: 'Bard', icon: '📚', color: 'from-blue-500 to-purple-500' },
  { id: 'gemini', name: 'Gemini', icon: '♊', color: 'from-blue-600 to-cyan-600' },
  { id: 'perplexity', name: 'Perplexity', icon: '🔍', color: 'from-teal-400 to-teal-600' },
  { id: 'notion-ai', name: 'Notion AI', icon: '📝', color: 'from-gray-700 to-gray-900' },
  { id: 'jasper', name: 'Jasper', icon: '✍️', color: 'from-purple-600 to-indigo-600' },
  { id: 'runway', name: 'Runway', icon: '🎬', color: 'from-pink-500 to-purple-500' },
  { id: 'eleven-labs', name: 'ElevenLabs', icon: '🔊', color: 'from-green-500 to-teal-500' },
];

// Additional category tags
const categoryIcons = [
  { id: 'news', name: 'News', icon: '📰', color: 'from-gray-400 to-gray-600' },
  { id: 'tutorial', name: 'Tutorial', icon: '📖', color: 'from-blue-400 to-blue-600' },
  { id: 'review', name: 'Review', icon: '⭐', color: 'from-yellow-400 to-yellow-600' },
  { id: 'opinion', name: 'Meinung', icon: '💭', color: 'from-purple-400 to-purple-600' },
  { id: 'analysis', name: 'Analyse', icon: '📊', color: 'from-green-400 to-green-600' },
  { id: 'interview', name: 'Interview', icon: '🎤', color: 'from-red-400 to-red-600' },
  { id: 'announcement', name: 'Ankündigung', icon: '📢', color: 'from-orange-400 to-orange-600' },
  { id: 'guide', name: 'Guide', icon: '🗺️', color: 'from-teal-400 to-teal-600' },
];

interface TechTagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export default function TechTagSelector({ selectedTags, onTagsChange }: TechTagSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customTag, setCustomTag] = useState('');
  const [customIcon, setCustomIcon] = useState('🏷️');

  const allTags = [...techTags, ...categoryIcons];

  const filteredTags = allTags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter((id) => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  const addCustomTag = () => {
    if (customTag.trim()) {
      const customId = `custom-${customTag.toLowerCase().replace(/\s+/g, '-')}`;
      if (!selectedTags.includes(customId)) {
        onTagsChange([...selectedTags, customId]);
      }
      setCustomTag('');
      setShowCustomInput(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Tech-Tags & Icons</h3>
        <button
          type="button"
          onClick={() => setShowCustomInput(!showCustomInput)}
          className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/30 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Eigenes Tag
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tags durchsuchen..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
        />
      </div>

      {/* Custom Tag Input */}
      {showCustomInput && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={customIcon}
            onChange={(e) => setCustomIcon(e.target.value)}
            className="w-16 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 text-center text-xl"
            placeholder="🏷️"
            maxLength={2}
          />
          <input
            type="text"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            placeholder="Custom Tag Name..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
          />
          <button
            type="button"
            onClick={addCustomTag}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Hinzufügen
          </button>
        </motion.div>
      )}

      {/* Tech Tags Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {filteredTags.map((tag) => {
          const isSelected = selectedTags.includes(tag.id);
          return (
            <motion.button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative group cursor-pointer ${isSelected ? 'ring-2 ring-purple-500' : ''}`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-r ${tag.color} rounded-lg opacity-20 group-hover:opacity-30 transition-opacity`}
              />
              <div
                className={`relative bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm hover:shadow-md transition-all ${
                  isSelected
                    ? 'border-2 border-purple-500'
                    : 'border border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="text-2xl mb-1 text-center">{tag.icon}</div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                  {tag.name}
                </div>
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* AI Suggestion */}
      <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-lg">
        <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <strong>Tipp:</strong> Wähle relevante Tech-Tags, damit deine Artikel besser gefunden
          werden!
        </p>
      </div>

      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          {selectedTags.map((tagId) => {
            const tag = allTags.find((t) => t.id === tagId);
            return tag ? (
              <span
                key={tagId}
                className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-700 rounded-full text-sm shadow-sm"
              >
                <span>{tag.icon}</span>
                <span>{tag.name}</span>
                <button
                  type="button"
                  onClick={() => toggleTag(tagId)}
                  className="ml-1 text-gray-400 hover:text-red-500"
                >
                  ×
                </button>
              </span>
            ) : (
              <span
                key={tagId}
                className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-700 rounded-full text-sm shadow-sm"
              >
                <span>🏷️</span>
                <span>{tagId.replace('custom-', '')}</span>
                <button
                  type="button"
                  onClick={() => toggleTag(tagId)}
                  className="ml-1 text-gray-400 hover:text-red-500"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
