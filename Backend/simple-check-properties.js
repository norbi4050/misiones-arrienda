// Script simple para verificar datos de propiedades en Supabase
// Ejecutar desde el directorio Backend

const { createClient } = require('@supabase/supabase-js');

// Configurar Supabase con variables de entorno del sistema
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Verificando configuración de Supabase...');
console.log('URL:', supabaseUrl ? '✅ Configurada' : '❌ No encontrada');
console.log('Key:', supabaseKey ? '✅ Configurada' : '❌ No encontrada');

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Variables de entorno no encontradas. Asegúrate de tener .env.local en Backend/');
  console.log('\n💡 Alternativa: Ejecutar consultas SQL manualmente en Supabase SQL Editor');
  console.log('📋 Consultas a ejecutar:');
  console.log('');
  console.log('-- A: ¿En cuál tabla hay datos?');
  console.log(`select 'Property' as t, count(*) as c from "Property"`);
  console.log(`union all`);
  console.log(`select 'properties' as t, count(*) as c from public.properties;`);
  console.log('');
  console.log('-- B: Conteo por status en la tabla Property');
  console.log(`select status, count(*) from "Property" group by status order by status;`);
  console.log('');
  console.log('-- C: Ver ejemplos de status no estándar');
  console.log(`select id, status from "Property" where status not in ('PUBLISHED','DRAFT','ARCHIVED') limit 10;`);
  console.log('');
  console.log('-- D: Listar policies RLS');
  console.log(`select schemaname, tablename, policyname, cmd, roles, qual, with_check from pg_policies where tablename = 'Property';`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function ejecutarConsultas() {
  console.log('\n🔍 Ejecutando consultas sobre tabla Property...\n');

  try {
    // A: ¿En cuál tabla hay datos?
    console.log('📊 A: ¿En cuál tabla hay datos?');
    const queryA1 = await supabase.from('Property').select('*', { count: 'exact', head: true });
    const queryA2 = await supabase.from('properties').select('*', { count: 'exact', head: true });

    console.log(`Property (CamelCase): ${queryA1.count || 0} filas`);
    console.log(`properties (snake_case): ${queryA2.count || 0} filas\n`);

    // B: Conteo por status en la tabla Property
    console.log('📈 B: Conteo por status en tabla Property');
    const { data: statusData, error: statusError } = await supabase
      .from('Property')
      .select('status')
      .order('status');

    if (statusError) {
      console.error('❌ Error en consulta B:', statusError.message);
    } else {
      const statusCount = {};
      statusData.forEach(row => {
        statusCount[row.status] = (statusCount[row.status] || 0) + 1;
      });

      Object.entries(statusCount)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([status, count]) => {
          console.log(`${status}: ${count}`);
        });
    }
    console.log('');

    // C: Ver ejemplos de status distinto a mayúsculas
    console.log('🔍 C: Ejemplos de status no estándar');
    const { data: nonStandardStatus, error: nonStandardError } = await supabase
      .from('Property')
      .select('id, status')
      .not('status', 'in', '("PUBLISHED","DRAFT","ARCHIVED")')
      .limit(10);

    if (nonStandardError) {
      console.error('❌ Error en consulta C:', nonStandardError.message);
    } else {
      if (nonStandardStatus.length === 0) {
        console.log('✅ Todos los status están en mayúsculas estándar');
      } else {
        nonStandardStatus.forEach(row => {
          console.log(`ID: ${row.id}, Status: "${row.status}"`);
        });
      }
    }
    console.log('');

    // D: Listar policies RLS vigentes
    console.log('🔒 D: Policies RLS en tabla Property');
    try {
      const { data: pgPolicies, error: pgError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'Property');

      if (pgError) {
        console.error('❌ Error consultando pg_policies:', pgError.message);
        console.log('💡 Sugerencia: Ejecutar consulta SQL manualmente en Supabase SQL Editor');
        console.log('SELECT * FROM pg_policies WHERE tablename = \'Property\';');
      } else {
        if (pgPolicies.length === 0) {
          console.log('❌ No hay policies RLS definidas para tabla Property');
          console.log('⚠️  Esto explica por qué la API no devuelve datos reales');
        } else {
          pgPolicies.forEach(policy => {
            console.log(`Policy: ${policy.policyname}`);
            console.log(`  Command: ${policy.cmd}`);
            console.log(`  Roles: ${policy.roles}`);
            console.log(`  Using: ${policy.qual}`);
            console.log('');
          });
        }
      }
    } catch (e) {
      console.error('❌ Error al consultar policies:', e.message);
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

// Ejecutar consultas
ejecutarConsultas();
