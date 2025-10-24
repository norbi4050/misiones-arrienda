/**
 * Test script para llamar directamente al endpoint de Analytics
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testEndpoint() {
  console.log('🧪 Testing Analytics API Endpoint...\n');

  try {
    // Obtener un usuario autenticado
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1)
      .single();

    if (userError) {
      console.error('❌ Error getting user:', userError.message);
      return;
    }

    console.log(`Testing with user: ${userData.email} (${userData.id})\n`);

    // Llamar al endpoint
    const ranges = ['7d', '30d', '90d'];

    for (const range of ranges) {
      console.log(`📊 Testing range: ${range}`);

      const url = `http://localhost:3000/api/analytics/dashboard?userId=${userData.id}&range=${range}`;

      try {
        const response = await fetch(url, {
          headers: {
            'Cookie': `sb-access-token=${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          }
        });

        console.log(`   Status: ${response.status} ${response.statusText}`);

        if (response.ok) {
          const data = await response.json();
          console.log('   ✅ Response structure:');
          console.log(`      - summary.totalViews: ${data.summary?.totalViews}`);
          console.log(`      - summary.totalContacts: ${data.summary?.totalContacts}`);
          console.log(`      - summary.conversionRate: ${data.summary?.conversionRate}%`);
          console.log(`      - viewsByDay: ${data.viewsByDay?.length} days`);
          console.log(`      - topProperties: ${data.topProperties?.length} properties`);
          console.log(`      - Comparisons:`);
          console.log(`        * viewsChange: ${data.summary?.viewsChange}%`);
          console.log(`        * contactsChange: ${data.summary?.contactsChange}%`);
          console.log('');
        } else {
          const errorText = await response.text();
          console.log(`   ❌ Error response: ${errorText}\n`);
        }
      } catch (fetchError) {
        console.log(`   ❌ Fetch error: ${fetchError.message}`);
        console.log('   Hint: Make sure dev server is running (npm run dev)\n');
      }
    }

    console.log('✅ Test completed!');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }
}

// Check if server is running first
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/health', {
      method: 'GET'
    });
    return response.ok;
  } catch {
    return false;
  }
}

(async () => {
  const serverRunning = await checkServer();

  if (!serverRunning) {
    console.log('⚠️  Development server is not running on http://localhost:3000');
    console.log('   Please start it with: npm run dev');
    console.log('   Then run this test again.\n');
    process.exit(1);
  }

  await testEndpoint();
})();
