const { createClient } = require('@supabase/supabase-js');

// Configuración de colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

async function diagnosticarErrorRegistroConCredencialesReales() {
  log('\n🔍 DIAGNÓSTICO COMPLETO - ERROR DE REGISTRO CON CREDENCIALES REALES', colors.cyan + colors.bright);
  log('=' .repeat(80), colors.cyan);
  
  try {
    // ========================================
    // 1. CONFIGURAR CREDENCIALES REALES
    // ========================================
    log('\n📋 PASO 1: Configurando credenciales reales de Supabase...', colors.yellow);
    
    const supabaseUrl = 'https://qfeyhaaxymmnohqdele.supabase.co';
    const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';
    
    log(`✅ URL de Supabase: ${supabaseUrl}`, colors.green);
    log(`✅ Service Key configurada: ${supabaseServiceKey.substring(0, 20)}...`, colors.green);
    
    // ========================================
    // 2. CREAR CLIENTE SUPABASE
    // ========================================
    log('\n🔗 PASO 2: Creando cliente Supabase con credenciales reales...', colors.yellow);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    log('✅ Cliente Supabase creado exitosamente', colors.green);
    
    // ========================================
    // 3. VERIFICAR CONECTIVIDAD BÁSICA
    // ========================================
    log('\n🏥 PASO 3: Verificando conectividad básica...', colors.yellow);
    
    try {
      // Probar una consulta simple a la tabla auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        log(`❌ Error accediendo a auth.users: ${authError.message}`, colors.red);
        return;
      } else {
        log(`✅ Conectividad con auth.users verificada`, colors.green);
        log(`   Usuarios en auth: ${authUsers?.users?.length || 0}`, colors.green);
      }
    } catch (connectError) {
      log(`❌ Error de conexión: ${connectError.message}`, colors.red);
      return;
    }
    
    // ========================================
    // 4. VERIFICAR TABLA USERS
    // ========================================
    log('\n📊 PASO 4: Verificando tabla users...', colors.yellow);
    
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (usersError) {
        log(`❌ Error accediendo a tabla users: ${usersError.message}`, colors.red);
        log(`   Código: ${usersError.code}`, colors.red);
        log(`   Detalles: ${JSON.stringify(usersError.details)}`, colors.red);
        
        if (usersError.code === '42P01') {
          log('\n🔧 PROBLEMA IDENTIFICADO: La tabla "users" no existe', colors.magenta);
          log('   Solución: Crear la tabla users en Supabase Dashboard', colors.magenta);
          await crearTablaUsers(supabase);
          return;
        }
      } else {
        log('✅ Tabla users accesible', colors.green);
        log(`   Registros en tabla users: ${usersData?.length || 0}`, colors.green);
      }
    } catch (tableError) {
      log(`❌ Error verificando tabla users: ${tableError.message}`, colors.red);
    }
    
    // ========================================
    // 5. VERIFICAR ESTRUCTURA DE TABLA USERS
    // ========================================
    log('\n🔍 PASO 5: Verificando estructura de tabla users...', colors.yellow);
    
    try {
      // Obtener información de columnas usando información del sistema
      const { data: columns, error: columnsError } = await supabase
        .rpc('get_table_columns', { table_name: 'users' })
        .single();
      
      if (columnsError) {
        log(`⚠️ No se pudo obtener estructura automáticamente: ${columnsError.message}`, colors.yellow);
        
        // Intentar insertar un registro de prueba para ver qué columnas faltan
        log('   Intentando insertar registro de prueba para detectar columnas...', colors.blue);
        await probarInsercionPrueba(supabase);
      } else {
        log('✅ Estructura de tabla obtenida', colors.green);
        log(`   Columnas: ${JSON.stringify(columns)}`, colors.blue);
      }
    } catch (structureError) {
      log(`⚠️ Error obteniendo estructura: ${structureError.message}`, colors.yellow);
      await probarInsercionPrueba(supabase);
    }
    
    // ========================================
    // 6. PROBAR CREACIÓN DE USUARIO COMPLETA
    // ========================================
    log('\n👤 PASO 6: Probando proceso completo de creación de usuario...', colors.yellow);
    
    const testEmail = `test-diagnostico-${Date.now()}@example.com`;
    const testPassword = 'test123456';
    
    try {
      // 6.1 Crear usuario en Auth
      log('   6.1 Creando usuario en Supabase Auth...', colors.blue);
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: {
          name: 'Usuario de Prueba Diagnóstico',
          phone: '123456789',
          userType: 'inquilino'
        }
      });
      
      if (authError) {
        log(`   ❌ Error creando usuario en Auth: ${authError.message}`, colors.red);
        log(`   Código: ${authError.status}`, colors.red);
        return;
      } else {
        log(`   ✅ Usuario creado en Auth: ${authData.user.id}`, colors.green);
      }
      
      // 6.2 Crear perfil en tabla users
      log('   6.2 Creando perfil en tabla users...', colors.blue);
      const userData = {
        id: authData.user.id,
        name: 'Usuario de Prueba Diagnóstico',
        email: testEmail,
        phone: '123456789',
        user_type: 'inquilino',
        company_name: null,
        license_number: null,
        property_count: null,
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();
      
      if (profileError) {
        log(`   ❌ ERROR ENCONTRADO - Creando perfil: ${profileError.message}`, colors.red);
        log(`   Código: ${profileError.code}`, colors.red);
        log(`   Detalles: ${JSON.stringify(profileError.details)}`, colors.red);
        log(`   Hint: ${profileError.hint || 'No disponible'}`, colors.red);
        
        // Analizar el tipo específico de error
        await analizarErrorPerfil(profileError, supabase);
        
        // Limpiar usuario de Auth
        log('   🔄 Limpiando usuario de Auth...', colors.blue);
        await supabase.auth.admin.deleteUser(authData.user.id);
        
        return;
      } else {
        log(`   ✅ Perfil creado exitosamente: ${profileData.id}`, colors.green);
        
        // Limpiar datos de prueba
        log('   🧹 Limpiando datos de prueba...', colors.blue);
        await supabase.from('users').delete().eq('id', authData.user.id);
        await supabase.auth.admin.deleteUser(authData.user.id);
        log('   ✅ Datos de prueba limpiados', colors.green);
      }
      
    } catch (testError) {
      log(`   ❌ Error en prueba completa: ${testError.message}`, colors.red);
    }
    
    // ========================================
    // 7. VERIFICAR POLÍTICAS RLS
    // ========================================
    log('\n🔒 PASO 7: Verificando políticas RLS...', colors.yellow);
    
    try {
      // Verificar si RLS está habilitado
      const { data: rlsInfo, error: rlsError } = await supabase
        .rpc('check_rls_policies', { table_name: 'users' });
      
      if (rlsError) {
        log(`⚠️ No se pudo verificar RLS automáticamente: ${rlsError.message}`, colors.yellow);
      } else {
        log(`✅ Información RLS obtenida: ${JSON.stringify(rlsInfo)}`, colors.green);
      }
    } catch (rlsError) {
      log(`⚠️ Error verificando RLS: ${rlsError.message}`, colors.yellow);
    }
    
    // ========================================
    // 8. RESUMEN Y RECOMENDACIONES
    // ========================================
    log('\n📋 PASO 8: Resumen y recomendaciones...', colors.yellow);
    log('✅ Diagnóstico completado', colors.green);
    
  } catch (error) {
    log(`❌ Error general en diagnóstico: ${error.message}`, colors.red);
    console.error('Stack trace:', error.stack);
  }
}

async function crearTablaUsers(supabase) {
  log('\n🔧 Intentando crear tabla users...', colors.magenta);
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS public.users (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      user_type TEXT NOT NULL CHECK (user_type IN ('inquilino', 'dueno_directo', 'inmobiliaria')),
      company_name TEXT,
      license_number TEXT,
      property_count INTEGER,
      email_verified BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Habilitar RLS
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    
    -- Política para permitir inserción con service role
    CREATE POLICY "Allow service role to insert users" ON public.users
      FOR INSERT WITH CHECK (true);
    
    -- Política para permitir lectura con service role
    CREATE POLICY "Allow service role to read users" ON public.users
      FOR SELECT USING (true);
  `;
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      log(`❌ Error creando tabla: ${error.message}`, colors.red);
    } else {
      log('✅ Tabla users creada exitosamente', colors.green);
    }
  } catch (createError) {
    log(`❌ Error ejecutando SQL: ${createError.message}`, colors.red);
  }
}

async function probarInsercionPrueba(supabase) {
  log('   Probando inserción con datos mínimos...', colors.blue);
  
  const testData = {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Test',
    email: 'test@test.com',
    user_type: 'inquilino'
  };
  
  try {
    const { error } = await supabase
      .from('users')
      .insert([testData]);
    
    if (error) {
      log(`   ❌ Error en inserción de prueba: ${error.message}`, colors.red);
      log(`   Código: ${error.code}`, colors.red);
      
      if (error.code === '42703') {
        log('   🔧 PROBLEMA: Columna no existe', colors.magenta);
        log(`   Columna faltante detectada en: ${error.message}`, colors.magenta);
      }
    } else {
      log('   ✅ Inserción de prueba exitosa', colors.green);
      // Limpiar
      await supabase.from('users').delete().eq('id', testData.id);
    }
  } catch (insertError) {
    log(`   ❌ Error en prueba de inserción: ${insertError.message}`, colors.red);
  }
}

async function analizarErrorPerfil(error, supabase) {
  log('\n🔍 ANÁLISIS DETALLADO DEL ERROR:', colors.magenta);
  
  switch (error.code) {
    case '42P01':
      log('   📋 DIAGNÓSTICO: Tabla "users" no existe', colors.magenta);
      log('   💡 SOLUCIÓN: Crear tabla users en Supabase', colors.cyan);
      break;
      
    case '42703':
      log('   📋 DIAGNÓSTICO: Columna no existe en la tabla', colors.magenta);
      log(`   🔍 Columna problemática: ${error.message}`, colors.magenta);
      log('   💡 SOLUCIÓN: Agregar columna faltante o ajustar datos', colors.cyan);
      break;
      
    case '23505':
      log('   📋 DIAGNÓSTICO: Violación de restricción única', colors.magenta);
      log('   💡 SOLUCIÓN: Verificar datos duplicados', colors.cyan);
      break;
      
    case '23502':
      log('   📋 DIAGNÓSTICO: Campo requerido es NULL', colors.magenta);
      log('   💡 SOLUCIÓN: Proporcionar valor para campo obligatorio', colors.cyan);
      break;
      
    case '23503':
      log('   📋 DIAGNÓSTICO: Violación de clave foránea', colors.magenta);
      log('   💡 SOLUCIÓN: Verificar que el usuario existe en auth.users', colors.cyan);
      break;
      
    default:
      log(`   📋 DIAGNÓSTICO: Error desconocido (${error.code})`, colors.magenta);
      log('   💡 SOLUCIÓN: Revisar logs detallados de Supabase', colors.cyan);
  }
  
  // Intentar obtener más información sobre la tabla
  try {
    log('\n   🔍 Obteniendo información adicional de la tabla...', colors.blue);
    
    const { data: tableInfo, error: infoError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'users')
      .eq('table_schema', 'public');
    
    if (!infoError && tableInfo) {
      log('   ✅ Columnas de la tabla users:', colors.green);
      tableInfo.forEach(col => {
        log(`      - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`, colors.blue);
      });
    }
  } catch (infoError) {
    log(`   ⚠️ No se pudo obtener info de tabla: ${infoError.message}`, colors.yellow);
  }
}

// Ejecutar diagnóstico
diagnosticarErrorRegistroConCredencialesReales()
  .then(() => {
    log('\n🎉 Diagnóstico completado', colors.green);
    process.exit(0);
  })
  .catch((error) => {
    log(`\n❌ Error fatal: ${error.message}`, colors.red);
    console.error(error.stack);
    process.exit(1);
  });
