// =====================================================
// 🧪 TESTING EXHAUSTIVO POST-DIAGNÓSTICO COMPLETO
// =====================================================
// 
// Testing completo después de aplicar la solución definitiva
// para el error de la tabla profiles
// =====================================================

const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

// =====================================================
// CONFIGURACIÓN Y CONSTANTES
// =====================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Datos de prueba para diferentes tipos de usuario
const TEST_USERS = {
  inquilino: {
    email: 'test.inquilino@example.com',
    password: 'TestPassword123!',
    name: 'Juan Pérez',
    phone: '+54 376 123-4567',
    userType: 'inquilino'
  },
  propietario: {
    email: 'test.propietario@example.com',
    password: 'TestPassword123!',
    name: 'María González',
    phone: '+54 376 234-5678',
    userType: 'propietario'
  },
  inmobiliaria: {
    email: 'test.inmobiliaria@example.com',
    password: 'TestPassword123!',
    name: 'Carlos Rodríguez',
    phone: '+54 376 345-6789',
    userType: 'inmobiliaria',
    company_name: 'Inmobiliaria Test SA',
    business_type: 'inmobiliaria',
    address: 'Av. Corrientes 1234, Posadas, Misiones',
    website: 'https://inmobiliariatest.com'
  }
};

// =====================================================
// UTILIDADES DE TESTING
// =====================================================

function logTest(testName, status, details = '') {
  const timestamp = new Date().toISOString();
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`[${timestamp}] ${statusIcon} ${testName}: ${status}`);
  if (details) {
    console.log(`   📝 ${details}`);
  }
}

function logSection(sectionName) {
  console.log('\n' + '='.repeat(60));
  console.log(`🔍 ${sectionName}`);
  console.log('='.repeat(60));
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =====================================================
// FASE 1: VERIFICACIÓN DE ESTRUCTURA DE BASE DE DATOS
// =====================================================

async function testDatabaseStructure() {
  logSection('FASE 1: VERIFICACIÓN DE ESTRUCTURA DE BASE DE DATOS');
  
  try {
    // Verificar que la tabla profiles existe y tiene las columnas correctas
    const { data: columns, error } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'profiles')
      .eq('table_schema', 'public');

    if (error) {
      logTest('Verificación estructura profiles', 'FAIL', `Error: ${error.message}`);
      return false;
    }

    const requiredColumns = [
      'id', 'email', 'name', 'phone', 'user_type', 
      'company_name', 'business_type', 'address', 
      'website', 'description', 'avatar_url',
      'created_at', 'updated_at'
    ];

    const existingColumns = columns.map(col => col.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length > 0) {
      logTest('Verificación columnas profiles', 'FAIL', `Columnas faltantes: ${missingColumns.join(', ')}`);
      return false;
    }

    logTest('Verificación estructura profiles', 'PASS', `Todas las columnas requeridas están presentes`);

    // Verificar que el trigger existe
    const { data: triggers, error: triggerError } = await supabaseAdmin
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation')
      .eq('trigger_name', 'on_auth_user_created');

    if (triggerError || !triggers || triggers.length === 0) {
      logTest('Verificación trigger', 'FAIL', 'Trigger on_auth_user_created no encontrado');
      return false;
    }

    logTest('Verificación trigger', 'PASS', 'Trigger on_auth_user_created existe');
    return true;

  } catch (error) {
    logTest('Verificación estructura DB', 'FAIL', `Error inesperado: ${error.message}`);
    return false;
  }
}

// =====================================================
// FASE 2: TESTING DE REGISTRO DE USUARIOS
// =====================================================

async function testUserRegistration() {
  logSection('FASE 2: TESTING DE REGISTRO DE USUARIOS');
  
  const results = [];

  for (const [userType, userData] of Object.entries(TEST_USERS)) {
    try {
      logTest(`Iniciando registro ${userType}`, 'INFO', `Email: ${userData.email}`);

      // Limpiar usuario existente si existe
      await cleanupTestUser(userData.email);
      await delay(1000);

      // Intentar registro
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            phone: userData.phone,
            userType: userData.userType,
            company_name: userData.company_name || '',
            business_type: userData.business_type || '',
            address: userData.address || '',
            website: userData.website || ''
          }
        }
      });

      if (authError) {
        logTest(`Registro ${userType}`, 'FAIL', `Error auth: ${authError.message}`);
        results.push({ userType, success: false, error: authError.message });
        continue;
      }

      if (!authData.user) {
        logTest(`Registro ${userType}`, 'FAIL', 'No se creó el usuario en auth');
        results.push({ userType, success: false, error: 'No user created' });
        continue;
      }

      logTest(`Registro auth ${userType}`, 'PASS', `Usuario creado: ${authData.user.id}`);

      // Esperar a que el trigger cree el perfil
      await delay(2000);

      // Verificar que se creó el perfil
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        logTest(`Perfil ${userType}`, 'FAIL', `Error perfil: ${profileError?.message || 'No profile found'}`);
        results.push({ userType, success: false, error: 'Profile not created' });
        continue;
      }

      // Verificar campos específicos del perfil
      const profileChecks = [
        { field: 'email', expected: userData.email, actual: profile.email },
        { field: 'name', expected: userData.name, actual: profile.name },
        { field: 'phone', expected: userData.phone, actual: profile.phone },
        { field: 'user_type', expected: userData.userType, actual: profile.user_type }
      ];

      if (userType === 'inmobiliaria') {
        profileChecks.push(
          { field: 'company_name', expected: userData.company_name, actual: profile.company_name },
          { field: 'business_type', expected: userData.business_type, actual: profile.business_type },
          { field: 'address', expected: userData.address, actual: profile.address },
          { field: 'website', expected: userData.website, actual: profile.website }
        );
      }

      let profileValid = true;
      for (const check of profileChecks) {
        if (check.actual !== check.expected) {
          logTest(`Campo ${check.field} ${userType}`, 'FAIL', `Esperado: ${check.expected}, Actual: ${check.actual}`);
          profileValid = false;
        }
      }

      if (profileValid) {
        logTest(`Perfil completo ${userType}`, 'PASS', 'Todos los campos correctos');
        results.push({ userType, success: true, userId: authData.user.id });
      } else {
        results.push({ userType, success: false, error: 'Profile fields mismatch' });
      }

    } catch (error) {
      logTest(`Registro ${userType}`, 'FAIL', `Error inesperado: ${error.message}`);
      results.push({ userType, success: false, error: error.message });
    }
  }

  return results;
}

// =====================================================
// FASE 3: TESTING DE CASOS EDGE
// =====================================================

async function testEdgeCases() {
  logSection('FASE 3: TESTING DE CASOS EDGE');
  
  const edgeCases = [
    {
      name: 'Email duplicado',
      test: async () => {
        const email = 'duplicate@test.com';
        await cleanupTestUser(email);
        
        // Primer registro
        const { error: error1 } = await supabase.auth.signUp({
          email,
          password: 'Test123!',
          options: { data: { name: 'Test User', userType: 'inquilino' } }
        });
        
        if (error1) return { success: false, error: error1.message };
        
        await delay(1000);
        
        // Segundo registro (debería fallar)
        const { error: error2 } = await supabase.auth.signUp({
          email,
          password: 'Test123!',
          options: { data: { name: 'Test User 2', userType: 'inquilino' } }
        });
        
        return { success: error2 !== null, error: error2?.message };
      }
    },
    {
      name: 'Datos faltantes',
      test: async () => {
        const email = 'missing-data@test.com';
        await cleanupTestUser(email);
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password: 'Test123!',
          options: { data: {} } // Sin datos adicionales
        });
        
        if (error) return { success: false, error: error.message };
        
        await delay(2000);
        
        // Verificar que el perfil se creó con valores por defecto
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        return { 
          success: !profileError && profile !== null,
          error: profileError?.message,
          profile
        };
      }
    },
    {
      name: 'Caracteres especiales',
      test: async () => {
        const email = 'special-chars@test.com';
        await cleanupTestUser(email);
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password: 'Test123!',
          options: { 
            data: { 
              name: 'José María Ñoño',
              phone: '+54 (376) 123-4567',
              userType: 'propietario',
              company_name: 'Empresa & Cía. S.A.',
              address: 'Av. San Martín #1234, 1° Piso "A"'
            } 
          }
        });
        
        if (error) return { success: false, error: error.message };
        
        await delay(2000);
        
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        return { 
          success: !profileError && profile !== null,
          error: profileError?.message
        };
      }
    }
  ];

  const results = [];
  
  for (const edgeCase of edgeCases) {
    try {
      logTest(`Iniciando caso edge: ${edgeCase.name}`, 'INFO');
      const result = await edgeCase.test();
      
      if (result.success) {
        logTest(`Caso edge: ${edgeCase.name}`, 'PASS', result.error || 'Comportamiento esperado');
      } else {
        logTest(`Caso edge: ${edgeCase.name}`, 'FAIL', result.error);
      }
      
      results.push({ name: edgeCase.name, ...result });
      
    } catch (error) {
      logTest(`Caso edge: ${edgeCase.name}`, 'FAIL', `Error inesperado: ${error.message}`);
      results.push({ name: edgeCase.name, success: false, error: error.message });
    }
  }
  
  return results;
}

// =====================================================
// FASE 4: TESTING DE INTEGRACIÓN CON APIS
// =====================================================

async function testAPIIntegration() {
  logSection('FASE 4: TESTING DE INTEGRACIÓN CON APIS');
  
  const apiTests = [
    {
      name: 'API Register Endpoint',
      test: async () => {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'api-test@example.com',
            password: 'Test123!',
            name: 'API Test User',
            phone: '+54 376 123-4567',
            userType: 'inquilino'
          })
        });
        
        const data = await response.json();
        return { 
          success: response.ok, 
          status: response.status,
          data 
        };
      }
    },
    {
      name: 'API Properties Endpoint',
      test: async () => {
        const response = await fetch('/api/properties');
        const data = await response.json();
        return { 
          success: response.ok, 
          status: response.status,
          count: data?.length || 0
        };
      }
    },
    {
      name: 'API Health Check',
      test: async () => {
        const response = await fetch('/api/health/db');
        const data = await response.json();
        return { 
          success: response.ok, 
          status: response.status,
          data 
        };
      }
    }
  ];

  const results = [];
  
  for (const apiTest of apiTests) {
    try {
      logTest(`Iniciando API test: ${apiTest.name}`, 'INFO');
      const result = await apiTest.test();
      
      if (result.success) {
        logTest(`API test: ${apiTest.name}`, 'PASS', `Status: ${result.status}`);
      } else {
        logTest(`API test: ${apiTest.name}`, 'FAIL', `Status: ${result.status}`);
      }
      
      results.push({ name: apiTest.name, ...result });
      
    } catch (error) {
      logTest(`API test: ${apiTest.name}`, 'FAIL', `Error: ${error.message}`);
      results.push({ name: apiTest.name, success: false, error: error.message });
    }
  }
  
  return results;
}

// =====================================================
// FASE 5: TESTING DE CONFIGURACIÓN SMTP
// =====================================================

async function testSMTPConfiguration() {
  logSection('FASE 5: TESTING DE CONFIGURACIÓN SMTP');
  
  const smtpTests = [
    {
      name: 'Variables SMTP configuradas',
      test: async () => {
        const requiredVars = [
          'SMTP_HOST',
          'SMTP_PORT', 
          'SMTP_USER',
          'SMTP_PASS',
          'SMTP_FROM'
        ];
        
        const missing = requiredVars.filter(varName => !process.env[varName]);
        
        return {
          success: missing.length === 0,
          missing,
          configured: requiredVars.filter(varName => process.env[varName])
        };
      }
    },
    {
      name: 'Conexión SMTP',
      test: async () => {
        if (!process.env.SMTP_HOST) {
          return { success: false, error: 'SMTP_HOST no configurado' };
        }
        
        try {
          const transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_PORT === '465',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
            }
          });
          
          await transporter.verify();
          return { success: true };
          
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
    },
    {
      name: 'Envío email de prueba',
      test: async () => {
        if (!process.env.SMTP_HOST) {
          return { success: false, error: 'SMTP no configurado' };
        }
        
        try {
          const transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_PORT === '465',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
            }
          });
          
          const info = await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: 'test@example.com',
            subject: 'Test Email - Misiones Arrienda',
            text: 'Este es un email de prueba del sistema.',
            html: '<p>Este es un email de prueba del sistema.</p>'
          });
          
          return { success: true, messageId: info.messageId };
          
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
    }
  ];

  const results = [];
  
  for (const smtpTest of smtpTests) {
    try {
      logTest(`Iniciando SMTP test: ${smtpTest.name}`, 'INFO');
      const result = await smtpTest.test();
      
      if (result.success) {
        logTest(`SMTP test: ${smtpTest.name}`, 'PASS', result.messageId || 'Configuración correcta');
      } else {
        logTest(`SMTP test: ${smtpTest.name}`, 'FAIL', result.error);
      }
      
      results.push({ name: smtpTest.name, ...result });
      
    } catch (error) {
      logTest(`SMTP test: ${smtpTest.name}`, 'FAIL', `Error inesperado: ${error.message}`);
      results.push({ name: smtpTest.name, success: false, error: error.message });
    }
  }
  
  return results;
}

// =====================================================
// FASE 6: TESTING DE FLUJOS COMPLETOS
// =====================================================

async function testCompleteFlows() {
  logSection('FASE 6: TESTING DE FLUJOS COMPLETOS');
  
  const flows = [
    {
      name: 'Flujo completo inquilino',
      test: async () => {
        const email = 'flow-inquilino@test.com';
        await cleanupTestUser(email);
        
        // 1. Registro
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password: 'Test123!',
          options: {
            data: {
              name: 'Inquilino Test',
              phone: '+54 376 123-4567',
              userType: 'inquilino'
            }
          }
        });
        
        if (authError) return { success: false, step: 'registro', error: authError.message };
        
        await delay(2000);
        
        // 2. Verificar perfil
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();
        
        if (profileError) return { success: false, step: 'perfil', error: profileError.message };
        
        // 3. Login
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password: 'Test123!'
        });
        
        if (loginError) return { success: false, step: 'login', error: loginError.message };
        
        // 4. Acceso a propiedades
        const { data: properties, error: propertiesError } = await supabase
          .from('properties')
          .select('*')
          .limit(5);
        
        if (propertiesError) return { success: false, step: 'propiedades', error: propertiesError.message };
        
        return { success: true, steps: ['registro', 'perfil', 'login', 'propiedades'] };
      }
    },
    {
      name: 'Flujo completo inmobiliaria',
      test: async () => {
        const email = 'flow-inmobiliaria@test.com';
        await cleanupTestUser(email);
        
        // 1. Registro con datos completos
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password: 'Test123!',
          options: {
            data: {
              name: 'Inmobiliaria Test',
              phone: '+54 376 123-4567',
              userType: 'inmobiliaria',
              company_name: 'Test Inmobiliaria SA',
              business_type: 'inmobiliaria',
              address: 'Av. Test 1234',
              website: 'https://test.com'
            }
          }
        });
        
        if (authError) return { success: false, step: 'registro', error: authError.message };
        
        await delay(2000);
        
        // 2. Verificar perfil completo
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();
        
        if (profileError) return { success: false, step: 'perfil', error: profileError.message };
        
        if (!profile.company_name || !profile.business_type) {
          return { success: false, step: 'perfil', error: 'Datos de empresa faltantes' };
        }
        
        // 3. Login y acceso a funciones de inmobiliaria
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password: 'Test123!'
        });
        
        if (loginError) return { success: false, step: 'login', error: loginError.message };
        
        return { success: true, steps: ['registro', 'perfil', 'login'] };
      }
    }
  ];

  const results = [];
  
  for (const flow of flows) {
    try {
      logTest(`Iniciando flujo: ${flow.name}`, 'INFO');
      const result = await flow.test();
      
      if (result.success) {
        logTest(`Flujo: ${flow.name}`, 'PASS', `Pasos completados: ${result.steps?.join(', ')}`);
      } else {
        logTest(`Flujo: ${flow.name}`, 'FAIL', `Error en paso ${result.step}: ${result.error}`);
      }
      
      results.push({ name: flow.name, ...result });
      
    } catch (error) {
      logTest(`Flujo: ${flow.name}`, 'FAIL', `Error inesperado: ${error.message}`);
      results.push({ name: flow.name, success: false, error: error.message });
    }
  }
  
  return results;
}

// =====================================================
// UTILIDADES DE LIMPIEZA
// =====================================================

async function cleanupTestUser(email) {
  try {
    // Buscar usuario por email
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) return;
    
    const user = users.users.find(u => u.email === email);
    if (user) {
      // Eliminar perfil
      await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', user.id);
      
      // Eliminar usuario
      await supabaseAdmin.auth.admin.deleteUser(user.id);
    }
  } catch (error) {
    // Ignorar errores de limpieza
  }
}

async function cleanupAllTestUsers() {
  logSection('LIMPIEZA DE USUARIOS DE PRUEBA');
  
  const testEmails = [
    ...Object.values(TEST_USERS).map(u => u.email),
    'duplicate@test.com',
    'missing-data@test.com',
    'special-chars@test.com',
    'api-test@example.com',
    'flow-inquilino@test.com',
    'flow-inmobiliaria@test.com'
  ];
  
  for (const email of testEmails) {
    await cleanupTestUser(email);
    logTest(`Limpieza usuario`, 'INFO', email);
  }
}

// =====================================================
// FUNCIÓN PRINCIPAL DE TESTING
// =====================================================

async function runExhaustiveTesting() {
  console.log('\n🚀 INICIANDO TESTING EXHAUSTIVO POST-DIAGNÓSTICO COMPLETO');
  console.log('='.repeat(80));
  
  const startTime = Date.now();
  const results = {
    database: null,
    registration: null,
    edgeCases: null,
    apiIntegration: null,
    smtpConfig: null,
    completeFlows: null,
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      duration: 0
    }
  };
  
  try {
    // Verificar configuración inicial
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      console.log('❌ ERROR: Variables de Supabase no configuradas');
      return;
    }
    
    // Ejecutar todas las fases de testing
    results.database = await testDatabaseStructure();
    results.registration = await testUserRegistration();
    results.edgeCases = await testEdgeCases();
    results.apiIntegration = await testAPIIntegration();
    results.smtpConfig = await testSMTPConfiguration();
    results.completeFlows = await testCompleteFlows();
    
    // Limpiar usuarios de prueba
    await cleanupAllTestUsers();
    
    // Calcular estadísticas
    const endTime = Date.now();
    results.summary.duration = Math.round((endTime - startTime) / 1000);
    
    // Contar resultados
    const allResults = [
      ...(Array.isArray(results.registration) ? results.registration : []),
      ...(Array.isArray(results.edgeCases) ? results.edgeCases : []),
      ...(Array.isArray(results.apiIntegration) ? results.apiIntegration : []),
      ...(Array.isArray(results.smtpConfig) ? results.smtpConfig : []),
      ...(Array.isArray(results.completeFlows) ? results.completeFlows : [])
    ];
    
    results.summary.totalTests = allResults.length + (results.database ? 1 : 0);
    results.summary.passedTests = allResults.filter(r => r.success).length + (results.database ? 1 : 0);
    results.summary.failedTests = results.summary.totalTests - results.summary.passedTests;
    
    // Mostrar resumen final
    logSection('RESUMEN FINAL DE TESTING');
    console.log(`📊 Total de pruebas: ${results.summary.totalTests}`);
    console.log(`✅ Pruebas exitosas: ${results.summary.passedTests}`);
    console.log(`❌ Pruebas fallidas: ${results.summary.failedTests}`);
    console.log(`⏱️  Duración total: ${results.summary.duration} segundos`);
    
    const successRate = Math.round((results.summary.passedTests / results.summary.totalTests) * 100);
    console.log(`📈 Tasa de éxito: ${successRate}%`);
    
    if (successRate >= 90) {
      console.log('\n🎉 TESTING COMPLETADO CON ÉXITO - Sistema funcionando correctamente');
    } else if (successRate >= 70) {
      console.log('\n⚠️  TESTING COMPLETADO CON ADVERTENCIAS - Revisar fallos menores');
    } else {
      console.log('\n🚨 TESTING COMPLETADO CON ERRORES CRÍTICOS - Requiere atención inmediata');
    }
    
    return results;
    
  } catch (error) {
    console.log(`\n❌ ERROR CRÍTICO EN TESTING: ${error.message}`);
    console.log(error.stack);
    return null;
  }
}

// =====================================================
// EJECUTAR TESTING SI ES LLAMADO DIRECTAMENTE
// =====================================================

if (require.main === module) {
  runExhaustiveTesting()
    .then(results => {
      if (results) {
        const successRate = Math.round((results.summary.passedTests / results.summary.totalTests) * 100);
        process.exit(successRate >= 70 ? 0 : 1);
      } else {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ ERROR CRÍTICO:', error.message);
      process.exit(1);
    });
}

// Exportar función para uso en otros scripts
module.exports = { runExhaustiveTesting };
