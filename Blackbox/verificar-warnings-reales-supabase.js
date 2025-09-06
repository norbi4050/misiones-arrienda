const { createClient } = require('@supabase/supabase-js');

console.log('🔍 VERIFICACIÓN REAL DE WARNINGS EN SUPABASE');
console.log('=' .repeat(70));

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

async function verificarWarningsReales() {
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
        // VERIFICAR POLÍTICAS ACTUALES
        // =====================================================
        console.log('');
        console.log('🛡️ VERIFICANDO POLÍTICAS ACTUALES...');
        console.log('-'.repeat(50));

        const { data: politicas, error: politicasError } = await supabase
            .from('pg_policies')
            .select('policyname, cmd, roles, qual, with_check')
            .eq('schemaname', 'public')
            .eq('tablename', 'users');

        if (!politicasError && politicas) {
            console.log(`   📊 Total políticas encontradas: ${politicas.length}`);
            console.log('   📋 Políticas actuales:');
            politicas.forEach((policy, index) => {
                console.log(`      ${index + 1}. ${policy.policyname} (${policy.cmd})`);
                console.log(`         └─ Roles: ${policy.roles}`);
                if (policy.qual) {
                    console.log(`         └─ Condición: ${policy.qual.substring(0, 100)}...`);
                }
            });

            // Verificar si hay políticas problemáticas
            const politicasProblematicas = politicas.filter(p => 
                p.qual && (p.qual.includes('auth.uid()') || p.qual.includes('auth.role()'))
            );

            console.log('');
            console.log('🚨 ANÁLISIS DE WARNINGS:');
            if (politicasProblematicas.length > 0) {
                console.log(`   ❌ ${politicasProblematicas.length} políticas causan Auth RLS InitPlan warnings:`);
                politicasProblematicas.forEach(p => {
                    console.log(`      └─ ${p.policyname}: Usa auth.uid() o auth.role() sin (select)`);
                });
            } else {
                console.log('   ✅ No se detectaron políticas problemáticas para Auth RLS InitPlan');
            }

            // Verificar políticas múltiples por rol/acción
            const politicasPorRolAccion = {};
            politicas.forEach(p => {
                const key = `${p.cmd}`;
                if (!politicasPorRolAccion[key]) {
                    politicasPorRolAccion[key] = [];
                }
                politicasPorRolAccion[key].push(p.policyname);
            });

            console.log('');
            console.log('🔄 ANÁLISIS DE POLÍTICAS MÚLTIPLES:');
            Object.keys(politicasPorRolAccion).forEach(key => {
                const politicasDelTipo = politicasPorRolAccion[key];
                if (politicasDelTipo.length > 1) {
                    console.log(`   ⚠️ ${key}: ${politicasDelTipo.length} políticas (puede causar Multiple Permissive Policies warning)`);
                    politicasDelTipo.forEach(nombre => {
                        console.log(`      └─ ${nombre}`);
                    });
                } else {
                    console.log(`   ✅ ${key}: 1 política (optimizado)`);
                }
            });
        }

        // =====================================================
        // VERIFICAR ÍNDICES
        // =====================================================
        console.log('');
        console.log('📊 VERIFICANDO ÍNDICES...');
        console.log('-'.repeat(50));

        const { data: indices, error: indicesError } = await supabase
            .from('pg_indexes')
            .select('indexname, tablename, indexdef')
            .eq('schemaname', 'public')
            .eq('tablename', 'users')
            .like('indexname', '%email%');

        if (!indicesError && indices) {
            console.log(`   📊 Índices de email encontrados: ${indices.length}`);
            indices.forEach(idx => {
                console.log(`      └─ ${idx.indexname}`);
            });

            // Verificar duplicados
            const indicesEmail = indices.filter(idx => idx.indexname.includes('email'));
            if (indicesEmail.length > 1) {
                console.log('   ⚠️ Posibles índices duplicados detectados (Duplicate Index warning)');
            } else {
                console.log('   ✅ No hay índices duplicados');
            }
        }

        // =====================================================
        // VERIFICAR TABLA COMMUNITY_PROFILES
        // =====================================================
        console.log('');
        console.log('👥 VERIFICANDO TABLA COMMUNITY_PROFILES...');
        console.log('-'.repeat(50));

        const { data: tablaExists, error: tablaError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .eq('table_name', 'community_profiles')
            .single();

        if (!tablaError && tablaExists) {
            console.log('   ✅ Tabla community_profiles existe');
            
            const { data: politicasCommunity, error: politicasCommunityError } = await supabase
                .from('pg_policies')
                .select('policyname, cmd, roles')
                .eq('schemaname', 'public')
                .eq('tablename', 'community_profiles');

            if (!politicasCommunityError && politicasCommunity) {
                console.log(`   📊 Políticas en community_profiles: ${politicasCommunity.length}`);
                politicasCommunity.forEach(p => {
                    console.log(`      └─ ${p.policyname} (${p.cmd})`);
                });

                // Verificar políticas múltiples
                const selectPolicies = politicasCommunity.filter(p => p.cmd === 'SELECT');
                if (selectPolicies.length > 1) {
                    console.log('   ⚠️ Múltiples políticas SELECT detectadas (Multiple Permissive Policies warning)');
                }
            }
        } else {
            console.log('   ℹ️ Tabla community_profiles no existe');
        }

        // =====================================================
        // RESUMEN DE WARNINGS DETECTADOS
        // =====================================================
        console.log('');
        console.log('📋 RESUMEN DE WARNINGS DETECTADOS');
        console.log('='.repeat(70));

        let warningsDetectados = 0;

        // Auth RLS InitPlan
        if (politicasProblematicas && politicasProblematicas.length > 0) {
            console.log(`🚨 Auth RLS InitPlan: ${politicasProblematicas.length} políticas problemáticas`);
            warningsDetectados += politicasProblematicas.length;
        }

        // Multiple Permissive Policies
        let politicasMultiples = 0;
        if (politicasPorRolAccion) {
            Object.values(politicasPorRolAccion).forEach(arr => {
                if (arr.length > 1) politicasMultiples += arr.length - 1;
            });
        }
        if (politicasMultiples > 0) {
            console.log(`🚨 Multiple Permissive Policies: ${politicasMultiples} políticas redundantes`);
            warningsDetectados += politicasMultiples;
        }

        // Duplicate Index
        if (indices && indices.length > 1) {
            console.log(`🚨 Duplicate Index: ${indices.length - 1} índices duplicados`);
            warningsDetectados += indices.length - 1;
        }

        console.log('');
        if (warningsDetectados > 0) {
            console.log(`❌ TOTAL WARNINGS DETECTADOS: ${warningsDetectados}`);
            console.log('🔧 ACCIÓN REQUERIDA: Aplicar optimizaciones para eliminar warnings');
        } else {
            console.log('✅ NO SE DETECTARON WARNINGS - Base de datos optimizada');
        }

        console.log('');
        console.log('✅ VERIFICACIÓN REAL COMPLETADA');

    } catch (error) {
        console.error('❌ Error en verificación:', error.message);
    }
}

// Ejecutar verificación
if (require.main === module) {
    verificarWarningsReales().catch(console.error);
}

module.exports = { verificarWarningsReales };
