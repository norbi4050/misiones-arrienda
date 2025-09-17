/**
 * DIAGNÓSTICO EXHAUSTIVO - PROBLEMA PERSISTENCIA AVATARES 2025
 * Investigación completa del flujo de subida y persistencia de avatares
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MjI3MzgsImV4cCI6MjA1MTQ5ODczOH0.vgrh05_Ej-Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnosticoAvatarPersistenciaExhaustivo() {
  console.log('🔍 DIAGNÓSTICO EXHAUSTIVO - PERSISTENCIA AVATARES 2025');
  console.log('='.repeat(70));

  const problemas = [];
  const soluciones = [];

  // ==========================================
  // FASE 1: VERIFICAR ESTRUCTURA DE TABLAS
  // ==========================================
  console.log('\n📋 FASE 1: Verificar estructura de tablas');
  console.log('-'.repeat(50));

  // Test 1.1: Verificar tabla User y campos
  console.log('\n🔍 Test 1.1: Estructura tabla User');
  try {
    const { data, error } = await supabase
      .from('User')
      .select('id, profile_image, updated_at, name, email')
      .limit(1);

    if (error) {
      problemas.push(`Error tabla User: ${error.message}`);
      console.log(`❌ Error accediendo tabla User: ${error.message}`);
    } else {
      console.log('✅ Tabla User accesible');
      console.log(`   Registros encontrados: ${data?.length || 0}`);
      
      if (data && data.length > 0) {
        const sample = data[0];
        console.log('   Campos disponibles:', Object.keys(sample));
        
        // Verificar campos específicos
        if (!sample.hasOwnProperty('profile_image')) {
          problemas.push('Campo profile_image no existe en tabla User');
          soluciones.push('Agregar campo profile_image a tabla User');
        } else {
          console.log('✅ Campo profile_image existe');
        }
        
        if (!sample.hasOwnProperty('updated_at')) {
          problemas.push('Campo updated_at no existe en tabla User');
          soluciones.push('Agregar campo updated_at a tabla User');
        } else {
          console.log('✅ Campo updated_at existe');
        }
      }
    }
  } catch (error) {
    problemas.push(`Error crítico tabla User: ${error.message}`);
    console.log(`❌ Error crítico: ${error.message}`);
  }

  // Test 1.2: Verificar usuario específico
  console.log('\n🔍 Test 1.2: Verificar usuario específico');
  try {
    const userId = '6403f9d2-e846-4c70-87e0-e051127d9500';
    const { data, error } = await supabase
      .from('User')
      .select('id, profile_image, updated_at, name')
      .eq('id', userId)
      .single();

    if (error) {
      problemas.push(`Usuario específico no encontrado: ${error.message}`);
      console.log(`❌ Usuario no encontrado: ${error.message}`);
    } else {
      console.log('✅ Usuario encontrado');
      console.log(`   ID: ${data.id}`);
      console.log(`   Nombre: ${data.name || 'Sin nombre'}`);
      console.log(`   Profile Image: ${data.profile_image || 'Sin imagen'}`);
      console.log(`   Updated At: ${data.updated_at || 'Sin fecha'}`);
    }
  } catch (error) {
    problemas.push(`Error buscando usuario: ${error.message}`);
    console.log(`❌ Error: ${error.message}`);
  }

  // ==========================================
  // FASE 2: VERIFICAR BUCKET AVATARS
  // ==========================================
  console.log('\n📁 FASE 2: Verificar bucket avatars');
  console.log('-'.repeat(50));

  // Test 2.1: Acceso al bucket
  console.log('\n🔍 Test 2.1: Acceso bucket avatars');
  try {
    const { data, error } = await supabase.storage
      .from('avatars')
      .list('', { limit: 5 });

    if (error) {
      problemas.push(`Error bucket avatars: ${error.message}`);
      console.log(`❌ Error accediendo bucket: ${error.message}`);
    } else {
      console.log('✅ Bucket avatars accesible');
      console.log(`   Carpetas encontradas: ${data?.length || 0}`);
      
      if (data && data.length > 0) {
        console.log('   Carpetas:', data.map(item => item.name).slice(0, 3));
      }
    }
  } catch (error) {
    problemas.push(`Error crítico bucket: ${error.message}`);
    console.log(`❌ Error crítico: ${error.message}`);
  }

  // ==========================================
  // FASE 3: VERIFICAR API ENDPOINTS
  // ==========================================
  console.log('\n🌐 FASE 3: Verificar API endpoints');
  console.log('-'.repeat(50));

  // Test 3.1: Endpoint avatar GET
  console.log('\n🔍 Test 3.1: API GET /api/users/avatar');
  try {
    const response = await fetch('http://localhost:3000/api/users/avatar', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('✅ API responde correctamente (401 sin auth)');
    } else if (response.status === 500) {
      const errorData = await response.json();
      problemas.push(`Error 500 en API: ${errorData.error || 'Error desconocido'}`);
      console.log(`❌ Error 500: ${errorData.error || 'Error desconocido'}`);
    } else {
      console.log(`⚠️  Status inesperado: ${response.status}`);
    }
  } catch (error) {
    problemas.push(`Error conectando API: ${error.message}`);
    console.log(`❌ Error conectando API: ${error.message}`);
    soluciones.push('Verificar que el servidor Next.js esté ejecutándose en puerto 3000');
  }

  // ==========================================
  // FASE 4: ANÁLISIS DE LOGS SUPABASE
  // ==========================================
  console.log('\n📊 FASE 4: Análisis de logs Supabase');
  console.log('-'.repeat(50));

  console.log('\n🔍 Análisis de errores reportados:');
  console.log('   - HEAD 400 en user_searches: Tabla no existe o RLS bloqueando');
  console.log('   - HEAD 400 en user_messages: Tabla no existe o RLS bloqueando');  
  console.log('   - HEAD 400 en profile_views: Tabla no existe o RLS bloqueando');
  console.log('   - POST 404 en get_user_stats: Función RPC no existe');

  problemas.push('Múltiples tablas con errores 400/404');
  soluciones.push('Ejecutar migraciones SQL para crear tablas faltantes');
  soluciones.push('Verificar y corregir políticas RLS');
  soluciones.push('Crear función get_user_stats en Supabase');

  // ==========================================
  // FASE 5: VERIFICAR COMPONENTES FRONTEND
  // ==========================================
  console.log('\n🎨 FASE 5: Verificar componentes frontend');
  console.log('-'.repeat(50));

  console.log('\n🔍 Test 5.1: Verificar archivos de componentes');
  const fs = require('fs');
  const path = require('path');
  
  const componentFiles = [
    'src/components/ui/avatar-universal.tsx',
    'src/components/ui/profile-avatar.tsx',
    'src/components/ui/profile-avatar-enhanced.tsx',
    'src/utils/avatar.ts',
    'src/app/api/users/avatar/route.ts'
  ];

  componentFiles.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${filePath} existe`);
    } else {
      problemas.push(`Archivo faltante: ${filePath}`);
      console.log(`❌ ${filePath} no existe`);
    }
  });

  // ==========================================
  // RESUMEN Y RECOMENDACIONES
  // ==========================================
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMEN DIAGNÓSTICO');
  console.log('='.repeat(70));

  console.log(`\n🚨 PROBLEMAS ENCONTRADOS (${problemas.length}):`);
  problemas.forEach((problema, index) => {
    console.log(`${index + 1}. ${problema}`);
  });

  console.log(`\n💡 SOLUCIONES RECOMENDADAS (${soluciones.length}):`);
  soluciones.forEach((solucion, index) => {
    console.log(`${index + 1}. ${solucion}`);
  });

  // ==========================================
  // PLAN DE ACCIÓN ESPECÍFICO
  // ==========================================
  console.log('\n🎯 PLAN DE ACCIÓN ESPECÍFICO PARA PERSISTENCIA:');
  console.log('-'.repeat(50));

  console.log('\n📋 PASO 1: Verificar estructura base');
  console.log('   - Confirmar que tabla User tiene campo profile_image');
  console.log('   - Confirmar que updated_at se actualiza automáticamente');
  console.log('   - Verificar que bucket avatars existe y es accesible');

  console.log('\n📋 PASO 2: Corregir políticas RLS');
  console.log('   - Ejecutar: Backend/sql-migrations/FIX-RLS-POLICIES-TYPE-CASTING-2025.sql');
  console.log('   - Verificar que políticas permiten UPDATE en tabla User');

  console.log('\n📋 PASO 3: Debugging API avatar');
  console.log('   - Agregar logs detallados en API de avatar');
  console.log('   - Verificar que actualización de profile_image se ejecuta');
  console.log('   - Confirmar que no hay rollback de transacción');

  console.log('\n📋 PASO 4: Testing frontend');
  console.log('   - Verificar que componente llama API correctamente');
  console.log('   - Confirmar que respuesta de API se procesa bien');
  console.log('   - Verificar que estado se actualiza en frontend');

  console.log('\n🏁 Diagnóstico completado');
  
  return {
    problemas,
    soluciones,
    totalProblemas: problemas.length,
    criticidad: problemas.length > 3 ? 'ALTA' : problemas.length > 1 ? 'MEDIA' : 'BAJA'
  };
}

// Ejecutar diagnóstico si se llama directamente
if (require.main === module) {
  diagnosticoAvatarPersistenciaExhaustivo()
    .then(results => {
      console.log(`\n🎯 CRITICIDAD: ${results.criticidad}`);
      process.exit(results.totalProblemas > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('💥 Error crítico en diagnóstico:', error);
      process.exit(1);
    });
}

module.exports = { diagnosticoAvatarPersistenciaExhaustivo };
