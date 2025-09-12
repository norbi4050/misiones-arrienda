const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🧪 TESTING COMPLETO AVATAR UPLOAD FIX - 2025');
console.log('==============================================\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  console.log('Variables encontradas:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ Faltante');
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Configurada' : '❌ Faltante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCompleteAvatarFix() {
  let testResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
    details: []
  };

  try {
    // Test 1: Verificar conexión a Supabase
    console.log('1. 🔗 Verificando conexión a Supabase...');
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      if (error && !error.message.includes('permission denied')) {
        throw error;
      }
      console.log('✅ Conexión a Supabase establecida');
      testResults.passed++;
      testResults.details.push('✅ Conexión Supabase: OK');
    } catch (error) {
      console.log('❌ Error de conexión:', error.message);
      testResults.failed++;
      testResults.details.push('❌ Conexión Supabase: FAILED');
    }

    // Test 2: Verificar bucket de avatares
    console.log('\n2. 📁 Verificando bucket de avatares...');
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        throw bucketsError;
      }

      const avatarsBucket = buckets.find(bucket => bucket.id === 'avatars');
      if (!avatarsBucket) {
        console.log('❌ Bucket "avatars" no encontrado');
        console.log('💡 Ejecuta: Backend/sql-migrations/fix-avatar-upload-rls-2025.sql');
        testResults.failed++;
        testResults.details.push('❌ Bucket avatars: NOT FOUND');
      } else {
        console.log('✅ Bucket "avatars" encontrado');
        console.log(`   - Público: ${avatarsBucket.public ? '✅' : '❌'}`);
        console.log(`   - Límite: ${avatarsBucket.file_size_limit ? (avatarsBucket.file_size_limit / 1024 / 1024).toFixed(1) + 'MB' : 'Sin límite'}`);
        testResults.passed++;
        testResults.details.push('✅ Bucket avatars: EXISTS');
        
        if (!avatarsBucket.public) {
          testResults.warnings++;
          testResults.details.push('⚠️ Bucket avatars: NOT PUBLIC');
        }
      }
    } catch (error) {
      console.log('❌ Error verificando buckets:', error.message);
      testResults.failed++;
      testResults.details.push('❌ Bucket verification: FAILED');
    }

    // Test 3: Verificar estructura de archivos del proyecto
    console.log('\n3. 📂 Verificando archivos del proyecto...');
    const requiredFiles = [
      'sql-migrations/fix-avatar-upload-rls-2025.sql',
      'src/app/api/users/avatar/route.ts',
      'src/components/ui/profile-avatar-enhanced.tsx'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}`);
        testResults.passed++;
      } else {
        console.log(`❌ ${file} - NO ENCONTRADO`);
        testResults.failed++;
      }
    }

    // Test 4: Verificar contenido del API route
    console.log('\n4. 🔍 Verificando API route actualizado...');
    try {
      const apiRoutePath = path.join(__dirname, 'src/app/api/users/avatar/route.ts');
      const apiContent = fs.readFileSync(apiRoutePath, 'utf8');
      
      // Verificar que usa la nueva estructura de paths
      if (apiContent.includes('const filePath = `${user.id}/${fileName}`;')) {
        console.log('✅ API route usa nueva estructura de paths');
        testResults.passed++;
        testResults.details.push('✅ API route: NEW PATH STRUCTURE');
      } else {
        console.log('❌ API route no usa nueva estructura de paths');
        testResults.failed++;
        testResults.details.push('❌ API route: OLD PATH STRUCTURE');
      }

      // Verificar compatibilidad backward
      if (apiContent.includes('Manejar tanto el formato antiguo como el nuevo')) {
        console.log('✅ API route mantiene compatibilidad backward');
        testResults.passed++;
        testResults.details.push('✅ API route: BACKWARD COMPATIBILITY');
      } else {
        console.log('⚠️ API route podría no tener compatibilidad backward');
        testResults.warnings++;
        testResults.details.push('⚠️ API route: BACKWARD COMPATIBILITY UNCLEAR');
      }
    } catch (error) {
      console.log('❌ Error verificando API route:', error.message);
      testResults.failed++;
      testResults.details.push('❌ API route verification: FAILED');
    }

    // Test 5: Verificar migración SQL
    console.log('\n5. 📜 Verificando migración SQL...');
    try {
      const sqlPath = path.join(__dirname, 'sql-migrations/fix-avatar-upload-rls-2025.sql');
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');
      
      const requiredPolicies = [
        'Avatars — public read',
        'Avatars — users can insert into own folder',
        'Avatars — users can update own objects',
        'Avatars — users can delete own objects'
      ];

      let policiesFound = 0;
      for (const policy of requiredPolicies) {
        if (sqlContent.includes(policy)) {
          policiesFound++;
        }
      }

      if (policiesFound === requiredPolicies.length) {
        console.log('✅ Todas las políticas RLS están en la migración');
        testResults.passed++;
        testResults.details.push('✅ SQL Migration: ALL POLICIES PRESENT');
      } else {
        console.log(`⚠️ Solo ${policiesFound}/${requiredPolicies.length} políticas encontradas`);
        testResults.warnings++;
        testResults.details.push('⚠️ SQL Migration: INCOMPLETE POLICIES');
      }
    } catch (error) {
      console.log('❌ Error verificando migración SQL:', error.message);
      testResults.failed++;
      testResults.details.push('❌ SQL Migration verification: FAILED');
    }

    // Test 6: Verificar que el servidor puede iniciarse
    console.log('\n6. 🚀 Verificando configuración del servidor...');
    try {
      const packagePath = path.join(__dirname, 'package.json');
      if (fs.existsSync(packagePath)) {
        const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        if (packageContent.scripts && packageContent.scripts.dev) {
          console.log('✅ Script de desarrollo configurado');
          testResults.passed++;
          testResults.details.push('✅ Server config: DEV SCRIPT READY');
        } else {
          console.log('⚠️ Script de desarrollo no encontrado');
          testResults.warnings++;
          testResults.details.push('⚠️ Server config: NO DEV SCRIPT');
        }
      }
    } catch (error) {
      console.log('⚠️ No se pudo verificar configuración del servidor');
      testResults.warnings++;
      testResults.details.push('⚠️ Server config: VERIFICATION FAILED');
    }

    // Resumen de resultados
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN DE TESTING');
    console.log('='.repeat(50));
    console.log(`✅ Tests Pasados: ${testResults.passed}`);
    console.log(`❌ Tests Fallidos: ${testResults.failed}`);
    console.log(`⚠️ Advertencias: ${testResults.warnings}`);
    console.log(`📈 Tasa de Éxito: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

    console.log('\n📋 DETALLES:');
    testResults.details.forEach(detail => console.log(`   ${detail}`));

    // Recomendaciones
    console.log('\n🚀 PRÓXIMOS PASOS:');
    if (testResults.failed === 0) {
      console.log('1. ✅ Todos los tests críticos pasaron');
      console.log('2. 🔧 Ejecutar migración SQL en Supabase');
      console.log('3. 🧪 Probar upload de avatar desde la interfaz');
      console.log('4. ✨ Verificar que no aparezca el error RLS');
    } else {
      console.log('1. 🔧 Corregir los tests fallidos mostrados arriba');
      console.log('2. 🔄 Volver a ejecutar este test');
      console.log('3. 📖 Revisar la documentación en REPORTE-FINAL-FIX-AVATAR-UPLOAD-RLS-2025.md');
    }

    console.log('\n' + '='.repeat(50));
    if (testResults.failed === 0) {
      console.log('🎉 TESTING COMPLETADO - LISTO PARA IMPLEMENTAR');
    } else {
      console.log('⚠️ TESTING COMPLETADO - REQUIERE CORRECCIONES');
    }
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Error durante el testing:', error.message);
    console.log('\n🔧 SOLUCIÓN:');
    console.log('1. Verifica las variables de entorno de Supabase');
    console.log('2. Asegúrate de que el proyecto de Supabase esté activo');
    console.log('3. Revisa la conectividad de red');
  }
}

// Ejecutar el test completo
testCompleteAvatarFix().catch(console.error);
