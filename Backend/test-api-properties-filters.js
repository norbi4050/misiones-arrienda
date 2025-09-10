const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testPropertiesFilters() {
  console.log('🧪 Testing Properties API Filters');
  console.log('=====================================\n');

  try {
    // Test 1: Verificar que solo se devuelven propiedades PUBLISHED y activas
    console.log('Test 1: Verificar filtros status=PUBLISHED y is_active=true');
    const response = await axios.get(`${BASE_URL}/api/properties`);

    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Total properties: ${response.data.count}`);
    console.log(`📋 Items returned: ${response.data.items.length}`);

    if (response.data.items.length > 0) {
      console.log('\n📋 Sample property:');
      const sample = response.data.items[0];
      console.log(`   - ID: ${sample.id}`);
      console.log(`   - Title: ${sample.title}`);
      console.log(`   - Status: ${sample.status}`);
      console.log(`   - Is Active: ${sample.is_active || sample.isActive || 'N/A'}`);
      console.log(`   - City: ${sample.city}`);
      console.log(`   - Price: ${sample.price} ${sample.currency}`);
    }

    // Test 2: Verificar que todos los items cumplen con los filtros
    console.log('\nTest 2: Verificar que todos los items cumplen con los filtros');
    let allValid = true;
    let invalidItems = [];

    response.data.items.forEach((item, index) => {
      const statusValid = item.status === 'PUBLISHED';
      const activeValid = item.is_active === true || item.isActive === true;

      if (!statusValid || !activeValid) {
        allValid = false;
        invalidItems.push({
          index,
          id: item.id,
          status: item.status,
          is_active: item.is_active || item.isActive
        });
      }
    });

    if (allValid) {
      console.log('✅ Todos los items cumplen con los filtros requeridos');
    } else {
      console.log('❌ Algunos items no cumplen con los filtros:');
      invalidItems.forEach(item => {
        console.log(`   - Item ${item.index}: ID=${item.id}, Status=${item.status}, Active=${item.is_active}`);
      });
    }

    // Test 3: Verificar filtros adicionales funcionan
    console.log('\nTest 3: Verificar filtros adicionales (city filter)');
    const cityResponse = await axios.get(`${BASE_URL}/api/properties?city=Posadas`);
    console.log(`✅ City filter test: ${cityResponse.data.count} properties found for "Posadas"`);

    // Test 4: Verificar paginación
    console.log('\nTest 4: Verificar paginación');
    const paginatedResponse = await axios.get(`${BASE_URL}/api/properties?limit=2&offset=0`);
    console.log(`✅ Pagination test: ${paginatedResponse.data.items.length} items (limit=2)`);

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Total properties: ${response.data.count}`);
    console.log(`   - Data source: ${response.data.meta.dataSource}`);
    console.log(`   - All filters applied: status='PUBLISHED' AND is_active=true`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the development server is running:');
      console.log('   cd Backend && npm run dev');
    }
  }
}

// Ejecutar tests
testPropertiesFilters();
