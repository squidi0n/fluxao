import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import PostFormV2 from '@/components/admin/PostFormV2';
import { auth } from '@/auth';
import { can } from '@/lib/rbac';

export const metadata: Metadata = {
  title: 'Neuer Artikel - Admin - FluxAO',
};

export default async function NewPostPage() {
  const session = await auth();

  if (!session?.user || !can(session.user, 'create', 'posts')) {
    redirect('/auth/login');
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Neuer Artikel</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Erstelle einen neuen Artikel für dein Magazin
        </p>
      </div>

      <PostFormV2 />
    </div>
  );
}
