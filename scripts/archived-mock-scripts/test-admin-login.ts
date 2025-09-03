import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testAdminLogin() {
  try {
    console.log('🔍 Testing Admin Login...\n');
    
    // Find admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'adam.freundt@gmail.com' }
    });
    
    if (!adminUser) {
      console.error('❌ Admin user not found!');
      return;
    }
    
    console.log('✅ Admin user found:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   isAdmin: ${adminUser.isAdmin}`);
    console.log(`   Email Verified: ${adminUser.emailVerified ? 'Yes' : 'No'}`);
    
    // Test password
    const passwordTest = await bcrypt.compare('SecureAdmin123!', adminUser.passwordHash || '');
    console.log(`   Password Test: ${passwordTest ? '✅ Valid' : '❌ Invalid'}`);
    
    console.log('\n📋 RBAC Testing:');
    
    // Simulate RBAC check
    const userRole = adminUser.role;
    const roleHierarchy = {
      'USER': 0,
      'PREMIUM': 1,
      'EDITOR': 2,
      'ADMIN': 3
    };
    
    const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy];
    const requiredLevel = roleHierarchy['ADMIN'];
    
    const hasAdminAccess = userLevel >= requiredLevel;
    console.log(`   Role Level: ${userLevel}/3 (${userRole})`);
    console.log(`   Required Level: ${requiredLevel}/3 (ADMIN)`);
    console.log(`   Admin Access: ${hasAdminAccess ? '✅ Granted' : '❌ Denied'}`);
    
    console.log('\n🎯 Login Test Results:');
    console.log(`   📧 Email: adam.freundt@gmail.com`);
    console.log(`   🔑 Password: SecureAdmin123!`);
    console.log(`   🎭 Role: ADMIN`);
    console.log(`   🔐 Can access /admin/posts/new: ${hasAdminAccess ? 'YES' : 'NO'}`);
    
    if (hasAdminAccess) {
      console.log('\n🚀 READY TO TEST:');
      console.log('   1. Go to http://localhost:3000/auth/login');
      console.log('   2. Use email: adam.freundt@gmail.com');
      console.log('   3. Use password: SecureAdmin123!');
      console.log('   4. Access: http://localhost:3000/admin/posts/new');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminLogin();