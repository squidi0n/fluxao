import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // console.log('👤 Creating normal user...');

  // Create normal user
  const hashedPassword = await bcrypt.hash('User123!@#', 10);

  const user = await prisma.user.create({
    data: {
      email: 'user@fluxao.de',
      name: 'User',
      passwordHash: hashedPassword,
      role: 'USER',
      emailVerified: new Date(),
      isAdmin: false,
    },
  });

  // console.log('✅ Normal user created');
  // console.log('📧 Email: user@fluxao.de');
  // console.log('🔑 Password: User123!@#');
  // console.log('');
  // console.log('🎉 User account created successfully!');
}

main()
  .catch((e) => {
    // console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
