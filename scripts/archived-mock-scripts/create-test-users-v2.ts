import { PrismaClient, Role, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUsers() {
  // console.log('\n🔧 Erstelle Test-User für Development...\n');

  // 1. Premium Test User
  const premiumPassword = await bcrypt.hash('Premium123!', 10);
  const premium = await prisma.user.upsert({
    where: { email: 'premium@test.com' },
    update: {
      passwordHash: premiumPassword,
      role: Role.USER,
    },
    create: {
      email: 'premium@test.com',
      name: 'Max Premium',
      username: 'maxpremium',
      passwordHash: premiumPassword,
      role: Role.USER,
      emailVerified: new Date(),
      emailVerifiedLegacy: true,
      bio: '⚡ Premium Test Account',
      subscription: {
        create: {
          plan: SubscriptionPlan.PRO,
          status: SubscriptionStatus.ACTIVE,
          stripePriceId: 'price_dummy_pro',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 Tage
        },
      },
    },
  });
  // console.log('✅ Premium User erstellt:', premium.email);

  // 2. Normal User (Free)
  const normalPassword = await bcrypt.hash('User123!', 10);
  const normal = await prisma.user.upsert({
    where: { email: 'user@test.com' },
    update: {
      passwordHash: normalPassword,
      role: Role.USER,
    },
    create: {
      email: 'user@test.com',
      name: 'Lisa Normal',
      username: 'lisanormal',
      passwordHash: normalPassword,
      role: Role.USER,
      emailVerified: new Date(),
      emailVerifiedLegacy: true,
      bio: 'Normal Test Account',
      subscription: {
        create: {
          plan: SubscriptionPlan.FREE,
          status: SubscriptionStatus.ACTIVE,
        },
      },
    },
  });
  // console.log('✅ Normal User erstellt:', normal.email);

  // 3. Show all users
  const allUsers = await prisma.user.findMany({
    select: {
      email: true,
      name: true,
      role: true,
      subscription: {
        select: { plan: true },
      },
    },
    orderBy: { role: 'asc' },
  });

  // console.log('\n📝 Aktuelle User in der Datenbank:');
  // console.log('────────────────────────────');
  allUsers.forEach((user) => {
    const icon = user.role === 'ADMIN' ? '👑' : user.subscription?.plan === 'PRO' ? '⚡' : '👤';
    // console.log(`${icon} ${user.email} (${user.role}) - ${user.subscription?.plan || 'FREE'}`);
  });

  // console.log('\n📝 Login-Daten für Test-User:');
  // console.log('────────────────────────────');
  // console.log('Premium: premium@test.com / Premium123!');
  // console.log('Normal:  user@test.com / User123!');
  // console.log('────────────────────────────');
}

createTestUsers()
  .catch((error) => {
    // console.error('❌ Fehler:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
