const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isAdmin: true,
        passwordHash: true
      }
    });
    
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - hasPassword: ${!!user.passwordHash} - isAdmin: ${user.isAdmin}`);
    });
    
    if (users.length === 0) {
      console.log('No users found. Creating test admin user...');
      
      // Create a test admin user
      const { hashPassword } = require('../lib/password');
      const hashedPassword = await hashPassword('admin123');
      
      const adminUser = await prisma.user.create({
        data: {
          email: 'admin@test.com',
          name: 'Test Admin',
          role: 'ADMIN',
          isAdmin: true,
          passwordHash: hashedPassword,
          emailVerified: new Date(),
          emailVerifiedLegacy: true
        }
      });
      
      console.log('Created admin user:', adminUser.email);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();