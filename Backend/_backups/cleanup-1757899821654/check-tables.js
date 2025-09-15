const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  console.log('Checking database tables...');
  
  // Try properties (lowercase)
  try {
    const { data: propsLower, error: errorLower } = await supabase
      .from('properties')
      .select('id, title, status')
      .limit(5);
      
    if (!errorLower) {
      console.log('✅ Table "properties" (lowercase) exists');
      console.log('   Records found:', propsLower?.length || 0);
      if (propsLower && propsLower.length > 0) {
        propsLower.forEach(p => console.log(`   - ${p.id}: ${p.title} (${p.status})`));
      }
    } else {
      console.log('❌ Table "properties" (lowercase) error:', errorLower.message);
    }
  } catch (e) {
    console.log('❌ Table "properties" (lowercase) not accessible');
  }
  
  // Try Property (uppercase)
  try {
    const { data: propsUpper, error: errorUpper } = await supabase
      .from('Property')
      .select('id, title, status')
      .limit(5);
      
    if (!errorUpper) {
      console.log('✅ Table "Property" (uppercase) exists');
      console.log('   Records found:', propsUpper?.length || 0);
      if (propsUpper && propsUpper.length > 0) {
        propsUpper.forEach(p => console.log(`   - ${p.id}: ${p.title} (${p.status})`));
      }
    } else {
      console.log('❌ Table "Property" (uppercase) error:', errorUpper.message);
    }
  } catch (e) {
    console.log('❌ Table "Property" (uppercase) not accessible');
  }
}

checkTables().catch(console.error);
