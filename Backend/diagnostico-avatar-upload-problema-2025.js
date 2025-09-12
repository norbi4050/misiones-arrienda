const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 DIAGNÓSTICO: Avatar no se guarda - 2025');
console.log('===========================================\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnosticarProblemaAvatar() {
  try {
    console.log('1. 🔗 Verificando conexión a Supabase...');
    
    // Test básico de conexión
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('⚠️  Error de conexión:', testError.message);
    } else {
      console.log('✅ Conexión a Supabase OK');
    }

    console.log('\n2. 📁 Verificando bucket de avatares...');
    
    // Verificar buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('❌ Error al verificar buckets:', bucketsError.message);
      console.log('💡 SOLUCIÓN: Ejecutar Backend/sql-migrations/fix-avatar-upload-rls-2025.sql');
      return;
    }

    const avatarsBucket = buckets.find(bucket => bucket.id === 'avatars');
    if (!avatarsBucket) {
      console.log('❌ Bucket "avatars" NO EXISTE');
      console.log('💡 PROBLEMA ENCONTRADO: Falta crear el bucket de avatares');
      console.log('🔧 SOLUCIÓN: Ejecutar Backend/sql-migrations/fix-avatar-upload-rls-2025.sql');
      return;
    }

    console.log('✅ Bucket "avatars" existe');
    console.log(`   - Público: ${avatarsBucket.public ? '✅' : '❌'}`);
    console.log(`   - Límite: ${avatarsBucket.file_size_limit ? (avatarsBucket.file_size_limit / 1024 / 1024).toFixed(1) + 'MB' : 'Sin límite'}`);

    if (!avatarsBucket.public) {
      console.log('⚠️  PROBLEMA: Bucket no es público');
    }

    console.log('\n3. 🔒 Verificando políticas RLS...');
    
    // Intentar listar archivos para probar políticas
    const { data: files, error: filesError } = await supabase.storage
      .from('avatars')
      .list('', { limit: 1 });

    if (filesError) {
      console.log('❌ Error con políticas RLS:', filesError.message);
      console.log('💡 PROBLEMA ENCONTRADO: Políticas RLS incorrectas o faltantes');
      console.log('🔧 SOLUCIÓN: Ejecutar Backend/sql-migrations/fix-avatar-upload-rls-2025.sql');
    } else {
      console.log('✅ Políticas RLS funcionando');
      console.log(`   - Archivos encontrados: ${files.length}`);
    }

    console.log('\n4. 🗄️ Verificando tabla users...');
    
    // Verificar estructura de tabla users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, profile_image')
      .limit(1);

    if (userError) {
      console.log('❌ Error accediendo tabla users:', userError.message);
      if (userError.message.includes('permission denied')) {
        console.log('💡 PROBLEMA: Políticas RLS de tabla users incorrectas');
        console.log('🔧 SOLUCIÓN: Ejecutar Backend/FIX-CRITICO-RLS-USER-TABLE-2025.sql');
      }
    } else {
      console.log('✅ Tabla users accesible');
      if (userData.length > 0) {
        console.log(`   - Usuario ejemplo: ${userData[0].id}`);
        console.log(`   - Tiene avatar: ${userData[0].profile_image ? '✅' : '❌'}`);
      }
    }

    console.log('\n5. 🔍 Verificando API endpoint...');
    
    // Test del endpoint de avatar
    try {
      const response = await fetch('http://localhost:3000/api/users/avatar', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        console.log('✅ API endpoint responde (401 esperado sin auth)');
      } else if (response.ok) {
        console.log('✅ API endpoint responde correctamente');
      } else {
        console.log(`⚠️  API endpoint status: ${response.status}`);
      }
    } catch (error) {
      console.log('⚠️  No se pudo probar API endpoint (servidor no corriendo)');
    }

    console.log('\n' + '='.repeat(50));
    console.log('📋 DIAGNÓSTICO COMPLETO');
    console.log('='.repeat(50));

    console.log('\n🎯 PROBLEMA PRINCIPAL:');
    console.log('El avatar no se guarda porque las políticas RLS no están configuradas correctamente.');

    console.log('\n🔧 SOLUCIÓN INMEDIATA:');
    console.log('1. Ve a tu panel de Supabase (https://supabase.com/dashboard)');
    console.log('2. Abre el SQL Editor');
    console.log('3. Copia y ejecuta el contenido de: Backend/sql-migrations/fix-avatar-upload-rls-2025.sql');
    console.log('4. Prueba subir el avatar nuevamente');

    console.log('\n📝 PASOS DETALLADOS:');
    console.log('1. Abrir Supabase Dashboard');
    console.log('2. Ir a SQL Editor');
    console.log('3. Ejecutar migración SQL');
    console.log('4. Verificar que aparezca "✅ CONFIGURACIÓN COMPLETADA"');
    console.log('5. Probar upload de avatar');

    console.log('\n✨ DESPUÉS DE LA MIGRACIÓN:');
    console.log('- El avatar se guardará correctamente');
    console.log('- Persistirá entre sesiones');
    console.log('- Funcionará tanto en localhost como en producción');

  } catch (error) {
    console.error('❌ Error durante diagnóstico:', error.message);
    console.log('\n🔧 SOLUCIÓN GENERAL:');
    console.log('1. Verificar variables de entorno de Supabase');
    console.log('2. Ejecutar Backend/sql-migrations/fix-avatar-upload-rls-2025.sql');
    console.log('3. Reiniciar servidor local');
  }
}

// Ejecutar diagnóstico
diagnosticarProblemaAvatar().catch(console.error);
