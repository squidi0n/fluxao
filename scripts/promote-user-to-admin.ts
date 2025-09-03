#!/usr/bin/env ts-node

import { prisma } from '../lib/prisma';

async function promoteUserToAdmin(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        role: 'ADMIN',
        isAdmin: true,
      },
    });

    console.log(`Successfully promoted user ${email} to ADMIN role`);
    console.log(`User ID: ${updatedUser.id}`);
    console.log(`User Name: ${updatedUser.name}`);
    console.log(`User Role: ${updatedUser.role}`);
  } catch (error) {
    console.error('Error promoting user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('Usage: ts-node scripts/promote-user-to-admin.ts <email>');
  process.exit(1);
}

promoteUserToAdmin(email);