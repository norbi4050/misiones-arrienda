const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createDemoProperty() {
  console.log('🏠 Creando propiedad demo PUBLISHED + activa...');
  
  try {
    // Step 1: Create or get a demo user
    console.log('\n📋 PASO 1: Verificando/creando usuario demo...');
    
    let demoUser;
    const { data: existingUsers, error: userSearchError } = await supabase
      .from('User')
      .select('*')
      .eq('email', 'demo@misiones-arrienda.com')
      .limit(1);
    
    if (userSearchError) {
      console.error('Error buscando usuario:', userSearchError);
      return;
    }
    
    if (existingUsers && existingUsers.length > 0) {
      demoUser = existingUsers[0];
      console.log(`✅ Usuario demo existente encontrado: ${demoUser.id}`);
    } else {
      // Create demo user
      const { data: newUser, error: userError } = await supabase
        .from('User')
        .insert({
          name: 'Usuario Demo',
          email: 'demo@misiones-arrienda.com',
          phone: '+54 376 123-4567',
          password: 'demo123', // In real app this would be hashed
          userType: 'dueno_directo',
          verified: true,
          emailVerified: true
        })
        .select()
        .single();
      
      if (userError) {
        console.error('Error creando usuario:', userError);
        return;
      }
      
      demoUser = newUser;
      console.log(`✅ Usuario demo creado: ${demoUser.id}`);
    }
    
    // Step 2: Create demo property
    console.log('\n🏠 PASO 2: Creando propiedad demo...');
    
    const propertyData = {
      title: 'Casa demo Posadas Centro',
      description: 'Hermosa casa en el centro de Posadas, ideal para familias. Propiedad demo para pruebas de sistema.',
      price: 120000,
      currency: 'USD',
      bedrooms: 3,
      bathrooms: 2,
      garages: 1,
      area: 150.5,
      lotArea: 300.0,
      address: 'Av. Mitre 1234',
      city: 'Posadas',
      province: 'Misiones',
      postalCode: '3300',
      latitude: -27.3676,
      longitude: -55.8961,
      propertyType: 'HOUSE',
      status: 'PUBLISHED', // ✅ PUBLISHED status
      images: '[]', // ✅ Empty array as JSON string to force fallback
      virtualTourUrl: null,
      amenities: '["piscina", "jardin", "cochera", "parrilla"]',
      features: '["aire_acondicionado", "calefaccion", "alarma"]',
      yearBuilt: 2018,
      floor: null,
      totalFloors: 1,
      featured: false,
      isActive: true, // ✅ Active property
      contact_name: 'Juan Demo',
      contact_phone: '+54 376 123-4567',
      contact_email: 'demo@misiones-arrienda.com',
      expiresAt: null,
      highlightedUntil: null,
      isPaid: false,
      userId: demoUser.id
    };
    
    const { data: property, error: propertyError } = await supabase
      .from('Property')
      .insert(propertyData)
      .select()
      .single();
    
    if (propertyError) {
      console.error('Error creando propiedad:', propertyError);
      return;
    }
    
    console.log(`✅ Propiedad demo creada exitosamente!`);
    console.log(`   ID: ${property.id}`);
    console.log(`   Título: ${property.title}`);
    console.log(`   Status: ${property.status}`);
    console.log(`   isActive: ${property.isActive}`);
    console.log(`   Precio: ${property.currency} ${property.price.toLocaleString()}`);
    console.log(`   Imágenes: ${property.images} (vacío para forzar fallback)`);
    
    // Step 3: Test API endpoint
    console.log('\n🧪 PASO 3: Probando endpoint API...');
    
    const testResponse = await fetch('http://localhost:3000/api/properties?limit=1');
    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log(`✅ API responde correctamente`);
      console.log(`   Propiedades encontradas: ${testData.items?.length || 0}`);
      if (testData.items && testData.items.length > 0) {
        console.log(`   Primera propiedad ID: ${testData.items[0].id}`);
      }
    } else {
      console.log(`⚠️  API no responde (status: ${testResponse.status})`);
    }
    
    // Step 4: Show test commands
    console.log('\n📖 COMANDOS DE PRUEBA:');
    console.log(`   node Backend/test-detail-seo-fallback.mjs --id=${property.id}`);
    console.log(`   node Backend/test-detail-seo-fallback.mjs`);
    console.log(`   node Backend/test-property-images-bucket-upload-complete.js`);
    
    console.log('\n✨ ¡Propiedad demo lista para pruebas!');
    
  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

// Run the script
createDemoProperty();
