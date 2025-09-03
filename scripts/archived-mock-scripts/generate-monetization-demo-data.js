// Demo data generator for monetization features
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function generateMonetizationDemoData() {
  console.log('🚀 Generating monetization demo data...');

  try {
    // Create demo affiliate links
    const affiliateLinks = [
      {
        name: 'JavaScript: The Good Parts - Amazon',
        url: 'https://amazon.com/javascript-good-parts-dp/B0026OR2ZY?tag=yourassociate-20',
        affiliateId: 'yourassociate-20',
        program: 'amazon',
        category: 'books',
        description: 'Essential JavaScript book for developers',
        clicks: 45,
        conversions: 3,
        revenue: 8.99,
        createdBy: 'system',
      },
      {
        name: 'React.js Course - Coursera',
        url: 'https://coursera.org/learn/react-js?affiliate=youraffid',
        affiliateId: 'youraffid',
        program: 'coursera',
        category: 'courses',
        description: 'Complete React.js development course',
        clicks: 78,
        conversions: 8,
        revenue: 156.0,
        createdBy: 'system',
      },
      {
        name: 'VS Code Extension Pack - Custom',
        url: 'https://custom-partner.com/vscode-pack?ref=fluxao',
        affiliateId: 'fluxao',
        program: 'custom',
        category: 'tools',
        description: 'Essential VS Code extensions for developers',
        clicks: 23,
        conversions: 5,
        revenue: 25.0,
        createdBy: 'system',
      },
    ];

    console.log('Creating affiliate links...');
    for (const linkData of affiliateLinks) {
      const existingLink = await prisma.affiliateLink.findFirst({
        where: {
          url: linkData.url,
          program: linkData.program,
          affiliateId: linkData.affiliateId,
        },
      });

      if (existingLink) {
        await prisma.affiliateLink.update({
          where: { id: existingLink.id },
          data: linkData,
        });
      } else {
        await prisma.affiliateLink.create({
          data: linkData,
        });
      }
    }

    // Create demo ad slots
    const adSlots = [
      {
        name: 'Header Banner',
        position: 'header',
        size: '728x90',
        adCode:
          '<div style="background: linear-gradient(45deg, #ff6b6b, #4ecdc4); color: white; padding: 20px; text-align: center; border-radius: 8px;"><h3>Demo Header Ad</h3><p>This is a demo banner ad slot</p></div>',
        isActive: true,
        priority: 1,
        impressions: 1250,
        clicks: 15,
        revenue: 37.5,
      },
      {
        name: 'Sidebar Banner',
        position: 'sidebar',
        size: '300x250',
        adCode:
          '<div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 30px; text-align: center; border-radius: 12px; height: 250px; display: flex; flex-direction: column; justify-content: center;"><h3>Sidebar Ad</h3><p>Premium advertising space</p><button style="background: rgba(255,255,255,0.2); border: 1px solid white; color: white; padding: 8px 16px; border-radius: 4px; margin-top: 10px;">Learn More</button></div>',
        isActive: true,
        priority: 2,
        impressions: 890,
        clicks: 12,
        revenue: 28.8,
      },
      {
        name: 'Content Banner',
        position: 'content',
        size: '728x90',
        adCode:
          '<div style="background: linear-gradient(90deg, #f093fb, #f5576c); color: white; padding: 20px; text-align: center; border-radius: 8px;"><h3>Content Ad</h3><p>Contextual advertising within articles</p></div>',
        isActive: true,
        priority: 3,
        impressions: 2100,
        clicks: 28,
        revenue: 84.0,
      },
      {
        name: 'Mobile Banner',
        position: 'content',
        size: '320x50',
        adCode:
          '<div style="background: linear-gradient(45deg, #fa709a, #fee140); color: white; padding: 10px; text-align: center; border-radius: 6px; height: 50px; display: flex; align-items: center; justify-content: center;"><span>Mobile Ad Space</span></div>',
        isActive: true,
        priority: 1,
        impressions: 3400,
        clicks: 45,
        revenue: 68.0,
      },
    ];

    console.log('Creating ad slots...');
    for (const slotData of adSlots) {
      const existingSlot = await prisma.adSlot.findFirst({
        where: {
          name: slotData.name,
          position: slotData.position,
        },
      });

      if (existingSlot) {
        await prisma.adSlot.update({
          where: { id: existingSlot.id },
          data: slotData,
        });
      } else {
        await prisma.adSlot.create({
          data: slotData,
        });
      }
    }

    // Create some demo revenue records
    console.log('Creating revenue records...');
    const revenueData = [
      {
        type: 'AFFILIATE',
        source: 'amazon-javascript-book',
        amount: 899, // $8.99 in cents
        currency: 'USD',
        description: 'JavaScript book commission',
        metadata: { program: 'amazon', clicks: 3 },
      },
      {
        type: 'AFFILIATE',
        source: 'coursera-react-course',
        amount: 15600, // $156.00 in cents
        currency: 'USD',
        description: 'React course commission',
        metadata: { program: 'coursera', clicks: 8 },
      },
      {
        type: 'ADVERTISING',
        source: 'header-banner-cpm',
        amount: 3750, // $37.50 in cents
        currency: 'USD',
        description: 'Header banner CPM revenue',
        metadata: { impressions: 1250, clicks: 15 },
      },
      {
        type: 'ADVERTISING',
        source: 'sidebar-banner-cpc',
        amount: 2880, // $28.80 in cents
        currency: 'USD',
        description: 'Sidebar banner CPC revenue',
        metadata: { clicks: 12 },
      },
      {
        type: 'SUBSCRIPTION',
        source: 'stripe-demo-subscription',
        amount: 499, // €4.99 in cents
        currency: 'EUR',
        description: 'Premium subscription payment',
        metadata: { plan: 'PREMIUM', userId: 'demo-user' },
      },
    ];

    for (const revenue of revenueData) {
      await prisma.revenueRecord.create({
        data: {
          ...revenue,
          recordedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        },
      });
    }

    // Create some demo premium content
    console.log('Creating premium content examples...');
    const posts = await prisma.post.findMany({ take: 3 });

    if (posts.length > 0) {
      for (let i = 0; i < Math.min(2, posts.length); i++) {
        await prisma.premiumContent.upsert({
          where: { postId: posts[i].id },
          update: {},
          create: {
            postId: posts[i].id,
            title: 'Premium Content Access Required',
            description: `This ${posts[i].title} contains advanced techniques and insider tips available only to Pro and Premium subscribers.`,
            requiredPlan: i === 0 ? 'PRO' : 'PREMIUM',
            previewLength: 300,
            isActive: true,
            views: Math.floor(Math.random() * 500) + 100,
            subscribers: Math.floor(Math.random() * 50) + 10,
          },
        });
      }
    }

    console.log('✅ Monetization demo data generated successfully!');
    console.log('📊 Data created:');
    console.log('  - 3 affiliate links with click data');
    console.log('  - 4 ad slots with impression data');
    console.log('  - 5 revenue records from different sources');
    console.log('  - 2 premium content examples');
    console.log('');
    console.log('🌟 Visit the following pages to see the results:');
    console.log('  - Admin Monetization Dashboard: http://localhost:3005/admin/monetization');
    console.log('  - Test affiliate links in your content');
    console.log('  - View ad slots on pages');
    console.log('  - See premium content gates on posts');
  } catch (error) {
    console.error('Error generating monetization demo data:', error);
    throw error;
  }
}

generateMonetizationDemoData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
