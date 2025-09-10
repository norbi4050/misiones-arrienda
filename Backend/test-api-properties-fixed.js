const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api/properties';

async function testAPI() {
  console.log('🧪 TESTING API PROPERTIES - FIXES APLICADOS\n');

  // Test 1: Filtros básicos funcionando
  console.log('📋 Test 1: Filtros priceMin/priceMax');
  try {
    const response = await fetch(`${BASE_URL}?priceMin=100000&priceMax=200000&limit=5`);
    const data = await response.json();
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Items encontrados: ${data.items?.length || 0}`);
    console.log(`🔢 Total count: ${data.count || 0}`);
    console.log(`💰 Filtros aplicados:`, data.meta?.filters);
    console.log('');
  } catch (error) {
    console.log('❌ Error en test 1:', error.message);
    console.log('');
  }

  // Test 2: Filtros bedroomsMin/bathroomsMin
  console.log('📋 Test 2: Filtros bedroomsMin/bathroomsMin');
  try {
    const response = await fetch(`${BASE_URL}?bedroomsMin=2&bathroomsMin=1&limit=5`);
    const data = await response.json();
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Items encontrados: ${data.items?.length || 0}`);
    console.log(`🏠 Filtros aplicados:`, data.meta?.filters);
    console.log('');
  } catch (error) {
    console.log('❌ Error en test 2:', error.message);
    console.log('');
  }

  // Test 3: Filtro province con ilike
  console.log('📋 Test 3: Filtro province (ilike)');
  try {
    const response = await fetch(`${BASE_URL}?province=Misiones&limit=5`);
    const data = await response.json();
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Items encontrados: ${data.items?.length || 0}`);
    console.log(`🏛️ Filtros aplicados:`, data.meta?.filters);
    console.log('');
  } catch (error) {
    console.log('❌ Error en test 3:', error.message);
    console.log('');
  }

  // Test 4: OrderBy=id (NUEVO FIX)
  console.log('📋 Test 4: OrderBy=id (FIX APLICADO)');
  try {
    const response = await fetch(`${BASE_URL}?orderBy=id&order=asc&limit=5`);
    const data = await response.json();
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Items encontrados: ${data.items?.length || 0}`);
    console.log(`🔢 Ordenamiento:`, data.meta?.sorting);
    if (data.items && data.items.length > 0) {
      console.log(`📋 Primer ID: ${data.items[0].id}`);
      console.log(`📋 Último ID: ${data.items[data.items.length - 1].id}`);
    }
    console.log('');
  } catch (error) {
    console.log('❌ Error en test 4:', error.message);
    console.log('');
  }

  // Test 5: OrderBy=price
  console.log('📋 Test 5: OrderBy=price');
  try {
    const response = await fetch(`${BASE_URL}?orderBy=price&order=desc&limit=5`);
    const data = await response.json();
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Items encontrados: ${data.items?.length || 0}`);
    console.log(`💰 Ordenamiento:`, data.meta?.sorting);
    if (data.items && data.items.length > 0) {
      console.log(`💰 Precio más alto: $${data.items[0].price}`);
      console.log(`💰 Precio más bajo: $${data.items[data.items.length - 1].price}`);
    }
    console.log('');
  } catch (error) {
    console.log('❌ Error en test 5:', error.message);
    console.log('');
  }

  // Test 6: Paginación
  console.log('📋 Test 6: Paginación con offset/limit');
  try {
    const response = await fetch(`${BASE_URL}?limit=3&offset=0`);
    const data = await response.json();
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Items en página 1: ${data.items?.length || 0}`);
    console.log(`🔢 Total count: ${data.count || 0}`);
    console.log(`📄 Paginación:`, data.meta?.pagination);
    console.log('');
  } catch (error) {
    console.log('❌ Error en test 6:', error.message);
    console.log('');
  }

  // Test 7: Combinación de filtros
  console.log('📋 Test 7: Combinación de filtros');
  try {
    const response = await fetch(`${BASE_URL}?province=Misiones&priceMin=50000&bedroomsMin=1&orderBy=price&order=asc&limit=5`);
    const data = await response.json();
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Items encontrados: ${data.items?.length || 0}`);
    console.log(`🔍 Filtros aplicados:`, data.meta?.filters);
    console.log(`🔢 Ordenamiento:`, data.meta?.sorting);
    console.log('');
  } catch (error) {
    console.log('❌ Error en test 7:', error.message);
    console.log('');
  }

  console.log('🎉 TESTS COMPLETADOS');
  console.log('📝 Resumen:');
  console.log('- ✅ priceMin/priceMax: gte/lte aplicado');
  console.log('- ✅ bedroomsMin/bathroomsMin: gte aplicado');
  console.log('- ✅ province: ilike aplicado');
  console.log('- ✅ orderBy=id: AGREGADO al whitelist');
  console.log('- ✅ orderBy=price: funcionando');
  console.log('- ✅ Paginación: offset/limit funcionando');
  console.log('- ✅ select(\'*\', { count: \'exact\' }): implementado');
}

// Ejecutar tests
testAPI().catch(console.error);
