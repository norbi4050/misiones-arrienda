const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testPropertiesAPI() {
  console.log('🧪 Testing Properties API...\n');

  try {
    const response = await fetch(`${BASE_URL}/api/properties?sortBy=id&sortOrder=desc&limit=12`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📊 Response Headers:`, Object.fromEntries(response.headers.entries()));

    const data = await response.json();

    console.log('\n📋 Response Body:');
    console.log(JSON.stringify(data, null, 2));

    if (data.properties && Array.isArray(data.properties)) {
      console.log(`\n✅ Found ${data.properties.length} properties`);
      if (data.properties.length > 0) {
        console.log('✅ First property sample:');
        console.log(JSON.stringify(data.properties[0], null, 2));
      }
    }

    if (data.pagination) {
      console.log(`\n📄 Pagination:`, data.pagination);
    }

    if (data.meta) {
      console.log(`📊 Meta:`, data.meta);
    }

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    console.log('Stack:', error.stack);
  }
}

// Run the test
testPropertiesAPI().catch(console.error);
