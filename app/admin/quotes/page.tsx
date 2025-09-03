'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Quote as QuoteIcon, Search, Filter } from 'lucide-react';

interface Quote {
  id: string;
  text: string;
  author: string;
  profession: string | null;
  year: number | null;
  source: string | null;
  category: string;
  isActive: boolean;
  createdAt: string;
}

export default function QuotesAdminPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [newQuote, setNewQuote] = useState({
    text: '',
    author: '',
    profession: '',
    year: '',
    source: '',
    category: 'TECHNOLOGY'
  });

  const categories = [
    'ALL', 'TECHNOLOGY', 'AI', 'PHILOSOPHY', 'FUTURE', 'INNOVATION', 'SOCIETY', 'SCIENCE', 'WISDOM'
  ];

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const response = await fetch('/api/admin/quotes');
      const data = await response.json();
      setQuotes(data.quotes || []);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const addQuote = async () => {
    try {
      const response = await fetch('/api/admin/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newQuote,
          year: newQuote.year ? parseInt(newQuote.year) : null
        })
      });
      
      if (response.ok) {
        fetchQuotes();
        setShowAddForm(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error adding quote:', error);
    }
  };

  const editQuote = async () => {
    if (!editingQuote) return;
    
    try {
      const response = await fetch(`/api/admin/quotes/${editingQuote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newQuote.text,
          author: newQuote.author,
          profession: newQuote.profession || null,
          year: newQuote.year ? parseInt(newQuote.year) : null,
          source: newQuote.source || null,
          category: newQuote.category
        })
      });
      
      if (response.ok) {
        fetchQuotes();
        setEditingQuote(null);
        resetForm();
      }
    } catch (error) {
      console.error('Error editing quote:', error);
    }
  };

  const startEdit = (quote: Quote) => {
    setEditingQuote(quote);
    setNewQuote({
      text: quote.text,
      author: quote.author,
      profession: quote.profession || '',
      year: quote.year?.toString() || '',
      source: quote.source || '',
      category: quote.category
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setNewQuote({
      text: '',
      author: '',
      profession: '',
      year: '',
      source: '',
      category: 'TECHNOLOGY'
    });
  };

  const cancelEdit = () => {
    setEditingQuote(null);
    setShowAddForm(false);
    resetForm();
  };

  const deleteQuote = async (id: string) => {
    if (!confirm('Zitat löschen?')) return;
    
    try {
      await fetch(`/api/admin/quotes/${id}`, { method: 'DELETE' });
      fetchQuotes();
    } catch (error) {
      console.error('Error deleting quote:', error);
    }
  };

  const toggleQuote = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/admin/quotes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      });
      fetchQuotes();
    } catch (error) {
      console.error('Error toggling quote:', error);
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || quote.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <div className="p-6">Lädt Zitate...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Zitate verwalten</h1>
          <p className="text-gray-600 dark:text-gray-400">Inspirerende Zitate für die Landingpage</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Neues Zitat
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Zitate durchsuchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Add/Edit Quote Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4">
            {editingQuote ? 'Zitat bearbeiten' : 'Neues Zitat hinzufügen'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Zitat</label>
              <textarea
                value={newQuote.text}
                onChange={(e) => setNewQuote({...newQuote, text: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                rows={3}
                placeholder="Das Zitat..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Autor</label>
              <input
                type="text"
                value={newQuote.author}
                onChange={(e) => setNewQuote({...newQuote, author: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                placeholder="z.B. Alan Turing"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Beruf</label>
              <input
                type="text"
                value={newQuote.profession}
                onChange={(e) => setNewQuote({...newQuote, profession: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                placeholder="z.B. Computer Scientist"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Jahr</label>
              <input
                type="number"
                value={newQuote.year}
                onChange={(e) => setNewQuote({...newQuote, year: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                placeholder="z.B. 1950"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Kategorie</label>
              <select
                value={newQuote.category}
                onChange={(e) => setNewQuote({...newQuote, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              >
                {categories.slice(1).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={editingQuote ? editQuote : addQuote}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              {editingQuote ? 'Zitat speichern' : 'Zitat hinzufügen'}
            </button>
            <button
              onClick={cancelEdit}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Quotes List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Alle Zitate ({filteredQuotes.length})</h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredQuotes.map((quote) => (
            <div key={quote.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <QuoteIcon className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <blockquote className="text-gray-900 dark:text-white italic mb-3">
                        "{quote.text}"
                      </blockquote>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">— {quote.author}</span>
                        {quote.profession && <span>{quote.profession}</span>}
                        {quote.year && <span>({quote.year})</span>}
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-xs">
                          {quote.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => toggleQuote(quote.id, quote.isActive)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      quote.isActive
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {quote.isActive ? 'Aktiv' : 'Inaktiv'}
                  </button>
                  <button
                    onClick={() => startEdit(quote)}
                    className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                    title="Bearbeiten"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteQuote(quote.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}