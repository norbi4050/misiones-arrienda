/**
 * SCRIPT DE TESTING SQL SUPABASE CORREGIDO - 2025
 * 
 * Este script verifica que la migración SQL corregida funcione correctamente
 * y que todas las tablas, funciones y políticas estén creadas.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Colores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bold');
  console.log('='.repeat(60));
}

function logTest(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const statusColor = passed ? 'green' : 'red';
  log(`${status} ${testName}`, statusColor);
  if (details) {
    log(`   ${details}`, 'yellow');
  }
}

// Configurar cliente Supabase
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Variables de entorno de Supabase no configuradas');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

// Tests principales
async function runSQLTests() {
  logSection('🗄️ TESTING SQL SUPABASE CORREGIDO - 2025');
  
  let totalTests = 0;
  let passedTests = 0;
  let supabase;

  try {
    supabase = createSupabaseClient();
    log('✅ Cliente Supabase configurado correctamente', 'green');
  } catch (error) {
    log('❌ Error configurando Supabase: ' + error.message, 'red');
    return;
  }

  // ==========================================
  // 1. VERIFICAR TABLAS CREADAS
  // ==========================================
  logSection('📊 Verificación de Tablas');

  const expectedTables = [
    'profile_views',
    'user_messages', 
    'user_searches',
    'user_ratings',
    'user_activity_log'
  ];

  for (const tableName of expectedTables) {
    totalTests++;
    try {
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', tableName);

      const tableExists = !error && data && data.length > 0;
      logTest(`Tabla: ${tableName}`, tableExists, 
        tableExists ? 'Creada correctamente' : `Error: ${error?.message || 'No encontrada'}`);
      
      if (tableExists) passedTests++;
    } catch (err) {
      logTest(`Tabla: ${tableName}`, false, `Error: ${err.message}`);
    }
  }

  // ==========================================
  // 2. VERIFICAR FUNCIONES CREADAS
  // ==========================================
  logSection('🔧 Verificación de Funciones');

  const expectedFunctions = [
    'get_user_profile_stats',
    'log_profile_view'
  ];

  for (const functionName of expectedFunctions) {
    totalTests++;
    try {
      const { data, error } = await supabase
        .from('information_schema.routines')
        .select('routine_name')
        .eq('routine_schema', 'public')
        .eq('routine_name', functionName);

      const functionExists = !error && data && data.length > 0;
      logTest(`Función: ${functionName}`, functionExists,
        functionExists ? 'Creada correctamente' : `Error: ${error?.message || 'No encontrada'}`);
      
      if (functionExists) passedTests++;
    } catch (err) {
      logTest(`Función: ${functionName}`, false, `Error: ${err.message}`);
    }
  }

  // ==========================================
  // 3. VERIFICAR RLS POLICIES
  // ==========================================
  logSection('🔒 Verificación de RLS Policies');

  totalTests++;
  try {
    const { data, error } = await supabase.rpc('sql', {
      query: `
        SELECT COUNT(*) as policy_count
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND tablename IN ('profile_views', 'user_messages', 'user_searches', 'user_ratings', 'user_activity_log');
      `
    });

    const hasPolicies = !error && data && data[0]?.policy_count > 0;
    logTest('RLS Policies configuradas', hasPolicies,
      hasPolicies ? `${data[0]?.policy_count} políticas encontradas` : 'No se encontraron políticas');
    
    if (hasPolicies) passedTests++;
  } catch (err) {
    logTest('RLS Policies configuradas', false, `Error: ${err.message}`);
  }

  // ==========================================
  // 4. PROBAR FUNCIÓN DE ESTADÍSTICAS
  // ==========================================
  logSection('🧪 Testing de Funciones');

  totalTests++;
  try {
    // Intentar obtener un usuario existente
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError || !users || users.users.length === 0) {
      logTest('Función get_user_profile_stats', false, 'No hay usuarios para probar');
    } else {
      const testUserId = users.users[0].id;
      
      const { data, error } = await supabase.rpc('get_user_profile_stats', {
        target_user_id: testUserId
      });

      const functionWorks = !error && data;
      logTest('Función get_user_profile_stats', functionWorks,
        functionWorks ? 'Función ejecutada correctamente' : `Error: ${error?.message}`);
      
      if (functionWorks) {
        passedTests++;
        log(`   Resultado: ${JSON.stringify(data, null, 2)}`, 'blue');
      }
    }
  } catch (err) {
    logTest('Función get_user_profile_stats', false, `Error: ${err.message}`);
  }

  // ==========================================
  // 5. VERIFICAR ÍNDICES
  // ==========================================
  logSection('📈 Verificación de Índices');

  totalTests++;
  try {
    const { data, error } = await supabase.rpc('sql', {
      query: `
        SELECT COUNT(*) as index_count
        FROM pg_indexes 
        WHERE schemaname = 'public'
        AND tablename IN ('profile_views', 'user_messages', 'user_searches', 'user_ratings', 'user_activity_log');
      `
    });

    const hasIndexes = !error && data && data[0]?.index_count > 0;
    logTest('Índices creados', hasIndexes,
      hasIndexes ? `${data[0]?.index_count} índices encontrados` : 'No se encontraron índices');
    
    if (hasIndexes) passedTests++;
  } catch (err) {
    logTest('Índices creados', false, `Error: ${err.message}`);
  }

  // ==========================================
  // 6. VERIFICAR TRIGGERS
  // ==========================================
  logSection('⚡ Verificación de Triggers');

  totalTests++;
  try {
    const { data, error } = await supabase.rpc('sql', {
      query: `
        SELECT COUNT(*) as trigger_count
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public'
        AND trigger_name LIKE '%updated_at%';
      `
    });

    const hasTriggers = !error && data && data[0]?.trigger_count > 0;
    logTest('Triggers updated_at', hasTriggers,
      hasTriggers ? `${data[0]?.trigger_count} triggers encontrados` : 'No se encontraron triggers');
    
    if (hasTriggers) passedTests++;
  } catch (err) {
    logTest('Triggers updated_at', false, `Error: ${err.message}`);
  }

  // ==========================================
  // 7. TEST DE INSERCIÓN BÁSICA
  // ==========================================
  logSection('💾 Test de Inserción');

  totalTests++;
  try {
    // Intentar insertar un registro de prueba en user_activity_log
    const { data, error } = await supabase
      .from('user_activity_log')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // UUID de prueba
        activity_type: 'login',
        activity_description: 'Test login',
        entity_type: 'test',
        metadata: { test: true }
      })
      .select();

    const insertWorks = !error && data && data.length > 0;
    logTest('Inserción en user_activity_log', insertWorks,
      insertWorks ? 'Inserción exitosa' : `Error: ${error?.message}`);
    
    if (insertWorks) {
      passedTests++;
      
      // Limpiar el registro de prueba
      await supabase
        .from('user_activity_log')
        .delete()
        .eq('id', data[0].id);
    }
  } catch (err) {
    logTest('Inserción en user_activity_log', false, `Error: ${err.message}`);
  }

  // ==========================================
  // RESUMEN FINAL
  // ==========================================
  logSection('📊 RESUMEN DE RESULTADOS SQL');

  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  const status = successRate >= 90 ? 'EXCELENTE' : 
                 successRate >= 70 ? 'BUENO' : 
                 successRate >= 50 ? 'REGULAR' : 'CRÍTICO';
  const statusColor = successRate >= 90 ? 'green' : 
                      successRate >= 70 ? 'yellow' : 'red';

  log(`\nTests SQL ejecutados: ${totalTests}`, 'blue');
  log(`Tests exitosos: ${passedTests}`, 'green');
  log(`Tests fallidos: ${totalTests - passedTests}`, 'red');
  log(`Tasa de éxito: ${successRate}%`, statusColor);
  log(`Estado de la migración: ${status}`, statusColor);

  // ==========================================
  // RECOMENDACIONES
  // ==========================================
  if (successRate < 100) {
    logSection('💡 RECOMENDACIONES');
    
    if (successRate < 50) {
      log('🚨 CRÍTICO: La migración SQL no se ejecutó correctamente', 'red');
      log('• Verificar que ejecutaste TODO el contenido del archivo SQL', 'yellow');
      log('• Revisar permisos de administrador en Supabase', 'yellow');
      log('• Verificar que no hay errores de sintaxis', 'yellow');
    } else if (successRate < 90) {
      log('⚠️ PARCIAL: Algunos elementos no se crearon correctamente', 'yellow');
      log('• Revisar logs de Supabase para errores específicos', 'yellow');
      log('• Re-ejecutar partes específicas de la migración', 'yellow');
    }
    
    log('📖 Consultar: INSTRUCCIONES-SQL-SUPABASE-CORREGIDO-2025.md', 'blue');
  } else {
    logSection('🎉 ¡MIGRACIÓN SQL EXITOSA!');
    log('✅ Todas las tablas, funciones y políticas están creadas', 'green');
    log('✅ El sistema está listo para estadísticas reales', 'green');
    log('🚀 Próximo paso: Implementar las APIs y componentes mejorados', 'blue');
  }

  console.log('\n' + '='.repeat(60));
  log('🏁 TESTING SQL COMPLETADO', 'bold');
  console.log('='.repeat(60) + '\n');

  return {
    total: totalTests,
    passed: passedTests,
    successRate: parseFloat(successRate),
    status
  };
}

// Ejecutar tests si se llama directamente
if (require.main === module) {
  runSQLTests().catch(error => {
    console.error('Error ejecutando tests SQL:', error);
    process.exit(1);
  });
}

module.exports = { runSQLTests };
