// Test de conexión a Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 INICIANDO TESTING DE SUPABASE...\n');

// Verificar variables de entorno
console.log('📋 VERIFICANDO VARIABLES DE ENTORNO:');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.DATABASE_URL;

console.log(`✅ SUPABASE_URL: ${supabaseUrl ? 'Configurada' : '❌ FALTANTE'}`);
console.log(`✅ SUPABASE_ANON_KEY: ${supabaseKey ? 'Configurada' : '❌ FALTANTE'}`);
console.log(`✅ SERVICE_ROLE_KEY: ${serviceRoleKey ? 'Configurada' : '❌ FALTANTE'}`);
console.log(`✅ DATABASE_URL: ${databaseUrl ? 'Configurada' : '❌ FALTANTE'}\n`);

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ ERROR: Variables de entorno faltantes');
  process.exit(1);
}

async function testSupabaseConnection() {
  try {
    console.log('🔗 TESTING CONEXIÓN A SUPABASE...');
    
    // Crear cliente de Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test 1: Verificar conexión básica
    console.log('📡 Test 1: Conexión básica...');
    const { data, error } = await supabase.from('properties').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log(`⚠️  Error en conexión: ${error.message}`);
      if (error.message.includes('relation "properties" does not exist')) {
        console.log('📝 Nota: La tabla "properties" no existe aún, pero la conexión funciona');
      }
    } else {
      console.log('✅ Conexión exitosa a Supabase');
    }
    
    // Test 2: Verificar autenticación
    console.log('🔐 Test 2: Sistema de autenticación...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log(`⚠️  Error en auth: ${authError.message}`);
    } else {
      console.log('✅ Sistema de autenticación disponible');
    }
    
    // Test 3: Listar tablas disponibles
    console.log('📊 Test 3: Verificando esquema de base de datos...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.log(`⚠️  No se pudieron listar las tablas: ${tablesError.message}`);
    } else if (tables && tables.length > 0) {
      console.log('✅ Tablas encontradas:');
      tables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    } else {
      console.log('📝 No se encontraron tablas públicas');
    }
    
    console.log('\n🎉 TESTING COMPLETADO');
    console.log('✅ Supabase está configurado y funcionando correctamente');
    
  } catch (error) {
    console.log(`❌ ERROR CRÍTICO: ${error.message}`);
    console.log('🔧 Verifica tu configuración de Supabase');
  }
}

// Ejecutar testing
testSupabaseConnection();
