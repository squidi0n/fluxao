import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import UserEditForm from '@/components/admin/UserEditForm';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Benutzer bearbeiten - Admin',
};

interface UserEditPageProps {
  params: Promise<{ id: string }>;
}

async function getUser(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            posts: true,
            sessions: true,
            following: true,
            followers: true,
          },
        },
        subscription: true,
      },
    });
    return user;
  } catch (error) {
    // console.error('Error fetching user:', error);
    return null;
  }
}

export default async function UserEditPage({ params }: UserEditPageProps) {
  const { id } = await params;
  const user = await getUser(id);

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Benutzer bearbeiten
          </h2>
        </div>
        <div className="p-6">
          <UserEditForm user={user as any} />
        </div>
      </div>
    </div>
  );
}
