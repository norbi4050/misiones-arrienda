const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getValidPropertyId() {
  try {
    console.log('Querying Supabase for PUBLISHED + ACTIVE properties...');

    const { data: properties, error } = await supabase
      .from('properties')
      .select('id, status, is_active, title, created_at')
      .eq('status', 'PUBLISHED')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error querying properties:', error.message);
      return;
    }

    if (!properties || properties.length === 0) {
      console.log('No PUBLISHED + ACTIVE properties found in database');
      return;
    }

    const property = properties[0];
    console.log('\n=== VALID PROPERTY ID FOUND ===');
    console.log(`ID: ${property.id}`);
    console.log(`Status: ${property.status}`);
    console.log(`is_active: ${property.is_active}`);
    console.log(`Title: ${property.title}`);
    console.log(`Created: ${property.created_at}`);

    // Also show the expected bucket path
    console.log('\n=== EXPECTED BUCKET PATH ===');
    console.log(`property-images/${property.id}/`);
    console.log('This path is constructed in Backend/src/lib/property-images.ts');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

getValidPropertyId();
