/**
 * Test script to verify /api/users/profile returns correct user_type
 */

const fetch = require('node-fetch');

const SESSION_TOKEN = 'YOUR_SESSION_TOKEN_HERE'; // Get from browser DevTools → Application → Cookies

async function testProfileAPI() {
  console.log('=== Testing /api/users/profile ===\n');

  const response = await fetch('http://localhost:3000/api/users/profile', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // Add cookie header
      'Cookie': `sb-qfeyhaaxyemmnohqdele-auth-token=${SESSION_TOKEN}`
    }
  });

  const data = await response.json();

  if (response.ok) {
    console.log('✅ API Response:', JSON.stringify(data, null, 2));
    console.log('\n=== User Type Detection ===');
    console.log('userType:', data.profile.userType);
    console.log('isCompany:', data.profile.isCompany);
    console.log('Expected for inmobiliaria:', {
      userType: 'inmobiliaria',
      isCompany: true
    });
  } else {
    console.log('❌ API Error:', data);
  }
}

// To run: node test-api-profile.js
// Make sure to replace SESSION_TOKEN with your actual token from browser cookies

console.log('Instructions:');
console.log('1. Open browser DevTools (F12)');
console.log('2. Go to Application → Cookies → http://localhost:3000');
console.log('3. Find cookie "sb-qfeyhaaxyemmnohqdele-auth-token" or similar');
console.log('4. Copy the full value');
console.log('5. Replace SESSION_TOKEN in this script');
console.log('6. Run: node test-api-profile.js\n');

// Uncomment to run (after setting token):
// testProfileAPI();
