'use client';

import { format } from 'date-fns';
import {
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Download,
  Trash,
  CheckSquare,
  Square,
} from 'lucide-react';
import { useState } from 'react';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  token: string;
  createdAt: Date;
  verifiedAt: Date | null;
}

interface NewsletterSubscribersProps {
  subscribers: Subscriber[];
}

export default function NewsletterSubscribers({
  subscribers: initialSubscribers,
}: NewsletterSubscribersProps) {
  const [subscribers, setSubscribers] = useState(initialSubscribers);
  const [filter, setFilter] = useState<'all' | 'verified' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredSubscribers = subscribers.filter((subscriber) => {
    const matchesFilter = filter === 'all' || subscriber.status === filter;
    const matchesSearch = subscriber.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Möchten Sie diesen Abonnenten wirklich löschen?')) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/newsletter/subscribers/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSubscribers(subscribers.filter((s) => s.id !== id));
        setSelectedIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Fehler beim Löschen des Abonnenten');
      }
    } catch (error) {
      // console.error('Delete error:', error);
      alert('Fehler beim Löschen des Abonnenten');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      alert('Bitte wählen Sie mindestens einen Abonnenten aus');
      return;
    }

    if (!confirm(`Möchten Sie ${selectedIds.size} Abonnenten wirklich löschen?`)) return;

    setIsDeleting(true);
    try {
      const response = await fetch('/api/admin/newsletter/subscribers/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (response.ok) {
        const result = await response.json();
        setSubscribers(subscribers.filter((s) => !selectedIds.has(s.id)));
        setSelectedIds(new Set());
        alert(`${result.deletedCount} Abonnenten erfolgreich gelöscht`);
      } else {
        const error = await response.json();
        alert(error.error || 'Fehler beim Löschen der Abonnenten');
      }
    } catch (error) {
      // console.error('Bulk delete error:', error);
      alert('Fehler beim Löschen der Abonnenten');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredSubscribers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSubscribers.map((s) => s.id)));
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Email', 'Status', 'Anmeldedatum', 'Verifiziert am'],
      ...filteredSubscribers.map((s) => [
        s.email,
        s.status,
        format(new Date(s.createdAt), 'dd.MM.yyyy'),
        s.verifiedAt ? format(new Date(s.verifiedAt), 'dd.MM.yyyy') : '-',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-abonnenten-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Verifiziert';
      case 'pending':
        return 'Ausstehend';
      default:
        return 'Inaktiv';
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Abonnenten verwalten
        </h2>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Nach Email suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              Alle ({subscribers.length})
            </button>
            <button
              onClick={() => setFilter('verified')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'verified'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              Verifiziert ({subscribers.filter((s) => s.status === 'verified').length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              Ausstehend ({subscribers.filter((s) => s.status === 'pending').length})
            </button>
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Trash className="w-4 h-4" />
                {selectedIds.size} Löschen
              </button>
            )}
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="w-12 px-6 py-3">
                <button
                  onClick={toggleSelectAll}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  {selectedIds.size === filteredSubscribers.length &&
                  filteredSubscribers.length > 0 ? (
                    <CheckSquare className="w-5 h-5" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Angemeldet
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Verifiziert
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Aktionen</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredSubscribers.map((subscriber) => (
              <tr
                key={subscriber.id}
                className={
                  selectedIds.has(subscriber.id) ? 'bg-indigo-50 dark:bg-indigo-950/20' : ''
                }
              >
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleSelection(subscriber.id)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    {selectedIds.has(subscriber.id) ? (
                      <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {subscriber.email}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(subscriber.status)}
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {getStatusLabel(subscriber.status)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {format(new Date(subscriber.createdAt), 'dd.MM.yyyy HH:mm')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {subscriber.verifiedAt
                    ? format(new Date(subscriber.verifiedAt), 'dd.MM.yyyy HH:mm')
                    : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleDelete(subscriber.id)}
                    disabled={isDeleting}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                    title="Löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredSubscribers.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">Keine Abonnenten gefunden</p>
          </div>
        )}
      </div>
    </div>
  );
}
