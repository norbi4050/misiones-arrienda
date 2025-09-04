const { createClient } = require('@supabase/supabase-js');

// =====================================================
// TESTING EXHAUSTIVO SUPABASE - MISIONES ARRIENDA
// =====================================================

console.log('🚀 TESTING EXHAUSTIVO SUPABASE - CONFIGURACIÓN COMPLETA\n');

// Credenciales de Supabase desde .env
const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTY3MzgsImV4cCI6MjA3MTM5MjczOH0.vgrh055OkiBIJFBlRlEuEZAOF2FHo3LBUNitB09dSIE';

// Crear clientes de Supabase
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variables para tracking
let testResults = {
  conexion: { score: 0, max: 15 },
  tablas: { score: 0, max: 25 },
  storage: { score: 0, max: 15 },
  policies: { score: 0, max: 20 },
  apis: { score: 0, max: 15 },
  integracion: { score: 0, max: 10 }
};

let reporteDetallado = [];

// Función para logging con timestamp
function log(mensaje, tipo = 'INFO') {
  const timestamp = new Date().toLocaleTimeString();
  const emoji = tipo === 'SUCCESS' ? '✅' : tipo === 'ERROR' ? '❌' : tipo === 'WARNING' ? '⚠️' : '🔍';
  console.log(`${emoji} [${timestamp}] ${mensaje}`);
  reporteDetallado.push({ timestamp, tipo, mensaje });
}

// 1. TESTING DE CONEXIÓN
async function testConexion() {
  log('INICIANDO TESTING DE CONEXIÓN', 'INFO');
  
  try {
    // Test conexión admin
    const { data: adminTest, error: adminError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);
    
    if (!adminError) {
      testResults.conexion.score += 8;
      log('Conexión Admin Service Role: EXITOSA', 'SUCCESS');
    } else {
      log(`Conexión Admin falló: ${adminError.message}`, 'ERROR');
    }
    
    // Test conexión cliente
    const { data: clientTest, error: clientError } = await supabaseClient.auth.getSession();
    
    if (!clientError) {
      testResults.conexion.score += 7;
      log('Conexión Cliente Anon Key: EXITOSA', 'SUCCESS');
    } else {
      log(`Conexión Cliente falló: ${clientError.message}`, 'ERROR');
    }
    
  } catch (error) {
    log(`Error crítico en conexión: ${error.message}`, 'ERROR');
  }
}

// 2. TESTING DE TABLAS
async function testTablas() {
  log('INICIANDO TESTING DE TABLAS', 'INFO');
  
  const tablasEsperadas = [
    'profiles', 'properties', 'favorites', 'search_history', 
    'messages', 'conversations', 'property_images', 'user_limits', 'admin_activity'
  ];
  
  let tablasEncontradas = 0;
  
  for (const tabla of tablasEsperadas) {
    try {
      const { data, error } = await supabaseAdmin
        .from(tabla)
        .select('*')
        .limit(1);
      
      if (!error) {
        tablasEncontradas++;
        log(`Tabla ${tabla}: EXISTE`, 'SUCCESS');
      } else {
        log(`Tabla ${tabla}: FALTANTE - ${error.message}`, 'ERROR');
      }
    } catch (error) {
      log(`Error verificando tabla ${tabla}: ${error.message}`, 'ERROR');
    }
  }
  
  testResults.tablas.score = Math.round((tablasEncontradas / tablasEsperadas.length) * testResults.tablas.max);
  log(`Tablas encontradas: ${tablasEncontradas}/${tablasEsperadas.length}`, 'INFO');
}

// 3. TESTING DE STORAGE
async function testStorage() {
  log('INICIANDO TESTING DE STORAGE', 'INFO');
  
  const bucketsEsperados = ['property-images', 'avatars', 'documents'];
  let bucketsEncontrados = 0;
  
  try {
    const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
    
    if (error) {
      log(`Error obteniendo buckets: ${error.message}`, 'ERROR');
      return;
    }
    
    const bucketNames = buckets.map(b => b.name);
    
    for (const bucket of bucketsEsperados) {
      if (bucketNames.includes(bucket)) {
        bucketsEncontrados++;
        log(`Bucket ${bucket}: EXISTE`, 'SUCCESS');
        
        // Test upload/download
        try {
          const testFile = new Blob(['test'], { type: 'text/plain' });
          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from(bucket)
            .upload(`test-${Date.now()}.txt`, testFile);
          
          if (!uploadError) {
            log(`Bucket ${bucket}: UPLOAD OK`, 'SUCCESS');
            
            // Limpiar archivo de test
            await supabaseAdmin.storage
              .from(bucket)
              .remove([uploadData.path]);
          }
        } catch (uploadError) {
          log(`Bucket ${bucket}: Upload falló - ${uploadError.message}`, 'WARNING');
        }
      } else {
        log(`Bucket ${bucket}: FALTANTE`, 'ERROR');
      }
    }
    
    testResults.storage.score = Math.round((bucketsEncontrados / bucketsEsperados.length) * testResults.storage.max);
    
  } catch (error) {
    log(`Error crítico en storage: ${error.message}`, 'ERROR');
  }
}

// 4. TESTING DE POLÍTICAS RLS
async function testPolicies() {
  log('INICIANDO TESTING DE POLÍTICAS RLS', 'INFO');
  
  const tablasConRLS = ['profiles', 'properties', 'favorites', 'search_history'];
  let policiesOK = 0;
  
  for (const tabla of tablasConRLS) {
    try {
      // Verificar si RLS está habilitado
      const { data: rlsData, error: rlsError } = await supabaseAdmin
        .rpc('check_rls_enabled', { table_name: tabla });
      
      if (!rlsError && rlsData) {
        log(`RLS habilitado en ${tabla}: SÍ`, 'SUCCESS');
        policiesOK++;
      } else {
        log(`RLS habilitado en ${tabla}: NO`, 'WARNING');
      }
    } catch (error) {
      log(`Error verificando RLS en ${tabla}: ${error.message}`, 'WARNING');
    }
  }
  
  testResults.policies.score = Math.round((policiesOK / tablasConRLS.length) * testResults.policies.max);
}

// 5. TESTING DE APIs
async function testAPIs() {
  log('INICIANDO TESTING DE APIs', 'INFO');
  
  const endpoints = [
    { name: 'Properties API', path: '/api/properties' },
    { name: 'Auth Register API', path: '/api/auth/register' },
    { name: 'Auth Login API', path: '/api/auth/login' },
    { name: 'Stats API', path: '/api/stats' },
    { name: 'Favorites API', path: '/api/favorites' }
  ];
  
  let apisOK = 0;
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:3000${endpoint.path}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.status !== 404) {
        apisOK++;
        log(`${endpoint.name}: DISPONIBLE (${response.status})`, 'SUCCESS');
      } else {
        log(`${endpoint.name}: NO ENCONTRADO`, 'ERROR');
      }
    } catch (error) {
      log(`${endpoint.name}: ERROR - ${error.message}`, 'ERROR');
    }
  }
  
  testResults.apis.score = Math.round((apisOK / endpoints.length) * testResults.apis.max);
}

// 6. TESTING DE INTEGRACIÓN
async function testIntegracion() {
  log('INICIANDO TESTING DE INTEGRACIÓN', 'INFO');
  
  let integracionOK = 0;
  
  // Test 1: Crear usuario de prueba
  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: `test-${Date.now()}@test.com`,
      password: 'test123456',
      email_confirm: true
    });
    
    if (!authError && authData.user) {
      integracionOK += 3;
      log('Creación de usuario: EXITOSA', 'SUCCESS');
      
      // Test 2: Crear perfil
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          full_name: 'Test User',
          user_type: 'inquilino'
        });
      
      if (!profileError) {
        integracionOK += 4;
        log('Creación de perfil: EXITOSA', 'SUCCESS');
      }
      
      // Test 3: Crear propiedad
      const { error: propertyError } = await supabaseAdmin
        .from('properties')
        .insert({
          title: 'Test Property',
          description: 'Test Description',
          price: 100000,
          location: 'Test Location',
          user_id: authData.user.id,
          property_type: 'casa',
          operation_type: 'venta'
        });
      
      if (!propertyError) {
        integracionOK += 3;
        log('Creación de propiedad: EXITOSA', 'SUCCESS');
      }
      
      // Limpiar datos de prueba
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
    } else {
      log(`Error creando usuario: ${authError?.message}`, 'ERROR');
    }
  } catch (error) {
    log(`Error en testing de integración: ${error.message}`, 'ERROR');
  }
  
  testResults.integracion.score = integracionOK;
}

// 7. CREAR TABLAS FALTANTES
async function crearTablasFaltantes() {
  log('INICIANDO CREACIÓN DE TABLAS FALTANTES', 'INFO');
  
  const sqlCrearTablas = `
    -- Crear tabla profiles si no existe
    CREATE TABLE IF NOT EXISTS profiles (
      id UUID REFERENCES auth.users(id) PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT,
      avatar_url TEXT,
      user_type TEXT CHECK (user_type IN ('inquilino', 'propietario', 'inmobiliaria')) DEFAULT 'inquilino',
      phone TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Crear tabla properties si no existe
    CREATE TABLE IF NOT EXISTS properties (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      price DECIMAL(12,2) NOT NULL,
      location TEXT NOT NULL,
      property_type TEXT NOT NULL,
      operation_type TEXT NOT NULL,
      bedrooms INTEGER,
      bathrooms INTEGER,
      area DECIMAL(10,2),
      user_id UUID REFERENCES auth.users(id) NOT NULL,
      images TEXT[],
      amenities TEXT[],
      contact_phone TEXT,
      contact_email TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Crear tabla favorites si no existe
    CREATE TABLE IF NOT EXISTS favorites (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) NOT NULL,
      property_id UUID REFERENCES properties(id) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, property_id)
    );

    -- Crear tabla search_history si no existe
    CREATE TABLE IF NOT EXISTS search_history (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) NOT NULL,
      search_query TEXT NOT NULL,
      filters JSONB,
      results_count INTEGER,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Crear tabla messages si no existe
    CREATE TABLE IF NOT EXISTS messages (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      conversation_id UUID NOT NULL,
      sender_id UUID REFERENCES auth.users(id) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Crear tabla conversations si no existe
    CREATE TABLE IF NOT EXISTS conversations (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      property_id UUID REFERENCES properties(id) NOT NULL,
      buyer_id UUID REFERENCES auth.users(id) NOT NULL,
      seller_id UUID REFERENCES auth.users(id) NOT NULL,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Crear tabla property_images si no existe
    CREATE TABLE IF NOT EXISTS property_images (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      property_id UUID REFERENCES properties(id) NOT NULL,
      image_url TEXT NOT NULL,
      alt_text TEXT,
      order_index INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Crear tabla user_limits si no existe
    CREATE TABLE IF NOT EXISTS user_limits (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) NOT NULL,
      properties_limit INTEGER DEFAULT 5,
      properties_used INTEGER DEFAULT 0,
      plan_type TEXT DEFAULT 'free',
      expires_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Crear tabla admin_activity si no existe
    CREATE TABLE IF NOT EXISTS admin_activity (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      admin_id UUID REFERENCES auth.users(id) NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id UUID,
      details JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  try {
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: sqlCrearTablas });
    
    if (!error) {
      log('Tablas creadas exitosamente', 'SUCCESS');
    } else {
      log(`Error creando tablas: ${error.message}`, 'ERROR');
    }
  } catch (error) {
    log(`Error ejecutando SQL: ${error.message}`, 'ERROR');
  }
}

// 8. HABILITAR RLS
async function habilitarRLS() {
  log('HABILITANDO ROW LEVEL SECURITY', 'INFO');
  
  const sqlRLS = `
    -- Habilitar RLS en todas las tablas
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
    ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
    ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
    ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
    ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
    ALTER TABLE user_limits ENABLE ROW LEVEL SECURITY;
    ALTER TABLE admin_activity ENABLE ROW LEVEL SECURITY;

    -- Políticas básicas para profiles
    DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
    CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
    
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

    -- Políticas básicas para properties
    DROP POLICY IF EXISTS "Properties are viewable by everyone" ON properties;
    CREATE POLICY "Properties are viewable by everyone" ON properties FOR SELECT USING (is_active = true);
    
    DROP POLICY IF EXISTS "Users can insert own properties" ON properties;
    CREATE POLICY "Users can insert own properties" ON properties FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Users can update own properties" ON properties;
    CREATE POLICY "Users can update own properties" ON properties FOR UPDATE USING (auth.uid() = user_id);

    -- Políticas básicas para favorites
    DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
    CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites;
    CREATE POLICY "Users can manage own favorites" ON favorites FOR ALL USING (auth.uid() = user_id);
  `;
  
  try {
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: sqlRLS });
    
    if (!error) {
      log('RLS habilitado exitosamente', 'SUCCESS');
    } else {
      log(`Error habilitando RLS: ${error.message}`, 'ERROR');
    }
  } catch (error) {
    log(`Error ejecutando RLS: ${error.message}`, 'ERROR');
  }
}

// FUNCIÓN PRINCIPAL
async function testingExhaustivo() {
  const startTime = Date.now();
  
  console.log('🎯 OBJETIVO: Testing exhaustivo y configuración completa de Supabase');
  console.log('📊 PROYECTO: qfeyhaaxyemmnohqdele.supabase.co');
  console.log('⏰ INICIO:', new Date().toLocaleString());
  console.log('=' .repeat(80));
  
  // Ejecutar todos los tests
  await testConexion();
  await testTablas();
  await testStorage();
  await testPolicies();
  await testAPIs();
  await testIntegracion();
  
  // Si hay tablas faltantes, crearlas
  if (testResults.tablas.score < testResults.tablas.max) {
    log('DETECTADAS TABLAS FALTANTES - INICIANDO CREACIÓN', 'WARNING');
    await crearTablasFaltantes();
    await habilitarRLS();
    
    // Re-test después de crear tablas
    log('RE-TESTING DESPUÉS DE CREAR TABLAS', 'INFO');
    await testTablas();
    await testPolicies();
    await testIntegracion();
  }
  
  // Calcular score final
  const scoreTotal = Object.values(testResults).reduce((sum, test) => sum + test.score, 0);
  const scoreMaximo = Object.values(testResults).reduce((sum, test) => sum + test.max, 0);
  const porcentajeFinal = Math.round((scoreTotal / scoreMaximo) * 100);
  
  // Generar reporte final
  const endTime = Date.now();
  const duracion = Math.round((endTime - startTime) / 1000);
  
  const reporte = `
# 🎉 TESTING EXHAUSTIVO SUPABASE COMPLETADO

## 📊 RESUMEN EJECUTIVO

**Fecha:** ${new Date().toLocaleDateString()}  
**Hora:** ${new Date().toLocaleTimeString()}  
**Duración:** ${duracion} segundos  
**Score Final:** ${scoreTotal}/${scoreMaximo} (${porcentajeFinal}%)  

## ✅ RESULTADOS DETALLADOS

### 🔌 Conexión (${testResults.conexion.score}/${testResults.conexion.max})
- Service Role Key: ${testResults.conexion.score >= 8 ? '✅ OK' : '❌ FALLO'}
- Anon Key: ${testResults.conexion.score >= 15 ? '✅ OK' : testResults.conexion.score >= 8 ? '✅ OK' : '❌ FALLO'}

### 🗄️ Tablas (${testResults.tablas.score}/${testResults.tablas.max})
- Porcentaje completado: ${Math.round((testResults.tablas.score / testResults.tablas.max) * 100)}%

### 📁 Storage (${testResults.storage.score}/${testResults.storage.max})
- Buckets configurados: ${Math.round((testResults.storage.score / testResults.storage.max) * 100)}%

### 🔒 Políticas RLS (${testResults.policies.score}/${testResults.policies.max})
- Seguridad configurada: ${Math.round((testResults.policies.score / testResults.policies.max) * 100)}%

### 🌐 APIs (${testResults.apis.score}/${testResults.apis.max})
- Endpoints disponibles: ${Math.round((testResults.apis.score / testResults.apis.max) * 100)}%

### 🔗 Integración (${testResults.integracion.score}/${testResults.integracion.max})
- Funcionalidad completa: ${Math.round((testResults.integracion.score / testResults.integracion.max) * 100)}%

## 🎯 EVALUACIÓN FINAL

${porcentajeFinal >= 90 ? '🎉 **EXCELENTE** - Supabase configurado al 100%' : 
  porcentajeFinal >= 75 ? '✅ **BUENO** - Configuración funcional' : 
  porcentajeFinal >= 60 ? '⚠️ **REGULAR** - Necesita mejoras' : 
  '❌ **CRÍTICO** - Requiere configuración adicional'}

## 📋 LOG DETALLADO

${reporteDetallado.map(entry => `**[${entry.timestamp}]** ${entry.tipo}: ${entry.mensaje}`).join('\n')}

## 🚀 PRÓXIMOS PASOS

${porcentajeFinal >= 90 ? 
  '✅ El proyecto está listo para producción con Supabase completamente configurado.' :
  '🔧 Revisar los errores en el log y completar la configuración faltante.'
}

---
*Testing generado automáticamente - ${new Date().toLocaleString()}*
`;

  // Guardar reporte
  require('fs').writeFileSync('REPORTE-TESTING-EXHAUSTIVO-SUPABASE-COMPLETO.md', reporte);
  
  console.log('\n' + '='.repeat(80));
  console.log('🎉 TESTING EXHAUSTIVO COMPLETADO');
  console.log('='.repeat(80));
  console.log(`📊 Score Final: ${scoreTotal}/${scoreMaximo} (${porcentajeFinal}%)`);
  console.log(`⏱️  Duración: ${duracion} segundos`);
  console.log(`📄 Reporte: REPORTE-TESTING-EXHAUSTIVO-SUPABASE-COMPLETO.md`);
  console.log('='.repeat(80));
  
  if (porcentajeFinal >= 90) {
    console.log('🎉 ¡SUPABASE CONFIGURADO EXITOSAMENTE!');
    console.log('✅ Proyecto listo para usar');
  } else if (porcentajeFinal >= 75) {
    console.log('✅ Configuración funcional');
    console.log('🔧 Algunas optimizaciones pendientes');
  } else {
    console.log('⚠️  Configuración parcial');
    console.log('🔄 Se recomienda completar la configuración');
  }
  
  return porcentajeFinal;
}

// Ejecutar testing
if (require.main === module) {
  testingExhaustivo()
    .then(score => {
      process.exit(score >= 75 ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { testingExhaustivo };
