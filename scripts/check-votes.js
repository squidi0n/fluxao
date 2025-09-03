const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkVoteIssue() {
  try {
    // Check if the specific post exists
    const postId = 'bbf13fa8-6bca-4c4c-af76-f9d081f61dc9';
    
    console.log('Checking post:', postId);
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, title: true, slug: true }
    });
    
    if (!post) {
      console.log('❌ Post not found! This is the issue.');
      
      // Get a real post for testing
      const realPost = await prisma.post.findFirst({
        where: { published: true },
        select: { id: true, title: true, slug: true }
      });
      
      if (realPost) {
        console.log('\n✅ Found a real post for testing:');
        console.log('ID:', realPost.id);
        console.log('Title:', realPost.title);
        console.log('Slug:', realPost.slug);
        console.log('\nUse this URL to test voting:');
        console.log(`http://localhost:3000/${realPost.slug}`);
      }
    } else {
      console.log('✅ Post exists:', post.title);
    }
    
    // Check if there are any users
    const userCount = await prisma.user.count();
    console.log('\nTotal users in database:', userCount);
    
    if (userCount === 0) {
      console.log('❌ No users found! You need to create a user first.');
    } else {
      const user = await prisma.user.findFirst();
      console.log('✅ Sample user:', user?.email);
    }
    
    // Check existing votes
    const voteCount = await prisma.articleVote.count();
    console.log('\nTotal votes in database:', voteCount);
    
    // List all posts
    const allPosts = await prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true, title: true, slug: true },
      take: 5
    });
    
    console.log('\n📝 Available posts for testing:');
    allPosts.forEach(p => {
      console.log(`- ${p.title}`);
      console.log(`  URL: http://localhost:3000/${p.slug}`);
      console.log(`  ID: ${p.id}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVoteIssue();