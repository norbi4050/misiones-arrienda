const { createClient } = require('@supabase/supabase-js');

console.log('🔍 ANÁLISIS CRÍTICO - POLÍTICAS SUPABASE ACTUAL VS PROYECTO');
console.log('=' .repeat(80));

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

// Reporte proporcionado por el usuario
const reporteUsuario = [
    // TABLA: community_profiles
    { schemaname: 'public', tablename: 'community_profiles', policyname: 'Enable read access for all users', cmd: 'SELECT', roles: '{public}', qual: 'true' },
    { schemaname: 'public', tablename: 'community_profiles', policyname: 'community_profiles_optimized_delete', cmd: 'DELETE', roles: '{public}', qual: '(user_id = ( SELECT auth.uid() AS uid))' },
    { schemaname: 'public', tablename: 'community_profiles', policyname: 'community_profiles_optimized_insert', cmd: 'INSERT', roles: '{public}', qual: null, with_check: '(user_id = ( SELECT auth.uid() AS uid))' },
    { schemaname: 'public', tablename: 'community_profiles', policyname: 'community_profiles_optimized_select', cmd: 'SELECT', roles: '{public}', qual: 'true' },
    { schemaname: 'public', tablename: 'community_profiles', policyname: 'community_profiles_optimized_update', cmd: 'UPDATE', roles: '{public}', qual: '(user_id = ( SELECT auth.uid() AS uid))' },
    
    // TABLA: profiles
    { schemaname: 'public', tablename: 'profiles', policyname: 'profiles_optimized_insert', cmd: 'INSERT', roles: '{public}', qual: null, with_check: '(id = ( SELECT auth.uid() AS uid))' },
    { schemaname: 'public', tablename: 'profiles', policyname: 'profiles_optimized_select', cmd: 'SELECT', roles: '{public}', qual: 'true' },
    { schemaname: 'public', tablename: 'profiles', policyname: 'profiles_optimized_update', cmd: 'UPDATE', roles: '{public}', qual: '(id = ( SELECT auth.uid() AS uid))' },
    
    // TABLA: users (CRÍTICA)
    { schemaname: 'public', tablename: 'users', policyname: 'Public profiles viewable by authenticated users', cmd: 'SELECT', roles: '{public}', qual: "((auth.role() = 'authenticated'::text) AND true)" },
    { schemaname: 'public', tablename: 'users', policyname: 'Service role full access', cmd: 'ALL', roles: '{public}', qual: "(auth.role() = 'service_role'::text)" },
    { schemaname: 'public', tablename: 'users', policyname: 'Users can delete own profile', cmd: 'DELETE', roles: '{public}', qual: '((auth.uid())::text = id)' },
    { schemaname: 'public', tablename: 'users', policyname: 'Users can insert own profile', cmd: 'INSERT', roles: '{public}', qual: null, with_check: '((auth.uid())::text = id)' },
    { schemaname: 'public', tablename: 'users', policyname: 'Users can update own profile', cmd: 'UPDATE', roles: '{public}', qual: '((auth.uid())::text = id)', with_check: '((auth.uid())::text = id)' },
    { schemaname: 'public', tablename: 'users', policyname: 'Users can view own profile', cmd: 'SELECT', roles: '{public}', qual: '((auth.uid())::text = id)' }
];

async function analizarPoliticasCritico() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('📅 Fecha:', new Date().toISOString());
    console.log('🎯 Objetivo: Análisis crítico de políticas actuales vs proyecto');
    console.log('');

    const problemas = [];
    const recomendaciones = [];
    const warnings = [];

    try {
        // =====================================================
        // PASO 1: OBTENER POLÍTICAS ACTUALES
        // =====================================================
        console.log('🔍 PASO 1: OBTENIENDO POLÍTICAS ACTUALES DE SUPABASE...');
        console.log('-'.repeat(60));

        const { data: politicasActuales, error: politicasError } = await supabase
            .from('pg_policies')
            .select('schemaname, tablename, policyname, cmd, roles, qual, with_check')
            .in('schemaname', ['public', 'storage'])
            .order('tablename, cmd, policyname');

        if (politicasError) {
            console.log('❌ ERROR: No se pueden obtener políticas actuales');
            console.log(`   └─ ${politicasError.message}`);
            return;
        }

        console.log(`✅ Políticas obtenidas: ${politicasActuales.length}`);

        // =====================================================
        // PASO 2: ANÁLISIS CRÍTICO TABLA USERS
        // =====================================================
        console.log('');
        console.log('🚨 PASO 2: ANÁLISIS CRÍTICO TABLA USERS...');
        console.log('-'.repeat(60));

        const politicasUsers = politicasActuales.filter(p => p.tablename === 'users');
        const politicasUsersReporte = reporteUsuario.filter(p => p.tablename === 'users');

        console.log(`📊 Políticas actuales en users: ${politicasUsers.length}`);
        console.log(`📊 Políticas en reporte: ${politicasUsersReporte.length}`);

        // Verificar políticas problemáticas
        const politicasProblematicas = politicasUsers.filter(p => 
            p.qual && (
                p.qual.includes('auth.uid()') && !p.qual.includes('( SELECT auth.uid()') ||
                p.qual.includes('auth.role()') && !p.qual.includes('( SELECT auth.role()')
            )
        );

        if (politicasProblematicas.length > 0) {
            console.log('');
            console.log('🚨 PROBLEMA CRÍTICO: POLÍTICAS CAUSAN WARNINGS');
            console.log('   ⚠️ Auth RLS InitPlan warnings detectados:');
            politicasProblematicas.forEach(p => {
                console.log(`      └─ ${p.policyname}: ${p.qual}`);
                problemas.push({
                    tipo: 'AUTH_RLS_INITPLAN',
                    tabla: 'users',
                    politica: p.policyname,
                    problema: 'Usa auth.uid() sin (select), causa re-evaluación por fila',
                    impacto: 'ALTO - Performance degradada 70-90%'
                });
            });
        }

        // Verificar políticas múltiples por comando
        const comandosUsers = {};
        politicasUsers.forEach(p => {
            if (!comandosUsers[p.cmd]) comandosUsers[p.cmd] = [];
            comandosUsers[p.cmd].push(p.policyname);
        });

        console.log('');
        console.log('📋 ANÁLISIS POR COMANDO:');
        Object.keys(comandosUsers).forEach(cmd => {
            const politicas = comandosUsers[cmd];
            console.log(`   ${cmd}: ${politicas.length} políticas`);
            if (politicas.length > 1 && cmd === 'SELECT') {
                console.log('      ⚠️ Multiple Permissive Policies warning');
                problemas.push({
                    tipo: 'MULTIPLE_PERMISSIVE_POLICIES',
                    tabla: 'users',
                    comando: cmd,
                    problema: `${politicas.length} políticas SELECT causan overhead`,
                    impacto: 'MEDIO - Evaluación múltiple por query'
                });
            }
        });

        // =====================================================
        // PASO 3: ANÁLISIS TABLA COMMUNITY_PROFILES
        // =====================================================
        console.log('');
        console.log('👥 PASO 3: ANÁLISIS TABLA COMMUNITY_PROFILES...');
        console.log('-'.repeat(60));

        const politicasCommunity = politicasActuales.filter(p => p.tablename === 'community_profiles');
        console.log(`📊 Políticas en community_profiles: ${politicasCommunity.length}`);

        if (politicasCommunity.length > 0) {
            // Verificar políticas duplicadas
            const selectPoliciesCommunity = politicasCommunity.filter(p => p.cmd === 'SELECT');
            if (selectPoliciesCommunity.length > 1) {
                console.log('   ⚠️ Políticas SELECT múltiples detectadas:');
                selectPoliciesCommunity.forEach(p => {
                    console.log(`      └─ ${p.policyname}`);
                });
                problemas.push({
                    tipo: 'MULTIPLE_PERMISSIVE_POLICIES',
                    tabla: 'community_profiles',
                    comando: 'SELECT',
                    problema: `${selectPoliciesCommunity.length} políticas SELECT redundantes`,
                    impacto: 'MEDIO - Overhead innecesario'
                });
            }
        }

        // =====================================================
        // PASO 4: ANÁLISIS TABLA PROFILES
        // =====================================================
        console.log('');
        console.log('👤 PASO 4: ANÁLISIS TABLA PROFILES...');
        console.log('-'.repeat(60));

        const politicasProfiles = politicasActuales.filter(p => p.tablename === 'profiles');
        console.log(`📊 Políticas en profiles: ${politicasProfiles.length}`);

        if (politicasProfiles.length === 0) {
            console.log('   ⚠️ ADVERTENCIA: Tabla profiles sin políticas RLS');
            warnings.push({
                tipo: 'MISSING_RLS',
                tabla: 'profiles',
                problema: 'Tabla sin políticas RLS configuradas',
                impacto: 'ALTO - Posible acceso no controlado'
            });
        }

        // =====================================================
        // PASO 5: ANÁLISIS STORAGE POLICIES
        // =====================================================
        console.log('');
        console.log('📁 PASO 5: ANÁLISIS STORAGE POLICIES...');
        console.log('-'.repeat(60));

        const politicasStorage = politicasActuales.filter(p => p.schemaname === 'storage');
        console.log(`📊 Políticas de storage: ${politicasStorage.length}`);

        // Agrupar por bucket
        const buckets = {};
        politicasStorage.forEach(p => {
            if (p.qual && p.qual.includes('bucket_id')) {
                const match = p.qual.match(/bucket_id = '([^']+)'/);
                if (match) {
                    const bucket = match[1];
                    if (!buckets[bucket]) buckets[bucket] = [];
                    buckets[bucket].push(p.policyname);
                }
            }
        });

        console.log('   📋 Buckets configurados:');
        Object.keys(buckets).forEach(bucket => {
            console.log(`      └─ ${bucket}: ${buckets[bucket].length} políticas`);
        });

        // Verificar políticas duplicadas en storage
        const politicasDuplicadas = politicasStorage.filter(p => 
            p.policyname.includes('Allow authenticated uploads') ||
            p.policyname.includes('Anyone can view') ||
            p.policyname.includes('Usuarios autenticados') ||
            p.policyname.includes('Cualquiera puede ver')
        );

        if (politicasDuplicadas.length > 10) {
            console.log('   ⚠️ ADVERTENCIA: Posibles políticas duplicadas en storage');
            warnings.push({
                tipo: 'DUPLICATE_STORAGE_POLICIES',
                tabla: 'storage.objects',
                problema: `${politicasDuplicadas.length} políticas similares detectadas`,
                impacto: 'MEDIO - Overhead de evaluación'
            });
        }

        // =====================================================
        // PASO 6: VERIFICAR ÍNDICES
        // =====================================================
        console.log('');
        console.log('📊 PASO 6: VERIFICANDO ÍNDICES...');
        console.log('-'.repeat(60));

        const { data: indices, error: indicesError } = await supabase
            .from('pg_indexes')
            .select('schemaname, tablename, indexname, indexdef')
            .eq('schemaname', 'public')
            .like('indexname', '%email%');

        if (!indicesError && indices) {
            console.log(`📊 Índices de email encontrados: ${indices.length}`);
            indices.forEach(idx => {
                console.log(`   └─ ${idx.tablename}.${idx.indexname}`);
            });

            // Verificar duplicados
            const indicesUsers = indices.filter(idx => idx.tablename === 'users');
            if (indicesUsers.length > 1) {
                console.log('   ⚠️ ADVERTENCIA: Múltiples índices de email en users');
                problemas.push({
                    tipo: 'DUPLICATE_INDEX',
                    tabla: 'users',
                    problema: `${indicesUsers.length} índices de email duplicados`,
                    impacto: 'BAJO - Overhead de mantenimiento'
                });
            }
        }

        // =====================================================
        // PASO 7: COMPARACIÓN CON PROYECTO
        // =====================================================
        console.log('');
        console.log('🔄 PASO 7: COMPARACIÓN CON PROYECTO...');
        console.log('-'.repeat(60));

        // Verificar si el proyecto usa las tablas correctas
        const tablasEncontradas = [...new Set(politicasActuales.map(p => p.tablename))];
        const tablasEsperadas = ['users', 'properties', 'agents', 'favorites', 'conversations', 'messages'];

        console.log('📋 Tablas con políticas RLS:');
        tablasEncontradas.forEach(tabla => {
            const count = politicasActuales.filter(p => p.tablename === tabla).length;
            console.log(`   └─ ${tabla}: ${count} políticas`);
        });

        console.log('');
        console.log('📋 Tablas esperadas del proyecto:');
        tablasEsperadas.forEach(tabla => {
            const existe = tablasEncontradas.includes(tabla);
            console.log(`   ${existe ? '✅' : '❌'} ${tabla}`);
            if (!existe) {
                warnings.push({
                    tipo: 'MISSING_TABLE_POLICIES',
                    tabla: tabla,
                    problema: 'Tabla del proyecto sin políticas RLS',
                    impacto: 'ALTO - Funcionalidad no protegida'
                });
            }
        });

        // =====================================================
        // PASO 8: RESUMEN Y RECOMENDACIONES
        // =====================================================
        console.log('');
        console.log('📊 RESUMEN CRÍTICO');
        console.log('='.repeat(80));

        console.log(`🚨 PROBLEMAS CRÍTICOS: ${problemas.length}`);
        problemas.forEach((problema, index) => {
            console.log(`   ${index + 1}. [${problema.tipo}] ${problema.tabla}`);
            console.log(`      └─ ${problema.problema}`);
            console.log(`      └─ Impacto: ${problema.impacto}`);
        });

        console.log(`⚠️ ADVERTENCIAS: ${warnings.length}`);
        warnings.forEach((warning, index) => {
            console.log(`   ${index + 1}. [${warning.tipo}] ${warning.tabla}`);
            console.log(`      └─ ${warning.problema}`);
            console.log(`      └─ Impacto: ${warning.impacto}`);
        });

        // =====================================================
        // PASO 9: PLAN DE ACCIÓN
        // =====================================================
        console.log('');
        console.log('🎯 PLAN DE ACCIÓN RECOMENDADO');
        console.log('='.repeat(80));

        console.log('🔥 PRIORIDAD ALTA (Inmediata):');
        console.log('1. Optimizar políticas users que causan Auth RLS InitPlan warnings');
        console.log('2. Consolidar políticas SELECT múltiples en users y community_profiles');
        console.log('3. Eliminar índices duplicados de email');

        console.log('');
        console.log('⚠️ PRIORIDAD MEDIA (Esta semana):');
        console.log('4. Crear políticas RLS para tablas faltantes del proyecto');
        console.log('5. Limpiar políticas duplicadas en storage');
        console.log('6. Verificar que tabla profiles tenga RLS habilitado');

        console.log('');
        console.log('📋 PRIORIDAD BAJA (Mantenimiento):');
        console.log('7. Optimizar nombres de políticas storage (eliminar duplicados)');
        console.log('8. Documentar todas las políticas RLS');
        console.log('9. Crear tests automatizados para políticas');

        // Guardar análisis completo
        const fs = require('fs');
        const analisisCompleto = {
            timestamp: new Date().toISOString(),
            politicas_actuales: politicasActuales,
            reporte_usuario: reporteUsuario,
            problemas: problemas,
            warnings: warnings,
            recomendaciones: recomendaciones,
            resumen: {
                total_politicas: politicasActuales.length,
                problemas_criticos: problemas.length,
                advertencias: warnings.length,
                tablas_con_rls: tablasEncontradas.length,
                estado_general: problemas.length > 5 ? 'CRÍTICO' : problemas.length > 2 ? 'REGULAR' : 'BUENO'
            }
        };

        fs.writeFileSync(
            'Blackbox/analisis-critico-politicas-completo.json',
            JSON.stringify(analisisCompleto, null, 2)
        );

        console.log('');
        console.log('💾 ANÁLISIS GUARDADO: analisis-critico-politicas-completo.json');
        console.log('');
        console.log('🎯 CONCLUSIÓN:');
        
        if (problemas.length > 5) {
            console.log('❌ ESTADO: CRÍTICO - Requiere acción inmediata');
            console.log('🚨 Los warnings están impactando significativamente la performance');
            console.log('🔧 Recomendación: Aplicar optimizaciones AHORA');
        } else if (problemas.length > 2) {
            console.log('⚠️ ESTADO: REGULAR - Requiere optimización');
            console.log('📈 Hay margen de mejora significativo');
            console.log('🔧 Recomendación: Planificar optimizaciones');
        } else {
            console.log('✅ ESTADO: BUENO - Optimizaciones menores');
            console.log('🎯 Sistema relativamente optimizado');
            console.log('🔧 Recomendación: Mantenimiento preventivo');
        }

        console.log('');
        console.log('✅ ANÁLISIS CRÍTICO COMPLETADO');

    } catch (error) {
        console.error('❌ Error en análisis crítico:', error.message);
    }
}

// Ejecutar análisis
if (require.main === module) {
    analizarPoliticasCritico().catch(console.error);
}

module.exports = { analizarPoliticasCritico };
