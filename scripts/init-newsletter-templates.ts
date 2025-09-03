#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { createDefaultTemplates } from '../lib/newsletter-templates';

const prisma = new PrismaClient();

async function initNewsletterTemplates() {
  try {
    console.log('🚀 Initializing newsletter templates...');

    // Check if templates already exist
    const existingTemplates = await prisma.newsletterTemplate.count();
    
    if (existingTemplates > 0) {
      console.log(`✅ Found ${existingTemplates} existing templates. Skipping initialization.`);
      return;
    }

    // Create default templates
    const createdTemplates = await createDefaultTemplates();
    
    console.log(`✅ Created ${createdTemplates.length} default newsletter templates:`);
    createdTemplates.forEach(template => {
      console.log(`   - ${template.name} (${template.category})`);
    });

    // Also ensure we have some basic settings
    const settings = [
      {
        key: 'newsletter_from_email',
        value: process.env.NEWSLETTER_FROM_EMAIL || 'newsletter@fluxao.com',
      },
      {
        key: 'newsletter_from_name',
        value: 'FluxAO Team',
      },
      {
        key: 'newsletter_reply_to',
        value: process.env.NEWSLETTER_REPLY_TO || 'hello@fluxao.com',
      },
      {
        key: 'newsletter_send_enabled',
        value: 'true',
      },
    ];

    for (const setting of settings) {
      await prisma.setting.upsert({
        where: { key: setting.key },
        update: {},
        create: {
          key: setting.key,
          value: setting.value,
        }
      });
    }

    console.log('✅ Newsletter settings initialized');

    // Create a test subscriber if none exist
    const subscriberCount = await prisma.newsletterSubscriber.count();
    if (subscriberCount === 0) {
      await prisma.newsletterSubscriber.create({
        data: {
          email: 'admin@fluxao.com',
          status: 'verified',
          frequency: 'weekly',
          categories: ['tech', 'ai'],
          preferences: {
            allowTracking: false,
            allowPersonalization: false,
          }
        }
      });
      console.log('✅ Created test subscriber');
    }

    console.log('\n🎉 Newsletter system initialized successfully!');
    console.log('\nNext steps:');
    console.log('1. Go to /admin/newsletter to manage newsletters');
    console.log('2. Go to /admin/newsletter/create to create your first newsletter');
    console.log('3. Check /admin/newsletter/templates to see available templates');

  } catch (error) {
    console.error('❌ Failed to initialize newsletter templates:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  initNewsletterTemplates();
}

export { initNewsletterTemplates };