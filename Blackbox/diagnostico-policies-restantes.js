const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function diagnosticarPoliciesRestantes() {
    console.log('🔍 DIAGNOSTICANDO POLÍTICAS PROBLEMÁTICAS RESTANTES');
    console.log('=' .repeat(60));
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log('=' .repeat(60));
    console.log('');

    try {
        // Obtener todas las políticas actuales
        const { data: policies, error: polError } = await supabase.rpc('sql', {
            query: `
                SELECT
                    schemaname,
                    tablename,
                    policyname,
                    cmd,
                    qual,
                    with_check
                FROM pg_policies
                WHERE schemaname = 'public'
                    AND tablename IN ('users', 'favorites', 'property_inquiries')
                    AND policyname LIKE '%_optimized_final'
                ORDER BY tablename, policyname;
            `
        });

        if (polError) {
            console.log('❌ ERROR obteniendo políticas:', polError.message);
            return;
        }

        console.log('📋 POLÍTICAS ACTUALES:');
        console.log('=' .repeat(60));

        let problematicas = [];

        policies.forEach(policy => {
            console.log(`\n🔍 ${policy.tablename}.${policy.policyname} (${policy.cmd})`);

            // Verificar USING
            if (policy.qual) {
                const hasRawAuthUid = policy.qual.includes('auth.uid()') && !policy.qual.includes('(select auth.uid())');
                console.log(`   USING: ${policy.qual}`);
                console.log(`   ❌ Raw auth.uid(): ${hasRawAuthUid ? 'SÍ' : 'NO'}`);

                if (hasRawAuthUid) {
                    problematicas.push({
                        table: policy.tablename,
                        policy: policy.policyname,
                        type: 'USING',
                        expression: policy.qual
                    });
                }
            }

            // Verificar WITH CHECK
            if (policy.with_check) {
                const hasRawAuthUid = policy.with_check.includes('auth.uid()') && !policy.with_check.includes('(select auth.uid())');
                console.log(`   WITH CHECK: ${policy.with_check}`);
                console.log(`   ❌ Raw auth.uid(): ${hasRawAuthUid ? 'SÍ' : 'NO'}`);

                if (hasRawAuthUid) {
                    problematicas.push({
                        table: policy.tablename,
                        policy: policy.policyname,
                        type: 'WITH_CHECK',
                        expression: policy.with_check
                    });
                }
            }
        });

        console.log('\n' + '=' .repeat(60));
        console.log('🚨 POLÍTICAS PROBLEMÁTICAS ENCONTRADAS:', problematicas.length);
        console.log('=' .repeat(60));

        problematicas.forEach((prob, index) => {
            console.log(`${index + 1}. ${prob.table}.${prob.policy} (${prob.type})`);
            console.log(`   Expresión: ${prob.expression}`);
        });

        // Generar SQL de corrección
        console.log('\n' + '=' .repeat(60));
        console.log('🔧 SQL DE CORRECCIÓN GENERADO:');
        console.log('=' .repeat(60));

        let sqlStatements = [];

        problematicas.forEach(prob => {
            let sql = '';

            if (prob.type === 'USING') {
                sql = `ALTER POLICY "${prob.policy}" ON public.${prob.table}\nTO anon, authenticated, authenticator, dashboard_user\nUSING (\n    ${prob.expression.replace(/auth\.uid\(\)/g, '(select auth.uid())')}\n);`;
            } else if (prob.type === 'WITH_CHECK') {
                sql = `ALTER POLICY "${prob.policy}" ON public.${prob.table}\nTO anon, authenticated, authenticator, dashboard_user\nWITH CHECK (\n    ${prob.expression.replace(/auth\.uid\(\)/g, '(select auth.uid())')}\n);`;
            }

            sqlStatements.push(sql);
            console.log(`\n-- Fix for ${prob.table}.${prob.policy} (${prob.type})`);
            console.log(sql);
        });

        // Guardar reporte
        const reporte = {
            timestamp: new Date().toISOString(),
            totalPolicies: policies.length,
            problematicPolicies: problematicas.length,
            problematicDetails: problematicas,
            sqlCorrections: sqlStatements
        };

        const fs = require('fs');
        fs.writeFileSync('Blackbox/REPORTE-DIAGNOSTICO-POLICIES-RESTANTES.json', JSON.stringify(reporte, null, 2));

        console.log('\n' + '=' .repeat(60));
        console.log('📄 Reporte guardado en: Blackbox/REPORTE-DIAGNOSTICO-POLICIES-RESTANTES.json');
        console.log('✅ Diagnóstico completado');

        return reporte;

    } catch (error) {
        console.log('❌ ERROR DURANTE EL DIAGNÓSTICO:', error.message);
        return null;
    }
}

// Ejecutar
if (require.main === module) {
    diagnosticarPoliciesRestantes().catch(console.error);
}

module.exports = { diagnosticarPoliciesRestantes };
