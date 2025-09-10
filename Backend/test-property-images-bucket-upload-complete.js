const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Supabase configuration
const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('🚀 INICIANDO PRUEBA COMPLETA DE BUCKET UPLOAD Y FALLBACK');
console.log('='.repeat(60));

// Step 1: Get a valid property ID
async function getValidPropertyId() {
  console.log('\n📋 PASO 1: Obteniendo ID de propiedad válida...');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/properties?limit=20&orderBy=createdAt&order=desc',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.items && response.items.length > 0) {
            const validProperty = response.items.find(property => {
              const status = property.status;
              const isActive = property.isActive ?? property.is_active ?? true;
              return status === 'PUBLISHED' && isActive === true;
            });

            if (validProperty) {
              console.log(`✅ Propiedad encontrada: ${validProperty.id}`);
              console.log(`   Título: ${validProperty.title}`);
              console.log(`   Estado: ${validProperty.status}`);
              resolve(validProperty.id);
            } else {
              reject(new Error('No se encontró ninguna propiedad PUBLISHED + activa'));
            }
          } else {
            reject(new Error('No se encontraron propiedades'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Error conectando al servidor: ${error.message}`));
    });

    req.end();
  });
}

// Step 2: Create a sample image
function createSampleImage() {
  console.log('\n🖼️  PASO 2: Creando imagen de muestra...');
  
  // Create a simple SVG image as cover.jpg
  const svgContent = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#4F46E5"/>
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" fill="white" text-anchor="middle" dy=".3em">
      COVER IMAGE
    </text>
    <text x="50%" y="65%" font-family="Arial, sans-serif" font-size="24" fill="#E5E7EB" text-anchor="middle" dy=".3em">
      Fallback Test Image
    </text>
  </svg>`;
  
  const imagePath = path.join(__dirname, 'cover.jpg');
  fs.writeFileSync(imagePath, svgContent);
  console.log(`✅ Imagen creada: ${imagePath}`);
  return imagePath;
}

// Step 3: Upload image to Supabase bucket
async function uploadImageToBucket(propertyId, imagePath) {
  console.log('\n☁️  PASO 3: Subiendo imagen al bucket...');
  
  const bucketName = 'property-images';
  const fileName = 'cover.jpg';
  const filePath = `${propertyId}/${fileName}`;
  
  try {
    // Read the file
    const fileBuffer = fs.readFileSync(imagePath);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType: 'image/svg+xml',
        upsert: true
      });

    if (error) {
      throw error;
    }

    console.log(`✅ Imagen subida exitosamente: ${filePath}`);
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;
    console.log(`🔗 URL pública: ${publicUrl}`);
    
    return publicUrl;
  } catch (error) {
    throw new Error(`Error subiendo imagen: ${error.message}`);
  }
}

// Step 4: Test property detail page
async function testPropertyDetailPage(propertyId) {
  console.log('\n🧪 PASO 4: Probando página de detalle de propiedad...');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/properties/${propertyId}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`✅ Página cargada - Status: ${res.statusCode}`);
        
        // Check for meta tags
        const ogImageMatch = data.match(/<meta property="og:image" content="([^"]+)"/);
        const twitterImageMatch = data.match(/<meta name="twitter:image" content="([^"]+)"/);
        const jsonLdMatch = data.match(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/s);
        
        const results = {
          statusCode: res.statusCode,
          ogImage: ogImageMatch ? ogImageMatch[1] : null,
          twitterImage: twitterImageMatch ? twitterImageMatch[1] : null,
          jsonLd: jsonLdMatch ? jsonLdMatch[1] : null,
          hasImages: data.includes('property-images')
        };
        
        resolve(results);
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Error probando página: ${error.message}`));
    });

    req.end();
  });
}

// Step 5: Test invalid property ID (404 test)
async function testInvalidPropertyId() {
  console.log('\n❌ PASO 5: Probando ID inválido (404 test)...');
  
  const invalidId = 'invalid-property-id-12345';
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/properties/${invalidId}`,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const is404 = res.statusCode === 404;
        const hasNotFoundUI = data.includes('no encontrada') || data.includes('not found') || data.includes('404');
        
        console.log(`✅ Status Code: ${res.statusCode}`);
        console.log(`✅ Tiene UI de 404: ${hasNotFoundUI}`);
        
        resolve({
          statusCode: res.statusCode,
          hasNotFoundUI,
          is404
        });
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Error probando 404: ${error.message}`));
    });

    req.end();
  });
}

// Main execution
async function runCompleteTest() {
  try {
    let propertyId;
    let publicUrl;
    let imagePath;
    
    // Step 1: Get property ID
    try {
      propertyId = await getValidPropertyId();
    } catch (error) {
      console.error(`❌ Error obteniendo propiedad: ${error.message}`);
      console.log('\n⚠️  Nota: Asegúrate de que el servidor Next.js esté corriendo en localhost:3000');
      return;
    }
    
    // Step 2: Create sample image
    try {
      imagePath = createSampleImage();
    } catch (error) {
      console.error(`❌ Error creando imagen: ${error.message}`);
      return;
    }
    
    // Step 3: Upload to bucket
    try {
      publicUrl = await uploadImageToBucket(propertyId, imagePath);
    } catch (error) {
      console.error(`❌ Error subiendo imagen: ${error.message}`);
      return;
    }
    
    // Wait a moment for the upload to propagate
    console.log('\n⏳ Esperando propagación del bucket...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 4: Test property page
    let pageResults;
    try {
      pageResults = await testPropertyDetailPage(propertyId);
    } catch (error) {
      console.error(`❌ Error probando página: ${error.message}`);
      return;
    }
    
    // Step 5: Test 404
    let notFoundResults;
    try {
      notFoundResults = await testInvalidPropertyId();
    } catch (error) {
      console.error(`❌ Error probando 404: ${error.message}`);
      return;
    }
    
    // Generate final report
    console.log('\n' + '='.repeat(60));
    console.log('📊 REPORTE FINAL');
    console.log('='.repeat(60));
    
    console.log(`\n🏠 PROPIEDAD PROBADA:`);
    console.log(`   ID: ${propertyId}`);
    console.log(`   URL: http://localhost:3000/properties/${propertyId}`);
    
    console.log(`\n🖼️  IMAGEN SUBIDA:`);
    console.log(`   Bucket: property-images`);
    console.log(`   Path: ${propertyId}/cover.jpg`);
    console.log(`   URL: ${publicUrl}`);
    
    console.log(`\n✅ PRUEBAS DE PÁGINA VÁLIDA:`);
    console.log(`   Status Code: ${pageResults.statusCode}`);
    console.log(`   Renderiza OK: ${pageResults.statusCode === 200 ? '✅' : '❌'}`);
    console.log(`   Usa imágenes del bucket: ${pageResults.hasImages ? '✅' : '❌'}`);
    
    console.log(`\n🔍 SEO META TAGS:`);
    console.log(`   og:image: ${pageResults.ogImage ? '✅' : '❌'}`);
    if (pageResults.ogImage) {
      console.log(`     URL: ${pageResults.ogImage}`);
    }
    console.log(`   twitter:image: ${pageResults.twitterImage ? '✅' : '❌'}`);
    if (pageResults.twitterImage) {
      console.log(`     URL: ${pageResults.twitterImage}`);
    }
    console.log(`   JSON-LD: ${pageResults.jsonLd ? '✅' : '❌'}`);
    if (pageResults.jsonLd) {
      try {
        const jsonData = JSON.parse(pageResults.jsonLd);
        console.log(`     Tiene imagen: ${jsonData.image ? '✅' : '❌'}`);
        if (jsonData.image) {
          console.log(`     URL imagen: ${Array.isArray(jsonData.image) ? jsonData.image[0] : jsonData.image}`);
        }
      } catch (e) {
        console.log(`     Error parseando JSON-LD: ${e.message}`);
      }
    }
    
    console.log(`\n❌ PRUEBAS DE ID INVÁLIDO:`);
    console.log(`   Status Code: ${notFoundResults.statusCode}`);
    console.log(`   Es 404: ${notFoundResults.is404 ? '✅' : '❌'}`);
    console.log(`   Tiene UI de 404: ${notFoundResults.hasNotFoundUI ? '✅' : '❌'}`);
    
    // Final verdict
    const allTestsPassed = 
      pageResults.statusCode === 200 &&
      pageResults.ogImage &&
      pageResults.twitterImage &&
      pageResults.jsonLd &&
      notFoundResults.is404;
    
    console.log(`\n🎯 VEREDICTO FINAL:`);
    console.log(`   ${allTestsPassed ? '🟢 GO' : '🔴 NO-GO'}`);
    
    if (!allTestsPassed) {
      console.log(`\n📋 PRÓXIMOS PASOS:`);
      if (pageResults.statusCode !== 200) {
        console.log(`   - Verificar que la página renderiza correctamente`);
      }
      if (!pageResults.ogImage) {
        console.log(`   - Implementar og:image meta tag`);
      }
      if (!pageResults.twitterImage) {
        console.log(`   - Implementar twitter:image meta tag`);
      }
      if (!pageResults.jsonLd) {
        console.log(`   - Implementar JSON-LD structured data`);
      }
      if (!notFoundResults.is404) {
        console.log(`   - Verificar manejo de IDs inválidos (404)`);
      }
    }
    
    // Cleanup
    try {
      fs.unlinkSync(imagePath);
      console.log(`\n🧹 Imagen temporal eliminada`);
    } catch (e) {
      console.log(`\n⚠️  No se pudo eliminar imagen temporal: ${e.message}`);
    }
    
    console.log('\n✨ Prueba completada exitosamente!');
    
  } catch (error) {
    console.error(`\n💥 Error general: ${error.message}`);
    console.error(error.stack);
  }
}

// Run the test
runCompleteTest();
