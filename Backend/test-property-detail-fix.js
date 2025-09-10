const fetch = require('node-fetch').default || require('node-fetch');

async function testPropertyDetail() {
  const propertyId = '4d4dc702-953a-41b9-b875-8c1eaa3d8714';
  const url = `http://localhost:3000/api/properties/${propertyId}`;

  console.log('Testing property detail API...');
  console.log('URL:', url);

  try {
    const response = await fetch(url);
    const data = await response.json();

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('✅ SUCCESS: Property detail retrieved successfully');
    } else {
      console.log('❌ ERROR: Failed to retrieve property detail');
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

testPropertyDetail();
