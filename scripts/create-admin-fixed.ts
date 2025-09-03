import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const email = 'admin@fluxao.com';
    const password = 'Admin123!@#';

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      // console.log('Admin user already exists, updating password...');
      // Update password for existing user
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { email },
        data: {
          passwordHash: hashedPassword,
          role: 'ADMIN',
          emailVerifiedLegacy: true,
        },
      });
      // console.log('✅ Admin password updated successfully!');
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash(password, 10);

      const admin = await prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          name: 'Admin',
          role: 'ADMIN',
          emailVerifiedLegacy: true,
        },
      });
      // console.log('✅ Admin user created successfully!');
    }

    // console.log('----------------------------');
    // console.log('📧 Email:', email);
    // console.log('🔑 Password:', password);
    // console.log('----------------------------');
    // console.log('🔗 Login at: http://localhost:3012/auth/login');
    // console.log('⚙️ Admin at: http://localhost:3012/admin');
  } catch (error) {
    // console.error('❌ Error creating/updating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
