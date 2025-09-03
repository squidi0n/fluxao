import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@fluxao.local' },
    });

    if (existingAdmin) {
      // console.log('Admin user already exists');
      // console.log('Email: admin@fluxao.local');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    const admin = await prisma.user.create({
      data: {
        email: 'admin@fluxao.local',
        passwordHash: hashedPassword,
        name: 'Admin',
        username: 'admin',
        role: 'ADMIN',
        emailVerified: new Date(),
        emailVerifiedLegacy: true,
        isAdmin: true,
        bio: 'System Administrator',
        website: 'https://fluxao.local',
        location: 'System',
      },
    });

    // console.log('Admin user created successfully!');
    // console.log('----------------------------');
    // console.log('Email: admin@fluxao.local');
    // console.log('Password: Admin123!');
    // console.log('----------------------------');
    // console.log('Login at: http://localhost:3000/admin');
  } catch (error) {
    // console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
