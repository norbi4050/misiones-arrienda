const { createClient } = require('@supabase/supabase-js');

// Configurar cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthStatus() {
  console.log('🔍 Verificando estado de autenticación...\n');

  try {
    // Verificar sesión actual
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('❌ Error obteniendo sesión:', sessionError.message);
      return;
    }

    if (sessionData.session) {
      console.log('✅ Usuario autenticado');
      console.log('📧 Email:', sessionData.session.user.email);
      console.log('🆔 User ID:', sessionData.session.user.id);

      // Verificar si el usuario existe en la tabla users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, email, user_type')
        .eq('id', sessionData.session.user.id)
        .single();

      if (userError) {
        console.error('❌ Error obteniendo datos del usuario:', userError.message);
        console.log('💡 Es posible que el usuario no exista en la tabla users');
      } else {
        console.log('✅ Usuario encontrado en tabla users:');
        console.log('   📝 Nombre:', userData.name);
        console.log('   👤 Tipo:', userData.user_type);
      }
    } else {
      console.log('❌ No hay sesión activa');
      console.log('💡 El usuario necesita iniciar sesión');
    }

  } catch (error) {
    console.error('❌ Error en test de autenticación:', error.message);
  }
}

testAuthStatus();
