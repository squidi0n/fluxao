import { PrismaClient, Role, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUsers() {
  // console.log('🔧 Erstelle Test-User...');

  // 1. Admin User (du)
  const adminPassword = await bcrypt.hash('Admin123!@#', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fluxao.com' },
    update: {},
    create: {
      email: 'admin@fluxao.com',
      name: 'FluxAO Admin',
      username: 'admin',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      isAdmin: true,
      emailVerified: new Date(),
      emailVerifiedLegacy: true,
      bio: '👑 Founder & Chief Editor von FluxAO. Tech-Enthusiast, KI-Explorer und Gaming-Philosoph.',
      subscription: {
        create: {
          plan: SubscriptionPlan.ENTERPRISE,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 Jahr
        },
      },
    },
  });
  // console.log('✅ Admin erstellt:', admin.email);

  // 2. Premium User
  const premiumPassword = await bcrypt.hash('Premium123!', 10);
  const premium = await prisma.user.upsert({
    where: { email: 'premium@test.com' },
    update: {},
    create: {
      email: 'premium@test.com',
      name: 'Max Premium',
      username: 'maxpremium',
      passwordHash: premiumPassword,
      role: Role.USER,
      emailVerified: new Date(),
      emailVerifiedLegacy: true,
      bio: '⚡ Premium Member seit Tag 1. Gaming & Tech Enthusiast.',
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

  // 3. Normal User (Free)
  const normalPassword = await bcrypt.hash('User123!', 10);
  const normal = await prisma.user.upsert({
    where: { email: 'user@test.com' },
    update: {},
    create: {
      email: 'user@test.com',
      name: 'Lisa Normal',
      username: 'lisanormal',
      passwordHash: normalPassword,
      role: Role.USER,
      emailVerified: new Date(),
      emailVerifiedLegacy: true,
      bio: 'Neue hier! Interessiert an Tech und Gaming.',
      subscription: {
        create: {
          plan: SubscriptionPlan.FREE,
          status: SubscriptionStatus.ACTIVE,
        },
      },
    },
  });
  // console.log('✅ Normal User erstellt:', normal.email);

  // console.log('\n📝 Login-Daten:');
  // console.log('────────────────────────────');
  // console.log('Admin:   admin@fluxao.com / Admin123!@#');
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
