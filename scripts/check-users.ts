import { prisma } from '../lib/prisma';

async function checkUsers() {
  // console.log('📋 Checking test users...\n');

  const users = await prisma.user.findMany({
    where: {
      email: {
        in: ['admin@fluxao.com', 'premium@test.com', 'user@test.com'],
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      subscription: true,
      createdAt: true,
    },
  });

  for (const user of users) {
    // console.log(`👤 ${user.email}`);
    // console.log(`   Name: ${user.name || 'Not set'}`);
    // console.log(`   Role: ${user.role}`);
    // console.log(`   Subscription: ${user.subscription}`);
    // console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
    // console.log('');
  }

  if (users.length === 0) {
    // console.log('❌ No test users found!');
    // console.log('Run: npx tsx scripts/create-test-users.ts');
  }

  // Fix roles if needed
  const adminUser = users.find((u) => u.email === 'admin@fluxao.com');
  if (adminUser && adminUser.role !== 'ADMIN') {
    // console.log('🔧 Fixing admin role...');
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { role: 'ADMIN' },
    });
    // console.log('✅ Admin role fixed!');
  }

  // Fix premium subscription
  const premiumUser = users.find((u) => u.email === 'premium@test.com');
  if (premiumUser) {
    // Check if subscription exists
    const subscription = await prisma.subscription.findUnique({
      where: { userId: premiumUser.id },
    });

    if (!subscription || subscription.plan !== 'PRO') {
      // console.log('🔧 Fixing premium subscription...');
      if (subscription) {
        // Update existing subscription
        await prisma.subscription.update({
          where: { userId: premiumUser.id },
          data: {
            plan: 'PRO',
            status: 'ACTIVE',
          },
        });
      } else {
        // Create new subscription
        await prisma.subscription.create({
          data: {
            userId: premiumUser.id,
            plan: 'PRO',
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        });
      }
      // console.log('✅ Premium subscription fixed!');
    }
  }

  await prisma.$disconnect();
}

checkUsers().catch(console.error);
