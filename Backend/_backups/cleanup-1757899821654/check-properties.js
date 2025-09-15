const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkProperties() {
  console.log('Checking properties in database...');
  
  // Check all properties
  const { data: allProps, error: allError } = await supabase
    .from('properties')
    .select('id, title, status, created_at')
    .limit(10);
    
  if (allError) {
    console.error('Error fetching all properties:', allError);
    return;
  }
  
  console.log('Total properties found:', allProps?.length || 0);
  if (allProps && allProps.length > 0) {
    console.log('Sample properties:');
    allProps.forEach(p => console.log('- ID:', p.id, 'Title:', p.title, 'Status:', p.status));
  }
  
  // Check AVAILABLE properties specifically
  const { data: availableProps, error: availableError } = await supabase
    .from('properties')
    .select('id, title, status')
    .eq('status', 'AVAILABLE');
    
  if (availableError) {
    console.error('Error fetching available properties:', availableError);
    return;
  }
  
  console.log('AVAILABLE properties found:', availableProps?.length || 0);
  
  // Check what statuses exist
  const { data: statusData, error: statusError } = await supabase
    .from('properties')
    .select('status')
    .not('status', 'is', null);
    
  if (!statusError && statusData) {
    const statuses = [...new Set(statusData.map(p => p.status))];
    console.log('Existing statuses:', statuses);
  }
}

checkProperties().catch(console.error);
