import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeData() {
  console.log('🔍 ANALYZING CURRENT DATA FOR MOCK CONTENT:');
  console.log('============================================\n');

  // Check newsletter subscribers
  const newsletters = await prisma.newsletterSubscriber.findMany();
  console.log(`📧 Newsletter Subscribers: ${newsletters.length}`);
  newsletters.forEach((sub) => {
    console.log(`   - ${sub.email} (${sub.status})`);
  });

  // Check comments for obvious mock content
  const comments = await prisma.comment.findMany({
    select: {
      id: true,
      body: true,
      authorName: true,
      authorEmail: true,
      status: true,
      post: {
        select: { title: true }
      }
    }
  });
  console.log(`\n💬 Comments: ${comments.length}`);
  comments.forEach((comment) => {
    console.log(`   - "${comment.body.substring(0, 50)}..." by ${comment.authorName} (${comment.authorEmail})`);
    console.log(`     Post: ${comment.post?.title}`);
  });

  // Check settings for any demo values
  const settings = await prisma.setting.findMany();
  console.log(`\n⚙️ Settings: ${settings.length}`);
  settings.forEach((setting) => {
    console.log(`   - ${setting.key}: ${setting.value}`);
  });

  // Check for any test data patterns
  const testEmails = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: 'test' } },
        { email: { contains: 'demo' } },
        { email: { contains: 'example' } },
        { email: { contains: 'mock' } },
      ]
    }
  });
  
  if (testEmails.length > 0) {
    console.log(`\n⚠️ Potential test users found: ${testEmails.length}`);
    testEmails.forEach((user) => {
      console.log(`   - ${user.email} (${user.name}) - ${user.role}`);
    });
  }

  // Check for any test newsletter subscribers
  const testNewsletterSubs = newsletters.filter(sub => 
    sub.email.includes('test') || 
    sub.email.includes('example') || 
    sub.email.includes('demo') || 
    sub.email.includes('mock')
  );
  
  if (testNewsletterSubs.length > 0) {
    console.log(`\n⚠️ Test newsletter subscribers found: ${testNewsletterSubs.length}`);
    testNewsletterSubs.forEach((sub) => {
      console.log(`   - ${sub.email}`);
    });
  }

  // Check for posts with obvious mock content patterns
  const posts = await prisma.post.findMany({
    select: {
      title: true,
      slug: true,
      excerpt: true,
      viewCount: true,
      author: { select: { email: true } },
      status: true
    }
  });

  const suspiciousPosts = posts.filter(post => 
    post.title.toLowerCase().includes('demo') ||
    post.title.toLowerCase().includes('test') ||
    post.title.toLowerCase().includes('sample') ||
    post.slug.includes('demo') ||
    post.slug.includes('test') ||
    post.excerpt?.toLowerCase().includes('lorem ipsum') ||
    (post.viewCount && post.viewCount > 100000) // Suspiciously high view counts
  );

  if (suspiciousPosts.length > 0) {
    console.log(`\n⚠️ Potentially suspicious posts found: ${suspiciousPosts.length}`);
    suspiciousPosts.forEach((post) => {
      console.log(`   - "${post.title}" (views: ${post.viewCount})`);
    });
  }

  console.log('\n✅ Analysis complete!');
}

analyzeData()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });