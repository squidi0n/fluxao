#!/usr/bin/env ts-node

import { prisma } from '../lib/prisma';

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isAdmin: true,
        createdAt: true,
        emailVerified: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`Found ${users.length} users:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'No Name'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Admin: ${user.isAdmin ? 'Yes' : 'No'}`);
      console.log(`   Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
      console.log(`   Created: ${user.createdAt.toISOString()}`);
      console.log('');
    });

    const adminUsers = users.filter(u => u.role === 'ADMIN' || u.isAdmin);
    console.log(`Admin users: ${adminUsers.length}`);
  } catch (error) {
    console.error('Error listing users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();