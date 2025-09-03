const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestSession() {
  try {
    // Find the admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'adam.freundt@gmail.com' }
    });
    
    if (!adminUser) {
      console.log('Admin user not found');
      return;
    }
    
    console.log('Found admin user:', adminUser.email);
    
    // Create a Google account for this user if it doesn't exist
    const existingAccount = await prisma.account.findFirst({
      where: {
        userId: adminUser.id,
        provider: 'google'
      }
    });
    
    if (!existingAccount) {
      console.log('Creating Google account for admin user...');
      await prisma.account.create({
        data: {
          userId: adminUser.id,
          type: 'oauth',
          provider: 'google',
          providerAccountId: 'google-test-123',
          access_token: 'fake-access-token',
          token_type: 'Bearer',
          scope: 'openid email profile'
        }
      });
      console.log('Created Google account');
    } else {
      console.log('Google account already exists');
    }
    
    // Create a session for the admin user
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now
    
    const session = await prisma.session.create({
      data: {
        sessionToken: 'test-session-token-' + Date.now(),
        userId: adminUser.id,
        expires: expiresAt
      }
    });
    
    console.log('Created session:', session.sessionToken);
    console.log('Session expires:', session.expires);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestSession();