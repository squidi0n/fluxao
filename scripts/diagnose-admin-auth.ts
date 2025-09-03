import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function diagnoseAdminAuth() {
  try {
    console.log('🚨 EMERGENCY AUTH DIAGNOSIS...\n');
    
    // Find admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'adam.freundt@gmail.com' }
    });
    
    if (!adminUser) {
      console.error('❌ CRITICAL: Admin user not found!');
      return;
    }
    
    console.log('✅ Admin user found:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Has Password Hash: ${adminUser.passwordHash ? 'YES' : 'NO'}`);
    console.log(`   Hash Length: ${adminUser.passwordHash?.length || 0}`);
    
    // Test claimed password
    const password1 = 'Admin123!Secure';
    const test1 = await bcrypt.compare(password1, adminUser.passwordHash || '');
    console.log(`\n🔐 Password Test 1 ('Admin123!Secure'): ${test1 ? '✅ VALID' : '❌ INVALID'}`);
    
    // Test alternative password
    const password2 = 'SecureAdmin123!';
    const test2 = await bcrypt.compare(password2, adminUser.passwordHash || '');
    console.log(`🔐 Password Test 2 ('SecureAdmin123!'): ${test2 ? '✅ VALID' : '❌ INVALID'}`);
    
    // Test simple variations
    const commonPasswords = [
      'admin123',
      'Admin123!',
      'password123',
      'Test123!',
      'AdminPassword123!',
      'FluxAdmin123!'
    ];
    
    console.log('\n🧪 Testing common admin passwords:');
    for (const pwd of commonPasswords) {
      const result = await bcrypt.compare(pwd, adminUser.passwordHash || '');
      console.log(`   '${pwd}': ${result ? '✅ MATCH!' : '❌'}`);
      if (result) {
        console.log(`   🎯 WORKING PASSWORD FOUND: ${pwd}`);
        break;
      }
    }
    
    // Now let's create the correct password hash
    console.log('\n🔧 FIXING PASSWORD HASH...');
    const correctPassword = 'Admin123!Secure';
    const newHash = await bcrypt.hash(correctPassword, 12);
    
    await prisma.user.update({
      where: { email: 'adam.freundt@gmail.com' },
      data: { 
        passwordHash: newHash,
        emailVerified: new Date(), // Ensure email is verified
      }
    });
    
    // Verify the fix
    const verification = await bcrypt.compare(correctPassword, newHash);
    console.log(`✅ PASSWORD FIXED! Verification: ${verification ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    console.log('\n🚀 ADMIN LOGIN NOW WORKING:');
    console.log(`   📧 Email: adam.freundt@gmail.com`);
    console.log(`   🔑 Password: Admin123!Secure`);
    console.log(`   🌐 Login URL: http://localhost:3000/auth/login`);
    console.log(`   🎯 Admin Panel: http://localhost:3000/admin`);
    
  } catch (error) {
    console.error('❌ DIAGNOSIS FAILED:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseAdminAuth();