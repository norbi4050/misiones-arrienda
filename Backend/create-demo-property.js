const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');
const path = require('path');

// Load environment variables from Backend directory
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createDemoProperty() {
  try {
    // Generate a fixed UUID for the demo property
    const demoPropertyId = randomUUID();
    console.log(`Generated UUID: ${demoPropertyId}`);

    // First, we need a user to associate with the property
    // Let's create a demo user first
    const demoUserId = randomUUID();
    
    const demoUser = {
      id: demoUserId,
      name: 'Demo User',
      email: 'demo@example.com',
      phone: '+54 376 123456',
      password: 'demo123', // In real app this would be hashed
      userType: 'dueno_directo',
      verified: true,
      emailVerified: true
    };

    console.log('Creating demo user...');
    const { data: userData, error: userError } = await supabase
      .from('User')
      .insert([demoUser])
      .select()
      .single();

    if (userError) {
      console.log('User might already exist, trying to find existing user...');
      const { data: existingUser } = await supabase
        .from('User')
        .select('id')
        .eq('email', 'demo@example.com')
        .single();
      
      if (existingUser) {
        console.log('Using existing demo user:', existingUser.id);
        demoUser.id = existingUser.id;
      } else {
        throw userError;
      }
    } else {
      console.log('Demo user created:', userData.id);
    }

    // Now create the demo property
    const demoProperty = {
      id: demoPropertyId,
      title: 'Casa demo Posadas Centro',
      description: 'Hermosa casa ubicada en el corazón de Posadas, ideal para familias. Cuenta con amplios espacios, excelente iluminación natural y se encuentra cerca de todos los servicios.',
      price: 120000,
      currency: 'USD',
      bedrooms: 3,
      bathrooms: 2,
      garages: 1,
      area: 120,
      address: 'Av. Mitre 123',
      city: 'Posadas',
      province: 'Misiones',
      postalCode: '3300',
      propertyType: 'HOUSE',
      status: 'PUBLISHED', // This is the key field for the requirement
      isActive: true, // This is the key field for the requirement
      images: '[]', // Empty array to force fallback
      amenities: '["garage", "jardin", "parrilla"]',
      features: '["luminosa", "amplia", "centrica"]',
      contact_name: 'Demo User',
      contact_phone: '+54 376 123456',
      contact_email: 'demo@example.com',
      userId: demoUser.id,
      featured: false,
      isPaid: false
    };

    console.log('\nInserting demo property...');
    console.log('SQL equivalent:');
    console.log(`INSERT INTO "Property" (
      id, title, description, price, currency, bedrooms, bathrooms, garages, area,
      address, city, province, "postalCode", "propertyType", status, "isActive",
      images, amenities, features, contact_name, contact_phone, contact_email,
      "userId", featured, "isPaid"
    ) VALUES (
      '${demoPropertyId}',
      'Casa demo Posadas Centro',
      'Hermosa casa ubicada en el corazón de Posadas, ideal para familias. Cuenta con amplios espacios, excelente iluminación natural y se encuentra cerca de todos los servicios.',
      120000,
      'USD',
      3,
      2,
      1,
      120,
      'Av. Mitre 123',
      'Posadas',
      'Misiones',
      '3300',
      'HOUSE',
      'PUBLISHED',
      true,
      '[]',
      '["garage", "jardin", "parrilla"]',
      '["luminosa", "amplia", "centrica"]',
      'Demo User',
      '+54 376 123456',
      'demo@example.com',
      '${demoUser.id}',
      false,
      false
    );`);

    const { data: propertyData, error: propertyError } = await supabase
      .from('Property')
      .insert([demoProperty])
      .select()
      .single();

    if (propertyError) {
      console.error('Error creating demo property:', propertyError);
      return;
    }

    console.log('\n=== DEMO PROPERTY CREATED SUCCESSFULLY ===');
    console.log(`Property ID: ${propertyData.id}`);
    console.log(`Title: ${propertyData.title}`);
    console.log(`Status: ${propertyData.status}`);
    console.log(`isActive: ${propertyData.isActive}`);
    console.log(`Price: ${propertyData.currency} ${propertyData.price}`);
    console.log(`Location: ${propertyData.address}, ${propertyData.city}, ${propertyData.province}`);
    console.log(`\n=== BUCKET PATH CONFIRMATION ===`);
    console.log(`Ruta del bucket: property-images/${propertyData.id}/`);
    console.log(`(Esta es la ruta de fallback que usa el sistema para las imágenes)`);

    // Test the API endpoint
    console.log('\n=== TESTING API ENDPOINT ===');
    await testApiEndpoint(propertyData.id);

  } catch (error) {
    console.error('Error:', error);
  }
}

async function testApiEndpoint(propertyId) {
  try {
    const response = await fetch(`http://localhost:3000/api/properties/${propertyId}`);
    
    console.log(`API Response Status: ${response.status}`);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('✅ API endpoint returns 200 OK');
      console.log('Property data retrieved successfully:');
      console.log(`- ID: ${data.id}`);
      console.log(`- Title: ${data.title}`);
      console.log(`- Status: ${data.status}`);
      console.log(`- isActive: ${data.isActive}`);
    } else {
      console.log('❌ API endpoint failed');
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
  } catch (error) {
    console.error('Error testing API endpoint:', error.message);
    console.log('Make sure the Next.js server is running on localhost:3000');
  }
}

// Run the script
createDemoProperty();
