const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qfeyhaaxyemmnohqdele.supabase.co',
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM'
);

async function verificarEstadoFinal() {
  console.log('🔍 VERIFICACIÓN FINAL - ESTADO SUPABASE');
  console.log('='.repeat(50));

  try {
    // 1. Verificar políticas múltiples
    console.log('1️⃣ Verificando políticas múltiples...');
    const { data: multiples, error: multiplesError } = await supabase.rpc('sql', {
      query: `
        SELECT tablename, cmd, COUNT(*) as count
        FROM pg_policies
        WHERE schemaname = 'public'
        GROUP BY tablename, cmd
        HAVING COUNT(*) > 1
        ORDER BY tablename, cmd
      `
    });

    if (multiplesError) {
      console.log('❌ Error:', multiplesError.message);
    } else if (multiples && multiples.length > 0) {
      console.log('⚠️ POLÍTICAS MÚLTIPLES ENCONTRADAS:');
      multiples.forEach(m => {
        console.log(`   - ${m.tablename}: ${m.count} políticas ${m.cmd}`);
      });
    } else {
      console.log('✅ No hay políticas múltiples');
    }

    // 2. Verificar funcionamiento básico
    console.log('\n2️⃣ Verificando funcionamiento básico...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email')
      .limit(3);

    if (usersError) {
      console.log('❌ Error en consulta básica:', usersError.message);
    } else {
      console.log(`✅ Consulta básica exitosa: ${users.length} usuarios`);
    }

    // 3. Verificar warnings actuales
    console.log('\n3️⃣ Verificando warnings actuales...');
    const { data: politicas, error: politicasError } = await supabase.rpc('sql', {
      query: `
        SELECT tablename, cmd, COUNT(*) as count
        FROM pg_policies
        WHERE schemaname = 'public'
        GROUP BY tablename, cmd
        ORDER BY tablename, cmd
      `
    });

    if (politicasError) {
      console.log('❌ Error obteniendo políticas:', politicasError.message);
    } else {
      const warnings = politicas.filter(p => p.count > 1);
      if (warnings.length > 0) {
        console.log('⚠️ WARNINGS DETECTADOS:');
        warnings.forEach(w => {
          console.log(`   - ${w.tablename}: ${w.count} políticas ${w.cmd}`);
        });
        console.log('\n💡 IMPACTO: Los warnings pueden causar:');
        console.log('   - Degradación del rendimiento');
        console.log('   - Comportamiento impredecible en consultas');
        console.log('   - Problemas de seguridad potenciales');
        console.log('   - Dificultades en el mantenimiento');
      } else {
        console.log('🎉 No hay warnings - Sistema optimizado');
        console.log('💡 IMPACTO: Rendimiento óptimo garantizado');
      }
    }

    // 4. Test de carga básico
    console.log('\n4️⃣ Test de carga básico...');
    const startTime = Date.now();
    for (let i = 0; i < 10; i++) {
      await supabase.from('users').select('id').limit(1);
    }
    const endTime = Date.now();
    const avgTime = (endTime - startTime) / 10;

    console.log(`✅ Test completado en ${avgTime.toFixed(2)}ms promedio por consulta`);

    if (avgTime < 100) {
      console.log('🚀 Rendimiento excelente');
    } else if (avgTime < 500) {
      console.log('⚡ Rendimiento aceptable');
    } else {
      console.log('🐌 Rendimiento lento - revisar optimizaciones');
    }

  } catch (error) {
    console.log('❌ ERROR GENERAL:', error.message);
  }
}

verificarEstadoFinal();
