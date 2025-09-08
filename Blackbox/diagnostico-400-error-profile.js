const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseProfileError() {
  console.log('🔍 Diagnóstico del Error 400 en Profile API\n');

  try {
    // 1. Verificar estructura de la tabla users
    console.log('1️⃣ Verificando estructura de tabla users...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('❌ Error al consultar tabla users:', tableError);
      return;
    }

    console.log('✅ Tabla users accesible');
    console.log('Campos disponibles:', Object.keys(tableInfo[0] || {}));

    // 2. Verificar políticas RLS
    console.log('\n2️⃣ Verificando políticas RLS...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies', { table_name: 'users' });

    if (policiesError) {
      console.log('⚠️ No se pudo verificar políticas RLS:', policiesError.message);
    } else {
      console.log('Políticas encontradas:', policies?.length || 0);
    }

    // 3. Intentar una consulta básica
    console.log('\n3️⃣ Probando consulta básica...');
    const { data: basicQuery, error: basicError } = await supabase
      .from('users')
      .select('id, name, email')
      .limit(1);

    if (basicError) {
      console.log('❌ Error en consulta básica:', basicError);
    } else {
      console.log('✅ Consulta básica exitosa');
    }

    // 4. Simular el payload que envía el frontend
    console.log('\n4️⃣ Probando payload similar al del frontend...');
    const testPayload = {
      id: '6403f9d2-e846-4c70-87e0-e051127d9500',
      name: 'Usuario Test',
      phone: '+54 376 1234567',
      location: 'Posadas, Misiones',
      bio: 'Perfil de prueba',
      user_type: 'inquilino'
    };

    console.log('Payload de prueba:', JSON.stringify(testPayload, null, 2));

    // 5. Intentar upsert sin autenticación (debería fallar)
    console.log('\n5️⃣ Probando upsert sin autenticación...');
    const { data: upsertData, error: upsertError } = await supabase
      .from('users')
      .upsert(testPayload, { onConflict: 'id' })
      .select();

    if (upsertError) {
      console.log('❌ Error en upsert (esperado sin auth):', upsertError.message);
      console.log('Código de error:', upsertError.code);
      console.log('Detalles:', upsertError.details);
    } else {
      console.log('⚠️ Upsert sin auth funcionó (inesperado)');
    }

    // 6. Verificar si el usuario existe
    console.log('\n6️⃣ Verificando si el usuario de prueba existe...');
    const { data: userExists, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', '6403f9d2-e846-4c70-87e0-e051127d9500')
      .maybeSingle();

    if (userError) {
      console.log('❌ Error al buscar usuario:', userError);
    } else if (userExists) {
      console.log('✅ Usuario encontrado:', userExists);
    } else {
      console.log('⚠️ Usuario no encontrado en la tabla');
    }

    // 7. Verificar constraints y tipos de datos
    console.log('\n7️⃣ Verificando posibles problemas de constraints...');
    const problematicFields = [];
    const payloadKeys = Object.keys(testPayload);

    // Verificar si hay campos que no existen en la tabla
    if (tableInfo && tableInfo[0]) {
      const tableFields = Object.keys(tableInfo[0]);
      payloadKeys.forEach(key => {
        if (!tableFields.includes(key)) {
          problematicFields.push(`${key} (no existe en tabla)`);
        }
      });
    }

    if (problematicFields.length > 0) {
      console.log('❌ Campos problemáticos encontrados:');
      problematicFields.forEach(field => console.log(`   - ${field}`));
    } else {
      console.log('✅ Todos los campos del payload existen en la tabla');
    }

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  }

  console.log('\n🎯 Diagnóstico completado');
  console.log('\n💡 Posibles causas del error 400:');
  console.log('   1. Autenticación faltante o inválida');
  console.log('   2. Campos no existentes en la tabla');
  console.log('   3. Constraints de base de datos violadas');
  console.log('   4. Políticas RLS bloqueando la operación');
  console.log('   5. Tipos de datos incompatibles');
}

diagnoseProfileError();
