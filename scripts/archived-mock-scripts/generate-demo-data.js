// Demo data generator for A/B tests
const { randomUUID } = require('crypto');

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function generateDemoData() {
  console.log('🚀 Generating demo A/B test data...');

  // Initialize newsletter A/B tests first
  await initializeNewsletterTests();

  // Generate test assignments and events
  await generateTestData();

  console.log('✅ Demo data generated successfully!');
  console.log('Visit http://localhost:3005/admin/abtests to see results');
}

async function initializeNewsletterTests() {
  // Newsletter opt-in variant test
  await prisma.aBTest.upsert({
    where: { id: 'newsletter_optin_variant' },
    update: {},
    create: {
      id: 'newsletter_optin_variant',
      name: 'Newsletter Opt-In Variant Test',
      description: 'Test inline vs modal newsletter signup forms',
      status: 'ACTIVE',
      targetMetric: 'newsletter_conversion',
      trafficAllocation: 100,
      startDate: new Date(),
      variants: {
        create: [
          {
            id: 'inline',
            name: 'Inline Form',
            weight: 50,
            config: { type: 'inline', position: 'content' },
          },
          {
            id: 'modal',
            name: 'Modal Popup',
            weight: 50,
            config: { type: 'modal', trigger: 'scroll' },
          },
        ],
      },
    },
  });

  console.log('✓ Newsletter A/B test initialized');
}

async function generateTestData() {
  const testId = 'newsletter_optin_variant';
  const variants = ['inline', 'modal'];

  // Generate 200 assignments (100 per variant)
  for (let i = 0; i < 200; i++) {
    const sessionId = `demo-session-${i}`;
    const variant = variants[i % 2];

    // Create assignment
    await prisma.aBTestAssignment.create({
      data: {
        testId,
        variantId: variant,
        sessionId,
        assignedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Generate view event (100% of assignments)
    await prisma.aBTestEvent.create({
      data: {
        testId,
        variantId: variant,
        eventType: 'newsletter_view',
        sessionId,
        metadata: { source: 'demo', variant },
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Generate click event (60% conversion from view)
    if (Math.random() < 0.6) {
      await prisma.aBTestEvent.create({
        data: {
          testId,
          variantId: variant,
          eventType: 'newsletter_click',
          sessionId,
          metadata: { source: 'demo', variant },
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        },
      });

      // Generate signup event (different rates for variants)
      const conversionRate = variant === 'modal' ? 0.15 : 0.08; // Modal performs better
      if (Math.random() < conversionRate) {
        await prisma.aBTestEvent.create({
          data: {
            testId,
            variantId: variant,
            eventType: 'newsletter_conversion',
            sessionId,
            metadata: { source: 'demo', variant },
            createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }
  }

  console.log('✓ Generated 200 test assignments with events');
}

generateDemoData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
