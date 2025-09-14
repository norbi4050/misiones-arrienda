const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testPropertyFilters() {
  console.log('🧪 Testing Property Filters API...\n');

  const testCases = [
    {
      name: 'Basic GET request',
      params: {},
      expected: 'Should return properties with default pagination'
    },
    {
      name: 'Filter by city',
      params: { city: 'Posadas' },
      expected: 'Should return properties from Posadas'
    },
    {
      name: 'Filter by province',
      params: { province: 'Misiones' },
      expected: 'Should return properties from Misiones province'
    },
    {
      name: 'Filter by property type',
      params: { propertyType: 'HOUSE' },
      expected: 'Should return only houses'
    },
    {
      name: 'Filter by price range',
      params: { priceMin: 100000, priceMax: 200000 },
      expected: 'Should return properties within price range'
    },
    {
      name: 'Filter by bedrooms minimum',
      params: { bedroomsMin: 2 },
      expected: 'Should return properties with 2+ bedrooms'
    },
    {
      name: 'Filter by bathrooms minimum',
      params: { bathroomsMin: 1 },
      expected: 'Should return properties with 1+ bathrooms'
    },
    {
      name: 'Order by price ascending',
      params: { orderBy: 'price', order: 'asc' },
      expected: 'Should return properties ordered by price ascending'
    },
    {
      name: 'Order by price descending',
      params: { orderBy: 'price', order: 'desc' },
      expected: 'Should return properties ordered by price descending'
    },
    {
      name: 'Combined filters',
      params: {
        city: 'Posadas',
        propertyType: 'APARTMENT',
        priceMin: 50000,
        priceMax: 150000,
        bedroomsMin: 1,
        bathroomsMin: 1,
        orderBy: 'price',
        order: 'asc'
      },
      expected: 'Should return apartments in Posadas within price range with min rooms'
    },
    {
      name: 'Pagination test',
      params: { page: 1, limit: 5 },
      expected: 'Should return first 5 properties'
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`📋 Testing: ${testCase.name}`);
      console.log(`   Expected: ${testCase.expected}`);

      const queryString = new URLSearchParams(testCase.params).toString();
      const url = `${BASE_URL}/api/properties${queryString ? '?' + queryString : ''}`;

      console.log(`   URL: ${url}`);

      const response = await axios.get(url);

      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📊 Properties returned: ${response.data.properties?.length || 0}`);
      console.log(`   📄 Pagination: Page ${response.data.pagination?.page || 'N/A'}, Total: ${response.data.pagination?.total || 'N/A'}`);
      console.log(`   🔍 Filters applied:`, response.data.meta?.filters || {});
      console.log(`   📋 Sorting:`, response.data.meta?.sorting || {});
      console.log(`   💾 Data source: ${response.data.meta?.dataSource || 'unknown'}`);

      // Validate response structure
      if (!response.data.properties) {
        console.log(`   ❌ Missing properties array`);
      } else if (!Array.isArray(response.data.properties)) {
        console.log(`   ❌ Properties is not an array`);
      } else {
        console.log(`   ✅ Response structure valid`);
      }

      console.log('');

    } catch (error) {
      console.log(`   ❌ Error: ${error.response?.status || error.code}`);
      console.log(`   📝 Message: ${error.response?.data?.error || error.message}`);
      console.log('');
    }
  }

  console.log('🎉 Filter testing completed!');
}

// Test POST endpoint for creating properties
async function testPropertyCreation() {
  console.log('🆕 Testing Property Creation...\n');

  const testProperty = {
    title: 'Test Property from API',
    description: 'This is a test property created via API',
    price: 150000,
    currency: 'ARS',
    propertyType: 'HOUSE',
    bedrooms: 3,
    bathrooms: 2,
    area: 120,
    address: 'Test Address 123',
    city: 'Posadas',
    province: 'Misiones',
    country: 'Argentina',
    images: ['/test-image.jpg'],
    amenities: ['garage', 'garden'],
    contact_name: 'Test Agent',
    contact_phone: '+54 376 1234567',
    contact_email: 'test@example.com'
  };

  try {
    const response = await axios.post(`${BASE_URL}/api/properties`, testProperty);

    console.log(`✅ Property created successfully!`);
    console.log(`📋 ID: ${response.data.property?.id}`);
    console.log(`🏠 Title: ${response.data.property?.title}`);
    console.log(`💰 Price: ${response.data.property?.price}`);
    console.log(`📍 Location: ${response.data.property?.city}, ${response.data.property?.province}`);

  } catch (error) {
    console.log(`❌ Error creating property: ${error.response?.status || error.code}`);
    console.log(`📝 Message: ${error.response?.data?.error || error.message}`);
  }

  console.log('');
}

// Run tests
async function runAllTests() {
  try {
    await testPropertyFilters();
    await testPropertyCreation();
  } catch (error) {
    console.error('💥 Test execution failed:', error.message);
  }
}

// Execute tests if run directly
if (require.main === module) {
  runAllTests();
}

module.exports = { testPropertyFilters, testPropertyCreation, runAllTests };
