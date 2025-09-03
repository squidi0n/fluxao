#!/usr/bin/env node

/**
 * Script to create a test user for FluxAO
 * Usage: node scripts/create-test-user.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🚀 Creating test user...');

    // Test user data
    const userData = {
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'testuser8',
      role: 'USER'
    };

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email.toLowerCase() },
    });

    if (existingUser) {
      console.log('❌ User already exists:', userData.email);
      console.log('User ID:', existingUser.id);
      console.log('Role:', existingUser.role);
      console.log('Created at:', existingUser.createdAt);
      return;
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(userData.password, saltRounds);

    // Generate unique username from email
    const baseUsername = userData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    let username = baseUsername;
    let counter = 0;

    while (true) {
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });

      if (!existingUser) {
        break;
      }

      counter++;
      username = `${baseUsername}${counter}`;
    }

    // Create user with correct field types
    const user = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email.toLowerCase(),
        username,
        passwordHash,
        role: userData.role,
        emailVerified: null,        // DateTime? field - set to null
        emailVerifiedLegacy: false, // Boolean field - set to false
        isPublic: true,
        isAdmin: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        emailVerified: true,
        emailVerifiedLegacy: true,
        isPublic: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    console.log('✅ Test user created successfully!');
    console.log('📧 Email:', user.email);
    console.log('👤 Username:', user.username);
    console.log('🔐 Password:', userData.password);
    console.log('🎯 Role:', user.role);
    console.log('🆔 User ID:', user.id);
    console.log('📅 Created:', user.createdAt);
    console.log('✉️  Email Verified:', user.emailVerified);
    console.log('✉️  Email Verified Legacy:', user.emailVerifiedLegacy);

  } catch (error) {
    console.error('❌ Error creating test user:', error);
    
    if (error.code === 'P2002') {
      console.log('💡 This is likely a unique constraint violation.');
    } else if (error.message.includes('emailVerified')) {
      console.log('💡 This confirms there\'s an issue with the emailVerified field.');
      console.log('📝 Error details:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTestUser().catch(console.error);