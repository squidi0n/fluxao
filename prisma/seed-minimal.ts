import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // console.log('🧹 Cleaning database...');

  // Delete all data in reverse order of dependencies
  // Skip tables that might not exist
  try {
    await prisma.readingHistory.deleteMany();
  } catch {}
  try {
    await prisma.postScore.deleteMany();
  } catch {}
  try {
    await prisma.flux.deleteMany();
  } catch {}
  try {
    await prisma.premiumContent.deleteMany();
  } catch {}
  await prisma.comment.deleteMany();
  await prisma.postTag.deleteMany();
  await prisma.postCategory.deleteMany();
  await prisma.post.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.newsletterSubscriber.deleteMany();
  try {
    await prisma.newsletterTemplate.deleteMany();
  } catch {}
  try {
    await prisma.newsletterCampaign.deleteMany();
  } catch {}
  try {
    await prisma.newsletterLog.deleteMany();
  } catch {}
  await prisma.siteSettings.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // console.log('✅ Database cleaned');

  // console.log('👤 Creating admin user...');

  // Create only admin user
  const hashedPassword = await bcrypt.hash('Admin123!@#', 10);

  await prisma.user.create({
    data: {
      id: 'admin-user-id',
      email: 'admin@fluxao.com',
      name: 'Admin',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      isActive: true,
      emailVerified: new Date(),
    },
  });

  // console.log('✅ Admin user created');
  // console.log('📧 Email: admin@fluxao.com');
  // console.log('🔑 Password: Admin123!@#');
  // console.log('');
  // console.log('🎉 Minimal setup complete - system is ready for fresh data!');
}

main()
  .catch((e) => {
    // console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
