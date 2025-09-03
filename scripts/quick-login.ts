import { hashPassword } from '../lib/auth';
import { prisma } from '../lib/prisma';

async function createOrUpdateAdminUser() {
  try {
    const hashedPassword = await hashPassword('admin123');

    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@fluxao.com' },
      update: {
        passwordHash: hashedPassword,
        role: 'ADMIN',
        emailVerifiedLegacy: true,
        emailVerified: new Date(),
      },
      create: {
        email: 'admin@fluxao.com',
        name: 'Admin User',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        emailVerifiedLegacy: true,
        emailVerified: new Date(),
      },
    });

    // console.log('✅ Admin user ready:');
    // console.log('📧 Email: admin@fluxao.com');
    // console.log('🔑 Password: admin123');
    // console.log('');
    // console.log('Login URL: http://localhost:3005/auth/login');

    return adminUser;
  } catch (error) {
    // console.error('Error creating admin user:', error);
    throw error;
  }
}

createOrUpdateAdminUser()
  .then(() => {
    // console.log('\n✨ You can now login!');
    process.exit(0);
  })
  .catch((error) => {
    // console.error('Failed:', error);
    process.exit(1);
  });
