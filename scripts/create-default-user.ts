import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if default user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@fluxao.de' },
    });

    if (existingUser) {
      // console.log('Default user already exists');
      return;
    }

    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const user = await prisma.user.create({
      data: {
        id: '1',
        email: 'admin@fluxao.de',
        name: 'Admin',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date(),
        isAdmin: true,
      },
    });

    // console.log('Default admin user created:', user.email);
  } catch (error) {
    // console.error('Error creating default user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
