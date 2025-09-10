// Test script using the provided configuration
const fetch = require('node-fetch');

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTY3MzgsImV4cCI6MjA3MTM5MjczOH0.vgrh055OkiBIJFBlRlEuEZAOF2FHo3LBUNitB09dSIE';

async function testPropertyAPI() {
  const propertyId = '4d4dc702-953a-41b9-b875-8c1eaa3d8714';

  console.log('Testing property API with configuration...');
  console.log('NODE_ENV=development');
  console.log('NEXT_PUBLIC_APP_URL=http://localhost:3000');
  console.log('NEXT_PUBLIC_API_URL=http://localhost:3000/api');
  console.log('NEXT_PUBLIC_BASE_URL=http://localhost:3000');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL);

  try {
    // Test with existing property ID
    const response = await fetch(`${SUPABASE_URL}/rest/v1/Property?id=eq.${encodeURIComponent(propertyId)}&select=id,title,status,is_active`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error('Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return;
    }

    const data = await response.json();
    console.log('Property data:', data);

    if (data.length === 0) {
      console.log('Property not found');
    } else {
      console.log('Property exists:', data[0]);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testPropertyAPI();
