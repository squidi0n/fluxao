/**
 * Migration script to set up the enhanced user roles and settings system
 * Run with: npx tsx scripts/migrate-user-roles-system.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting user roles system migration...');

  try {
    // Step 1: Apply database schema changes (run prisma db push first)
    console.log('📋 Schema changes should be applied via: npx prisma db push');
    
    // Step 2: Create default user settings for existing users
    console.log('⚙️ Creating default user settings for existing users...');
    
    const usersWithoutSettings = await prisma.user.findMany({
      where: {
        userSettings: null
      },
      select: { id: true }
    });

    console.log(`Found ${usersWithoutSettings.length} users without settings`);

    for (const user of usersWithoutSettings) {
      await prisma.userSettings.create({
        data: {
          userId: user.id,
          emailNotifications: true,
          newsletterSubscription: true,
          commentNotifications: true,
          mentionNotifications: true,
          securityNotifications: true,
          profileVisible: true,
          showEmail: false,
          showLocation: true,
          allowDirectMessages: true,
          language: 'de',
          timezone: 'Europe/Berlin',
          dateFormat: 'DD/MM/YYYY',
          theme: 'system',
          hideAds: false,
          authorPageVisible: true,
        }
      });
    }

    console.log('✅ Created default settings for all users');

    // Step 3: Initialize trial system for existing users
    console.log('🎯 Initializing trial system for existing users...');
    
    const now = new Date();
    const regularUsers = await prisma.user.findMany({
      where: {
        role: 'USER',
        trialStartedAt: null,
        hasUsedTrial: false
      },
      select: { id: true, createdAt: true }
    });

    console.log(`Found ${regularUsers.length} regular users to initialize`);

    // For existing users, we'll mark them as having used trial but not set dates
    // This prevents automatic trial activation for existing users
    for (const user of regularUsers) {
      // If user is newer than 7 days, they can still get a trial
      const daysSinceRegistration = Math.floor(
        (now.getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceRegistration <= 7) {
        // New users get a trial
        const trialEnd = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
        
        await prisma.user.update({
          where: { id: user.id },
          data: {
            trialStartedAt: now,
            trialEndsAt: trialEnd,
            hasUsedTrial: true,
          }
        });
      } else {
        // Older users are marked as having used trial (no automatic trial)
        await prisma.user.update({
          where: { id: user.id },
          data: {
            hasUsedTrial: true,
          }
        });
      }
    }

    console.log('✅ Initialized trial system for all users');

    // Step 4: Create sample categories if none exist
    console.log('📚 Ensuring categories exist for editor permissions...');
    
    const categoryCount = await prisma.category.count();
    if (categoryCount === 0) {
      const sampleCategories = [
        { name: 'KI & Machine Learning', slug: 'ki-machine-learning' },
        { name: 'Web Development', slug: 'web-development' },
        { name: 'Mobile Development', slug: 'mobile-development' },
        { name: 'DevOps & Infrastructure', slug: 'devops-infrastructure' },
        { name: 'Data Science', slug: 'data-science' },
        { name: 'Cybersecurity', slug: 'cybersecurity' },
        { name: 'Gaming & VR', slug: 'gaming-vr' },
      ];

      for (const category of sampleCategories) {
        await prisma.category.create({ data: category });
      }

      console.log('✅ Created sample categories');
    } else {
      console.log(`✅ Categories already exist (${categoryCount} found)`);
    }

    // Step 5: Update existing subscriptions to work with new role system
    console.log('💳 Updating subscription system...');
    
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        plan: { not: 'FREE' }
      },
      include: { user: true }
    });

    for (const subscription of activeSubscriptions) {
      // Update user role based on subscription plan
      let newRole = 'USER';
      if (subscription.plan === 'PRO' || subscription.plan === 'ENTERPRISE') {
        newRole = 'PREMIUM'; // Map PRO/ENTERPRISE to PREMIUM role
      }

      if (subscription.user.role === 'USER') {
        await prisma.user.update({
          where: { id: subscription.user.id },
          data: { role: newRole }
        });
      }
    }

    console.log('✅ Updated subscription role mappings');

    // Step 6: Create audit log entry for migration
    console.log('📝 Creating audit log entry...');
    
    await prisma.auditLog.create({
      data: {
        action: 'SYSTEM_MIGRATION',
        userId: null,
        targetId: null,
        targetType: 'System',
        metadata: {
          migration: 'user-roles-system',
          usersUpdated: usersWithoutSettings.length,
          trialsInitialized: regularUsers.length,
          subscriptionsUpdated: activeSubscriptions.length,
          timestamp: now.toISOString()
        },
        status: 'SUCCESS',
        message: 'Enhanced user roles and settings system migration completed successfully'
      }
    });

    console.log('📊 Migration Statistics:');
    console.log(`  • User settings created: ${usersWithoutSettings.length}`);
    console.log(`  • Trials initialized: ${regularUsers.length}`);
    console.log(`  • Subscriptions updated: ${activeSubscriptions.length}`);
    console.log(`  • Categories available: ${categoryCount || 7}`);

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('  1. Test the new user role system');
    console.log('  2. Verify trial functionality works correctly');
    console.log('  3. Check that settings pages load properly');
    console.log('  4. Test paywall and content restriction');
    console.log('  5. Verify editor permissions work as expected');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });