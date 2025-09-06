// =====================================================
// VERIFICACIÓN DIRECTA: POLÍTICAS ACTUALES EN SUPABASE
// =====================================================

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verificarPoliciesActuales() {
    console.log('🔍 VERIFICANDO POLÍTICAS ACTUALES EN SUPABASE');
    console.log('=' .repeat(60));

    try {
        // Obtener todas las políticas
        const { data: policies, error } = await supabase.rpc('sql', {
            query: `
                SELECT
                    schemaname,
                    tablename,
                    policyname,
                    cmd,
                    roles,
                    qual
                FROM pg_policies
                WHERE schemaname = 'public'
                    AND tablename IN ('users', 'favorites', 'property_inquiries')
                ORDER BY tablename, policyname;
            `
        });

        if (error) {
            console.log('❌ Error:', error.message);
            return;
        }

        console.log(`📊 Total de políticas encontradas: ${policies.length}`);
        console.log('');

        // Mostrar políticas por tabla
        const tablas = ['users', 'favorites', 'property_inquiries'];

        for (const tabla of tablas) {
            console.log(`📋 POLÍTICAS PARA TABLA: ${tabla.toUpperCase()}`);
            console.log('-'.repeat(50));

            const policiesTabla = policies.filter(p => p.tablename === tabla);

            if (policiesTabla.length === 0) {
                console.log('❌ No hay políticas para esta tabla');
            } else {
                policiesTabla.forEach(policy => {
                    console.log(`🔧 Política: ${policy.policyname}`);
                    console.log(`   📝 Comando: ${policy.cmd}`);
                    console.log(`   👥 Roles: ${policy.roles.join(', ')}`);
                    console.log(`   🎯 Condición: ${policy.qual}`);
                    console.log('');
                });
            }
            console.log('');
        }

        // Verificar específicamente auth.uid() sin (select ...)
        console.log('🚨 VERIFICACIÓN DE AUTH.UID() PROBLEMA');
        console.log('-'.repeat(50));

        const problematicPolicies = policies.filter(p =>
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

    } catch (error) {
        console.log('❌ ERROR:', error.message);
    }
}

verificarPoliciesActuales();
