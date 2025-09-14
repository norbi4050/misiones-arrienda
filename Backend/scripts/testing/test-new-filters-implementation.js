const axios = require('axios');

// Test script to validate the new filters implementation
async function testNewFilters() {
  const baseUrl = 'http://localhost:3000/api/properties';

  console.log('🧪 Testing New Filters Implementation\n');

  // Test 1: Province filter
  console.log('1️⃣ Testing Province Filter...');
  try {
    const provinceResponse = await axios.get(`${baseUrl}?province=Misiones`);
    console.log(`✅ Province filter: ${provinceResponse.data.properties.length} properties found`);
  } catch (error) {
    console.log(`❌ Province filter failed: ${error.message}`);
  }

  // Test 2: Price min/max filters
  console.log('\n2️⃣ Testing Price Min/Max Filters...');
  try {
    const priceResponse = await axios.get(`${baseUrl}?priceMin=50000&priceMax=150000`);
    console.log(`✅ Price range filter: ${priceResponse.data.properties.length} properties found`);
  } catch (error) {
    console.log(`❌ Price range filter failed: ${error.message}`);
  }

  // Test 3: Bedrooms min filter
  console.log('\n3️⃣ Testing Bedrooms Min Filter...');
  try {
    const bedroomsResponse = await axios.get(`${baseUrl}?bedroomsMin=2`);
    console.log(`✅ Bedrooms min filter: ${bedroomsResponse.data.properties.length} properties found`);
  } catch (error) {
    console.log(`❌ Bedrooms min filter failed: ${error.message}`);
  }

  // Test 4: Bathrooms min filter
  console.log('\n4️⃣ Testing Bathrooms Min Filter...');
  try {
    const bathroomsResponse = await axios.get(`${baseUrl}?bathroomsMin=1`);
    console.log(`✅ Bathrooms min filter: ${bathroomsResponse.data.properties.length} properties found`);
  } catch (error) {
    console.log(`❌ Bathrooms min filter failed: ${error.message}`);
  }

  // Test 5: Area min/max filters
  console.log('\n5️⃣ Testing Area Min/Max Filters...');
  try {
    const areaResponse = await axios.get(`${baseUrl}?minArea=50&maxArea=200`);
    console.log(`✅ Area range filter: ${areaResponse.data.properties.length} properties found`);
  } catch (error) {
    console.log(`❌ Area range filter failed: ${error.message}`);
  }

  // Test 6: Amenities filter
  console.log('\n6️⃣ Testing Amenities Filter...');
  try {
    const amenitiesResponse = await axios.get(`${baseUrl}?amenities=piscina`);
    console.log(`✅ Amenities filter: ${amenitiesResponse.data.properties.length} properties found`);
  } catch (error) {
    console.log(`❌ Amenities filter failed: ${error.message}`);
  }

  // Test 7: Order by and order filters
  console.log('\n7️⃣ Testing Order By and Order Filters...');
  try {
    const orderResponse = await axios.get(`${baseUrl}?orderBy=price&order=asc`);
    console.log(`✅ Order by price asc: ${orderResponse.data.properties.length} properties found`);
  } catch (error) {
    console.log(`❌ Order by filter failed: ${error.message}`);
  }

  // Test 8: Combined filters
  console.log('\n8️⃣ Testing Combined Filters...');
  try {
    const combinedResponse = await axios.get(`${baseUrl}?province=Misiones&priceMin=50000&bedroomsMin=2&orderBy=price&order=desc`);
    console.log(`✅ Combined filters: ${combinedResponse.data.properties.length} properties found`);
    console.log(`📊 Meta data:`, combinedResponse.data.meta);
  } catch (error) {
    console.log(`❌ Combined filters failed: ${error.message}`);
  }

  // Test 9: Pagination with new filters
  console.log('\n9️⃣ Testing Pagination with New Filters...');
  try {
    const paginationResponse = await axios.get(`${baseUrl}?page=1&limit=5&province=Misiones&priceMin=50000`);
    console.log(`✅ Pagination with filters: ${paginationResponse.data.properties.length} properties found`);
    console.log(`📄 Pagination info:`, paginationResponse.data.pagination);
  } catch (error) {
    console.log(`❌ Pagination with filters failed: ${error.message}`);
  }

  // Test 10: Invalid parameters handling
  console.log('\n🔟 Testing Invalid Parameters Handling...');
  try {
    const invalidResponse = await axios.get(`${baseUrl}?priceMin=invalid&page=-1`);
    console.log(`✅ Invalid parameters handled gracefully: ${invalidResponse.status}`);
  } catch (error) {
    console.log(`ℹ️ Invalid parameters test: ${error.response?.status || error.message}`);
  }

  console.log('\n🎉 Filter testing completed!');
}

// Run the tests
if (require.main === module) {
  testNewFilters().catch(console.error);
}

module.exports = { testNewFilters };
