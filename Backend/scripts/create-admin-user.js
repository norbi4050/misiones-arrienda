/**
 * Script para crear el usuario admin en Supabase
 * Usa el Service Role Key para bypasear RLS y crear el usuario correctamente
 *
 * USO:
 *   node scripts/create-admin-user.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const ADMIN_EMAIL = 'misionesarrienda@gmail.com';
const ADMIN_PASSWORD = 'Admin2025Misiones!'; // ⚠️ CAMBIAR después del primer login
const ADMIN_NAME = 'Admin Misiones Arrienda';

async function createAdminUser() {
  console.log('🚀 Iniciando creación de usuario admin...\n');

  // Verificar variables de entorno
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Error: Variables de entorno faltantes');
    console.error('   Asegúrate de que .env.local tenga:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log('✅ Variables de entorno encontradas');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Service Key: ${serviceRoleKey.substring(0, 20)}...\n`);

  // Crear cliente de Supabase con Service Role Key
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Paso 1: Verificar si el usuario ya existe
    console.log('🔍 Verificando si el usuario ya existe...');
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      throw new Error(`Error listando usuarios: ${listError.message}`);
    }

    const existingUser = existingUsers.users.find(u => u.email === ADMIN_EMAIL);

    if (existingUser) {
      console.log('⚠️  El usuario ya existe con ID:', existingUser.id);
      console.log('   Email:', existingUser.email);
      console.log('   Creado:', existingUser.created_at);
      console.log('\n✨ Puedes iniciar sesión con este usuario.');
      console.log('   Si olvidaste la contraseña, puedes resetearla desde Supabase Dashboard.\n');
      return;
    }

    console.log('✅ El usuario no existe, procediendo a crearlo...\n');

    // Paso 2: Crear usuario en Supabase Auth
    console.log('🔐 Creando usuario en Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        name: ADMIN_NAME,
        full_name: ADMIN_NAME,
      }
    });

    if (authError) {
      throw new Error(`Error creando usuario en Auth: ${authError.message}`);
    }

    console.log('✅ Usuario creado en Auth con ID:', authData.user.id);

    // Paso 3: Crear perfil en tabla profiles
    console.log('👤 Creando perfil en tabla profiles...');
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          full_name: ADMIN_NAME,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);

    if (profileError) {
      console.warn('⚠️  Error creando perfil:', profileError.message);
      console.warn('   El usuario fue creado en Auth, pero el perfil falló.');
      console.warn('   Esto es OK si el trigger automático ya creó el perfil.\n');
    } else {
      console.log('✅ Perfil creado exitosamente\n');
    }

    // Resumen final
    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 ¡Usuario admin creado exitosamente!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('📧 Email:    ', ADMIN_EMAIL);
    console.log('🔑 Password: ', ADMIN_PASSWORD);
    console.log('🆔 User ID:  ', authData.user.id);
    console.log('');
    console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login');
    console.log('');
    console.log('🔗 Iniciar sesión:');
    console.log('   https://www.misionesarrienda.com.ar/login');
    console.log('');
    console.log('🛡️  Acceso al panel admin:');
    console.log('   1. Inicia sesión con las credenciales de arriba');
    console.log('   2. Click en tu perfil (arriba derecha)');
    console.log('   3. Click en "Panel de Admin"');
    console.log('');
    console.log('═══════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nDetalles del error:');
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar
createAdminUser();
