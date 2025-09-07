const fetch = require('node-fetch');

async function testProfileAPI() {
  console.log('🧪 Testing Profile API Fix...\n');

  const baseURL = 'http://localhost:3000';

  try {
    // Test 1: GET request to fetch profile
    console.log('1️⃣ Testing GET /api/users/profile...');
    const getResponse = await fetch(`${baseURL}/api/users/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    console.log(`   Status: ${getResponse.status}`);
    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log('   ✅ GET request successful');
      console.log('   Profile data keys:', Object.keys(getData.profile || {}));
    } else {
      const errorData = await getResponse.text();
      console.log('   ❌ GET request failed:', errorData);
    }

    // Test 2: PUT request to update profile
    console.log('\n2️⃣ Testing PUT /api/users/profile...');
    const testProfileData = {
      name: 'Usuario Test Actualizado',
      phone: '+54 376 123 4567',
      location: 'Posadas, Misiones',
      bio: 'Perfil actualizado desde test'
    };

    const putResponse = await fetch(`${baseURL}/api/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(testProfileData)
    });

    console.log(`   Status: ${putResponse.status}`);
    if (putResponse.ok) {
      const putData = await putResponse.json();
      console.log('   ✅ PUT request successful');
      console.log('   Updated profile:', putData.profile?.name);
    } else {
      const errorData = await putResponse.text();
      console.log('   ❌ PUT request failed:', errorData);
    }

    // Test 3: PATCH request (alternative method)
    console.log('\n3️⃣ Testing PATCH /api/users/profile...');
    const patchResponse = await fetch(`${baseURL}/api/users/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        name: 'Usuario Test PATCH',
        phone: '+54 376 987 6543'
      })
    });

    console.log(`   Status: ${patchResponse.status}`);
    if (patchResponse.ok) {
      const patchData = await patchResponse.json();
      console.log('   ✅ PATCH request successful');
    } else {
      const errorData = await patchResponse.text();
      console.log('   ❌ PATCH request failed:', errorData);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }

  console.log('\n🎯 Test completed!');
  console.log('\n💡 Make sure:');
  console.log('   - Next.js server is running on localhost:3000');
  console.log('   - User is authenticated in the browser');
  console.log('   - Supabase tables and policies are properly configured');
}

testProfileAPI();
