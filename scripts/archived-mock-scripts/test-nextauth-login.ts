// Test NextAuth login flow directly
import fetch from 'node-fetch';

async function testNextAuthLogin() {
  try {
    console.log('🔐 Testing NextAuth Admin Login Flow...\n');
    
    // 1. Get CSRF token
    console.log('1️⃣ Getting CSRF token...');
    const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
    const csrfData = await csrfResponse.json() as { csrfToken: string };
    console.log(`   ✅ CSRF Token: ${csrfData.csrfToken.substring(0, 20)}...`);
    
    // 2. Test credentials signin
    console.log('\n2️⃣ Testing credentials signin...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/signin/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': `next-auth.csrf-token=${csrfData.csrfToken}`
      },
      body: new URLSearchParams({
        email: 'adam.freundt@gmail.com',
        password: 'Admin123!Secure',
        csrfToken: csrfData.csrfToken,
        callbackUrl: 'http://localhost:3000/admin'
      }),
      redirect: 'manual' // Don't follow redirects automatically
    });
    
    console.log(`   ✅ Login Response Status: ${loginResponse.status}`);
    console.log(`   ✅ Login Response Headers:`, Object.fromEntries(loginResponse.headers.entries()));
    
    if (loginResponse.status === 302) {
      console.log('   ✅ Login successful - got redirect (302)');
      const location = loginResponse.headers.get('location');
      console.log(`   ✅ Redirect Location: ${location}`);
    } else {
      console.log('   ❌ Login may have failed - no redirect');
      const responseText = await loginResponse.text();
      console.log(`   Response Body: ${responseText}`);
    }
    
    // 3. Test admin API with session
    console.log('\n3️⃣ Testing admin API access...');
    const adminApiResponse = await fetch('http://localhost:3000/api/admin/categories', {
      headers: {
        'Cookie': loginResponse.headers.get('set-cookie') || ''
      }
    });
    
    console.log(`   ✅ Admin API Status: ${adminApiResponse.status}`);
    if (adminApiResponse.ok) {
      const apiData = await adminApiResponse.json();
      console.log(`   ✅ Admin API Response: ${JSON.stringify(apiData, null, 2)}`);
    } else {
      const errorText = await adminApiResponse.text();
      console.log(`   ❌ Admin API Error: ${errorText}`);
    }
    
    console.log('\n🎯 LOGIN TEST COMPLETE!');
    
  } catch (error) {
    console.error('❌ NextAuth Login Test Failed:', error);
  }
}

testNextAuthLogin();