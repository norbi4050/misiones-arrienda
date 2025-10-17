/**
 * Script para aplicar Fix de RLS - Avatares Públicos
 * Permite que usuarios autenticados puedan ver avatares de otros usuarios
 * Fecha: 16 de Enero 2025
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qfeyhaaxyemmnohqdele.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('============================================================================');
console.log('FIX RLS: PERMITIR LECTURA PÚBLICA DE AVATARES');
console.log('Fecha: 2025-01-16');
console.log('============================================================================\n');

async function applyFix() {
  try {
    // ========================================
    // 1. VERIFICAR TABLA
    // ========================================
    console.log('--- 1. VERIFICANDO ESTRUCTURA DE TABLAS ---\n');

    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name IN ('User', 'users')
          ORDER BY table_name;
        `
      });

    if (tablesError) {
      console.log('⚠️ No se puede ejecutar RPC exec_sql (función personalizada no existe)');
      console.log('   Procediendo con método alternativo...\n');
    }

    // ========================================
    // 2. APLICAR FIX VIA SQL DIRECTO
    // ========================================
    console.log('--- 2. APLICANDO FIX DE RLS POLICIES ---\n');

    // Nota: Supabase JS no permite DROP/CREATE POLICY directamente
    // Necesitamos usar el SQL Editor del dashboard o ejecutar via psql

    console.log('⚠️ IMPORTANTE: Las RLS policies no se pueden modificar via Supabase JS');
    console.log('   Debes ejecutar el script SQL en el Dashboard de Supabase\n');

    console.log('📝 INSTRUCCIONES:');
    console.log('   1. Ve a: https://supabase.com/dashboard/project/qfeyhaaxyemmnohqdele/sql/new');
    console.log('   2. Copia el contenido de: sql-audit/FIX-RLS-AVATAR-PUBLIC-2025.sql');
    console.log('   3. Pega en el SQL Editor');
    console.log('   4. Ejecuta el script');
    console.log('   5. Verifica que las policies se crearon correctamente\n');

    console.log('============================================================================');
    console.log('CÓDIGO SQL A EJECUTAR (copia esto):');
    console.log('============================================================================\n');

    const sqlToExecute = `
-- PASO 1: Eliminar policy restrictiva de public."User"
DROP POLICY IF EXISTS "Users can view own data" ON public."User";

-- PASO 2: Crear policy pública para SELECT
CREATE POLICY "Anyone can view basic user data" ON public."User"
FOR SELECT TO authenticated
USING (true);

-- PASO 3: Mantener policy de UPDATE (solo propio perfil)
DROP POLICY IF EXISTS "Users can update own data" ON public."User";
CREATE POLICY "Users can update own data" ON public."User"
FOR UPDATE TO authenticated
USING (id = auth.uid()::text)
WITH CHECK (id = auth.uid()::text);

-- PASO 4: Verificar policies creadas
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'User'
ORDER BY policyname;

-- PASO 5: Testing - Consultar usuario específico
SELECT id, name, email, avatar
FROM public."User"
WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500';
`;

    console.log(sqlToExecute);

    console.log('\n============================================================================');
    console.log('ALTERNATIVA: Ejecutar via psql (si tienes acceso)');
    console.log('============================================================================\n');

    console.log('Si tienes psql instalado y las credenciales de conexión directa:');
    console.log('  psql $DATABASE_URL < sql-audit/FIX-RLS-AVATAR-PUBLIC-2025.sql\n');

    // ========================================
    // 3. TESTING - Verificar lectura actual
    // ========================================
    console.log('\n--- 3. TESTING PRE-FIX: Intentando leer usuario ---\n');

    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('id,name,email,avatar')
      .eq('id', '6403f9d2-e846-4c70-87e0-e051127d9500')
      .maybeSingle();

    if (userError) {
      console.log('❌ Error al leer usuario (esperado si RLS está bloqueando):');
      console.log(`   ${userError.message}\n`);
      console.log('   Esto confirma que necesitas aplicar el fix de RLS\n');
    } else if (userData) {
      console.log('✓ Usuario leído exitosamente:');
      console.log(`   ID: ${userData.id}`);
      console.log(`   Name: ${userData.name}`);
      console.log(`   Email: ${userData.email}\n`);
      console.log('   Si puedes leer esto, el fix ya fue aplicado o no es necesario\n');
    } else {
      console.log('⚠️ Usuario no encontrado (NULL return)');
      console.log('   Esto puede indicar que RLS está bloqueando la query\n');
    }

    console.log('============================================================================');
    console.log('PRÓXIMOS PASOS');
    console.log('============================================================================\n');

    console.log('1. Ejecuta el SQL en el Dashboard de Supabase');
    console.log('2. Luego ejecuta este script nuevamente para verificar');
    console.log('3. Prueba el endpoint: curl "https://www.misionesarrienda.com.ar/api/users/avatar?userId=6403f9d2-e846-4c70-87e0-e051127d9500"');
    console.log('4. Debería retornar el avatar en lugar de 404\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

applyFix();
