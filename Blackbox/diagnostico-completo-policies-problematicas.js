// =====================================================
// DIAGNÓSTICO COMPLETO: POLÍTICAS PROBLEMÁTICAS AUTH.UID()
// =====================================================

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function diagnosticoCompletoPolicies() {
    console.log('🔍 DIAGNÓSTICO COMPLETO DE POLÍTICAS PROBLEMÁTICAS');
    console.log('=' .repeat(60));
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log('=' .repeat(60));
    console.log('');

    try {
        // Obtener TODAS las políticas con sus condiciones exactas
        const { data: allPolicies, error } = await supabase.rpc('sql', {
            query: `
                SELECT
                    schemaname,
                    tablename,
                    policyname,
                    cmd,
                    qual
                FROM pg_policies
                WHERE schemaname = 'public'
                    AND tablename IN ('users', 'favorites', 'property_inquiries')
                ORDER BY tablename, policyname;
            `
        });

        if (error) {
            console.log('❌ Error obteniendo políticas:', error.message);
            return;
        }

        console.log(`📊 Total de políticas encontradas: ${allPolicies.length}`);
        console.log('');

        // Mostrar todas las políticas con sus condiciones
        const tablas = ['users', 'favorites', 'property_inquiries'];

        for (const tabla of tablas) {
            console.log(`📋 POLÍTICAS PARA TABLA: ${tabla.toUpperCase()}`);
            console.log('-'.repeat(60));

            const policiesTabla = allPolicies.filter(p => p.tablename === tabla);

            if (policiesTabla.length === 0) {
                console.log('❌ No hay políticas para esta tabla');
            } else {
                policiesTabla.forEach(policy => {
                    console.log(`🔧 ${policy.policyname}`);
                    console.log(`   📝 Comando: ${policy.cmd}`);
                    console.log(`   🎯 Condición: ${policy.qual || 'SIN CONDICIÓN'}`);
                    console.log('');
                });
            }
            console.log('');
        }

        // Identificar específicamente las políticas problemáticas
        console.log('🚨 POLÍTICAS PROBLEMÁTICAS IDENTIFICADAS');
        console.log('-'.repeat(50));

        const problematicPolicies = allPolicies.filter(p =>
            p.qual && (
                p.qual.includes('auth.uid()') &&
                !p.qual.includes('(select auth.uid())')
            )
        );

        if (problematicPolicies.length === 0) {
            console.log('✅ No se encontraron políticas problemáticas');
        } else {
            console.log(`❌ POLÍTICAS PROBLEMÁTICAS ENCONTRADAS: ${problematicPolicies.length}`);
            problematicPolicies.forEach(policy => {
                console.log(`⚠️ ${policy.tablename}.${policy.policyname}`);
                console.log(`   Condición: ${policy.qual}`);
                console.log('');
            });
        }

        // Crear SQL para eliminar todas las políticas problemáticas
        console.log('🛠️ SQL PARA ELIMINAR POLÍTICAS PROBLEMÁTICAS');
        console.log('-'.repeat(50));

        const dropStatements = problematicPolicies.map(p =>
            `DROP POLICY IF EXISTS "${p.policyname}" ON public.${p.tablename};`
        );

        console.log('SQL generado:');
        dropStatements.forEach(stmt => console.log(`   ${stmt}`));
        console.log('');

        // Crear SQL para recrear políticas correctas
        console.log('🔧 SQL PARA RECREAR POLÍTICAS CORRECTAS');
        console.log('-'.repeat(50));

        const createStatements = problematicPolicies.map(p => {
            const table = p.tablename;
            const policyName = p.policyname;
            const cmd = p.cmd;

            // Determinar la columna correcta basada en la tabla
            let column;
            if (table === 'users') column = 'id';
            else if (table === 'favorites') column = 'user_id';
            else if (table === 'property_inquiries') column = 'inquirer_user_id';

            return `CREATE POLICY "${policyName}" ON public.${table}
FOR ${cmd} TO anon, authenticated, authenticator, dashboard_user
USING (
    ${column}::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);`;
        });

        console.log('SQL generado:');
        createStatements.forEach(stmt => console.log(`   ${stmt}`));
        console.log('');

        // Crear archivo SQL completo
        const fullSQL = [
            '-- =====================================================',
            '-- SOLUCIÓN DEFINITIVA: ELIMINAR Y RECREAR POLÍTICAS PROBLEMÁTICAS',
            '-- =====================================================',
            '',
            '-- PASO 1: ELIMINAR POLÍTICAS PROBLEMÁTICAS',
            ...dropStatements,
            '',
            '-- PASO 2: RECREAR POLÍTICAS CON SINTAXIS CORRECTA',
            ...createStatements,
            '',
            '-- PASO 3: VERIFICACIÓN',
            'SELECT',
            "    'POLÍTICAS PROBLEMÁTICAS RESTANTES' as tipo,",
            '    COUNT(*) as cantidad',
            'FROM pg_policies',
            "WHERE schemaname = 'public'",
            "    AND tablename IN ('users', 'favorites', 'property_inquiries')",
            "    AND qual LIKE '%auth.uid()%'",
            "    AND qual NOT LIKE '%(select auth.uid())%';"
        ].join('\n');

        const fs = require('fs');
        fs.writeFileSync('Blackbox/SQL-ELIMINAR-RECREAR-PROBLEMATICAS.sql', fullSQL);

        console.log('📄 Archivo SQL creado: Blackbox/SQL-ELIMINAR-RECREAR-PROBLEMATICAS.sql');

        // Guardar diagnóstico completo
        const diagnostico = {
            timestamp: new Date().toISOString(),
            totalPolicies: allPolicies.length,
            problematicPolicies: problematicPolicies.length,
            dropStatements: dropStatements,
            createStatements: createStatements
        };

        fs.writeFileSync('Blackbox/DIAGNOSTICO-POLICIES-PROBLEMATICAS.json', JSON.stringify(diagnostico, null, 2));
        console.log('📄 Diagnóstico guardado en: Blackbox/DIAGNOSTICO-POLICIES-PROBLEMATICAS.json');

        return diagnostico;

    } catch (error) {
        console.log('❌ ERROR DURANTE EL DIAGNÓSTICO:', error.message);
        return null;
    }
}

diagnosticoCompletoPolicies();
