const fetch = require('node-fetch');

console.log('=== VERIFICACIÓN DEL FIX ERROR 500 /api/properties ===\n');

async function testPropertiesFix() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('1. PROBANDO API ENDPOINT BÁSICO');
  console.log('='.repeat(50));
  
  try {
    const response = await fetch(`${baseUrl}/api/properties`);
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API funcionando correctamente');
      console.log(`Items: ${data?.items?.length || 0}`);
      console.log(`Count: ${data?.count || 0}`);
      console.log(`Data source: ${data?.meta?.dataSource || 'unknown'}`);
    } else {
      const errorText = await response.text();
      console.log('❌ API aún con errores:', errorText.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
  }
  
  console.log('\n2. PROBANDO FILTRO QUE CAUSABA ERROR 500');
  console.log('='.repeat(50));
  
  try {
    const response = await fetch(`${baseUrl}/api/properties?bedroomsMin=0`);
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Filtro bedroomsMin=0 funcionando');
      console.log(`Items: ${data?.items?.length || 0}`);
    } else {
      const errorText = await response.text();
      console.log('❌ Filtro aún con errores:', errorText.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ Error en filtro:', error.message);
  }
  
  console.log('\n3. PROBANDO OTROS FILTROS COMUNES');
  console.log('='.repeat(50));
  
  const testFilters = [
    '?city=Posadas',
    '?propertyType=HOUSE',
    '?priceMin=50000&priceMax=200000',
    '?limit=5&offset=0',
    '?orderBy=createdAt&order=desc'
  ];
  
  for (const filter of testFilters) {
    try {
      console.log(`\nTesting: ${filter}`);
      const response = await fetch(`${baseUrl}/api/properties${filter}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Status: ${response.status} - Items: ${data?.items?.length || 0}`);
      } else {
        console.log(`❌ Status: ${response.status} - Error en filtro`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n4. RESUMEN DE VERIFICACIÓN');
  console.log('='.repeat(50));
  
  console.log(`
CAMBIOS APLICADOS:
✅ Cambiado import de '@/lib/supabaseClient' a '@/lib/supabase/server'
✅ Agregado createServerSupabase() para crear cliente de servidor
✅ Mantenida toda la lógica de filtros y paginación

ARCHIVOS MODIFICADOS:
- Backend/src/app/api/properties/route.ts (1 archivo)

TIPO DE FIX:
- Configuración de cliente Supabase (mínimo y seguro)
- No se modificó lógica de negocio
- No se tocaron componentes frontend
- No se cambió estructura de datos

PRÓXIMOS PASOS:
1. Verificar que el servidor Next.js esté corriendo
2. Probar la página /properties en el navegador
3. Confirmar que no hay más errores 500
4. Verificar que filtros y paginación funcionan
  `);
}

// Ejecutar verificación
testPropertiesFix().catch(console.error);
