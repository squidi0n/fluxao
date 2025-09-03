'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Trash2, User, Shield, Calendar, FileText, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Define UserRole enum directly
enum UserRole {
  USER = 'USER',
  AUTHOR = 'AUTHOR',
  EDITOR = 'EDITOR',
  ADMIN = 'ADMIN',
}

const userSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  name: z.string().nullable(),
  username: z.string().nullable(),
  bio: z.string().nullable(),
  location: z.string().nullable(),
  website: z.string().url().nullable().or(z.literal('')),
  role: z.nativeEnum(UserRole),
  isAdmin: z.boolean(),
  isPublic: z.boolean(),
  emailVerified: z.boolean(),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserEditFormProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    username: string | null;
    bio: string | null;
    location: string | null;
    website: string | null;
    role: UserRole;
    isAdmin: boolean;
    isPublic: boolean;
    emailVerified: boolean;
    emailVerifiedLegacy: Date | null;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt: Date | null;
    _count?: {
      posts: number;
      sessions: number;
      following: number;
      followers: number;
    };
  };
}

export default function UserEditForm({ user }: UserEditFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: user.email,
      name: user.name || '',
      username: user.username || '',
      bio: user.bio || '',
      location: user.location || '',
      website: user.website || '',
      role: user.role,
      isAdmin: user.isAdmin,
      isPublic: user.isPublic,
      emailVerified: !!user.emailVerifiedLegacy,
    },
  });

  const onSubmit = async (data: UserFormData) => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Speichern');
      }

      router.push('/admin/users');
      router.refresh();
    } catch (error) {
      // console.error('Save error:', error);
      setError('Fehler beim Speichern der Änderungen');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        'Möchten Sie diesen Benutzer wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Fehler beim Löschen');
      }

      router.push('/admin/users');
      router.refresh();
    } catch (error) {
      // console.error('Delete error:', error);
      setError('Fehler beim Löschen des Benutzers');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Nie';
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Fehler</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* User Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 mb-1">
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">Posts</span>
          </div>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {user._count?.posts || 0}
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 mb-1">
            <User className="w-4 h-4" />
            <span className="text-sm font-medium">Follower</span>
          </div>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
            {user._count?.followers || 0}
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">Letzter Login</span>
          </div>
          <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
            {formatDate(user.lastLoginAt)}
          </p>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Grundinformationen
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              E-Mail *
            </label>
            <input
              {...register('email')}
              type="email"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              {...register('name')}
              type="text"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Benutzername
            </label>
            <input
              {...register('username')}
              type="text"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Website
            </label>
            <input
              {...register('website')}
              type="url"
              placeholder="https://example.com"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Standort
            </label>
            <input
              {...register('location')}
              type="text"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rolle
            </label>
            <select
              {...register('role')}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value={UserRole.USER}>User</option>
              <option value={UserRole.AUTHOR}>Author</option>
              <option value={UserRole.EDITOR}>Editor</option>
              <option value={UserRole.ADMIN}>Admin</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Bio
          </label>
          <textarea
            {...register('bio')}
            rows={3}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Permissions & Settings */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Berechtigungen & Einstellungen
        </h3>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              {...register('isAdmin')}
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              <Shield className="inline w-4 h-4 mr-1" />
              Admin-Rechte
            </label>
          </div>

          <div className="flex items-center">
            <input
              {...register('isPublic')}
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Öffentliches Profil
            </label>
          </div>

          <div className="flex items-center">
            <input
              {...register('emailVerified')}
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              E-Mail verifiziert
            </label>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Metadaten</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Erstellt:</span>
            <p className="font-medium text-gray-900 dark:text-white">
              {formatDate(user.createdAt)}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Aktualisiert:</span>
            <p className="font-medium text-gray-900 dark:text-white">
              {formatDate(user.updatedAt)}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">User ID:</span>
            <p className="font-mono text-xs text-gray-900 dark:text-white">{user.id}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {deleting ? 'Löschen...' : 'Benutzer löschen'}
        </button>

        <div className="space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={saving || !isDirty}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Speichern...' : 'Änderungen speichern'}
          </button>
        </div>
      </div>
    </form>
  );
}
