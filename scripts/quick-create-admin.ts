import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Check if admin exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('SecureAdmin123!', 12);
    
    const admin = await prisma.user.create({
      data: {
        email: 'adam.freundt@gmail.com',
        name: 'Adam Freundt',
        username: 'adamfreundt',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        isAdmin: true,
        emailVerified: new Date(),
        emailVerifiedLegacy: true,
        isPublic: false,
      }
    });

    console.log('✅ Admin user created:', admin.email);
    console.log('📧 Email: adam.freundt@gmail.com');
    console.log('🔑 Password: SecureAdmin123!');
    console.log('👤 Role: ADMIN');
    console.log('🆔 ID:', admin.id);
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();