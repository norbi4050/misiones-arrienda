const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRLSPoliciesFix() {
  console.log('🧪 Test de Solución Error 403 Profile RLS\n');

  try {
    // 1. Verificar autenticación
    console.log('1️⃣ Verificando autenticación...');

    const { data: authData, error: authError } = await supabase.auth.getSession();

    if (authError) {
      console.log('❌ Error de autenticación:', authError.message);
      console.log('💡 Necesitas estar autenticado para esta prueba');
      return;
    }

    if (!authData.session) {
      console.log('❌ No hay sesión activa');
      console.log('💡 Inicia sesión primero para probar las políticas RLS');
      return;
    }

    console.log('✅ Usuario autenticado:', authData.session.user.email);
    console.log('🆔 User ID:', authData.session.user.id);

    // 2. Probar SELECT (debería funcionar)
    console.log('\n2️⃣ Probando SELECT (debería funcionar)...');

    const { data: selectData, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.session.user.id)
      .single();

    if (selectError) {
      console.log('❌ SELECT failed:', selectError.message);
      console.log('🔍 Error code:', selectError.code);
    } else {
      console.log('✅ SELECT successful');
      console.log('📊 User data retrieved');
    }

    // 3. Probar UPDATE (esta es la operación que fallaba antes)
    console.log('\n3️⃣ Probando UPDATE (operación crítica que fallaba)...');

    const testUpdateData = {
      name: `Test Update ${Date.now()}`,
      updated_at: new Date().toISOString()
    };

    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update(testUpdateData)
      .eq('id', authData.session.user.id)
      .select()
      .single();

    if (updateError) {
      console.log('❌ UPDATE failed:', updateError.message);
      console.log('🔍 Error code:', updateError.code);
      console.log('📝 Error details:', updateError.details);

      if (updateError.code === 'PGRST116') {
        console.log('💡 Error PGRST116 indica problema de permisos RLS');
        console.log('🔧 Las políticas RLS no están configuradas correctamente');
      } else if (updateError.message.includes('permission denied')) {
        console.log('💡 Error de permisos - las políticas RLS están bloqueando la operación');
      }
    } else {
      console.log('✅ UPDATE successful!');
      console.log('🎉 El error 403 ha sido resuelto');
      console.log('📊 Updated user data:', updateData);
    }

    // 4. Probar INSERT (para usuarios nuevos)
    console.log('\n4️⃣ Probando INSERT (para nuevos usuarios)...');

    // Solo probar si no existe un registro para este usuario
    if (!selectData) {
      const testInsertData = {
        id: authData.session.user.id,
        email: authData.session.user.email,
        name: 'Test User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert(testInsertData)
        .select()
        .single();

      if (insertError) {
        console.log('❌ INSERT failed:', insertError.message);
        console.log('🔍 Error code:', insertError.code);
      } else {
        console.log('✅ INSERT successful');
        console.log('📊 New user created:', insertData);
      }
    } else {
      console.log('⏭️  INSERT skipped (user already exists)');
    }

    // 5. Verificar políticas actuales
    console.log('\n5️⃣ Verificando políticas RLS actuales...');

    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies_for_table', { table_name: 'users' });

    if (policiesError) {
      console.log('❌ Error getting policies:', policiesError.message);
    } else {
      console.log('📋 Políticas activas:', policies?.length || 0);
      if (policies && policies.length > 0) {
        policies.forEach((policy, index) => {
          console.log(`   ${index + 1}. ${policy.policyname} (${policy.cmd})`);
        });
      } else {
        console.log('⚠️  No hay políticas RLS definidas');
        console.log('💡 Esto explica por qué las operaciones fallan');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  console.log('\n🎯 Test completado!');
  console.log('\n📋 Resumen:');
  console.log('   • Si UPDATE funciona: ✅ Error 403 resuelto');
  console.log('   • Si UPDATE falla: ❌ Políticas RLS necesitan ajuste');
  console.log('   • Si no hay políticas: ❌ Ejecutar solucion-403-error-profile-rls.sql');
}

testRLSPoliciesFix();
