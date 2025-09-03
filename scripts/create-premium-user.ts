import { PrismaClient, Role, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function createPremiumUser() {
  console.log('\n🌟 Creating Premium User squidion@gmail.com...\n');

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'squidion@gmail.com' }
    });

    if (existingUser) {
      console.log('👤 User already exists, updating to PREMIUM...');
      
      const updatedUser = await prisma.user.update({
        where: { email: 'squidion@gmail.com' },
        data: {
          role: Role.PREMIUM,
          name: 'Squidion Premium',
          emailVerified: new Date(),
          emailVerifiedLegacy: true,
          bio: '🌟 Premium FluxAO User',
          subscription: {
            upsert: {
              create: {
                plan: SubscriptionPlan.PREMIUM,
                status: SubscriptionStatus.ACTIVE,
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 Jahr
              },
              update: {
                plan: SubscriptionPlan.PREMIUM,
                status: SubscriptionStatus.ACTIVE,
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
              }
            }
          }
        },
        include: {
          subscription: true
        }
      });

      console.log('✅ UPDATED Premium User:');
      console.log(`📧 Email: ${updatedUser.email}`);
      console.log(`👤 Name: ${updatedUser.name}`);
      console.log(`🎭 Role: ${updatedUser.role}`);
      console.log(`💎 Subscription: ${updatedUser.subscription?.plan} (${updatedUser.subscription?.status})`);

    } else {
      console.log('🆕 Creating new user...');
      
      const newUser = await prisma.user.create({
        data: {
          email: 'squidion@gmail.com',
          role: Role.PREMIUM,
          name: 'Squidion Premium',
          emailVerified: new Date(),
          emailVerifiedLegacy: true,
          bio: '🌟 Premium FluxAO User',
          subscription: {
            create: {
              plan: SubscriptionPlan.PREMIUM,
              status: SubscriptionStatus.ACTIVE,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 Jahr
            }
          }
        },
        include: {
          subscription: true
        }
      });

      console.log('✅ CREATED Premium User:');
      console.log(`📧 Email: ${newUser.email}`);
      console.log(`👤 Name: ${newUser.name}`);
      console.log(`🎭 Role: ${newUser.role}`);
      console.log(`💎 Subscription: ${newUser.subscription?.plan} (${newUser.subscription?.status})`);
    }

    console.log('\n🌟 PREMIUM USER RIGHTS:');
    console.log('✅ Read ALL articles (including premium content)');
    console.log('✅ Create, read and like comments');
    console.log('✅ Subscribe to newsletter');
    console.log('✅ Manage own subscription');
    console.log('✅ Full access to premium content');
    console.log('❌ No admin rights (cannot create/edit posts)');

    console.log('\n🎉 squidion@gmail.com is now a PREMIUM user!');

  } catch (error) {
    console.error('❌ Error creating premium user:', error);
    process.exit(1);
  }
}

createPremiumUser()
  .finally(async () => {
    await prisma.$disconnect();
  });