import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPostsAuthor() {
  // console.log('\n🔧 Fixing posts author...\n');

  // 1. Get Adam's user ID
  const adam = await prisma.user.findUnique({
    where: { email: 'adam.freundt@gmail.com' },
    select: { id: true, email: true },
  });

  if (!adam) {
    throw new Error('Adam not found!');
  }

  // console.log(`✅ Found Adam: ${adam.email} (${adam.id})`);

  // 2. Update all posts to have Adam as author
  const updated = await prisma.post.updateMany({
    data: {
      authorId: adam.id,
    },
  });

  // console.log(`✅ Updated ${updated.count} posts to have Adam as author`);

  // 3. Delete the unwanted users created by seed
  const usersToDelete = ['admin@fluxao.com', 'editor@fluxao.com'];

  for (const email of usersToDelete) {
    try {
      // First delete their subscriptions
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (user) {
        await prisma.subscription.deleteMany({
          where: { userId: user.id },
        });

        await prisma.user.delete({
          where: { email },
        });
        // console.log(`🗑️  Deleted user: ${email}`);
      }
    } catch (e) {
      // User might not exist
    }
  }

  // 4. Show final state
  const users = await prisma.user.findMany({
    select: { email: true, role: true },
  });

  const posts = await prisma.post.count();

  // console.log('\n📊 Final State:');
  // console.log('==============');
  // console.log('Users:');
  users.forEach((u) => {
    // console.log(`  - ${u.email} (${u.role})`);
  });
  // console.log(`\n📝 Total posts: ${posts} (all authored by Adam)`);
}

fixPostsAuthor()
  .catch((error) => {
    // console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
