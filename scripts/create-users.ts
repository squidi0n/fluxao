import { hashPassword } from '../lib/auth';
import { prisma } from '../lib/prisma';

async function createTestUsers() {
  // console.log('🔧 Erstelle Test-User...');

  const users = [
    {
      email: 'admin@fluxao.com',
      password: 'Admin123!@#',
      name: 'Admin User',
      role: 'ADMIN' as const,
    },
    {
      email: 'premium@test.com',
      password: 'Premium123!',
      name: 'Max Premium',
      role: 'USER' as const,
      subscription: 'PRO' as const,
    },
    {
      email: 'user@test.com',
      password: 'User123!',
      name: 'Lisa Normal',
      role: 'USER' as const,
      subscription: 'FREE' as const,
    },
  ];

  for (const userData of users) {
    const hashedPassword = await hashPassword(userData.password);

    // Create or update user
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        passwordHash: hashedPassword,
        name: userData.name,
        role: userData.role,
      },
      create: {
        email: userData.email,
        passwordHash: hashedPassword,
        name: userData.name,
        role: userData.role,
      },
    });

    // console.log(`✅ User erstellt/aktualisiert: ${user.email}`);

    // Create subscription if needed
    if (userData.subscription) {
      await prisma.subscription.upsert({
        where: { userId: user.id },
        update: {
          plan: userData.subscription,
          status: 'ACTIVE',
        },
        create: {
          userId: user.id,
          plan: userData.subscription,
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });
      // console.log(`   ↳ Subscription: ${userData.subscription}`);
    }
  }

  // console.log('\n📝 Login-Daten:');
  // console.log('────────────────────────────');
  // console.log('Admin:   admin@fluxao.com / Admin123!@#');
  // console.log('Premium: premium@test.com / Premium123!');
  // console.log('Normal:  user@test.com / User123!');
  // console.log('────────────────────────────');

  await prisma.$disconnect();
}

createTestUsers().catch(console.error);
