const { createToken, verifyToken } = require('../lib/auth');

async function testAuth() {
  // Create a test user payload matching database format
  const testUser = {
    id: '8114793c-cdfe-483e-895a-d629409ab65b',
    email: 'adam.freundt@gmail.com',
    name: 'Adam Freundt',
    role: 'USER'
  };
  
  console.log('Original user:', testUser);
  
  // Create token
  const token = await createToken(testUser);
  console.log('\nToken created');
  
  // Verify token to see what comes back
  const decoded = await verifyToken(token);
  console.log('\nDecoded user:', decoded);
  console.log('IDs match:', decoded.id === testUser.id);
}

testAuth();