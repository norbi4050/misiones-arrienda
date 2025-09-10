const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const http = require('http');

// Supabase configuration
const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('🎯 OBTENIENDO EVIDENCIAS FINALES');
console.log('='.repeat(50));

async function getPropertyId() {
  console.log('\n📋 A. OBTENIENDO ID DE PRUEBA...');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/properties?limit=1',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.items && response.items.length > 0) {
            const property = response.items.find(p => 
              p.status === 'PUBLISHED' && (p.isActive === true || p.is_active === true)
            );
            if (property) {
              console.log(`✅ ID encontrado: ${property.id}`);
              resolve(property.id);
            } else {
              reject(new Error('No hay propiedades PUBLISHED + activas'));
            }
          } else {
            reject(new Error('No hay propiedades'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function uploadImage(propertyId) {
  console.log('\n☁️ B. SUBIENDO IMAGEN AL BUCKET...');
  
  // Create simple SVG image
  const svgContent = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#4F46E5"/>
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" fill="white" text-anchor="middle" dy=".3em">COVER IMAGE</text>
  </svg>`;
  
  const filePath = `${propertyId}/cover.jpg`;
  
  try {
    const { data, error } = await supabase.storage
      .from('property-images')
      .upload(filePath, svgContent, {
        contentType: 'image/svg+xml',
        upsert: true
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('property-images')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;
    console.log(`✅ URL pública: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    throw new Error(`Error subiendo: ${error.message}`);
  }
}

async function getPageHTML(propertyId) {
  console.log('\n🔍 C. OBTENIENDO HTML RENDERIZADO...');
  
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
        console.log(`✅ HTML obtenido - Status: ${res.statusCode}`);
        resolve(data);
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function test404() {
  console.log('\n❌ D. PROBANDO 404...');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/properties/invalid-id-12345',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`✅ Status 404: ${res.statusCode}`);
        resolve({ statusCode: res.statusCode, html: data });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runEvidencias() {
  try {
    // A. Get property ID
    const propertyId = await getPropertyId();
    
    // B. Upload image
    const publicUrl = await uploadImage(propertyId);
    
    // Wait for propagation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // C. Get HTML
    const html = await getPageHTML(propertyId);
    
    // D. Test 404
    const notFoundResult = await test404();
    
    // Extract SEO snippets
    const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    const twitterImageMatch = html.match(/<meta name="twitter:image" content="([^"]+)"/);
    const jsonLdMatch = html.match(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/s);
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 EVIDENCIAS FINALES');
    console.log('='.repeat(50));
    
    console.log('\nA. ID DE PRUEBA:');
    console.log(propertyId);
    
    console.log('\nB. URL PÚBLICA DE IMAGEN:');
    console.log(publicUrl);
    
    console.log('\nC. SNIPPETS SEO (HTML renderizado):');
    console.log('\nog:image:');
    console.log(ogImageMatch ? ogImageMatch[0] : 'No encontrado');
    
    console.log('\ntwitter:image:');
    console.log(twitterImageMatch ? twitterImageMatch[0] : 'No encontrado');
    
    console.log('\nJSON-LD:');
    if (jsonLdMatch) {
      try {
        const jsonData = JSON.parse(jsonLdMatch[1]);
        console.log(`"image": ${JSON.stringify(jsonData.image || 'No encontrado')}`);
      } catch (e) {
        console.log('Error parseando JSON-LD');
      }
    } else {
      console.log('JSON-LD no encontrado');
    }
    
    console.log('\nD. 404/NOT FOUND:');
    console.log(`Status: ${notFoundResult.statusCode}`);
    console.log(`Es 404: ${notFoundResult.statusCode === 404 ? 'SÍ' : 'NO'}`);
    
    console.log('\n✅ EVIDENCIAS COMPLETAS OBTENIDAS');
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

runEvidencias();
