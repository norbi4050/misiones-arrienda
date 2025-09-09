const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../Backend/.env.local' });

// Configurar Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function ejecutarConsultas() {
  console.log('🔍 Ejecutando consultas sobre tabla Property...\n');

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
      console.error('❌ Error en consulta B:', statusError);
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
      console.error('❌ Error en consulta C:', nonStandardError);
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
    const { data: policiesData, error: policiesError } = await supabase.rpc('get_policies_for_table', {
      table_name: 'Property'
    });

    if (policiesError) {
      console.log('⚠️  No se pudo obtener policies via RPC, intentando consulta directa...');

      // Intentar consulta directa a pg_policies (solo funcionará si tenemos permisos)
      try {
        const { data: pgPolicies, error: pgError } = await supabase
          .from('pg_policies')
          .select('*')
          .eq('tablename', 'Property');

        if (pgError) {
          console.error('❌ Error consultando pg_policies:', pgError);
          console.log('💡 Sugerencia: Ejecutar las consultas SQL manualmente en Supabase SQL Editor');
        } else {
          if (pgPolicies.length === 0) {
            console.log('❌ No hay policies RLS definidas para tabla Property');
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
        console.log('💡 Para ver las policies, ejecutar en Supabase SQL Editor:');
        console.log('SELECT * FROM pg_policies WHERE tablename = \'Property\';');
      }
    } else {
      if (policiesData.length === 0) {
        console.log('❌ No hay policies RLS definidas para tabla Property');
      } else {
        policiesData.forEach(policy => {
          console.log(`Policy: ${policy.policyname}`);
          console.log(`  Command: ${policy.cmd}`);
          console.log(`  Roles: ${policy.roles}`);
          console.log(`  Using: ${policy.qual}`);
          console.log('');
        });
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar consultas
ejecutarConsultas();
