import { PrismaClient } from '@prisma/client';

import { hashPassword } from '../lib/password';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const email = 'admin@fluxao.com';
    const password = 'Admin123!@#';

    // Check if admin exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email },
    });

    const hashedPassword = await hashPassword(password);

    let admin;
    if (existingAdmin) {
      // Update existing admin
      admin = await prisma.user.update({
        where: { email },
        data: {
          passwordHash: hashedPassword,
          role: 'ADMIN',
          emailVerifiedLegacy: true,
          isAdmin: true,
          emailVerified: new Date(),
        },
      });
      // console.log('✅ Admin user updated successfully!');
    } else {
      // Create new admin user
      admin = await prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          name: 'Admin',
          role: 'ADMIN',
          emailVerifiedLegacy: true,
          isAdmin: true,
          emailVerified: new Date(),
        },
      });
      // console.log('✅ Admin user created successfully!');
    }
    // console.log('----------------------------');
    // console.log('📧 Email:', email);
    // console.log('🔑 Password:', password);
    // console.log('👤 Role:', admin.role);
    // console.log('✉️ Email Verified:', admin.emailVerified);
    // console.log('----------------------------');
    // console.log('🔗 Login at: http://localhost:3012/auth/login');
    // console.log('⚙️ Admin at: http://localhost:3012/admin');
  } catch (error) {
    // console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
