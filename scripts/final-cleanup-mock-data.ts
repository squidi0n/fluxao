import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function finalCleanup() {
  console.log('🧹 FINAL MOCK DATA CLEANUP');
  console.log('==========================\n');

  let cleanupCount = 0;

  // Remove test comments from test users
  console.log('1. Removing test comments...');
  const testComments = await prisma.comment.deleteMany({
    where: {
      OR: [
        { authorEmail: { contains: 'test.de' } },
        { authorEmail: { contains: 'example.com' } },
        { authorEmail: { contains: 'demo.com' } },
        { authorName: 'Test User' },
        { authorName: 'Demo User' },
        { body: { contains: 'Lorem ipsum' } },
        { body: { contains: 'asdasd' } }, // Obviously fake content
        { body: { contains: 'asasas' } }, // Obviously fake content
      ]
    }
  });
  cleanupCount += testComments.count;
  console.log(`   ✅ Removed ${testComments.count} test comments`);

  // Remove any newsletter subscribers with test emails
  console.log('2. Removing test newsletter subscribers...');
  const testNewsletters = await prisma.newsletterSubscriber.deleteMany({
    where: {
      OR: [
        { email: { contains: 'test' } },
        { email: { contains: 'example.com' } },
        { email: { contains: 'demo.com' } },
        { email: { contains: 'mock' } },
      ]
    }
  });
  cleanupCount += testNewsletters.count;
  console.log(`   ✅ Removed ${testNewsletters.count} test newsletter subscribers`);

  // Remove any users with obviously test emails (but preserve admin accounts)
  console.log('3. Checking for test users (preserving admins)...');
  const testUsers = await prisma.user.findMany({
    where: {
      AND: [
        { role: { not: 'ADMIN' } },
        {
          OR: [
            { email: { contains: 'test@example.com' } },
            { email: { contains: 'demo@example.com' } },
            { email: { contains: 'mock@example.com' } },
            { name: 'Test User' },
            { name: 'Demo User' },
          ]
        }
      ]
    }
  });

  if (testUsers.length > 0) {
    console.log(`   Found ${testUsers.length} test users to remove:`);
    testUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.name})`);
    });
    
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        id: { in: testUsers.map(u => u.id) }
      }
    });
    cleanupCount += deletedUsers.count;
    console.log(`   ✅ Removed ${deletedUsers.count} test users`);
  } else {
    console.log(`   ✅ No test users found`);
  }

  // Check for posts with suspicious patterns (but be very conservative)
  console.log('4. Checking for obviously fake posts...');
  const suspiciousPosts = await prisma.post.findMany({
    where: {
      OR: [
        { title: { contains: 'Lorem Ipsum' } },
        { title: { contains: 'Test Post' } },
        { title: { contains: 'Demo Article' } },
        { slug: { contains: 'test-post' } },
        { slug: { contains: 'demo-article' } },
        { content: { contains: 'Lorem ipsum dolor sit amet' } },
      ]
    }
  });

  if (suspiciousPosts.length > 0) {
    console.log(`   ⚠️ Found ${suspiciousPosts.length} potentially fake posts:`);
    suspiciousPosts.forEach(post => {
      console.log(`   - "${post.title}" (${post.slug})`);
    });
    console.log(`   ⚠️ Please review these manually - not removing automatically`);
  } else {
    console.log(`   ✅ No obviously fake posts found`);
  }

  // Final summary
  console.log(`\n📊 CLEANUP SUMMARY:`);
  console.log(`   - Total items cleaned: ${cleanupCount}`);

  if (cleanupCount === 0) {
    console.log('\n🎉 Database is already clean! No mock data found.');
  } else {
    console.log(`\n✅ Cleanup completed successfully!`);
  }

  // Show final state
  console.log('\n📈 FINAL DATABASE STATE:');
  const finalCounts = {
    posts: await prisma.post.count(),
    users: await prisma.user.count(),
    comments: await prisma.comment.count(),
    categories: await prisma.category.count(),
    tags: await prisma.tag.count(),
    newsletters: await prisma.newsletterSubscriber.count(),
    quotes: await prisma.quote.count(),
  };

  Object.entries(finalCounts).forEach(([table, count]) => {
    console.log(`   - ${table}: ${count}`);
  });
}

finalCleanup()
  .catch((error) => {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });