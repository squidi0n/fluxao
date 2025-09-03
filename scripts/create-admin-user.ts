import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    const email = 'admin@fluxao.de';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Update existing user to admin
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          role: 'ADMIN',
          passwordHash: hashedPassword,
          emailVerified: new Date(),
          isAdmin: true,
          name: 'Admin',
        },
      });
      // console.log('✅ Existing user updated to admin:', updatedUser.email);
    } else {
      // Create new admin user
      const newUser = await prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          role: 'ADMIN',
          name: 'Admin',
          emailVerified: new Date(),
          isAdmin: true,
          username: 'admin',
        },
      });
      // console.log('✅ Admin user created:', newUser.email);
    }

    // console.log('\n📧 Email:', email);
    // console.log('🔐 Password:', password);
    // console.log('\n⚠️  WICHTIG: Bitte ändern Sie das Passwort nach dem ersten Login!');
  } catch (error) {
    // console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
