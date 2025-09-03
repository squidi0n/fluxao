// Simple test to authenticate via Google OAuth
async function testAuth() {
  console.log('Testing authentication flow...');
  
  // Test if we can access the Google login URL
  const response = await fetch('http://localhost:3000/api/auth/signin/google');
  console.log('Google signin response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));
  
  if (response.ok) {
    const html = await response.text();
    console.log('HTML contains OAuth URL:', html.includes('accounts.google.com'));
  }
}

testAuth().catch(console.error);