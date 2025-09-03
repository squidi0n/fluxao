const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testVote() {
  try {
    const postId = 'bbf13fa8-6bca-4c4c-af76-f9d081f61dc9';
    
    // Get first user for testing
    const user = await prisma.user.findFirst();
    console.log('Testing with user:', user?.email);
    console.log('User ID:', user?.id);
    
    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });
    console.log('Post exists:', !!post);
    console.log('Post ID:', post?.id);
    
    if (!user || !post) {
      console.log('Missing user or post');
      return;
    }
    
    // Try to create a vote
    console.log('\nAttempting to create vote...');
    try {
      const vote = await prisma.articleVote.create({
        data: {
          userId: user.id,
          postId: post.id,
          type: 'like'
        }
      });
      console.log('✅ Vote created successfully:', vote);
    } catch (error) {
      console.log('❌ Error creating vote:', error.message);
      console.log('Error code:', error.code);
      
      if (error.code === 'P2003') {
        console.log('\nForeign key issue detected. Checking references...');
        
        // Check if user exists in User table
        const userCheck = await prisma.user.findUnique({
          where: { id: user.id }
        });
        console.log('User exists in User table:', !!userCheck);
        
        // Check if post exists in Post table
        const postCheck = await prisma.post.findUnique({
          where: { id: post.id }
        });
        console.log('Post exists in Post table:', !!postCheck);
      }
    }
    
  } catch (error) {
    console.error('Main error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testVote();