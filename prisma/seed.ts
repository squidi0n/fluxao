import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Make Adam admin - he uses Google OAuth
  const adamEmail = 'adam.freundt@gmail.com';

  console.log(`Ensuring ${adamEmail} is admin...`);

  // Update Adam to admin if he exists, or create him as admin
  const adamUser = await prisma.user.upsert({
    where: { email: adamEmail },
    update: {
      role: Role.ADMIN,
      isAdmin: true,
      emailVerifiedLegacy: true,
      emailVerified: new Date(),
    },
    create: {
      email: adamEmail,
      name: 'Adam Freundt',
      role: Role.ADMIN,
      isAdmin: true,
      emailVerifiedLegacy: true,
      emailVerified: new Date(),
      // No password needed - using Google OAuth
    },
  });

  console.log('✅ Adam is now admin!');

  // Create essential categories only (existing categories will be preserved)
  const categories = [
    { name: 'KI & Tech', slug: 'ki-tech' },
    { name: 'Mensch & Gesellschaft', slug: 'mensch-gesellschaft' },
    { name: 'Design & Ästhetik', slug: 'design-aesthetik' },
    { name: 'Gaming & Kultur', slug: 'gaming-kultur' },
    { name: 'Mindset & Philosophie', slug: 'mindset-philosophie' },
    { name: 'Business & Finance', slug: 'business-finance' },
    { name: 'Future & Science', slug: 'future-science' },
    { name: 'Fiction Lab', slug: 'fiction-lab' },
  ];

  const createdCategories = [];
  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    createdCategories.push(category);
  }

  console.log('✅ Created categories');

  // Create essential settings
  const settings = [
    { key: 'site_title', value: 'FluxAO' },
    {
      key: 'site_description',
      value: 'Tech & AI Magazin - Die neuesten Entwicklungen in KI und Technologie',
    },
    { key: 'posts_per_page', value: '10' },
    { key: 'registration_enabled', value: 'true' },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log('✅ Created settings');

  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('Note: This seed script only creates essential system data.');
  console.log('Real content (posts, comments, etc.) should be created through the application.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });