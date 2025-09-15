/**
 * 🧪 TEST FASE 2: CONFIGURACIÓN DE SUPABASE STORAGE
 * 
 * Script para verificar que la configuración de Storage esté funcionando correctamente
 * FASE 2: OPTIMIZACIÓN DE RENDIMIENTO
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas');
  console.error('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Resultados del test
const testResults = {
  buckets: { passed: 0, failed: 0, details: [] },
  policies: { passed: 0, failed: 0, details: [] },
  functions: { passed: 0, failed: 0, details: [] },
  upload: { passed: 0, failed: 0, details: [] },
  overall: 'PENDING'
};

/**
 * Test 1: Verificar que los buckets existen
 */
async function testBuckets() {
  console.log('\n🗄️  TEST 1: Verificando buckets de Storage...');
  
  const expectedBuckets = ['property-images', 'user-avatars', 'verification-docs'];
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      throw error;
    }

    const bucketNames = buckets.map(bucket => bucket.id);
    
    for (const expectedBucket of expectedBuckets) {
      if (bucketNames.includes(expectedBucket)) {
        console.log(`   ✅ Bucket '${expectedBucket}' existe`);
        testResults.buckets.passed++;
        testResults.buckets.details.push(`✅ ${expectedBucket}: OK`);
      } else {
        console.log(`   ❌ Bucket '${expectedBucket}' NO existe`);
        testResults.buckets.failed++;
        testResults.buckets.details.push(`❌ ${expectedBucket}: FALTA`);
      }
    }

    // Verificar configuración de buckets
    for (const bucket of buckets) {
      if (expectedBuckets.includes(bucket.id)) {
        console.log(`   📋 ${bucket.id}:`);
        console.log(`      - Público: ${bucket.public}`);
        console.log(`      - Límite: ${bucket.file_size_limit ? (bucket.file_size_limit / 1024 / 1024).toFixed(1) + 'MB' : 'Sin límite'}`);
      }
    }

  } catch (error) {
    console.error(`   ❌ Error verificando buckets: ${error.message}`);
    testResults.buckets.failed += expectedBuckets.length;
    testResults.buckets.details.push(`❌ Error: ${error.message}`);
  }
}

/**
 * Test 2: Verificar políticas RLS
 */
async function testPolicies() {
  console.log('\n🔒 TEST 2: Verificando políticas RLS...');
  
  try {
    const { data: policies, error } = await supabase
      .from('pg_policies')
      .select('policyname, cmd, tablename')
      .eq('schemaname', 'storage')
      .eq('tablename', 'objects');

    if (error) {
      throw error;
    }

    const expectedPolicies = [
      'Public read access for property images',
      'Authenticated users can upload property images',
      'Users can update their own property images',
      'Users can delete their own property images',
      'Public read access for user avatars',
      'Users can upload their own avatar',
      'Users can update their own avatar',
      'Users can delete their own avatar'
    ];

    const policyNames = policies.map(p => p.policyname);

    for (const expectedPolicy of expectedPolicies) {
      if (policyNames.includes(expectedPolicy)) {
        console.log(`   ✅ Política '${expectedPolicy}' existe`);
        testResults.policies.passed++;
        testResults.policies.details.push(`✅ ${expectedPolicy}: OK`);
      } else {
        console.log(`   ❌ Política '${expectedPolicy}' NO existe`);
        testResults.policies.failed++;
        testResults.policies.details.push(`❌ ${expectedPolicy}: FALTA`);
      }
    }

    console.log(`   📊 Total políticas encontradas: ${policies.length}`);

  } catch (error) {
    console.error(`   ❌ Error verificando políticas: ${error.message}`);
    testResults.policies.failed++;
    testResults.policies.details.push(`❌ Error: ${error.message}`);
  }
}

/**
 * Test 3: Verificar funciones auxiliares
 */
async function testFunctions() {
  console.log('\n⚙️  TEST 3: Verificando funciones auxiliares...');
  
  const expectedFunctions = [
    'get_public_image_url',
    'cleanup_orphaned_images',
    'cleanup_property_images'
  ];

  try {
    const { data: functions, error } = await supabase
      .from('pg_proc')
      .select('proname')
      .in('proname', expectedFunctions);

    if (error) {
      throw error;
    }

    const functionNames = functions.map(f => f.proname);

    for (const expectedFunction of expectedFunctions) {
      if (functionNames.includes(expectedFunction)) {
        console.log(`   ✅ Función '${expectedFunction}' existe`);
        testResults.functions.passed++;
        testResults.functions.details.push(`✅ ${expectedFunction}: OK`);
      } else {
        console.log(`   ❌ Función '${expectedFunction}' NO existe`);
        testResults.functions.failed++;
        testResults.functions.details.push(`❌ ${expectedFunction}: FALTA`);
      }
    }

  } catch (error) {
    console.error(`   ❌ Error verificando funciones: ${error.message}`);
    testResults.functions.failed++;
    testResults.functions.details.push(`❌ Error: ${error.message}`);
  }
}

/**
 * Test 4: Test de upload básico
 */
async function testUpload() {
  console.log('\n📤 TEST 4: Probando upload de imagen de prueba...');
  
  try {
    // Crear una imagen de prueba simple (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
      0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33,
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    const testFileName = `test/test_image_${Date.now()}.png`;

    // Intentar subir a bucket de property-images
    const { data, error } = await supabase.storage
      .from('property-images')
      .upload(testFileName, testImageBuffer, {
        contentType: 'image/png'
      });

    if (error) {
      throw error;
    }

    console.log(`   ✅ Upload exitoso: ${testFileName}`);
    testResults.upload.passed++;
    testResults.upload.details.push(`✅ Upload: OK`);

    // Verificar URL pública
    const { data: publicUrlData } = supabase.storage
      .from('property-images')
      .getPublicUrl(testFileName);

    console.log(`   🔗 URL pública: ${publicUrlData.publicUrl}`);
    testResults.upload.details.push(`🔗 URL: ${publicUrlData.publicUrl}`);

    // Limpiar archivo de prueba
    const { error: deleteError } = await supabase.storage
      .from('property-images')
      .remove([testFileName]);

    if (deleteError) {
      console.log(`   ⚠️  No se pudo eliminar archivo de prueba: ${deleteError.message}`);
    } else {
      console.log(`   🗑️  Archivo de prueba eliminado`);
    }

  } catch (error) {
    console.error(`   ❌ Error en test de upload: ${error.message}`);
    testResults.upload.failed++;
    testResults.upload.details.push(`❌ Error: ${error.message}`);
  }
}

/**
 * Test 5: Verificar estado de migración actual
 */
async function testMigrationStatus() {
  console.log('\n📊 TEST 5: Verificando estado actual de imágenes...');
  
  try {
    const { data: properties, error } = await supabase
      .from('Property')
      .select('id, title, images')
      .not('images', 'is', null)
      .limit(10);

    if (error) {
      throw error;
    }

    let totalImages = 0;
    let base64Images = 0;
    let urlImages = 0;
    let otherImages = 0;

    properties.forEach(property => {
      if (Array.isArray(property.images)) {
        property.images.forEach(image => {
          totalImages++;
          if (typeof image === 'string') {
            if (image.startsWith('data:image/')) {
              base64Images++;
            } else if (image.startsWith('http')) {
              urlImages++;
            } else {
              otherImages++;
            }
          }
        });
      }
    });

    console.log(`   📋 Propiedades analizadas: ${properties.length}`);
    console.log(`   🖼️  Total imágenes: ${totalImages}`);
    console.log(`   📥 Imágenes Base64: ${base64Images}`);
    console.log(`   📤 Imágenes URL: ${urlImages}`);
    console.log(`   ❓ Otros formatos: ${otherImages}`);

    if (totalImages > 0) {
      const migrationProgress = ((urlImages / totalImages) * 100).toFixed(1);
      console.log(`   📈 Progreso migración: ${migrationProgress}%`);
      
      if (base64Images > 0) {
        console.log(`   ⚠️  Hay ${base64Images} imágenes pendientes de migrar`);
      } else {
        console.log(`   ✅ Todas las imágenes están migradas`);
      }
    } else {
      console.log(`   ℹ️  No hay imágenes para analizar`);
    }

  } catch (error) {
    console.error(`   ❌ Error verificando estado de migración: ${error.message}`);
  }
}

/**
 * Generar reporte final
 */
function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 REPORTE FINAL - TEST FASE 2: SUPABASE STORAGE');
  console.log('='.repeat(60));

  const totalPassed = testResults.buckets.passed + testResults.policies.passed + 
                     testResults.functions.passed + testResults.upload.passed;
  const totalFailed = testResults.buckets.failed + testResults.policies.failed + 
                     testResults.functions.failed + testResults.upload.failed;
  const totalTests = totalPassed + totalFailed;

  console.log(`\n📈 RESUMEN GENERAL:`);
  console.log(`   ✅ Tests pasados: ${totalPassed}`);
  console.log(`   ❌ Tests fallidos: ${totalFailed}`);
  console.log(`   📊 Total tests: ${totalTests}`);
  
  if (totalTests > 0) {
    const successRate = ((totalPassed / totalTests) * 100).toFixed(1);
    console.log(`   🎯 Tasa de éxito: ${successRate}%`);
    
    if (successRate >= 80) {
      testResults.overall = 'PASSED';
      console.log(`\n🎉 RESULTADO: ✅ CONFIGURACIÓN EXITOSA`);
    } else if (successRate >= 60) {
      testResults.overall = 'WARNING';
      console.log(`\n⚠️  RESULTADO: 🟡 CONFIGURACIÓN PARCIAL`);
    } else {
      testResults.overall = 'FAILED';
      console.log(`\n❌ RESULTADO: 🔴 CONFIGURACIÓN FALLIDA`);
    }
  }

  // Detalles por categoría
  console.log(`\n📋 DETALLES POR CATEGORÍA:`);
  
  console.log(`\n🗄️  BUCKETS (${testResults.buckets.passed}/${testResults.buckets.passed + testResults.buckets.failed}):`);
  testResults.buckets.details.forEach(detail => console.log(`   ${detail}`));
  
  console.log(`\n🔒 POLÍTICAS RLS (${testResults.policies.passed}/${testResults.policies.passed + testResults.policies.failed}):`);
  testResults.policies.details.forEach(detail => console.log(`   ${detail}`));
  
  console.log(`\n⚙️  FUNCIONES (${testResults.functions.passed}/${testResults.functions.passed + testResults.functions.failed}):`);
  testResults.functions.details.forEach(detail => console.log(`   ${detail}`));
  
  console.log(`\n📤 UPLOAD TEST (${testResults.upload.passed}/${testResults.upload.passed + testResults.upload.failed}):`);
  testResults.upload.details.forEach(detail => console.log(`   ${detail}`));

  // Recomendaciones
  console.log(`\n💡 PRÓXIMOS PASOS:`);
  
  if (testResults.overall === 'PASSED') {
    console.log(`   1. ✅ Configuración completa - Proceder con migración de imágenes`);
    console.log(`   2. 🔄 Ejecutar: node Backend/scripts/migrate-images-to-storage.js check`);
    console.log(`   3. 📤 Ejecutar: node Backend/scripts/migrate-images-to-storage.js migrate`);
  } else if (testResults.overall === 'WARNING') {
    console.log(`   1. ⚠️  Revisar elementos fallidos antes de continuar`);
    console.log(`   2. 🔧 Ejecutar script SQL faltante en Supabase Dashboard`);
    console.log(`   3. 🔄 Volver a ejecutar este test`);
  } else {
    console.log(`   1. ❌ Ejecutar script SQL completo en Supabase Dashboard`);
    console.log(`   2. 🔧 Verificar variables de entorno`);
    console.log(`   3. 🔄 Volver a ejecutar este test`);
  }

  // Guardar reporte
  const reportPath = path.join(__dirname, 'test-storage-setup-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Reporte guardado en: ${reportPath}`);
}

/**
 * Función principal
 */
async function runTests() {
  console.log('🧪 INICIANDO TESTS DE CONFIGURACIÓN SUPABASE STORAGE');
  console.log('='.repeat(60));
  console.log(`📅 Fecha: ${new Date().toLocaleString()}`);
  console.log(`🌐 URL Supabase: ${supabaseUrl}`);
  console.log(`🔑 Service Key: ${supabaseServiceKey ? '✅ Configurada' : '❌ Falta'}`);

  try {
    await testBuckets();
    await testPolicies();
    await testFunctions();
    await testUpload();
    await testMigrationStatus();
    
    generateReport();

  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO EN LOS TESTS:');
    console.error(error.message);
    process.exit(1);
  }
}

// Ejecutar tests
runTests();
