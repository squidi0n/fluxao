const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../lib/password');

const prisma = new PrismaClient();

async function createAdminWithPassword() {
  try {
    const email = 'admin@test.com';
    const password = 'admin123';
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      console.log('Admin user already exists:', email);
      
      if (!existingUser.passwordHash) {
        console.log('Adding password to existing admin user...');
        const hashedPassword = await hashPassword(password);
        
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            passwordHash: hashedPassword,
            emailVerified: new Date(),
            emailVerifiedLegacy: true
          }
        });
        
        console.log('Password added to admin user');
      }
      
      return;
    }
    
    // Create new admin user
    console.log('Creating new admin user with credentials...');
    const hashedPassword = await hashPassword(password);
    
    const adminUser = await prisma.user.create({
      data: {
        email,
        name: 'Test Admin',
        role: 'ADMIN',
        isAdmin: true,
        passwordHash: hashedPassword,
        emailVerified: new Date(),
        emailVerifiedLegacy: true
      }
    });
    
    console.log('✅ Admin user created:');
    console.log('  Email:', email);
    console.log('  Password:', password);
    console.log('  Role:', adminUser.role);
    console.log('  isAdmin:', adminUser.isAdmin);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminWithPassword();