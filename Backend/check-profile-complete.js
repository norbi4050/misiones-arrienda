// Script para verificar qué datos faltan en el perfil
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProfile() {
  console.log('🔍 Verificando perfil de empresa...\n');

  // Obtener usuario con plan professional
  const { data: user } = await supabase
    .from('users')
    .select('id, email, company_name, phone, address, description')
    .eq('plan_tier', 'professional')
    .limit(1)
    .single();

  if (!user) {
    console.error('❌ No se encontró usuario');
    return;
  }

  console.log(`👤 Usuario: ${user.email}`);
  console.log(`   ID: ${user.id}\n`);

  console.log('📋 Estado del perfil:\n');

  // Verificar campos obligatorios
  const required = {
    'Nombre Comercial': user.company_name,
    'Teléfono': user.phone,
    'Dirección': user.address
  };

  let allComplete = true;

  for (const [field, value] of Object.entries(required)) {
    const status = value ? '✅' : '❌';
    const display = value || '(vacío)';
    console.log(`   ${status} ${field}: ${display}`);
    if (!value) allComplete = false;
  }

  console.log('\n📝 Campos opcionales:\n');
  console.log(`   Descripción: ${user.description || '(vacío)'}`);

  console.log('\n' + '━'.repeat(50));

  if (allComplete) {
    console.log('✅ Perfil completo - Botón "Ver perfil público" debería aparecer');
  } else {
    console.log('❌ Perfil incompleto - Botón "Ver perfil público" NO aparecerá');
    console.log('\n💡 Para que aparezca el botón, necesitás completar:');
    for (const [field, value] of Object.entries(required)) {
      if (!value) {
        console.log(`   - ${field}`);
      }
    }
  }

  console.log('\n🔗 URL del perfil público:');
  console.log(`   http://localhost:3000/inmobiliaria/${user.id}\n`);
}

checkProfile()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
