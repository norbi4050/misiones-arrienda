const fetch = require('node-fetch');

console.log('=== INVESTIGACIÓN ERROR PÁGINA /properties ===\n');

async function investigatePropertiesError() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('1. PROBANDO API ENDPOINT /api/properties');
  console.log('='.repeat(50));
  
  try {
    // Test básico del endpoint
    const apiResponse = await fetch(`${baseUrl}/api/properties`);
    console.log(`Status: ${apiResponse.status} ${apiResponse.statusText}`);
    console.log(`Headers:`, Object.fromEntries(apiResponse.headers.entries()));
    
    if (apiResponse.ok) {
      const data = await apiResponse.json();
      console.log(`Response data:`, JSON.stringify(data, null, 2));
      console.log(`Items count: ${data?.items?.length || 0}`);
      console.log(`Total count: ${data?.count || 0}`);
    } else {
      const errorText = await apiResponse.text();
      console.log(`Error response:`, errorText);
    }
  } catch (error) {
    console.log(`API Error:`, error.message);
  }
  
  console.log('\n2. PROBANDO CON FILTROS COMUNES');
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
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Items: ${data?.items?.length || 0}, Count: ${data?.count || 0}`);
      } else {
        const errorText = await response.text();
        console.log(`Error: ${errorText.substring(0, 200)}...`);
      }
    } catch (error) {
      console.log(`Filter Error: ${error.message}`);
    }
  }
  
  console.log('\n3. VERIFICANDO ESTRUCTURA DE DATOS');
  console.log('='.repeat(50));
  
  try {
    const response = await fetch(`${baseUrl}/api/properties?limit=1`);
    if (response.ok) {
      const data = await response.json();
      if (data?.items?.length > 0) {
        const sampleProperty = data.items[0];
        console.log('Sample property structure:');
        console.log('- id:', sampleProperty.id);
        console.log('- title:', sampleProperty.title);
        console.log('- price:', sampleProperty.price, typeof sampleProperty.price);
        console.log('- images:', sampleProperty.images, typeof sampleProperty.images);
        console.log('- city:', sampleProperty.city);
        console.log('- province:', sampleProperty.province);
        console.log('- bedrooms:', sampleProperty.bedrooms, typeof sampleProperty.bedrooms);
        console.log('- bathrooms:', sampleProperty.bathrooms, typeof sampleProperty.bathrooms);
        console.log('- area:', sampleProperty.area, typeof sampleProperty.area);
        console.log('- userId:', sampleProperty.userId);
        console.log('- createdAt:', sampleProperty.createdAt, typeof sampleProperty.createdAt);
        console.log('- status:', sampleProperty.status);
        
        // Verificar campos faltantes que podrían causar errores
        const requiredFields = ['id', 'title', 'price', 'city', 'province', 'userId'];
        const missingFields = requiredFields.filter(field => !sampleProperty[field]);
        if (missingFields.length > 0) {
          console.log('⚠️  MISSING REQUIRED FIELDS:', missingFields);
        }
        
        // Verificar tipos de datos problemáticos
        if (sampleProperty.price && isNaN(Number(sampleProperty.price))) {
          console.log('⚠️  PRICE IS NOT A VALID NUMBER:', sampleProperty.price);
        }
        
        if (sampleProperty.bedrooms && isNaN(Number(sampleProperty.bedrooms))) {
          console.log('⚠️  BEDROOMS IS NOT A VALID NUMBER:', sampleProperty.bedrooms);
        }
        
        if (sampleProperty.bathrooms && isNaN(Number(sampleProperty.bathrooms))) {
          console.log('⚠️  BATHROOMS IS NOT A VALID NUMBER:', sampleProperty.bathrooms);
        }
        
        if (sampleProperty.area && isNaN(Number(sampleProperty.area))) {
          console.log('⚠️  AREA IS NOT A VALID NUMBER:', sampleProperty.area);
        }
      }
    }
  } catch (error) {
    console.log(`Data structure check error: ${error.message}`);
  }
  
  console.log('\n4. PROBANDO PÁGINA FRONTEND /properties');
  console.log('='.repeat(50));
  
  try {
    const pageResponse = await fetch(`${baseUrl}/properties`);
    console.log(`Page Status: ${pageResponse.status} ${pageResponse.statusText}`);
    console.log(`Content-Type: ${pageResponse.headers.get('content-type')}`);
    
    if (pageResponse.ok) {
      const html = await pageResponse.text();
      
      // Buscar indicadores de error en el HTML
      const errorIndicators = [
        'Error al cargar',
        'error',
        'Error',
        'undefined',
        'null',
        'NaN',
        'TypeError',
        'ReferenceError',
        'SyntaxError'
      ];
      
      const foundErrors = errorIndicators.filter(indicator => 
        html.toLowerCase().includes(indicator.toLowerCase())
      );
      
      if (foundErrors.length > 0) {
        console.log('⚠️  POSSIBLE ERRORS FOUND IN HTML:', foundErrors);
      }
      
      // Verificar si la página contiene el componente esperado
      if (html.includes('Propiedades en Misiones')) {
        console.log('✅ Page title found');
      } else {
        console.log('⚠️  Expected page title not found');
      }
      
      if (html.includes('property-grid') || html.includes('PropertyGrid')) {
        console.log('✅ Property grid component found');
      } else {
        console.log('⚠️  Property grid component not found');
      }
      
      // Verificar scripts y estilos
      const scriptCount = (html.match(/<script/g) || []).length;
      const styleCount = (html.match(/<style/g) || []).length;
      console.log(`Scripts: ${scriptCount}, Styles: ${styleCount}`);
      
    } else {
      const errorHtml = await pageResponse.text();
      console.log(`Page Error: ${errorHtml.substring(0, 500)}...`);
    }
  } catch (error) {
    console.log(`Frontend page error: ${error.message}`);
  }
  
  console.log('\n5. VERIFICANDO CONFIGURACIÓN NEXT.JS');
  console.log('='.repeat(50));
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Verificar next.config.js
    const nextConfigPath = path.join(__dirname, 'next.config.js');
    if (fs.existsSync(nextConfigPath)) {
      console.log('✅ next.config.js exists');
      const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
      
      // Verificar configuración de imágenes
      if (nextConfig.includes('remotePatterns') || nextConfig.includes('domains')) {
        console.log('✅ Image configuration found');
      } else {
        console.log('⚠️  No image configuration found - could cause image loading issues');
      }
    } else {
      console.log('⚠️  next.config.js not found');
    }
    
    // Verificar variables de entorno
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
      console.log('✅ .env.local exists');
    } else {
      console.log('⚠️  .env.local not found');
    }
    
  } catch (error) {
    console.log(`Config check error: ${error.message}`);
  }
  
  console.log('\n6. RESUMEN DE DIAGNÓSTICO');
  console.log('='.repeat(50));
  
  console.log(`
ARCHIVOS CLAVE IDENTIFICADOS:
- Página: /src/app/properties/page.tsx (SSR con Suspense)
- Cliente: /src/app/properties/properties-client.tsx (CSR con fetch)
- API: /src/app/api/properties/route.ts (Supabase query)
- Grid: /src/components/property-grid.tsx (Renderizado de lista)
- Card: /src/components/property-card.tsx (Componente individual)

POSIBLES CAUSAS DE ERROR:
1. API devuelve datos con estructura incorrecta
2. Campos null/undefined en PropertyCard
3. Error en fetchBucketImages (imágenes)
4. Problema de tipos TypeScript
5. Error de RLS en Supabase
6. Configuración de imágenes remotas
7. Error de hidratación SSR/CSR

PRÓXIMOS PASOS:
- Verificar logs del navegador (Console)
- Verificar logs del servidor Next.js
- Probar con datos mock vs datos reales
- Verificar permisos RLS en Supabase
  `);
}

// Ejecutar investigación
investigatePropertiesError().catch(console.error);
