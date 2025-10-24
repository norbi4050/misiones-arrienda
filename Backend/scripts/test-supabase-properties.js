#!/usr/bin/env node

/**
 * Script para probar queries de Supabase directamente
 * Ejecutar: node scripts/test-supabase-properties.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: Environment variables missing');
  console.error('SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✓' : '✗');
  process.exit(1);
}

console.log('🔧 Testing Supabase connection...\n');
console.log('URL:', SUPABASE_URL);
console.log('Anon Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...\n');

// Cliente simple - solo anon key (como usuario anónimo)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runTests() {
  console.log('=' .repeat(60));
  console.log('TEST 1: Raw count - ALL properties (no filters)');
  console.log('=' .repeat(60));

  const test1 = await supabase
    .from('Property')
    .select('*', { count: 'exact' });

  console.log('Count:', test1.count);
  console.log('Data length:', test1.data?.length);
  console.log('Error:', test1.error?.message || 'none');
  if (test1.data && test1.data.length > 0) {
    console.log('Sample property:', {
      id: test1.data[0].id,
      title: test1.data[0].title,
      status: test1.data[0].status,
      is_active: test1.data[0].is_active
    });
  }
  console.log('');

  console.log('=' .repeat(60));
  console.log('TEST 2: With status filter (status = published)');
  console.log('=' .repeat(60));

  const test2 = await supabase
    .from('Property')
    .select('*', { count: 'exact' })
    .eq('status', 'published');

  console.log('Count:', test2.count);
  console.log('Data length:', test2.data?.length);
  console.log('Error:', test2.error?.message || 'none');
  if (test2.data && test2.data.length > 0) {
    console.log('Sample property:', {
      id: test2.data[0].id,
      title: test2.data[0].title,
      status: test2.data[0].status,
      is_active: test2.data[0].is_active
    });
  }
  console.log('');

  console.log('=' .repeat(60));
  console.log('TEST 3: With status AND is_active filters');
  console.log('=' .repeat(60));

  const test3 = await supabase
    .from('Property')
    .select('*', { count: 'exact' })
    .eq('status', 'published')
    .eq('is_active', true);

  console.log('Count:', test3.count);
  console.log('Data length:', test3.data?.length);
  console.log('Error:', test3.error?.message || 'none');
  if (test3.data && test3.data.length > 0) {
    console.log('Sample property:', {
      id: test3.data[0].id,
      title: test3.data[0].title,
      status: test3.data[0].status,
      is_active: test3.data[0].is_active
    });
  }
  console.log('');

  console.log('=' .repeat(60));
  console.log('TEST 4: All published properties - full data');
  console.log('=' .repeat(60));

  const test4 = await supabase
    .from('Property')
    .select('id, title, status, is_active, featured, expires_at')
    .eq('status', 'published')
    .eq('is_active', true);

  console.log('Count:', test4.data?.length);
  console.log('Error:', test4.error?.message || 'none');
  if (test4.data) {
    test4.data.forEach((prop, i) => {
      console.log(`\n  ${i + 1}. ${prop.title}`);
      console.log(`     ID: ${prop.id}`);
      console.log(`     Status: ${prop.status}`);
      console.log(`     Is Active: ${prop.is_active}`);
      console.log(`     Featured: ${prop.featured}`);
      console.log(`     Expires At: ${prop.expires_at}`);
    });
  }
  console.log('');

  console.log('=' .repeat(60));
  console.log('SUMMARY');
  console.log('=' .repeat(60));
  console.log('Test 1 (no filters):', test1.count, 'properties');
  console.log('Test 2 (status=published):', test2.count, 'properties');
  console.log('Test 3 (status=published AND is_active=true):', test3.count, 'properties');
  console.log('Test 4 (full data):', test4.data?.length, 'properties');
  console.log('');

  if (test1.count > 0 && test3.count === 0) {
    console.log('⚠️  WARNING: Filters are blocking results!');
    console.log('   Properties exist but filters return 0');
  } else if (test3.count > 0) {
    console.log('✅ SUCCESS: Queries are working correctly!');
  } else {
    console.log('❌ ERROR: No properties found at all');
  }
}

runTests().catch(console.error);
