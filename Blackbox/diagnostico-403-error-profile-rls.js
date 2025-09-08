const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseRLSPolicies() {
  console.log('🔍 Diagnóstico de Políticas RLS - Error 403 Profile\n');

  try {
    // 1. Check if RLS is enabled on users table
    console.log('1️⃣ Verificando estado de RLS en tabla users...');

    const { data: rlsEnabled, error: rlsError } = await supabase
      .rpc('check_rls_enabled', { table_name: 'users' });

    if (rlsError) {
      console.log('❌ Error checking RLS status:', rlsError.message);
    } else {
      console.log('✅ RLS Status for users table:', rlsEnabled ? 'ENABLED' : 'DISABLED');
    }

    // 2. Get current policies for users table
    console.log('\n2️⃣ Obteniendo políticas actuales para tabla users...');

    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies_for_table', { table_name: 'users' });

    if (policiesError) {
      console.log('❌ Error getting policies:', policiesError.message);
      console.log('💡 Esto puede indicar que no hay políticas definidas o hay un problema de permisos');
    } else {
      console.log('📋 Políticas encontradas:', policies?.length || 0);
      if (policies && policies.length > 0) {
        policies.forEach((policy, index) => {
          console.log(`\n📄 Política ${index + 1}:`);
          console.log(`   Nombre: ${policy.policyname}`);
          console.log(`   Comando: ${policy.cmd}`);
          console.log(`   Roles: ${policy.roles}`);
          console.log(`   Calificativo: ${policy.qual}`);
          console.log(`   Con chequeo: ${policy.with_check}`);
        });
      } else {
        console.log('⚠️  No se encontraron políticas definidas para la tabla users');
        console.log('💡 Esto explica el error 403 - no hay permisos para operaciones UPDATE/INSERT');
      }
    }

    // 3. Test a simple SELECT operation (should work if user is authenticated)
    console.log('\n3️⃣ Probando operación SELECT (debería funcionar)...');

    const { data: selectData, error: selectError } = await supabase
      .from('users')
      .select('id, name, email')
      .limit(1);

    if (selectError) {
      console.log('❌ SELECT failed:', selectError.message);
      console.log('💡 Esto indica problemas de permisos incluso para lectura');
    } else {
      console.log('✅ SELECT successful');
      console.log('📊 Sample data:', selectData);
    }

    // 4. Test UPDATE operation (this should fail with 403)
    console.log('\n4️⃣ Probando operación UPDATE (debería fallar con 403)...');

    const testUserId = '6403f9d2-e846-4c70-87e0-e051127d9500'; // From the logs
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ name: 'Test Update' })
      .eq('id', testUserId);

    if (updateError) {
      console.log('❌ UPDATE failed (expected):', updateError.message);
      console.log('🔍 Error code:', updateError.code);
      console.log('📝 Error details:', updateError.details);
    } else {
      console.log('✅ UPDATE successful (unexpected)');
    }

    // 5. Check authentication status
    console.log('\n5️⃣ Verificando estado de autenticación...');

    const { data: authData, error: authError } = await supabase.auth.getSession();

    if (authError) {
      console.log('❌ Auth check failed:', authError.message);
    } else {
      console.log('✅ Auth status:', authData.session ? 'AUTHENTICATED' : 'NOT AUTHENTICATED');
      if (authData.session) {
        console.log('👤 User ID:', authData.session.user.id);
        console.log('📧 User Email:', authData.session.user.email);
      }
    }

  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  }

  console.log('\n🎯 Diagnóstico completado!');
  console.log('\n📋 Resumen del problema:');
  console.log('   • Error 403 indica falta de permisos RLS');
  console.log('   • La tabla users probablemente no tiene políticas UPDATE/INSERT');
  console.log('   • Los usuarios autenticados no pueden modificar sus propios perfiles');
  console.log('\n💡 Solución necesaria: Crear políticas RLS para permitir UPDATE/INSERT en users');
}

diagnoseRLSPolicies();
