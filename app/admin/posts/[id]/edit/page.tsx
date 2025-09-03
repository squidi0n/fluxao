import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import PostFormV2 from '@/components/admin/PostFormV2';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Edit Post - Admin - FluxAO',
};

async function getPost(id: string) {
  const post = await prisma.post.findUnique({
    where: { id },
  });

  if (!post) {
    notFound();
  }

  return post;
}

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // TODO: Re-enable auth when fixed
  // const user = await getUserFromCookies()
  //
  // if (!session || !can(user, 'update', 'posts')) {
  //   redirect('/auth/login')
  // }

  const post = await getPost(id);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Post bearbeiten</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Bearbeite deinen Artikel</p>
      </div>

      <PostFormV2 post={post} isEdit />
    </div>
  );
}
