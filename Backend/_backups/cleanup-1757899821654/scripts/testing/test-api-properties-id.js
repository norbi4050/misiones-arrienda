const BASE_URL = 'http://localhost:3000';

async function testApi() {
  console.log('Testing /api/properties/[id] endpoint...\n');

  // Test 1: Non-existent ID should return 404
  const nonExistentId = '00000000-0000-0000-0000-000000000000';
  console.log(`Test 1: Testing with non-existent ID: ${nonExistentId}`);

  try {
    const response1 = await fetch(`${BASE_URL}/api/properties/${nonExistentId}`);
    console.log(`Status: ${response1.status}`);
    if (response1.status === 404) {
      console.log('✅ PASS: Returned 404 for non-existent ID');
    } else {
      console.log('❌ FAIL: Expected 404, got', response1.status);
    }
    const data1 = await response1.json();
    console.log('Response:', data1);
  } catch (error) {
    console.error('❌ FAIL: Error making request:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Existing ID should return 200
  const existingId = '4d4dc702-953a-41b9-b875-8c1eaa3d8714';
  console.log(`Test 2: Testing with existing ID: ${existingId}`);

  try {
    const response2 = await fetch(`${BASE_URL}/api/properties/${existingId}`);
    console.log(`Status: ${response2.status}`);
    if (response2.status === 200) {
      console.log('✅ PASS: Returned 200 for existing ID');
      const data2 = await response2.json();
      console.log('Response data keys:', Object.keys(data2));

      // Check if only the specified fields are returned
      const expectedFields = ['id', 'title', 'description', 'price', 'bedrooms', 'bathrooms', 'area', 'address', 'city', 'province', 'postalCode', 'propertyType', 'images', 'amenities', 'features', 'createdAt'];
      const actualFields = Object.keys(data2);
      const hasOnlyExpectedFields = expectedFields.every(field => actualFields.includes(field)) && actualFields.every(field => expectedFields.includes(field));

      if (hasOnlyExpectedFields) {
        console.log('✅ PASS: Response contains only the expected fields');
      } else {
        console.log('❌ FAIL: Response fields do not match expected fields');
        console.log('Expected:', expectedFields);
        console.log('Actual:', actualFields);
      }
    } else {
      console.log('❌ FAIL: Expected 200, got', response2.status);
      const data2 = await response2.json();
      console.log('Response:', data2);
    }
  } catch (error) {
    console.error('❌ FAIL: Error making request:', error.message);
  }

  console.log('\nTest completed.');
}

// Run the test
testApi().catch(console.error);
