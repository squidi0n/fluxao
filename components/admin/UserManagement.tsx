'use client';

import { useState, useMemo } from 'react';
import { Search, Users, UserPlus, Edit, Trash2, Shield, MoreHorizontal, Mail, Calendar, FileText } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/format';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  avatar: string | null;
  emailVerified: Date | null;
  createdAt: Date;
  _count: {
    posts: number;
  };
}

export default function UserManagement({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'USER' | 'ADMIN'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    password: '',
    role: 'USER',
  });

  // Filter and search functionality
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [users, roleFilter, searchTerm]);

  // Calculate stats
  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter(u => u.role === 'ADMIN').length,
    users: users.filter(u => u.role === 'USER').length,
    verified: users.filter(u => u.emailVerified).length,
    withPosts: users.filter(u => u._count.posts > 0).length,
  }), [users]);

  const handleDelete = async (userId: string) => {
    if (!confirm('Möchten Sie diesen Benutzer wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden!')) return;

    setDeletingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setUsers(users.filter((u) => u.id !== userId));
        alert('Benutzer erfolgreich gelöscht');
      } else {
        alert('Fehler beim Löschen des Benutzers');
      }
    } catch (error) {
      alert('Fehler beim Löschen des Benutzers');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      if (res.ok) {
        const user = await res.json();
        setUsers([user, ...users]);
        setShowAddForm(false);
        setNewUser({ email: '', name: '', password: '', role: 'USER' });
        alert('Benutzer erfolgreich erstellt');
      } else {
        alert('Fehler beim Erstellen des Benutzers');
      }
    } catch (error) {
      alert('Fehler beim Erstellen des Benutzers');
    }
  };

  return (
    <div className="space-y-6">
      {/* Modern Header with Gradient */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Users className="w-10 h-10" />
              Benutzer verwalten
            </h1>
            <p className="text-blue-100 text-lg">
              {stats.total} Benutzer verwalten - {stats.admins} Admins, {stats.users} Standard-Benutzer
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur text-white rounded-xl hover:bg-white/30 transition-all font-medium"
          >
            <UserPlus className="w-5 h-5" />
            {showAddForm ? 'Abbrechen' : 'Neuer Benutzer'}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Gesamt</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 shadow-lg border border-red-200 dark:border-red-800">
          <p className="text-xs font-semibold uppercase text-red-600 dark:text-red-400">Admins</p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">{stats.admins}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 shadow-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs font-semibold uppercase text-blue-600 dark:text-blue-400">Standard</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{stats.users}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 shadow-lg border border-green-200 dark:border-green-800">
          <p className="text-xs font-semibold uppercase text-green-600 dark:text-green-400">Verifiziert</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">{stats.verified}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 shadow-lg border border-purple-200 dark:border-purple-800">
          <p className="text-xs font-semibold uppercase text-purple-600 dark:text-purple-400">Mit Posts</p>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">{stats.withPosts}</p>
        </div>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="animate-fade-in-up">
          <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
            <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Neuen Benutzer hinzufügen
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Name</label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                      placeholder="Vollständiger Name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Email</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                      placeholder="benutzer@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Passwort</label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                      placeholder="Mindestens 8 Zeichen"
                      required
                      minLength={8}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Rolle</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    >
                      <option value="USER">Standard Benutzer</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all shadow-lg font-medium"
                >
                  Benutzer erstellen
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Nach Name oder Email suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* Role Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              roleFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Alle ({stats.total})
          </button>
          <button
            onClick={() => setRoleFilter('USER')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              roleFilter === 'USER'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Benutzer ({stats.users})
          </button>
          <button
            onClick={() => setRoleFilter('ADMIN')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              roleFilter === 'ADMIN'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Admins ({stats.admins})
          </button>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          {filteredUsers.length} {filteredUsers.length === 1 ? 'Benutzer' : 'Benutzer'} gefunden
        </div>
      </div>

      {/* Modern DataTable */}
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-xl rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Benutzer
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Rolle & Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Aktivität
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Registriert
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {(user.name || user.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {user.name || 'Unbenannt'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <Badge 
                      variant={user.role === 'ADMIN' ? 'destructive' : 'default'}
                      className="flex items-center gap-1 w-fit"
                    >
                      <Shield className="w-3 h-3" />
                      {user.role}
                    </Badge>
                    <Badge 
                      variant={user.emailVerified ? 'default' : 'secondary'}
                      className="flex items-center gap-1 w-fit"
                    >
                      {user.emailVerified ? '✅ Verifiziert' : '⏳ Unverifiziert'}
                    </Badge>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{user._count.posts}</span>
                    <span className="text-gray-500">Posts</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-white flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    {formatDate(user.createdAt)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-1">
                    <Link
                      href={`/admin/users/${user.id}/edit`}
                      className="inline-flex items-center p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Bearbeiten"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(user.id)}
                      disabled={deletingId === user.id}
                      className="inline-flex items-center p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Löschen"
                    >
                      {deletingId === user.id ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredUsers.length === 0 && (
          <div className="bg-white dark:bg-gray-800 px-6 py-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {searchTerm || roleFilter !== 'all'
                ? 'Keine Benutzer gefunden. Versuche andere Filterkriterien.'
                : 'Noch keine Benutzer vorhanden'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
