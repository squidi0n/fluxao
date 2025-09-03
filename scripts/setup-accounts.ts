import bcrypt from 'bcryptjs';

import { prisma } from '../lib/prisma';

async function setupAccounts() {
  // console.log('🔐 Setting up user accounts...');

  try {
    // Admin Account
    const adminPassword = 'FluxAdmin2024!';
    const adminHashedPassword = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.user.upsert({
      where: { email: 'admin@fluxao.de' },
      update: {
        passwordHash: adminHashedPassword,
        role: 'ADMIN',
        isAdmin: true,
        name: 'Admin',
        emailVerified: new Date(),
        emailVerifiedLegacy: true,
      },
      create: {
        email: 'admin@fluxao.de',
        name: 'Admin',
        passwordHash: adminHashedPassword,
        role: 'ADMIN',
        isAdmin: true,
        emailVerified: new Date(),
        emailVerifiedLegacy: true,
        isPublic: false,
      },
    });

    // console.log('✅ Admin account:');
    // console.log('   Email: admin@fluxao.de');
    // console.log('   Password: FluxAdmin2024!');
    // console.log('');

    // Normal User Account
    const userPassword = 'FluxUser2024!';
    const userHashedPassword = await bcrypt.hash(userPassword, 12);

    const user = await prisma.user.upsert({
      where: { email: 'user@fluxao.de' },
      update: {
        passwordHash: userHashedPassword,
        role: 'USER',
        isAdmin: false,
        name: 'Test User',
        emailVerified: new Date(),
        emailVerifiedLegacy: true,
      },
      create: {
        email: 'user@fluxao.de',
        name: 'Test User',
        passwordHash: userHashedPassword,
        role: 'USER',
        isAdmin: false,
        emailVerified: new Date(),
        emailVerifiedLegacy: true,
        isPublic: true,
      },
    });

    // console.log('✅ User account:');
    // console.log('   Email: user@fluxao.de');
    // console.log('   Password: FluxUser2024!');
    // console.log('');

    // console.log('🎉 Both accounts are ready!');
    // console.log('📌 Login at: http://localhost:3003/auth/login');
  } catch (error) {
    // console.error('❌ Error setting up accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupAccounts();
