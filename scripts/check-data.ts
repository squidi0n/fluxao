import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  console.log('\n📊 DATABASE STATUS:');
  console.log('==================\n');

  const posts = await prisma.post.count();
  const categories = await prisma.category.count();
  const users = await prisma.user.count();
  const comments = await prisma.comment.count();
  const tags = await prisma.tag.count();
  const quotes = await prisma.quote.count();

  console.log(`📝 Posts: ${posts}`);
  console.log(`📁 Categories: ${categories}`);
  console.log(`👥 Users: ${users}`);
  console.log(`💬 Comments: ${comments}`);
  console.log(`🏷️ Tags: ${tags}`);
  console.log(`💭 Quotes: ${quotes}`);

  if (posts === 0) {
    console.log('\n⚠️  Keine Posts gefunden!');
  } else {
    console.log('\n✅ Posts sind vorhanden!');

    // Zeige die ersten 5 Posts
    const samplePosts = await prisma.post.findMany({
      take: 5,
      select: {
        title: true,
        slug: true,
        status: true,
        author: {
          select: { email: true },
        },
      },
    });

    console.log('\n📄 Sample Posts:');
    samplePosts.forEach((post, i) => {
      console.log(`${i + 1}. ${post.title}`);
      console.log(`   - Slug: ${post.slug}`);
      console.log(`   - Author: ${post.author?.email || 'DELETED'}`);
      console.log(`   - Status: ${post.status}`);
    });
  }

  // Check categories
  if (categories > 0) {
    const cats = await prisma.category.findMany({
      select: { name: true, slug: true },
    });
    console.log('\n📁 Categories:');
    cats.forEach((cat) => {
      console.log(`   - ${cat.name} (${cat.slug})`);
    });
  }

  // Check users
  if (users > 0) {
    const userList = await prisma.user.findMany({
      select: { email: true, name: true, role: true },
    });
    console.log('\n👥 Users:');
    userList.forEach((user) => {
      console.log(`   - ${user.email} (${user.name}) - ${user.role}`);
    });
  }
}

checkData()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
