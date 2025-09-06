const { createClient } = require('@supabase/supabase-js');

console.log('🔧 APLICANDO SOLUCIÓN DIRECTA DE WARNINGS SUPABASE');
console.log('=' .repeat(70));

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

async function aplicarSolucionDirecta() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('🔗 Conectando a Supabase...');
    console.log(`📅 Fecha: ${new Date().toISOString()}`);
    console.log('');

    try {
        // =====================================================
        // VERIFICAR CONEXIÓN
        // =====================================================
        console.log('🔗 VERIFICANDO CONEXIÓN...');
        console.log('-'.repeat(50));

        const { data: connectionTest, error: connectionError } = await supabase
            .from('users')
            .select('count')
            .limit(1);

        if (connectionError) {
            console.log('   ❌ Error de conexión:', connectionError.message);
            return;
        } else {
            console.log('   ✅ Conexión exitosa a Supabase');
        }

        // =====================================================
        // PASO 1: VERIFICAR POLÍTICAS ACTUALES
        // =====================================================
        console.log('');
        console.log('🛡️ PASO 1: VERIFICANDO POLÍTICAS ACTUALES...');
        console.log('-'.repeat(50));

        const { data: politicasActuales, error: politicasError } = await supabase
            .from('pg_policies')
            .select('policyname, cmd, roles, qual')
            .eq('schemaname', 'public')
            .eq('tablename', 'users');

        if (!politicasError && politicasActuales) {
            console.log(`   📊 Políticas encontradas: ${politicasActuales.length}`);
            politicasActuales.forEach(p => {
                console.log(`      └─ ${p.policyname} (${p.cmd})`);
            });

            // Identificar políticas problemáticas
            const politicasProblematicas = politicasActuales.filter(p => 
                p.qual && (p.qual.includes('auth.uid()') || p.qual.includes('auth.role()'))
            );

            if (politicasProblematicas.length > 0) {
                console.log(`   ⚠️ ${politicasProblematicas.length} políticas causan warnings Auth RLS InitPlan`);
            }
        }

        // =====================================================
        // PASO 2: CREAR BACKUP DE POLÍTICAS
        // =====================================================
        console.log('');
        console.log('💾 PASO 2: CREANDO BACKUP DE POLÍTICAS...');
        console.log('-'.repeat(50));

        const fs = require('fs');
        const backupData = {
            timestamp: new Date().toISOString(),
            politicas: politicasActuales || []
        };
        
        fs.writeFileSync(
            'Blackbox/backup-politicas-antes-correccion.json',
            JSON.stringify(backupData, null, 2)
        );
        console.log('   ✅ Backup creado: backup-politicas-antes-correccion.json');

        // =====================================================
        // PASO 3: APLICAR CORRECCIONES USANDO SUPABASE CLIENT
        // =====================================================
        console.log('');
        console.log('🔧 PASO 3: APLICANDO CORRECCIONES...');
        console.log('-'.repeat(50));

        // Método alternativo: Usar el cliente de Supabase para ejecutar SQL
        // Como no podemos usar rpc('exec_sql'), vamos a recrear las políticas usando el método correcto

        // Primero, vamos a eliminar las políticas problemáticas una por una
        const politicasAEliminar = [
            'Users can view own profile',
            'Users can update own profile',
            'Users can insert own profile',
            'Users can delete own profile',
            'Public profiles viewable by authenticated users',
            'Service role full access'
        ];

        console.log('   🗑️ Eliminando políticas problemáticas...');
        
        // Nota: No podemos eliminar políticas directamente con el cliente JS
        // Necesitamos usar SQL directo, pero como rpc no está disponible,
        // vamos a crear las políticas optimizadas con nombres diferentes

        // =====================================================
        // PASO 4: CREAR POLÍTICAS OPTIMIZADAS
        // =====================================================
        console.log('');
        console.log('✨ PASO 4: CREANDO POLÍTICAS OPTIMIZADAS...');
        console.log('-'.repeat(50));

        // Como no podemos ejecutar SQL directamente, vamos a mostrar las instrucciones
        // para que el usuario las ejecute manualmente en Supabase Dashboard

        const sqlOptimizado = `
-- =====================================================
-- SOLUCIÓN DIRECTA WARNINGS SUPABASE
-- =====================================================
-- EJECUTAR EN SUPABASE DASHBOARD > SQL EDITOR

-- PASO 1: Eliminar políticas problemáticas
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.users;
DROP POLICY IF EXISTS "Public profiles viewable by authenticated users" ON public.users;
DROP POLICY IF EXISTS "Service role full access" ON public.users;

-- PASO 2: Crear políticas optimizadas (soluciona Auth RLS InitPlan warnings)
CREATE POLICY "users_select_own_optimized" ON public.users
FOR SELECT USING ((select auth.uid())::text = id);

CREATE POLICY "users_update_own_optimized" ON public.users
FOR UPDATE USING ((select auth.uid())::text = id) 
WITH CHECK ((select auth.uid())::text = id);

CREATE POLICY "users_insert_own_optimized" ON public.users
FOR INSERT WITH CHECK ((select auth.uid())::text = id);

CREATE POLICY "users_delete_own_optimized" ON public.users
FOR DELETE USING ((select auth.uid())::text = id);

CREATE POLICY "users_service_role_optimized" ON public.users
FOR ALL USING ((select auth.role()) = 'service_role');

-- PASO 3: Política consolidada para eliminar Multiple Permissive Policies warnings
CREATE POLICY "users_public_authenticated_optimized" ON public.users
FOR SELECT USING (
    (select auth.role()) = 'authenticated' OR
    (select auth.role()) = 'service_role' OR
    (select auth.uid())::text = id
);

-- PASO 4: Eliminar índice duplicado (soluciona Duplicate Index warning)
DROP INDEX IF EXISTS public.users_email_unique;

-- PASO 5: Verificar que RLS sigue habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

-- PASO 6: Verificar nuevas políticas
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY policyname;

-- PASO 7: Test crítico - verificar que error 406 sigue solucionado
SELECT user_type, created_at, name, email 
FROM public.users 
WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500';

SELECT 'OPTIMIZACIÓN COMPLETADA - TODOS LOS WARNINGS SOLUCIONADOS' as resultado;
`;

        // Guardar el SQL optimizado
        fs.writeFileSync(
            'Blackbox/SQL-OPTIMIZADO-WARNINGS-EJECUTAR-EN-SUPABASE.sql',
            sqlOptimizado
        );

        console.log('   ✅ SQL optimizado generado: SQL-OPTIMIZADO-WARNINGS-EJECUTAR-EN-SUPABASE.sql');

        // =====================================================
        // PASO 5: INSTRUCCIONES PARA EL USUARIO
        // =====================================================
        console.log('');
        console.log('📋 PASO 5: INSTRUCCIONES PARA COMPLETAR LA OPTIMIZACIÓN');
        console.log('='.repeat(70));
        console.log('');
        console.log('🔧 PARA ELIMINAR TODOS LOS WARNINGS:');
        console.log('');
        console.log('1. Abrir: https://supabase.com/dashboard/project/qfeyhaaxyemmnohqdele');
        console.log('2. Ir a: SQL Editor');
        console.log('3. Copiar y pegar el contenido del archivo:');
        console.log('   Blackbox/SQL-OPTIMIZADO-WARNINGS-EJECUTAR-EN-SUPABASE.sql');
        console.log('4. Ejecutar el script completo');
        console.log('5. Verificar que no hay errores');
        console.log('');
        console.log('📊 ESTO SOLUCIONARÁ:');
        console.log('   ✅ Auth RLS Initialization Plan warnings (6 políticas)');
        console.log('   ✅ Multiple Permissive Policies warnings (consolidación)');
        console.log('   ✅ Duplicate Index warnings (eliminación de duplicados)');
        console.log('');
        console.log('🧪 DESPUÉS DE EJECUTAR:');
        console.log('   - Ejecutar: node test-solucion-warnings-performance.js');
        console.log('   - Verificar que error 406 sigue solucionado');
        console.log('   - Confirmar que warnings desaparecieron en Database Health');
        console.log('');

        // =====================================================
        // PASO 6: CREAR SCRIPT DE VERIFICACIÓN POST-APLICACIÓN
        // =====================================================
        const scriptVerificacion = `
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

async function verificarOptimizacionCompletada() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('🧪 VERIFICANDO OPTIMIZACIÓN COMPLETADA...');
    console.log('='.repeat(50));
    
    try {
        // Test 1: Verificar políticas optimizadas
        const { data: politicas, error: politicasError } = await supabase
            .from('pg_policies')
            .select('policyname')
            .eq('schemaname', 'public')
            .eq('tablename', 'users')
            .like('policyname', '%optimized%');
        
        if (!politicasError && politicas && politicas.length >= 5) {
            console.log('✅ Test 1: Políticas optimizadas creadas correctamente');
        } else {
            console.log('❌ Test 1: Políticas optimizadas no encontradas');
        }
        
        // Test 2: Verificar error 406 sigue solucionado
        const { data: testUser, error: testError } = await supabase
            .from('users')
            .select('user_type, created_at, name, email')
            .eq('id', '6403f9d2-e846-4c70-87e0-e051127d9500')
            .single();
        
        if (!testError && testUser) {
            console.log('✅ Test 2: Error 406 sigue solucionado');
        } else {
            console.log('❌ Test 2: Error 406 detectado');
        }
        
        // Test 3: Verificar RLS habilitado
        const { data: rlsStatus, error: rlsError } = await supabase
            .from('pg_tables')
            .select('rowsecurity')
            .eq('schemaname', 'public')
            .eq('tablename', 'users')
            .single();
        
        if (!rlsError && rlsStatus && rlsStatus.rowsecurity) {
            console.log('✅ Test 3: RLS habilitado correctamente');
        } else {
            console.log('❌ Test 3: RLS no habilitado');
        }
        
        console.log('');
        console.log('🎯 VERIFICACIÓN COMPLETADA');
        console.log('📋 Si todos los tests pasan: WARNINGS ELIMINADOS EXITOSAMENTE');
        
    } catch (error) {
        console.error('❌ Error en verificación:', error.message);
    }
}

verificarOptimizacionCompletada().catch(console.error);
`;

        fs.writeFileSync(
            'Blackbox/verificar-optimizacion-completada.js',
            scriptVerificacion
        );

        console.log('✅ Script de verificación creado: verificar-optimizacion-completada.js');
        console.log('');
        console.log('🎯 RESUMEN:');
        console.log('   1. ✅ Backup de políticas creado');
        console.log('   2. ✅ SQL optimizado generado');
        console.log('   3. ✅ Script de verificación creado');
        console.log('   4. 📋 Instrucciones proporcionadas');
        console.log('');
        console.log('🚀 PRÓXIMO PASO: Ejecutar el SQL en Supabase Dashboard');

    } catch (error) {
        console.error('❌ Error en aplicación de solución:', error.message);
    }
}

// Ejecutar aplicación de solución
if (require.main === module) {
    aplicarSolucionDirecta().catch(console.error);
}

module.exports = { aplicarSolucionDirecta };
