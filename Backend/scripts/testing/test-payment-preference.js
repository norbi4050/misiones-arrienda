const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testPaymentPreference() {
  console.log('🧪 Testing MercadoPago Payment Preference API...\n');

  // Test 1: Legacy format (propertyId, amount, etc.)
  console.log('📋 Test 1: Legacy format');
  try {
    const legacyResponse = await fetch(`${BASE_URL}/api/payments/create-preference`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        propertyId: 'test-property-123',
        amount: 4999,
        title: 'Test Property',
        description: 'Test payment for property',
        userEmail: 'test@example.com',
        userName: 'Test User'
      })
    });

    const legacyData = await legacyResponse.json();
    console.log(`✅ Legacy response status: ${legacyResponse.status}`);
    console.log(`✅ Has init_point: ${!!legacyData.preference?.init_point}`);
    console.log(`✅ Has sandbox_init_point: ${!!legacyData.preference?.sandbox_init_point}`);
    console.log(`✅ Success: ${legacyData.success}\n`);
  } catch (error) {
    console.log(`❌ Legacy test failed: ${error.message}\n`);
  }

  // Test 2: New format (items, payer, etc.)
  console.log('📋 Test 2: New format');
  try {
    const newResponse = await fetch(`${BASE_URL}/api/payments/create-preference`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{
          title: "Destacado 7 días",
          quantity: 1,
          unit_price: 4999,
          currency_id: 'ARS'
        }],
        payer: {
          email: 'test@example.com',
          name: 'Test User'
        },
        back_urls: {
          success: `${BASE_URL}/payment/success`,
          failure: `${BASE_URL}/payment/failure`,
          pending: `${BASE_URL}/payment/pending`
        },
        metadata: { site: "misionesarrienda" }
      })
    });

    const newData = await newResponse.json();
    console.log(`✅ New format response status: ${newResponse.status}`);
    console.log(`✅ Has init_point: ${!!newData.init_point}`);
    console.log(`✅ Has sandbox_init_point: ${!!newData.sandbox_init_point}\n`);
  } catch (error) {
    console.log(`❌ New format test failed: ${error.message}\n`);
  }

  // Test 3: Invalid request
  console.log('📋 Test 3: Invalid request');
  try {
    const invalidResponse = await fetch(`${BASE_URL}/api/payments/create-preference`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    const invalidData = await invalidResponse.json();
    console.log(`✅ Invalid response status: ${invalidResponse.status}`);
    console.log(`✅ Error message: ${invalidData.error}\n`);
  } catch (error) {
    console.log(`❌ Invalid test failed: ${error.message}\n`);
  }

  console.log('🎉 Payment preference tests completed!');
}

// Run the test
testPaymentPreference().catch(console.error);
