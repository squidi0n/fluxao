const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@fluxao.de' },
    update: {
      passwordHash: password,
      role: 'ADMIN',
      isAdmin: true,
    },
    create: {
      email: 'admin@fluxao.de',
      name: 'Admin',
      passwordHash: password,
      role: 'ADMIN',
      isAdmin: true,
      emailVerified: new Date(),
    },
  });

  console.log('Admin user created/updated:');
  console.log('Email: admin@fluxao.de');
  console.log('Password: admin123');
  console.log('Role:', admin.role);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
