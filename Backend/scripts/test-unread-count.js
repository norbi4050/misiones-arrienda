const fetch = require('node-fetch');

async function testUnreadCount() {
  try {
    console.log('Testing /api/messages/unread-count endpoint...');

    // Test without auth (should return 0)
    const response = await fetch('http://localhost:3000/api/messages/unread-count');
    const data = await response.json();

    console.log('Response status:', response.status);
    console.log('Response data:', data);

    if (data.count === 0) {
      console.log('✅ Endpoint works correctly for unauthenticated users');
    } else {
      console.log('❌ Unexpected response for unauthenticated users');
    }

  } catch (error) {
    console.error('❌ Error testing endpoint:', error.message);
  }
}

testUnreadCount();
