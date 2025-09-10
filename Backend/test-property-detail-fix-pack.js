const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testInvalidId() {
  console.log('🧪 Test 1: Invalid ID validation');
  try {
    const res = await fetch(`${BASE_URL}/api/properties/invalid-id`);
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    console.log(`Response: ${JSON.stringify(data)}`);
    console.log(res.status === 404 && data.error === 'Not found' ? '✅ PASS' : '❌ FAIL');
  } catch (e) {
    console.log('❌ FAIL - Error:', e.message);
  }
}

async function testValidUUID() {
  console.log('\n🧪 Test 2: Valid UUID format');
  const validUUID = '123e4567-e89b-12d3-a456-426614174000';
  try {
    const res = await fetch(`${BASE_URL}/api/properties/${validUUID}`);
    console.log(`Status: ${res.status}`);
    if (res.status === 404) {
      const data = await res.json();
      console.log(`Response: ${JSON.stringify(data)}`);
      console.log('✅ PASS - Correctly rejected invalid UUID');
    } else {
      console.log('❌ FAIL - Should have returned 404 for invalid UUID');
    }
  } catch (e) {
    console.log('❌ FAIL - Error:', e.message);
  }
}

async function testValidCUID() {
  console.log('\n🧪 Test 3: Valid CUID format');
  const validCUID = 'c123456789012345678901234567890';
  try {
    const res = await fetch(`${BASE_URL}/api/properties/${validCUID}`);
    console.log(`Status: ${res.status}`);
    if (res.status === 404) {
      const data = await res.json();
      console.log(`Response: ${JSON.stringify(data)}`);
      console.log('✅ PASS - Correctly rejected invalid CUID');
    } else {
      console.log('❌ FAIL - Should have returned 404 for invalid CUID');
    }
  } catch (e) {
    console.log('❌ FAIL - Error:', e.message);
  }
}

async function runTests() {
  console.log('🚀 Running Property Detail Fix Pack QA Tests\n');

  await testInvalidId();
  await testValidUUID();
  await testValidCUID();

  console.log('\n✨ QA Tests completed!');
  console.log('Note: Tests verify ID validation. For image fallback testing,');
  console.log('you need properties with/without images in the database.');
}

runTests().catch(console.error);
