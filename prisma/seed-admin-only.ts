import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // console.log('👤 Creating admin user...');

  // Create only admin user
  const hashedPassword = await bcrypt.hash('Admin123!@#', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@fluxao.de',
      name: 'Admin',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
      isAdmin: true,
    },
  });

  // console.log('✅ Admin user created');
  // console.log('📧 Email: admin@fluxao.de');
  // console.log('🔑 Password: Admin123!@#');
  // console.log('');
  // console.log('🎉 System is ready - completely empty except for admin user!');
}

main()
  .catch((e) => {
    // console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
