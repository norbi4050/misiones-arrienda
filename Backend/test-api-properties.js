const fetch = require('node-fetch');

async function testPropertiesAPI() {
  console.log('🔍 Testing Properties API...\n');
  
  const baseUrl = 'http://localhost:3000';
  const endpoints = [
    '/api/properties',
    '/api/properties?city=Posadas',
    '/api/properties?propertyType=HOUSE',
    '/api/properties?priceMin=100000&priceMax=200000'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Testing: ${endpoint}`);
      const response = await fetch(`${baseUrl}${endpoint}`);
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Success: ${data.items?.length || 0} properties found`);
        console.log(`   📊 Total count: ${data.count || 0}`);
        console.log(`   🔧 Data source: ${data.meta?.dataSource || 'unknown'}`);
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${errorText}`);
      }
      
      console.log('');
    } catch (error) {
      console.log(`   💥 Network Error: ${error.message}\n`);
    }
  }
}

// Test if server is running
async function testServerHealth() {
  try {
    console.log('🏥 Testing server health...');
    const response = await fetch('http://localhost:3000');
    console.log(`Server status: ${response.status} ${response.statusText}\n`);
    return response.ok;
  } catch (error) {
    console.log(`❌ Server not accessible: ${error.message}\n`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting API Tests\n');
  
  const serverRunning = await testServerHealth();
  
  if (serverRunning) {
    await testPropertiesAPI();
  } else {
    console.log('❌ Cannot test API - server is not running');
    console.log('💡 Make sure to run: npm run dev');
  }
}

main().catch(console.error);
