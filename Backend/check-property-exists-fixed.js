require('dotenv').config({ path: './.env.local' });

async function checkProperty() {
  const propertyId = '4d4dc702-953a-41b9-b875-8c1eaa3d8714';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    console.error('Environment variable NEXT_PUBLIC_SUPABASE_URL is not set');
    return;
  }

  const url = `${supabaseUrl}/rest/v1/Property?id=eq.${encodeURIComponent(propertyId)}&select=id,title,status,is_active`;

  try {
    const response = await fetch(url, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
    });

    if (!response.ok) {
      console.error('Error fetching property:', response.status, response.statusText);
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

checkProperty();
