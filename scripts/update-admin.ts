import { PrismaClient, Role, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function updateAdmin() {
  // console.log('\n🔧 Updating database users...\n');

  // 1. First, delete related data for users to be deleted
  // console.log('🗑️  Cleaning up related data...');

  const usersToDelete = await prisma.user.findMany({
    where: {
      email: {
        not: 'adam.freundt@gmail.com',
      },
    },
    select: { id: true, email: true },
  });

  for (const user of usersToDelete) {
    // console.log(`  Deleting data for ${user.email}...`);

    // Delete subscriptions
    await prisma.subscription.deleteMany({
      where: { userId: user.id },
    });

    // Delete posts
    await prisma.post.deleteMany({
      where: { authorId: user.id },
    });

    // Delete comments (use authorEmail instead of authorId)
    await prisma.comment.deleteMany({
      where: { authorEmail: user.email },
    });

    // Delete sessions if they exist
    try {
      await prisma.session.deleteMany({
        where: { userId: user.id },
      });
    } catch (e) {
      // Sessions table might not exist
    }

    // Delete accounts if they exist
    try {
      await prisma.account.deleteMany({
        where: { userId: user.id },
      });
    } catch (e) {
      // Accounts table might not exist
    }
  }

  // Now delete the users
  // console.log('🗑️  Deleting users...');
  const deleted = await prisma.user.deleteMany({
    where: {
      email: {
        not: 'adam.freundt@gmail.com',
      },
    },
  });
  // console.log(`✅ Deleted ${deleted.count} users\n`);

  // 2. Update Adam to ADMIN with full access
  // console.log('👑 Updating adam.freundt@gmail.com to ADMIN...');
  const adam = await prisma.user.update({
    where: {
      email: 'adam.freundt@gmail.com',
    },
    data: {
      role: Role.ADMIN,
      isAdmin: true,
      emailVerified: new Date(),
      emailVerifiedLegacy: true,
      name: 'Adam Freundt',
      bio: '👑 Founder & Chief Admin von FluxAO',
      subscription: {
        upsert: {
          create: {
            plan: SubscriptionPlan.ENTERPRISE,
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 Jahr
          },
          update: {
            plan: SubscriptionPlan.ENTERPRISE,
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 Jahr
          },
        },
      },
    },
    include: {
      subscription: true,
    },
  });

  // console.log('\n✅ SUCCESS! Updated user:');
  // console.log('==========================');
  // console.log(`📧 Email: ${adam.email}`);
  // console.log(`👤 Name: ${adam.name}`);
  // console.log(`🎭 Role: ${adam.role} (Full Admin Access)`);
  // console.log(`💎 Subscription: ${adam.subscription?.plan} (${adam.subscription?.status})`);
  // console.log(`✉️  Email Verified: ✅`);
  // console.log('==========================\n');

  // 3. Show final user count
  const totalUsers = await prisma.user.count();
  // console.log(`📊 Total users in database: ${totalUsers}`);
  // console.log('🎉 You are now the sole ADMIN with full access to everything!');
}

updateAdmin()
  .catch((error) => {
    // console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
